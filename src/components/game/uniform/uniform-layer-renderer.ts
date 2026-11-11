import type { UniformLayer } from '@/types/uniform';
import * as THREE from 'three/webgpu';
import { DecalGeometry } from 'three/addons/geometries/DecalGeometry.js';
import { db, storage } from '@/services/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { getDownloadURL, ref } from 'firebase/storage';

/** Imperative Three.js renderer shared by the editor and the player viewer. */
export class UniformLayerRenderer {
  private readonly group = new THREE.Group();
  private readonly surfaceMeshes: THREE.Mesh[];
  private readonly textureCache = new Map<string, THREE.Texture>();
  private disposed = false;
  private revision = 0;

  constructor(private readonly model: THREE.Object3D, private readonly onError: (message: string | null) => void = () => {}) {
    this.surfaceMeshes = [];
    this.model.updateMatrixWorld(true);
    this.model.traverse((object) => { if ((object as THREE.Mesh).isMesh) this.surfaceMeshes.push(object as THREE.Mesh); });
    this.group.name = 'uniform-layers';
    this.model.add(this.group);
  }

  async render(layers: UniformLayer[]) {
    const revision = ++this.revision;
    this.onError(null);
    this.clearMeshes();
    const visibleLayers = layers.filter((layer) => layer.visible).sort((a, b) => a.order - b.order);
    await Promise.all(visibleLayers.map(async (layer) => {
      try {
        const texture = await this.getTexture(layer);
        if (this.disposed || revision !== this.revision) return;
        const geometry = this.createDecalGeometry(layer);
        const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: layer.opacity, alphaTest: 0.01, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = `uniform-layer:${layer.id}`;
        mesh.userData.layerId = layer.id;
        mesh.renderOrder = 10_000 + layer.order;
        this.group.add(mesh);
      } catch (error) {
        if (!this.disposed && revision === this.revision) this.onError(`Imagem “${layer.name}”: ${error instanceof Error ? error.message : 'falha na leitura da textura'}`);
      }
    }));
  }

  private createDecalGeometry(layer: UniformLayer) {
    this.model.updateMatrixWorld(true);
    const localPosition = new THREE.Vector3(layer.position.x, layer.position.y, layer.position.z);
    const localNormal = new THREE.Vector3(layer.normal.x, layer.normal.y, layer.normal.z).normalize();
    const worldPosition = this.model.localToWorld(localPosition.clone());
    const worldNormal = this.model.localToWorld(localPosition.clone().add(localNormal)).sub(worldPosition).normalize();
    let target = layer.surfaceMeshIndex === undefined ? undefined : this.surfaceMeshes[layer.surfaceMeshIndex];
    if (!target) {
      const raycaster = new THREE.Raycaster(worldPosition.clone().addScaledVector(worldNormal, Math.max(layer.width, layer.height)), worldNormal.clone().negate());
      target = raycaster.intersectObjects(this.surfaceMeshes, false)[0]?.object as THREE.Mesh | undefined;
    }
    if (!target) throw new Error('A superfície original da camisa não foi encontrada. Posicione a imagem novamente.');

    const orientation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), worldNormal);
    orientation.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), layer.rotation));
    const projectorDepth = Math.max(0.01, Math.min(layer.width, layer.height) * 0.35);
    const geometry = new DecalGeometry(target, worldPosition.clone().addScaledVector(worldNormal, 0.001), new THREE.Euler().setFromQuaternion(orientation), new THREE.Vector3(layer.width, layer.height, projectorDepth));
    // DecalGeometry emits world-space vertices. The uniform group follows the model,
    // so convert once to the model's local space and keep it glued during rotation.
    geometry.applyMatrix4(this.model.matrixWorld.clone().invert());
    return geometry;
  }

  private async getTexture(layer: UniformLayer) {
    let url = layer.imageUrl;
    const cached = this.textureCache.get(url);
    if (cached) return cached;
    // Resolve from the library's Storage object, rather than trusting a download
    // token copied into a layer indefinitely (tokens can change after replacement).
    if (db && storage && layer.imageId) {
      const record = await getDoc(doc(db, 'uniforms/miguel/library', layer.imageId));
      const path = record.data()?.storagePath;
      if (typeof path === 'string') url = await getDownloadURL(ref(storage, path));
    }
    if (!url) throw new Error('A camada não possui um arquivo de imagem associado.');
    let texture: THREE.Texture;
    if (typeof createImageBitmap === 'function') {
      // Explicit download/decode exposes HTTP errors and supplies WebGPU with a
      // decoded bitmap, without relying on DOM ImageLoader events.
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Download recusado (HTTP ${response.status}).`);
      const blob = await response.blob();
      if (!blob.size) throw new Error('O arquivo de imagem está vazio.');
      let bitmap: ImageBitmap;
      try { bitmap = await createImageBitmap(blob, { imageOrientation: 'flipY' }); }
      catch { throw new Error('O arquivo não pôde ser decodificado como PNG, JPG ou WEBP.'); }
      if (this.disposed) { bitmap.close(); throw new Error('Visualizador encerrado.'); }
      texture = new THREE.Texture(bitmap);
      texture.flipY = false;
      texture.addEventListener('dispose', () => bitmap.close());
    } else {
      texture = await new THREE.TextureLoader().loadAsync(url);
    }
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    this.textureCache.set(layer.imageUrl, texture);
    return texture;
  }

  private clearMeshes() {
    for (const child of [...this.group.children]) {
      const mesh = child as THREE.Mesh;
      mesh.geometry?.dispose();
      const material = mesh.material as THREE.Material;
      material?.dispose();
      this.group.remove(child);
    }
  }

  dispose() {
    this.disposed = true;
    this.clearMeshes();
    this.textureCache.forEach((texture) => texture.dispose());
    this.textureCache.clear();
    this.model.remove(this.group);
  }
}
