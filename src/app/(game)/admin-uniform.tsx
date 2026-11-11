import { Avatar3DViewer } from '@/components/game/home/Avatar3DViewer';
import { useAuth } from '@/hooks/use-auth';
import { deleteUniformLayer, getUniformCategories, getUniformLayers, getUniformLibrary, saveUniformLayers, uploadUniformImage } from '@/services/uniform/uniform-service';
import { DEFAULT_UNIFORM_REGIONS, type UniformCategory, type UniformLayer, type UniformLibraryImage, type UniformRegionId } from '@/types/uniform';
import * as DocumentPicker from 'expo-document-picker';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import * as THREE from 'three/webgpu';

const defaultCategories = ['Insígnias', 'Emblemas', 'Distintivos', 'Classes', 'Especialidades', 'Identificações', 'Medalhas', 'Outros'];
const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export default function AdminUniformScreen() {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const compact = width < 900;
  const [images, setImages] = useState<UniformLibraryImage[]>([]);
  const [layers, setLayers] = useState<UniformLayer[]>([]);
  const [categories, setCategories] = useState<UniformCategory[]>(defaultCategories);
  const [selectedImage, setSelectedImage] = useState<UniformLibraryImage | null>(null);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [region, setRegion] = useState<UniformRegionId>('chest-left');
  const [placing, setPlacing] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const savedLayers = useRef<UniformLayer[]>([]);
  const undo = useRef<UniformLayer[][]>([]);
  const redo = useRef<UniformLayer[][]>([]);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [nextImages, nextLayers, nextCategories] = await Promise.all([getUniformLibrary(), getUniformLayers(), getUniformCategories()]);
      setImages(nextImages); setLayers(nextLayers); savedLayers.current = nextLayers;
      if (nextCategories.length) setCategories(nextCategories);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível carregar o uniforme.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const selectedLayer = layers.find((layer) => layer.id === selectedLayerId) ?? null;
  const filteredImages = useMemo(() => images.filter((image) => image.name.toLocaleLowerCase().includes(search.toLocaleLowerCase())), [images, search]);
  const commit = (next: UniformLayer[]) => { undo.current.push(layers); redo.current = []; setLayers(next); };
  const updateSelected = (patch: Partial<UniformLayer>) => selectedLayer && commit(layers.map((layer) => layer.id === selectedLayer.id ? { ...layer, ...patch } : layer));
  const undoChange = () => { const previous = undo.current.pop(); if (previous) { redo.current.push(layers); setLayers(previous); } };
  const redoChange = () => { const next = redo.current.pop(); if (next) { undo.current.push(layers); setLayers(next); } };

  const removeSelectedLayer = async () => {
    if (!selectedLayer) return;
    const removed = selectedLayer;
    const next = layers.filter((layer) => layer.id !== removed.id);
    // Remove from the scene immediately; the viewer receives the new layer list on
    // this render, so the emblem disappears before the network request completes.
    commit(next);
    setSelectedLayerId(null);
    setError(null);
    try {
      await deleteUniformLayer(removed.id);
      savedLayers.current = next;
    } catch (reason) {
      setError(reason instanceof Error ? `A camada saiu da prévia, mas não pôde ser removida do servidor: ${reason.message}` : 'A camada saiu da prévia, mas não pôde ser removida do servidor.');
    }
  };

  const addToUniform = () => {
    if (!selectedImage) { setError('Selecione uma imagem na biblioteca primeiro.'); return; }
    setPlacing(true); setError(null);
  };
  const placeLayer = (surface: { position: UniformLayer['position']; normal: UniformLayer['normal']; surfaceMeshIndex: number }) => {
    if (!placing || !selectedImage) return;
    const layer: UniformLayer = { id: newId(), imageId: selectedImage.id, imageUrl: selectedImage.downloadUrl, name: selectedImage.name, category: selectedImage.category, region, position: surface.position, normal: surface.normal, surfaceMeshIndex: surface.surfaceMeshIndex, rotation: 0, width: 0.22, height: 0.22, opacity: 1, order: layers.length, visible: true, locked: false };
    commit([...layers, layer]); setSelectedLayerId(layer.id); setPlacing(false);
  };
  const save = async () => {
    if (!user || saving) return;
    setSaving(true); setError(null);
    try { await saveUniformLayers(layers, user.uid); savedLayers.current = layers; undo.current = []; redo.current = []; }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'O salvamento falhou. As alterações locais foram preservadas.'); }
    finally { setSaving(false); }
  };
  const discard = () => { setLayers(savedLayers.current); setSelectedLayerId(null); setPlacing(false); undo.current = []; redo.current = []; };
  const upload = async () => {
    if (!user || uploading) return;
    setError(null);
    const result = await DocumentPicker.getDocumentAsync({ type: ['image/png', 'image/jpeg', 'image/webp'], multiple: true, copyToCacheDirectory: true });
    if (result.canceled) return;
    try {
      for (let index = 0; index < result.assets.length; index += 1) {
        const asset = result.assets[index];
        setUploading((index / result.assets.length) * 100);
        const blob = asset.file ?? await (await fetch(asset.uri)).blob();
        await uploadUniformImage(blob, asset.name, asset.mimeType ?? blob.type, { name: asset.name.replace(/\.[^/.]+$/, ''), category: categories[0] || 'Outros', createdBy: user.uid }, (progress) => setUploading(((index + progress) / result.assets.length) * 100));
      }
      setUploading(0); await load();
    } catch (reason) { setUploading(0); setError(reason instanceof Error ? reason.message : 'Não foi possível enviar a imagem.'); }
  };

  if (loading) return <Centered label="Carregando o uniforme…" />;

  return <View style={{ flex: 1, backgroundColor: '#062D28' }}>
    <Stack.Screen options={{ title: 'Gerenciador de Uniforme', headerShown: true, headerStyle: { backgroundColor: '#073B35' }, headerTintColor: '#FFF1CD' }} />
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 14, gap: 14 }} keyboardShouldPersistTaps="handled">
      {error ? <Text selectable style={{ color: '#FFD2C9', fontWeight: '700' }}>{error}</Text> : null}
      <View style={{ flexDirection: compact ? 'column' : 'row', gap: 14, alignItems: 'stretch' }}>
        <View style={panel}><TextInput value={search} onChangeText={setSearch} placeholder="Buscar imagens" placeholderTextColor="#B9C9BD" style={input} accessibilityLabel="Buscar imagens" /><Pressable onPress={upload} style={button}><Text style={buttonText}>{uploading ? `ENVIANDO ${Math.round(uploading)}%` : 'ADICIONAR IMAGENS'}</Text></Pressable><FlatList data={filteredImages} scrollEnabled={false} keyExtractor={(item) => item.id} ListEmptyComponent={<Text selectable style={muted}>Nenhuma imagem cadastrada.</Text>} renderItem={({ item }) => <Pressable onPress={() => setSelectedImage(item)} style={[row, selectedImage?.id === item.id && selected]}><Text selectable style={rowTitle}>{item.name}</Text><Text selectable style={muted}>{item.category}{layers.some((layer) => layer.imageId === item.id) ? ' · em uso' : ''}</Text></Pressable>} /><Pressable onPress={addToUniform} style={[button, !selectedImage && { opacity: .45 }]}><Text style={buttonText}>{placing ? 'TOQUE NO UNIFORME' : 'ADICIONAR AO UNIFORME'}</Text></Pressable></View>
        <View style={[panel, { flex: 2, minHeight: compact ? 420 : 640, padding: 0, overflow: 'hidden' }]}><Avatar3DViewer uniformLayers={layers} onSurfacePress={placeLayer} autoRotate={!placing} /><View style={{ padding: 12, gap: 8, backgroundColor: '#073B35' }}><Text selectable style={{ color: '#FFF1CD', fontWeight: '800' }}>{placing ? 'Modo de posicionamento: toque apenas na região selecionada da camisa.' : 'Arraste para girar · pinçe para aproximar'}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{DEFAULT_UNIFORM_REGIONS.map((item) => <Pressable key={item.id} onPress={() => setRegion(item.id)} style={[chip, region === item.id && selected]}><Text style={rowTitle}>{item.name}</Text></Pressable>)}</ScrollView></View></View>
        <View style={panel}><Text selectable style={heading}>PROPRIEDADES</Text>{selectedLayer ? <Properties layer={selectedLayer} onPatch={updateSelected} onDuplicate={() => { const duplicate = { ...selectedLayer, id: newId(), name: `${selectedLayer.name} (cópia)`, order: layers.length }; commit([...layers, duplicate]); setSelectedLayerId(duplicate.id); }} onRemove={removeSelectedLayer} /> : <Text selectable style={muted}>Selecione uma camada no painel abaixo.</Text>}</View>
      </View>
      <View style={panel}><Text selectable style={heading}>CAMADAS ({layers.length})</Text>{layers.length ? layers.slice().sort((a, b) => a.order - b.order).map((layer) => <Pressable key={layer.id} onPress={() => setSelectedLayerId(layer.id)} style={[row, selectedLayerId === layer.id && selected]}><Text selectable style={rowTitle}>{layer.name}</Text><Text selectable style={muted}>{layer.region} · {layer.visible ? 'visível' : 'oculta'}{layer.locked ? ' · bloqueada' : ''}</Text></Pressable>) : <Text selectable style={muted}>Nenhum emblema aplicado. Escolha uma imagem e toque no uniforme.</Text>}</View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}><Pressable onPress={undoChange} style={button}><Text style={buttonText}>DESFAZER</Text></Pressable><Pressable onPress={redoChange} style={button}><Text style={buttonText}>REFAZER</Text></Pressable><Pressable onPress={discard} style={button}><Text style={buttonText}>DESCARTAR</Text></Pressable><Pressable onPress={save} style={[button, saving && { opacity: .5 }]}><Text style={buttonText}>{saving ? 'SALVANDO…' : 'SALVAR ALTERAÇÕES'}</Text></Pressable></View>
    </ScrollView>
  </View>;
}

