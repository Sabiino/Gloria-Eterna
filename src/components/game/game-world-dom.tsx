'use dom';

import { useEffect, useRef, useState } from 'react';

type Point = { x: number; y: number };
type Camp = {
  id: string;
  name: string;
  ownerId: string;
  ownerNickname?: string;
  tentLevel: number;
  gridX?: number;
  gridY?: number;
};
type Props = {
  camps: Camp[];
  currentUserId: string;
  placementEnabled: boolean;
  onClaim: (point: Point) => Promise<void>;
  onAvatarStopped: (point: Point) => Promise<void>;
  dom?: import('expo/dom').DOMProps;
};

const SIZE = 256;
const TILE_W = 48;
const TILE_H = 24;
const ORIGIN_Y = 180;
const CENTER = 127.5;

function hash(x: number, y: number, seed = 207) {
  let n = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + seed;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function riverCenter(y: number) {
  return 127 + 18 * Math.sin((y + 207) / 33) + 7 * Math.sin((y - 207) / 17);
}

function insideIsland(x: number, y: number) {
  const dx = (x - CENTER) / 117;
  const dy = (y - CENTER) / 117;
  const theta = Math.atan2(dy, dx);
  const coast = .96 + .035 * Math.sin(theta * 7) + .022 * Math.cos(theta * 13);
  return x >= 2 && y >= 2 && x < 254 && y < 254 && Math.hypot(dx, dy) < coast;
}

function isWalkable(x: number, y: number) {
  return insideIsland(x, y) && Math.abs(x - riverCenter(y)) > 3.5;
}

function gridToWorld(x: number, y: number): Point {
  return { x: (x - y) * TILE_W, y: ORIGIN_Y + (x + y) * TILE_H };
}

function worldToGrid(x: number, y: number): Point {
  const a = x / TILE_W;
  const b = (y - ORIGIN_Y) / TILE_H;
  return { x: Math.round((a + b) / 2), y: Math.round((b - a) / 2) };
}

function canPlace(point: Point, camps: Camp[]) {
  for (let oy = -2; oy <= 2; oy += 1) {
    for (let ox = -2; ox <= 2; ox += 1) {
      if (!isWalkable(point.x + ox, point.y + oy)) return false;
    }
  }
  return camps.every((camp) => camp.gridX === undefined || Math.hypot(camp.gridX - point.x, (camp.gridY ?? 0) - point.y) >= 7);
}

const trees = Array.from({ length: 230 }, (_, index) => {
  const angle = hash(index, 11) * Math.PI * 2;
  const radius = 25 + Math.sqrt(hash(index, 29)) * 92;
  return {
    x: CENTER + Math.cos(angle) * radius,
    y: CENTER + Math.sin(angle) * radius,
    scale: .72 + hash(index, 41) * .58,
    pine: hash(index, 53) > .46,
  };
}).filter((tree) => isWalkable(tree.x, tree.y) && Math.abs(tree.x - 84) > 12 && Math.abs(tree.y - 166) > 10);

const rocks = Array.from({ length: 52 }, (_, index) => ({
  x: 48 + hash(index, 71) * 160,
  y: 38 + hash(index, 83) * 174,
  scale: .7 + hash(index, 97) * .8,
})).filter((rock) => isWalkable(rock.x, rock.y));

export default function GameWorldDom({ camps, currentUserId, placementEnabled, onClaim, onAvatarStopped }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const campsRef = useRef(camps);
  const placingRef = useRef(placementEnabled);
  const claimRef = useRef(onClaim);
  const positionRef = useRef(onAvatarStopped);
  const userRef = useRef(currentUserId);
  const cameraRef = useRef({ x: 0, y: 6300, zoom: .105 });
  const avatarRef = useRef({ x: 128, y: 134, target: null as Point | null, step: 0 });
  const previewRef = useRef<Point | null>(null);
  const pendingTentRef = useRef<{ point: Point; status: 'saving' | 'confirmed' } | null>(null);
  const pointerRef = useRef<{ startX: number; startY: number; x: number; y: number; worldX: number; worldY: number; dragging: boolean } | null>(null);
  const [caption, setCaption] = useState('Arraste para explorar • use a roda ou os botões para aproximar');

  useEffect(() => {
    campsRef.current = camps;
    const pending = pendingTentRef.current;
    if (pending && camps.some((camp) => camp.gridX === pending.point.x && camp.gridY === pending.point.y)) {
      pendingTentRef.current = null;
    }
  }, [camps]);
  useEffect(() => { claimRef.current = onClaim; }, [onClaim]);
  useEffect(() => { positionRef.current = onAvatarStopped; }, [onAvatarStopped]);
  useEffect(() => { userRef.current = currentUserId; }, [currentUserId]);
  useEffect(() => {
    placingRef.current = placementEnabled;
    setCaption(placementEnabled ? 'Aproxime o mapa e escolha uma clareira para sua barraca.' : 'Arraste para explorar • toque no terreno para caminhar');
  }, [placementEnabled]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let frame = 0;
    let lastTime = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * ratio));
      canvas.height = Math.max(1, Math.round(rect.height * ratio));
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const toScreen = (point: Point) => ({
      x: canvas.clientWidth / 2 + (point.x - cameraRef.current.x) * cameraRef.current.zoom,
      y: canvas.clientHeight / 2 + (point.y - cameraRef.current.y) * cameraRef.current.zoom,
    });
    const toWorld = (x: number, y: number) => ({
      x: cameraRef.current.x + (x - canvas.clientWidth / 2) / cameraRef.current.zoom,
      y: cameraRef.current.y + (y - canvas.clientHeight / 2) / cameraRef.current.zoom,
    });

    const islandPath = () => {
      ctx.beginPath();
      for (let index = 0; index <= 96; index += 1) {
        const angle = index / 96 * Math.PI * 2;
        const radius = 114 * (1 + .034 * Math.sin(angle * 7) + .02 * Math.cos(angle * 13));
        const point = toScreen(gridToWorld(CENTER + Math.cos(angle) * radius, CENTER + Math.sin(angle) * radius));
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      }
      ctx.closePath();
    };

    const drawOcean = (width: number, height: number, time: number) => {
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#185f79');
      gradient.addColorStop(.52, '#277f96');
      gradient.addColorStop(1, '#10495f');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = 'rgba(170,225,226,.18)';
      ctx.lineWidth = 1.2;
      const offset = (time / 65) % 52;
      for (let y = -30; y < height + 40; y += 52) {
        for (let x = -60 + offset; x < width + 60; x += 110) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.quadraticCurveTo(x + 13, y - 5, x + 27, y);
          ctx.stroke();
        }
      }
    };

    const drawIsland = () => {
      ctx.save();
      islandPath();
      ctx.shadowColor = 'rgba(4,26,29,.55)';
      ctx.shadowBlur = 28;
      ctx.shadowOffsetY = 18;
      const soil = ctx.createLinearGradient(0, 90, 0, canvas.clientHeight);
      soil.addColorStop(0, '#a9ca78');
      soil.addColorStop(.42, '#7fa65d');
      soil.addColorStop(1, '#52784d');
      ctx.fillStyle = soil;
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.clip();

      const biome = (x: number, y: number, rx: number, ry: number, color: string) => {
        const center = toScreen(gridToWorld(x, y));
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(center.x, center.y, rx * TILE_W * cameraRef.current.zoom, ry * TILE_H * cameraRef.current.zoom, 0, 0, Math.PI * 2);
        ctx.fill();
      };
      biome(62, 70, 45, 32, 'rgba(44,100,57,.52)');
      biome(196, 73, 39, 35, 'rgba(52,105,61,.50)');
      biome(185, 188, 48, 38, 'rgba(94,123,65,.36)');
      biome(82, 177, 32, 25, 'rgba(174,151,91,.24)');
      biome(129, 129, 24, 18, 'rgba(174,201,111,.35)');

      const trailStart = toScreen(gridToWorld(39, 183));
      const trailMid = toScreen(gridToWorld(102, 144));
      const trailEnd = toScreen(gridToWorld(204, 107));
      ctx.strokeStyle = 'rgba(190,157,99,.72)';
      ctx.lineWidth = Math.max(3, 18 * cameraRef.current.zoom);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(trailStart.x, trailStart.y);
      ctx.quadraticCurveTo(trailMid.x, trailMid.y, trailEnd.x, trailEnd.y);
      ctx.stroke();
      ctx.restore();

      islandPath();
      ctx.strokeStyle = '#d2c88a';
      ctx.lineWidth = Math.max(2, 11 * cameraRef.current.zoom);
      ctx.stroke();
      islandPath();
      ctx.strokeStyle = 'rgba(157,224,221,.45)';
      ctx.lineWidth = Math.max(1, 4 * cameraRef.current.zoom);
      ctx.stroke();
    };

    const drawRiver = () => {
      const points: Point[] = [];
      for (let y = 8; y < 250; y += 5) points.push(toScreen(gridToWorld(riverCenter(y), y)));
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#c8b77c';
      ctx.lineWidth = Math.max(5, 13 * cameraRef.current.zoom);
      ctx.beginPath();
      points.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
      ctx.stroke();
      const water = ctx.createLinearGradient(points[0].x, points[0].y, points.at(-1)!.x, points.at(-1)!.y);
      water.addColorStop(0, '#65bfd0');
      water.addColorStop(.5, '#278ba8');
      water.addColorStop(1, '#176c8b');
      ctx.strokeStyle = water;
      ctx.lineWidth = Math.max(4, 9 * cameraRef.current.zoom);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(224,250,244,.45)';
      ctx.lineWidth = Math.max(1, 1.3 * cameraRef.current.zoom);
      ctx.stroke();
    };

    const drawMountain = (x: number, y: number, scale: number) => {
      const point = toScreen(gridToWorld(x, y));
      const size = 46 * scale * cameraRef.current.zoom;
      if (size < 4) return;
      ctx.fillStyle = 'rgba(17,42,37,.30)';
      ctx.beginPath();
      ctx.ellipse(point.x + size * .4, point.y + size * .34, size * .82, size * .27, -.12, 0, Math.PI * 2);
      ctx.fill();
      const gradient = ctx.createLinearGradient(point.x - size, point.y, point.x + size, point.y);
      gradient.addColorStop(0, '#79836d');
      gradient.addColorStop(.48, '#b7b49a');
      gradient.addColorStop(1, '#59665d');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(point.x - size, point.y + size * .35);
      ctx.lineTo(point.x, point.y - size);
      ctx.lineTo(point.x + size, point.y + size * .35);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(238,235,205,.8)';
      ctx.beginPath();
      ctx.moveTo(point.x, point.y - size);
      ctx.lineTo(point.x - size * .24, point.y - size * .42);
      ctx.lineTo(point.x + size * .2, point.y - size * .52);
      ctx.lineTo(point.x + size * .35, point.y - size * .2);
      ctx.closePath();
      ctx.fill();
    };

    const drawTree = (x: number, y: number, scale: number, pine: boolean) => {
      const point = toScreen(gridToWorld(x, y));
      const size = 26 * scale * cameraRef.current.zoom;
      if (size < 2.6) return;
      ctx.fillStyle = 'rgba(14,43,31,.30)';
      ctx.beginPath();
      ctx.ellipse(point.x + size * .35, point.y + size * .22, size * .65, size * .22, -.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#654831';
      ctx.fillRect(point.x - size * .08, point.y - size * .22, size * .16, size * .62);
      const crown = ctx.createLinearGradient(point.x - size, point.y - size, point.x + size, point.y + size);
      crown.addColorStop(0, pine ? '#3f8153' : '#649954');
      crown.addColorStop(1, pine ? '#183f34' : '#315f3e');
      ctx.fillStyle = crown;
      if (pine) {
        for (let layer = 0; layer < 3; layer += 1) {
          const top = point.y - size * (1.25 - layer * .34);
          ctx.beginPath();
          ctx.moveTo(point.x, top);
          ctx.lineTo(point.x + size * (.62 + layer * .12), top + size * .78);
          ctx.lineTo(point.x - size * (.62 + layer * .12), top + size * .78);
          ctx.closePath();
          ctx.fill();
        }
      } else {
        ctx.beginPath();
        ctx.arc(point.x, point.y - size * .62, size * .67, 0, Math.PI * 2);
        ctx.arc(point.x - size * .43, point.y - size * .36, size * .45, 0, Math.PI * 2);
        ctx.arc(point.x + size * .42, point.y - size * .33, size * .48, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawRock = (x: number, y: number, scale: number) => {
      const point = toScreen(gridToWorld(x, y));
      const size = 12 * scale * cameraRef.current.zoom;
      if (size < 2) return;
      ctx.fillStyle = 'rgba(12,35,28,.25)';
      ctx.beginPath();
      ctx.ellipse(point.x + size * .25, point.y + size * .35, size, size * .35, 0, 0, Math.PI * 2);
      ctx.fill();
      const gradient = ctx.createLinearGradient(point.x - size, point.y - size, point.x + size, point.y + size);
      gradient.addColorStop(0, '#b5b29c');
      gradient.addColorStop(1, '#5e6b62');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(point.x - size, point.y + size * .3);
      ctx.lineTo(point.x - size * .45, point.y - size * .65);
      ctx.lineTo(point.x + size * .45, point.y - size * .85);
      ctx.lineTo(point.x + size, point.y + size * .25);
      ctx.closePath();
      ctx.fill();
    };

    const drawBuildGrid = () => {
      if (!placingRef.current || cameraRef.current.zoom < .24) return;
      ctx.strokeStyle = 'rgba(230,245,199,.14)';
      ctx.lineWidth = 1;
      for (let y = 18; y < 238; y += 3) {
        for (let x = 18; x < 238; x += 3) {
          if (!isWalkable(x, y)) continue;
          const point = toScreen(gridToWorld(x, y));
          if (point.x < -30 || point.x > canvas.clientWidth + 30 || point.y < -30 || point.y > canvas.clientHeight + 30) continue;
          ctx.beginPath();
          ctx.moveTo(point.x, point.y - TILE_H * cameraRef.current.zoom * 1.5);
          ctx.lineTo(point.x + TILE_W * cameraRef.current.zoom * 1.5, point.y);
          ctx.lineTo(point.x, point.y + TILE_H * cameraRef.current.zoom * 1.5);
          ctx.lineTo(point.x - TILE_W * cameraRef.current.zoom * 1.5, point.y);
          ctx.closePath();
          ctx.stroke();
        }
      }
    };

    const drawTent = (camp: Camp) => {
      if (camp.gridX === undefined || camp.gridY === undefined) return;
      const point = toScreen(gridToWorld(camp.gridX, camp.gridY));
      const scale = cameraRef.current.zoom;
      const size = 43 * scale;
      ctx.fillStyle = 'rgba(12,35,28,.35)';
      ctx.beginPath();
      ctx.ellipse(point.x + size * .18, point.y + size * .34, size, size * .28, -.12, 0, Math.PI * 2);
      ctx.fill();
      const fabric = ctx.createLinearGradient(point.x - size, point.y, point.x + size, point.y);
      fabric.addColorStop(0, camp.ownerId === userRef.current ? '#d5a53f' : '#b86f43');
      fabric.addColorStop(.5, camp.ownerId === userRef.current ? '#f0d477' : '#dca06f');
      fabric.addColorStop(1, '#70432c');
      ctx.fillStyle = fabric;
      ctx.beginPath();
      ctx.moveTo(point.x - size, point.y + size * .28);
      ctx.lineTo(point.x, point.y - size * 1.2);
      ctx.lineTo(point.x + size, point.y + size * .28);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#4a3026';
      ctx.beginPath();
      ctx.moveTo(point.x - size * .28, point.y + size * .27);
      ctx.lineTo(point.x, point.y - size * .45);
      ctx.lineTo(point.x + size * .28, point.y + size * .27);
      ctx.closePath();
      ctx.fill();
      if (scale > .18) {
        ctx.font = `700 ${Math.max(11, 13 * scale)}px system-ui`;
        const labelWidth = Math.min(180, ctx.measureText(camp.name).width + 18);
        ctx.fillStyle = 'rgba(12,38,29,.88)';
        ctx.beginPath();
        ctx.roundRect(point.x - labelWidth / 2, point.y - size * 1.85, labelWidth, 24, 8);
        ctx.fill();
        ctx.fillStyle = '#fff0bd';
        ctx.textAlign = 'center';
        ctx.fillText(camp.name, point.x, point.y - size * 1.85 + 17);
      }
    };

    const drawAvatar = (time: number) => {
      const avatar = avatarRef.current;
      const point = toScreen(gridToWorld(avatar.x, avatar.y));
      const scale = cameraRef.current.zoom;
      const size = Math.max(9, 25 * scale);
      const bob = avatar.target ? Math.sin(time / 90) * 2 : Math.sin(time / 650);
      ctx.fillStyle = 'rgba(10,34,27,.35)';
      ctx.beginPath();
      ctx.ellipse(point.x, point.y + size * .28, size * .72, size * .22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#285f48';
      ctx.beginPath();
      ctx.roundRect(point.x - size * .43, point.y - size + bob, size * .86, size * 1.15, size * .18);
      ctx.fill();
      ctx.fillStyle = '#e3b184';
      ctx.beginPath();
      ctx.arc(point.x, point.y - size * 1.2 + bob, size * .42, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d6a84f';
      ctx.beginPath();
      ctx.moveTo(point.x - size * .45, point.y - size * .72 + bob);
      ctx.lineTo(point.x + size * .45, point.y - size * .72 + bob);
      ctx.lineTo(point.x, point.y - size * .36 + bob);
      ctx.closePath();
      ctx.fill();
    };

    const drawPlacement = () => {
      if (!placingRef.current || !previewRef.current) return;
      const selected = previewRef.current;
      const valid = canPlace(selected, campsRef.current);
      const point = toScreen(gridToWorld(selected.x, selected.y));
      const zoom = cameraRef.current.zoom;
      ctx.fillStyle = valid ? 'rgba(145,221,96,.38)' : 'rgba(255,85,72,.42)';
      ctx.strokeStyle = valid ? '#d8f89f' : '#ff8d82';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(point.x, point.y - TILE_H * zoom * 5);
      ctx.lineTo(point.x + TILE_W * zoom * 5, point.y);
      ctx.lineTo(point.x, point.y + TILE_H * zoom * 5);
      ctx.lineTo(point.x - TILE_W * zoom * 5, point.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.globalAlpha = .72;
      drawTent({ id: 'preview', name: valid ? 'Posição disponível' : 'Posição bloqueada', ownerId: userRef.current, tentLevel: 1, gridX: selected.x, gridY: selected.y });
      ctx.globalAlpha = 1;
    };

    const drawPendingTent = () => {
      const pending = pendingTentRef.current;
      if (!pending) return;
      ctx.globalAlpha = pending.status === 'saving' ? .76 : 1;
      drawTent({ id: 'pending-tent', name: pending.status === 'saving' ? 'Montando barraca...' : 'Minha barraca', ownerId: userRef.current, tentLevel: 1, gridX: pending.point.x, gridY: pending.point.y });
      ctx.globalAlpha = 1;
    };

    const render = (time: number) => {
      const delta = Math.min(.05, (time - lastTime) / 1000 || 0);
      lastTime = time;
      const avatar = avatarRef.current;
      if (avatar.target) {
        const dx = avatar.target.x - avatar.x;
        const dy = avatar.target.y - avatar.y;
        const distance = Math.hypot(dx, dy);
        if (distance < .12) {
          avatar.x = avatar.target.x;
          avatar.y = avatar.target.y;
          avatar.target = null;
          positionRef.current({ x: Math.round(avatar.x), y: Math.round(avatar.y) }).catch(() => undefined);
          setCaption('Destino alcançado.');
        } else {
          const movement = Math.min(distance, delta * 12);
          avatar.x += dx / distance * movement;
          avatar.y += dy / distance * movement;
          avatar.step += delta;
        }
      }

      drawOcean(canvas.clientWidth, canvas.clientHeight, time);
      drawIsland();
      drawRiver();
      drawBuildGrid();
      drawMountain(58, 58, 1.65);
      drawMountain(67, 64, 1.25);
      drawMountain(196, 58, 1.45);
      drawMountain(205, 70, 1.1);
      const objects = [
        ...trees.map((tree) => ({ kind: 'tree' as const, y: tree.y, data: tree })),
        ...rocks.map((rock) => ({ kind: 'rock' as const, y: rock.y, data: rock })),
        ...campsRef.current.filter((camp) => camp.gridX !== undefined && camp.gridY !== undefined).map((camp) => ({ kind: 'camp' as const, y: camp.gridY!, data: camp })),
        { kind: 'avatar' as const, y: avatar.y, data: avatar },
      ].sort((a, b) => a.y - b.y);
      for (const object of objects) {
        if (object.kind === 'tree') drawTree(object.data.x, object.data.y, object.data.scale, object.data.pine);
        else if (object.kind === 'rock') drawRock(object.data.x, object.data.y, object.data.scale);
        else if (object.kind === 'camp') drawTent(object.data);
        else drawAvatar(time);
      }
      drawPendingTent();
      drawPlacement();
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);

    const eventPoint = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };
    const onPointerDown = (event: PointerEvent) => {
      const point = eventPoint(event);
      const world = toWorld(point.x, point.y);
      pointerRef.current = { startX: point.x, startY: point.y, x: point.x, y: point.y, worldX: world.x, worldY: world.y, dragging: false };
      if (placingRef.current) previewRef.current = worldToGrid(world.x, world.y);
      canvas.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!pointerRef.current) return;
      const point = eventPoint(event);
      const pointer = pointerRef.current;
      if (Math.hypot(point.x - pointer.startX, point.y - pointer.startY) > 7) pointer.dragging = true;
      if (pointer.dragging) {
        cameraRef.current.x -= (point.x - pointer.x) / cameraRef.current.zoom;
        cameraRef.current.y -= (point.y - pointer.y) / cameraRef.current.zoom;
      }
      pointer.x = point.x;
      pointer.y = point.y;
      const world = toWorld(point.x, point.y);
      pointer.worldX = world.x;
      pointer.worldY = world.y;
      if (placingRef.current) previewRef.current = worldToGrid(world.x, world.y);
    };
    const onPointerUp = async () => {
      const pointer = pointerRef.current;
      pointerRef.current = null;
      if (!pointer || pointer.dragging) return;
      const selected = worldToGrid(pointer.worldX, pointer.worldY);
      if (placingRef.current) {
        if (!canPlace(selected, campsRef.current)) {
          setCaption('Posição inválida: escolha uma clareira longe do rio, relevo e outras barracas.');
          return;
        }
        pendingTentRef.current = { point: selected, status: 'saving' };
        previewRef.current = null;
        setCaption('Reservando seu terreno com segurança...');
        try {
          await claimRef.current(selected);
          pendingTentRef.current = { point: selected, status: 'confirmed' };
          setCaption('Terreno reservado! Sua primeira barraca foi montada.');
        } catch {
          pendingTentRef.current = null;
          setCaption('Não foi possível reservar esse terreno. Tente outra posição.');
        }
        return;
      }
      if (isWalkable(selected.x, selected.y)) {
        avatarRef.current.target = selected;
        setCaption('Caminhando até o destino...');
      }
    };
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const before = toWorld(x, y);
      cameraRef.current.zoom = Math.max(.075, Math.min(1.25, cameraRef.current.zoom * (event.deltaY > 0 ? .84 : 1.18)));
      const after = toWorld(x, y);
      cameraRef.current.x += before.x - after.x;
      cameraRef.current.y += before.y - after.y;
    };
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    const zoomIn = () => { cameraRef.current.zoom = Math.min(1.25, cameraRef.current.zoom * 1.25); };
    const zoomOut = () => { cameraRef.current.zoom = Math.max(.075, cameraRef.current.zoom / 1.25); };
    const fit = () => { cameraRef.current = { x: 0, y: 6300, zoom: .105 }; };
    const centerAvatar = () => {
      const point = gridToWorld(avatarRef.current.x, avatarRef.current.y);
      cameraRef.current.x = point.x;
      cameraRef.current.y = point.y;
      cameraRef.current.zoom = Math.max(cameraRef.current.zoom, .42);
    };
    document.getElementById('world-zoom-in')?.addEventListener('click', zoomIn);
    document.getElementById('world-zoom-out')?.addEventListener('click', zoomOut);
    document.getElementById('world-fit')?.addEventListener('click', fit);
    document.getElementById('world-avatar')?.addEventListener('click', centerAvatar);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
      document.getElementById('world-zoom-in')?.removeEventListener('click', zoomIn);
      document.getElementById('world-zoom-out')?.removeEventListener('click', zoomOut);
      document.getElementById('world-fit')?.removeEventListener('click', fit);
      document.getElementById('world-avatar')?.removeEventListener('click', centerAvatar);
    };
  }, []);

  const controlStyle = { width: 42, height: 42, border: '1px solid rgba(214,168,79,.7)', borderRadius: 12, background: 'rgba(13,38,31,.9)', color: '#f3e8d0', fontWeight: 800, cursor: 'pointer' } as const;
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#173d32' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />
      <div style={{ position: 'absolute', right: 14, top: 132, display: 'grid', gap: 8 }}>
        <button id="world-zoom-in" aria-label="Aproximar" style={controlStyle}>+</button>
        <button id="world-zoom-out" aria-label="Afastar" style={controlStyle}>−</button>
        <button id="world-fit" aria-label="Ver ilha inteira" style={{ ...controlStyle, fontSize: 11 }}>ILHA</button>
        <button id="world-avatar" aria-label="Centralizar no personagem" style={{ ...controlStyle, fontSize: 17 }}>◎</button>
      </div>
      <div style={{ position: 'absolute', bottom: 108, left: 12, maxWidth: 'min(520px, 75vw)', pointerEvents: 'none', color: '#fff0bd', background: 'rgba(10,31,27,.84)', border: '1px solid rgba(214,168,79,.35)', borderRadius: 10, padding: '8px 11px', font: '12px system-ui' }}>{caption}</div>
    </div>
  );
}
