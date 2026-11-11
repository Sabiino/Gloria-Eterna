import 'fast-text-encoding';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Image,
  PanResponder,
  PixelRatio,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';
import { Canvas, type CanvasRef } from 'react-native-wgpu';
import * as THREE from 'three/webgpu';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { UniformLayerRenderer } from '@/components/game/uniform/uniform-layer-renderer';
import type { UniformLayer } from '@/types/uniform';

type ModelSource = string | number;

type Avatar3DViewerProps = {
  /** A remote URL or a bundled asset returned by require(). */
  modelUrl?: ModelSource;
  enableRotation?: boolean;
  enableZoom?: boolean;
  autoRotate?: boolean;
  showControls?: boolean;
  onDetailsPress?: () => void;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  /** Saved official layers can be shown without exposing editor controls. */
  uniformLayers?: UniformLayer[];
  /** Receives a valid surface hit in Miguel's local GLB coordinates. */
  onSurfacePress?: (surface: { position: UniformLayer['position']; normal: UniformLayer['normal']; surfaceMeshIndex: number }) => void;
};

type ViewerStatus = 'loading' | 'ready' | 'error';

const defaultModel = require('../../../assets/game/models/miguel.glb');

function resolveModelUrl(source: ModelSource) {
  if (typeof source === 'string') return source;
  const asset = Image.resolveAssetSource(source);
  if (!asset?.uri) throw new Error('O arquivo do personagem 3D não foi encontrado.');
  return asset.uri;
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    mesh.geometry?.dispose();
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.filter(Boolean).forEach((material) => {
      Object.values(material).forEach((value) => {
        if (value && typeof value === 'object' && 'isTexture' in value && (value as THREE.Texture).dispose) (value as THREE.Texture).dispose();
      });
      material.dispose();
    });
  });
}

/**
 * A self-contained, interactive GLB viewer. It intentionally has no gameplay state
 * so future uniforms, insignias, accessories and animation controls can be supplied
 * without changing the dashboard layout.
 */