function Properties({ layer, onPatch, onDuplicate, onRemove }: { layer: UniformLayer; onPatch: (patch: Partial<UniformLayer>) => void; onDuplicate: () => void; onRemove: () => void }) {
  return <View style={{ gap: 10 }}><TextInput value={layer.name} onChangeText={(name) => onPatch({ name })} style={input} /><Text selectable style={muted}>Categoria: {layer.category}</Text>
    <RangeControl label="Largura" value={layer.width} min={0.01} max={0.5} step={0.005} onChange={(width) => onPatch({ width })} />
    <RangeControl label="Altura" value={layer.height} min={0.01} max={0.5} step={0.005} onChange={(height) => onPatch({ height })} />
    <RangeControl label="Rotação" suffix="°" value={THREE.MathUtils.radToDeg(layer.rotation)} min={-180} max={180} step={1} digits={0} onChange={(degrees) => onPatch({ rotation: THREE.MathUtils.degToRad(degrees) })} />
    <RangeControl label="Opacidade" value={layer.opacity} min={0} max={1} step={0.01} digits={2} onChange={(opacity) => onPatch({ opacity })} />
    <Pressable onPress={() => onPatch({ visible: !layer.visible })} style={button}><Text style={buttonText}>{layer.visible ? 'OCULTAR' : 'EXIBIR'}</Text></Pressable><Pressable onPress={() => onPatch({ locked: !layer.locked })} style={button}><Text style={buttonText}>{layer.locked ? 'DESBLOQUEAR' : 'BLOQUEAR'}</Text></Pressable><Pressable onPress={onDuplicate} style={button}><Text style={buttonText}>DUPLICAR</Text></Pressable><Pressable onPress={onRemove} style={[button, { backgroundColor: '#8D392D' }]}><Text style={buttonText}>REMOVER</Text></Pressable></View>;
}

function RangeControl({ label, value, min, max, step, digits = 3, suffix = '', onChange }: { label: string; value: number; min: number; max: number; step: number; digits?: number; suffix?: string; onChange: (value: number) => void }) {
  const [trackWidth, setTrackWidth] = useState(1);
  const updateFromEvent = (event: GestureResponderEvent) => {
    const ratio = Math.max(0, Math.min(1, event.nativeEvent.locationX / trackWidth));
    const raw = min + ratio * (max - min);
    const stepped = min + Math.round((raw - min) / step) * step;
    onChange(Number(Math.max(min, Math.min(max, stepped)).toFixed(Math.max(digits, 3))));
  };
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const onLayout = (event: LayoutChangeEvent) => setTrackWidth(Math.max(1, event.nativeEvent.layout.width));
  return <View style={{ gap: 6 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}><Text style={muted}>{label}</Text><Text selectable style={[muted, { color: '#FFF1CD', fontVariant: ['tabular-nums'] }]}>{value.toFixed(digits)}{suffix}</Text></View>
    <View accessibilityRole="adjustable" accessibilityLabel={label} accessibilityValue={{ min, max, now: value }} onLayout={onLayout} onStartShouldSetResponder={() => true} onMoveShouldSetResponder={() => true} onResponderGrant={updateFromEvent} onResponderMove={updateFromEvent} style={{ height: 30, justifyContent: 'center' }}>
      <View style={{ height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: '#153F38', borderWidth: 1, borderColor: '#759986' }}><View style={{ width: `${percentage}%`, height: '100%', backgroundColor: '#D6A83D' }} /></View>
      <View pointerEvents="none" style={{ position: 'absolute', left: `${percentage}%`, marginLeft: -9, width: 18, height: 18, borderRadius: 9, backgroundColor: '#FFF1CD', borderWidth: 2, borderColor: '#D6A83D' }} />
    </View>
  </View>;
}
function Centered({ label }: { label: string }) { return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#062D28' }}><ActivityIndicator color="#FFE387" size="large" /><Text selectable style={{ color: '#FFF1CD' }}>{label}</Text></View>; }
const panel = { flex: 1, minWidth: 250, padding: 14, gap: 10, borderRadius: 18, borderWidth: 1, borderColor: '#D6A83D', backgroundColor: '#073B35' } as const;
const input = { minHeight: 44, borderRadius: 10, paddingHorizontal: 12, color: '#FFF1CD', borderWidth: 1, borderColor: '#759986', backgroundColor: '#0B4A40' } as const;
const button = { minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#D6A83D' } as const;
const buttonText = { color: '#17392C', fontSize: 12, fontWeight: '900', letterSpacing: .3 } as const;
const row = { padding: 10, borderRadius: 10, gap: 3, borderWidth: 1, borderColor: 'transparent' } as const;
const selected = { borderColor: '#FFE387', backgroundColor: 'rgba(214,168,61,.16)' } as const;
const rowTitle = { color: '#FFF1CD', fontWeight: '800' } as const;
const muted = { color: '#C4D4C6', fontSize: 12 } as const;
const heading = { color: '#FFE387', fontWeight: '900', letterSpacing: .6 } as const;
const chip = { paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: '#759986', borderRadius: 18 } as const;