export function Avatar3DViewer({
  modelUrl = defaultModel,
  enableRotation = true,
  enableZoom = true,
  autoRotate = false,
  showControls = true,
  onDetailsPress,
  onLoad,
  onError,
  uniformLayers = [],
  onSurfacePress,
}: Avatar3DViewerProps) {
  const canvasRef = useRef<CanvasRef>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGPURenderer | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const uniformRendererRef = useRef<UniformLayerRenderer | null>(null);
  const surfacePressRef = useRef<Avatar3DViewerProps['onSurfacePress']>(onSurfacePress);
  const surfaceAtRef = useRef<(x: number, y: number) => void>(() => {});
  const frameRef = useRef<number | null>(null);
  const lastFrameRef = useRef(0);
  const orbitRef = useRef({ targetX: 0, targetY: 0, x: 0, y: 0, focusX: 0, focusY: 0, distance: 4, initialDistance: 4 });
  const gestureRef = useRef({ x: 0, y: 0, pinchDistance: 0 });
  const [status, setStatus] = useState<ViewerStatus>('loading');
  const [retryKey, setRetryKey] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [isMovingFocus, setIsMovingFocus] = useState(false);
  const isMovingFocusRef = useRef(false);
  const autoRotateRef = useRef(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [size, setSize] = useState({ width: 1, height: 1 });
  const layersRef = useRef(uniformLayers);
  const [layerError, setLayerError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => active && setReduceMotion(enabled));
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => { active = false; subscription.remove(); };
  }, []);

  useEffect(() => {
    const enabled = autoRotate && !reduceMotion;
    autoRotateRef.current = enabled;
    setIsAutoRotating(enabled);
  }, [autoRotate, reduceMotion]);

  const resetCamera = useCallback(() => {
    const orbit = orbitRef.current;
    orbit.targetX = 0;
    orbit.targetY = 0;
    orbit.focusX = 0;
    orbit.focusY = 0;
    orbit.distance = orbit.initialDistance;
  }, []);

  const changeZoom = useCallback((factor: number) => {
    const orbit = orbitRef.current;
    orbit.distance = THREE.MathUtils.clamp(orbit.distance * factor, orbit.initialDistance * 0.24, orbit.initialDistance * 2.4);
  }, []);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) setSize({ width, height });
  }, []);

  useEffect(() => {
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    if (!renderer || !camera) return;
    renderer.setSize(size.width, size.height, false);
    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();
  }, [size]);

  useEffect(() => {
    let cancelled = false;
    let loadedModel: THREE.Group | null = null;
    setStatus('loading');

    const start = async () => {
      try {
        const context = canvasRef.current?.getContext('webgpu');
        if (!context) throw new Error('WebGPU não está disponível neste dispositivo.');

        const nativeCanvas = context.canvas as unknown as HTMLCanvasElement;
        nativeCanvas.width = Math.max(1, nativeCanvas.clientWidth * Math.min(PixelRatio.get(), 2));
        nativeCanvas.height = Math.max(1, nativeCanvas.clientHeight * Math.min(PixelRatio.get(), 2));

        const renderer = new THREE.WebGPURenderer({
          antialias: true,
          canvas: nativeCanvas,
          context,
        });
        renderer.setPixelRatio(Math.min(PixelRatio.get(), 2));
        renderer.setSize(Math.max(1, nativeCanvas.clientWidth), Math.max(1, nativeCanvas.clientHeight), false);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        await renderer.init();
        if (cancelled) { renderer.dispose(); return; }

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(32, Math.max(1, nativeCanvas.clientWidth) / Math.max(1, nativeCanvas.clientHeight), 0.01, 1000);
        scene.add(new THREE.HemisphereLight(0xfff5d6, 0x203a2b, 2.1));
        const keyLight = new THREE.DirectionalLight(0xffefc1, 3.5);
        keyLight.position.set(3, 6, 5);
        scene.add(keyLight);
        const fillLight = new THREE.DirectionalLight(0xc6e2ff, 1.6);
        fillLight.position.set(-4, 2, 3);
        scene.add(fillLight);

        const gltf = await new GLTFLoader().loadAsync(resolveModelUrl(modelUrl));
        if (cancelled) { disposeObject(gltf.scene); renderer.dispose(); return; }

        loadedModel = gltf.scene;
        const box = new THREE.Box3().setFromObject(loadedModel);
        if (box.isEmpty()) throw new Error('O arquivo GLB não contém um modelo visível.');
        const center = box.getCenter(new THREE.Vector3());
        const bounds = box.getSize(new THREE.Vector3());
        const largestSide = Math.max(bounds.x, bounds.y, bounds.z);
        loadedModel.position.sub(center);
        scene.add(loadedModel);
        modelRef.current = loadedModel;
        uniformRendererRef.current = new UniformLayerRenderer(loadedModel, setLayerError);
        void uniformRendererRef.current.render(layersRef.current);

        const distance = (largestSide / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)))) * 1.35;
        orbitRef.current = { targetX: 0, targetY: 0, x: 0, y: 0, focusX: 0, focusY: 0, distance, initialDistance: distance };
        rendererRef.current = renderer;
        cameraRef.current = camera;
        lastFrameRef.current = 0;

        const renderFrame = (time: number) => {
          if (cancelled) return;
          // react-native-wgpu resizes its canvas on React commits and window resize.
          // Reconcile Three's depth/MSAA targets with that canvas before every frame.
          const width = Math.max(1, nativeCanvas.clientWidth);
          const height = Math.max(1, nativeCanvas.clientHeight);
          const pixelRatio = renderer.getPixelRatio();
          const rendererSize = renderer.getSize(new THREE.Vector2());
          if (rendererSize.x !== width || rendererSize.y !== height ||
              nativeCanvas.width !== Math.floor(width * pixelRatio) ||
              nativeCanvas.height !== Math.floor(height * pixelRatio)) {
            renderer.setSize(width, height, false);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
          }
          const delta = Math.min((time - lastFrameRef.current) / 1000 || 0, 0.05);
          lastFrameRef.current = time;
          const orbit = orbitRef.current;
          if (autoRotateRef.current && !reduceMotion) orbit.targetY += delta * 0.35;
          orbit.x += (orbit.targetX - orbit.x) * 0.14;
          orbit.y += (orbit.targetY - orbit.y) * 0.14;
          const distanceNow = orbit.distance;
          camera.position.set(
            orbit.focusX + Math.sin(orbit.y) * Math.cos(orbit.x) * distanceNow,
            orbit.focusY + Math.sin(orbit.x) * distanceNow,
            Math.cos(orbit.y) * Math.cos(orbit.x) * distanceNow,
          );
          camera.lookAt(orbit.focusX, orbit.focusY, 0);
          renderer.render(scene, camera);
          context.present();
          frameRef.current = requestAnimationFrame(renderFrame);
        };
        frameRef.current = requestAnimationFrame(renderFrame);
        setStatus('ready');
        onLoad?.();
      } catch (reason) {
        const error = reason instanceof Error ? reason : new Error('Não foi possível carregar o personagem 3D.');
        if (!cancelled) { setStatus('error'); onError?.(error); }
      }
    };
    void start();

    return () => {
      cancelled = true;
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      loadedModel && disposeObject(loadedModel);
      uniformRendererRef.current?.dispose();
      uniformRendererRef.current = null;
      modelRef.current = null;
      rendererRef.current?.dispose();
      rendererRef.current = null;
      cameraRef.current = null;
    };
  // The 3D asset is only loaded once; layers are reconciled independently.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelUrl, onError, onLoad, retryKey]);

  useEffect(() => { layersRef.current = uniformLayers; void uniformRendererRef.current?.render(uniformLayers); }, [uniformLayers]);
  useEffect(() => { surfacePressRef.current = onSurfacePress; }, [onSurfacePress]);

  const surfaceAt = useCallback((x: number, y: number) => {
    if (!surfacePressRef.current || !cameraRef.current || !modelRef.current || !size.width || !size.height) return;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2((x / size.width) * 2 - 1, -(y / size.height) * 2 + 1), cameraRef.current);
    const hit = raycaster.intersectObject(modelRef.current, true).find((entry) => entry.object.type === 'Mesh');
    if (!hit?.face) return;
    const position = modelRef.current.worldToLocal(hit.point.clone());
    const worldNormal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
    // A GLB may contain inward-wound faces. Point toward the current camera so the
    // decal sits outside the shirt instead of being hidden by the model depth buffer.
    if (worldNormal.dot(cameraRef.current.position.clone().sub(hit.point)) < 0) worldNormal.negate();
    const normal = modelRef.current.worldToLocal(hit.point.clone().add(worldNormal)).sub(position).normalize();
    // The GLB can use one mesh for all clothing. The editor requires an explicit region
    // selection before accepting a hit, keeping face, hands and trousers out of the flow.
    const meshes: THREE.Mesh[] = [];
    modelRef.current.traverse((object) => { if ((object as THREE.Mesh).isMesh) meshes.push(object as THREE.Mesh); });
    surfacePressRef.current({ position: { x: position.x, y: position.y, z: position.z }, normal: { x: normal.x, y: normal.y, z: normal.z }, surfaceMeshIndex: Math.max(0, meshes.indexOf(hit.object as THREE.Mesh)) });
  }, [size]);
  useEffect(() => { surfaceAtRef.current = surfaceAt; }, [surfaceAt]);

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => enableRotation || enableZoom,
    onMoveShouldSetPanResponder: () => enableRotation || enableZoom,
    onPanResponderGrant: (event) => {
      const touch = event.nativeEvent.touches;
      gestureRef.current = { x: event.nativeEvent.locationX, y: event.nativeEvent.locationY, pinchDistance: touch.length > 1 ? Math.hypot(touch[0].pageX - touch[1].pageX, touch[0].pageY - touch[1].pageY) : 0 };
      autoRotateRef.current = false;
      setIsAutoRotating(false);
    },
    onPanResponderMove: (event: GestureResponderEvent) => {
      const touch = event.nativeEvent.touches;
      const orbit = orbitRef.current;
      if (enableZoom && touch.length > 1) {
        const distance = Math.hypot(touch[0].pageX - touch[1].pageX, touch[0].pageY - touch[1].pageY);
        if (gestureRef.current.pinchDistance) orbit.distance = THREE.MathUtils.clamp(orbit.distance * (gestureRef.current.pinchDistance / distance), orbit.initialDistance * 0.24, orbit.initialDistance * 2.4);
        gestureRef.current.pinchDistance = distance;
        return;
      }
      if (!enableRotation) return;
      const dx = event.nativeEvent.locationX - gestureRef.current.x;
      const dy = event.nativeEvent.locationY - gestureRef.current.y;
      if (isMovingFocusRef.current) {
        const movementScale = orbit.distance * 0.0015;
        orbit.focusX -= dx * movementScale;
        orbit.focusY += dy * movementScale;
      } else {
        // Invert the horizontal drag so the character follows the pointer naturally.
        orbit.targetY -= dx * 0.012;
        orbit.targetX = THREE.MathUtils.clamp(orbit.targetX + dy * 0.006, -0.4, 0.4);
      }
      gestureRef.current.x = event.nativeEvent.locationX;
      gestureRef.current.y = event.nativeEvent.locationY;
    },
    onPanResponderRelease: (event) => {
      const dx = event.nativeEvent.locationX - gestureRef.current.x;
      const dy = event.nativeEvent.locationY - gestureRef.current.y;
      if (Math.hypot(dx, dy) < 8) surfaceAtRef.current(event.nativeEvent.locationX, event.nativeEvent.locationY);
    },
  })).current;

  return <View style={styles.viewer} onLayout={onLayout} {...panResponder.panHandlers} accessibilityLabel="Visualizador 3D do personagem Miguel">
    <Canvas ref={canvasRef} transparent style={StyleSheet.absoluteFill} />
    {layerError ? <Text selectable style={{ color: '#FFD2C9', backgroundColor: '#073B35', padding: 12 }}>{layerError}</Text> : null}
    {status === 'loading' ? <View pointerEvents="none" style={styles.message}><ActivityIndicator color="#FFE387" size="large" /><Text style={styles.messageText}>Carregando Miguel em 3D…</Text></View> : null}
    {status === 'error' ? <View style={styles.message}><Text selectable style={styles.errorTitle}>Não foi possível exibir o personagem 3D.</Text><Pressable accessibilityRole="button" onPress={() => setRetryKey((value) => value + 1)} style={styles.retry}><Text style={styles.retryText}>TENTAR NOVAMENTE</Text></Pressable></View> : null}
    {showControls && status === 'ready' ? <View style={styles.controls}>
      {enableZoom ? <>
        <Pressable accessibilityRole="button" accessibilityLabel="Aproximar personagem" onPress={() => changeZoom(0.72)} style={styles.control}><Text style={styles.controlText}>+</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Afastar personagem" onPress={() => changeZoom(1.38)} style={styles.control}><Text style={styles.controlText}>−</Text></Pressable>
      </> : null}
      <Pressable accessibilityRole="button" accessibilityLabel={isMovingFocus ? 'Voltar ao modo de rotação' : 'Mover foco da câmera'} accessibilityState={{ selected: isMovingFocus }} onPress={() => { const enabled = !isMovingFocusRef.current; isMovingFocusRef.current = enabled; setIsMovingFocus(enabled); autoRotateRef.current = false; setIsAutoRotating(false); }} style={[styles.control, isMovingFocus && styles.controlActive]}><Text style={styles.controlText}>✥</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Restaurar câmera" onPress={resetCamera} style={styles.control}><Text style={styles.controlText}>↺</Text></Pressable>
      {!reduceMotion ? <Pressable accessibilityRole="button" accessibilityLabel={isAutoRotating ? 'Pausar rotação automática' : 'Continuar rotação automática'} accessibilityState={{ selected: isAutoRotating }} onPress={() => { const enabled = !autoRotateRef.current; autoRotateRef.current = enabled; setIsAutoRotating(enabled); }} style={[styles.control, isAutoRotating && styles.controlActive]}><Text style={styles.controlText}>{isAutoRotating ? 'Ⅱ' : '▶'}</Text></Pressable> : null}
      {onDetailsPress ? <Pressable accessibilityRole="button" accessibilityLabel="Ver detalhes do personagem" onPress={onDetailsPress} style={styles.control}><Text style={styles.infoText}>i</Text></Pressable> : null}
    </View> : null}
  </View>;
}

const styles = StyleSheet.create({
  viewer: { flex: 1, minHeight: 260, width: '100%', overflow: 'hidden' },
  message: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 28, backgroundColor: 'rgba(3, 36, 27, .30)' },
  messageText: { color: '#FFF1CD', fontWeight: '800', letterSpacing: .3 },
  errorTitle: { color: '#FFF1CD', fontSize: 16, fontWeight: '800', textAlign: 'center' },
  retry: { backgroundColor: '#D6A83D', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  retryText: { color: '#17392C', fontSize: 12, fontWeight: '900', letterSpacing: .5 },
  controls: { position: 'absolute', right: 12, bottom: 12, gap: 8 },
  control: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21, backgroundColor: 'rgba(9, 52, 39, .88)', borderWidth: 1, borderColor: '#EACD5C' },
  controlActive: { backgroundColor: '#C9952E' },
  controlText: { color: '#FFF2C7', fontSize: 24, fontWeight: '900' },
  infoText: { color: '#FFF2C7', fontSize: 20, fontWeight: '900' },
});
