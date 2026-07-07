<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useGameStore } from '@/stores/game';
import { BUILD_ORDER, BUILDINGS, PLANET_STYLES } from '@/game/constants';
import { underTruce } from '@/game/engine';
import { anims } from '@/game/effects';
import type { Planet } from '@/game/types';

const store = useGameStore();
const state = store.state;

// DEBUG: set localStorage['seven-planets:debug-black-holes'] = 'true' to render
// EVERY planet as a black hole (visual testing only). Read once at load.
const FORCE_BLACK_HOLES = (() => {
  try {
    return localStorage.getItem('seven-planets:debug-black-holes') === 'true';
  } catch {
    return false;
  }
})();

const canvas = ref<HTMLCanvasElement | null>(null);
let ctx: CanvasRenderingContext2D | null = null;
let canvasW = 0;
let canvasH = 0;
let stars: { x: number; y: number; r: number; p: number }[] = [];
let raf = 0;

function circle(x: number, y: number, r: number): void {
  ctx!.beginPath();
  ctx!.arc(x, y, r, 0, Math.PI * 2);
}

function layoutBoard(): void {
  const el = canvas.value;
  if (!el || !el.parentElement) return;
  const rect = el.parentElement.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvasW = Math.max(300, rect.width);
  canvasH = Math.max(300, rect.height);
  el.width = canvasW * dpr;
  el.height = canvasH * dpr;
  ctx = el.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const cx = canvasW * 0.5;
  const cy = canvasH * 0.52;
  const rx = canvasW * 0.36;
  const ry = canvasH * 0.345;
  const r = Math.max(20, Math.min(38, Math.min(canvasW, canvasH) * 0.055));
  for (let i = 0; i < 7; i++) {
    const a = Math.PI / 2 + i * ((Math.PI * 2) / 7);
    state.planets[i].x = cx + rx * Math.cos(a);
    state.planets[i].y = cy + ry * Math.sin(a);
    state.planets[i].r = r;
  }
  stars = [];
  const n = Math.floor((canvasW * canvasH) / 8000);
  for (let i = 0; i < n; i++) {
    stars.push({
      x: Math.random() * canvasW,
      y: Math.random() * canvasH,
      r: Math.random() * 1.3 + 0.3,
      p: Math.random() * 6.28,
    });
  }
}

function drawFrame(now: number): void {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvasW, canvasH);
  ctx.fillStyle = '#05070f';
  ctx.fillRect(0, 0, canvasW, canvasH);
  let g = ctx.createRadialGradient(
    canvasW * 0.25,
    canvasH * 0.3,
    0,
    canvasW * 0.25,
    canvasH * 0.3,
    canvasW * 0.5,
  );
  g.addColorStop(0, 'rgba(90,40,140,0.10)');
  g.addColorStop(1, 'transparent');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvasW, canvasH);
  g = ctx.createRadialGradient(
    canvasW * 0.78,
    canvasH * 0.7,
    0,
    canvasW * 0.78,
    canvasH * 0.7,
    canvasW * 0.45,
  );
  g.addColorStop(0, 'rgba(30,110,140,0.10)');
  g.addColorStop(1, 'transparent');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvasW, canvasH);

  for (const s of stars) {
    ctx.globalAlpha = 0.35 + 0.55 * Math.abs(Math.sin(now / 900 + s.p));
    ctx.fillStyle = '#cfe3ff';
    circle(s.x, s.y, s.r);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  for (const pl of state.planets) drawPlanet(pl, now);
  drawAnims(now);
}

// A collapsed Singularity: a black event horizon wrapped in a glowing, spinning
// accretion disk with a lensing halo. Drawn in place of the normal planet body.
function drawBlackHole(x: number, y: number, r: number, now: number): void {
  if (!ctx) return;
  const t = now / 1000;

  // Gravitational lensing halo — light bending into a warm/violet glow.
  const halo = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 2.1);
  halo.addColorStop(0, 'rgba(255,170,70,0)');
  halo.addColorStop(0.55, 'rgba(255,150,60,0.28)');
  halo.addColorStop(0.8, 'rgba(150,90,255,0.16)');
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = halo;
  circle(x, y, r * 2.1);
  ctx.fill();

  // Accretion disk — bright tilted rings of infalling matter, plus a superheated
  // hotspot orbiting the plane to sell the spin.
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.4);
  for (let i = 0; i < 3; i++) {
    const rr = r * (1.35 + i * 0.16);
    const a = 0.5 - i * 0.13;
    const disk = ctx.createLinearGradient(-rr, 0, rr, 0);
    disk.addColorStop(0, 'rgba(255,120,40,0)');
    disk.addColorStop(0.25, `rgba(255,180,90,${a})`);
    disk.addColorStop(0.5, `rgba(255,240,200,${a + 0.15})`);
    disk.addColorStop(0.75, `rgba(255,150,70,${a})`);
    disk.addColorStop(1, 'rgba(255,120,40,0)');
    ctx.strokeStyle = disk;
    ctx.lineWidth = r * 0.16;
    ctx.beginPath();
    ctx.ellipse(0, 0, rr, rr * 0.42, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  const ang = t * 1.5;
  const hx = Math.cos(ang) * r * 1.5;
  const hy = Math.sin(ang) * r * 1.5 * 0.42;
  const spot = ctx.createRadialGradient(hx, hy, 0, hx, hy, r * 0.3);
  spot.addColorStop(0, 'rgba(255,255,235,0.9)');
  spot.addColorStop(1, 'rgba(255,180,80,0)');
  ctx.fillStyle = spot;
  circle(hx, hy, r * 0.3);
  ctx.fill();
  ctx.restore();

  // Event horizon — pure black, rimmed by a faint photon ring.
  ctx.fillStyle = '#000';
  circle(x, y, r);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,220,150,0.9)';
  ctx.lineWidth = 2;
  circle(x, y, r * 0.98);
  ctx.stroke();
}

function drawPlanet(pl: Planet, now: number): void {
  if (!ctx) return;
  const st =
    PLANET_STYLES[pl.styleIdx !== undefined ? pl.styleIdx : pl.id] ||
    PLANET_STYLES[0];
  const owner = state.players[pl.ownerId];
  const { x, y, r } = pl;
  // A maxed Singularity (level 3) collapses the planet into a black hole; the
  // debug flag forces the look on every planet.
  const blackHole = FORCE_BLACK_HOLES || (pl.buildings.SINGULARITY || 0) >= 3;

  if (owner.id === state.activeId && !state.over) {
    const k = 0.5 + 0.5 * Math.sin(now / 300);
    ctx.strokeStyle = owner.color;
    ctx.globalAlpha = 0.25 + 0.35 * k;
    ctx.lineWidth = 3;
    circle(x, y, r + 10 + 3 * k);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  if (blackHole) {
    drawBlackHole(x, y, r, now);
  } else {
    if (st.feature === 'rings') {
      ctx.strokeStyle = 'rgba(255,215,110,0.55)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(x, y, r * 1.7, r * 0.55, -0.35, 0, Math.PI * 2);
      ctx.stroke();
    }

    const g = ctx.createRadialGradient(
      x - r * 0.4,
      y - r * 0.4,
      r * 0.15,
      x,
      y,
      r,
    );
    g.addColorStop(0, st.light);
    g.addColorStop(1, st.dark);
    ctx.fillStyle = g;
    circle(x, y, r);
    ctx.fill();

    ctx.save();
    circle(x, y, r);
    ctx.clip();
    if (st.feature === 'continents') {
      ctx.fillStyle = 'rgba(46,143,79,0.75)';
      const blobs = [
        [-0.3, -0.2, 0.45],
        [0.28, 0.12, 0.34],
        [-0.05, 0.42, 0.28],
        [0.42, -0.36, 0.22],
      ];
      for (const [dx, dy, dr] of blobs) {
        circle(x + dx * r, y + dy * r, dr * r);
        ctx.fill();
      }
    } else if (st.feature === 'bands') {
      ctx.fillStyle = 'rgba(90,45,10,0.30)';
      ctx.fillRect(x - r, y - r * 0.55, r * 2, r * 0.28);
      ctx.fillRect(x - r, y + 0.05 * r, r * 2, r * 0.22);
      ctx.fillRect(x - r, y + 0.55 * r, r * 2, r * 0.18);
    } else if (st.feature === 'city') {
      ctx.fillStyle = 'rgba(255,224,130,0.9)';
      const dots = [
        [-0.4, 0.2],
        [-0.15, 0.45],
        [0.15, 0.3],
        [0.4, 0.45],
        [0.05, 0.05],
        [-0.5, 0.5],
        [0.3, 0.1],
        [-0.25, -0.1],
      ];
      for (const [dx, dy] of dots) {
        circle(x + dx * r, y + dy * r, 1.6);
        ctx.fill();
      }
    } else if (st.feature === 'ice') {
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.beginPath();
      ctx.ellipse(x, y - r * 0.8, r * 0.7, r * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x, y + r * 0.85, r * 0.6, r * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (st.feature === 'storm') {
      ctx.strokeStyle = 'rgba(220,200,255,0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x - r * 0.1, y, r * 0.55, 0.5, 3.5);
      ctx.stroke();
      ctx.fillStyle = 'rgba(230,215,255,0.5)';
      ctx.beginPath();
      ctx.ellipse(
        x + r * 0.25,
        y - r * 0.15,
        r * 0.28,
        r * 0.16,
        0.4,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    } else if (st.feature === 'craters') {
      ctx.fillStyle = 'rgba(0,0,20,0.25)';
      for (const [dx, dy, dr] of [
        [-0.3, 0.1, 0.18],
        [0.25, -0.25, 0.14],
        [0.1, 0.4, 0.12],
      ]) {
        circle(x + dx * r, y + dy * r, dr * r);
        ctx.fill();
      }
    } else if (st.feature === 'lava') {
      ctx.fillStyle = 'rgba(30,5,5,0.75)';
      for (const [dx, dy, rw, rh, ang] of [
        [-0.2, 0.1, 0.34, 0.18, 0.5],
        [0.3, -0.2, 0.24, 0.38, 1.2],
        [-0.05, -0.4, 0.3, 0.15, 0.8],
        [0.1, 0.4, 0.36, 0.2, 2.1],
      ]) {
        ctx.beginPath();
        ctx.ellipse(
          x + dx * r,
          y + dy * r,
          rw * r,
          rh * r,
          ang,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,110,0,0.32)';
      for (const [dx, dy] of [
        [-0.1, 0.06],
        [0.24, -0.14],
        [-0.16, -0.32],
      ]) {
        circle(x + dx * r, y + dy * r, 0.11 * r);
        ctx.fill();
      }
    } else if (st.feature === 'forest') {
      ctx.fillStyle = 'rgba(10,55,15,0.82)';
      for (const [dx, dy, dr] of [
        [-0.22, -0.08, 0.46],
        [0.26, 0.22, 0.38],
        [-0.06, 0.42, 0.34],
        [0.38, -0.36, 0.28],
        [-0.42, 0.28, 0.3],
      ]) {
        circle(x + dx * r, y + dy * r, dr * r);
        ctx.fill();
      }
    } else if (st.feature === 'toxic') {
      ctx.fillStyle = 'rgba(40,210,30,0.55)';
      for (const [dx, dy, dr] of [
        [-0.28, 0.22, 0.28],
        [0.22, -0.14, 0.24],
        [0.1, 0.44, 0.2],
        [-0.1, -0.34, 0.26],
      ]) {
        circle(x + dx * r, y + dy * r, dr * r);
        ctx.fill();
      }
    } else if (st.feature === 'desert') {
      ctx.strokeStyle = 'rgba(130,80,15,0.38)';
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(x, y + (i - 1.5) * r * 0.38, r * 0.88, -Math.PI * 0.65, 0.05);
        ctx.stroke();
      }
    } else if (st.feature === 'crystal') {
      ctx.fillStyle = 'rgba(140,190,255,0.32)';
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ctx.fillRect(
          x + Math.cos(a) * r * 0.32 - 0.11 * r,
          y + Math.sin(a) * r * 0.32 - 0.07 * r,
          0.22 * r,
          0.14 * r,
        );
      }
    } else if (st.feature === 'void') {
      ctx.fillStyle = 'rgba(0,0,15,0.65)';
      ctx.beginPath();
      ctx.ellipse(x, y, r * 0.5, r * 0.18, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(
        x + r * 0.2,
        y - r * 0.3,
        r * 0.28,
        r * 0.1,
        -0.6,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    } else if (st.feature === 'ocean') {
      ctx.strokeStyle = 'rgba(20,110,150,0.38)';
      ctx.lineWidth = 1.8;
      for (let i = 1; i <= 4; i++) {
        circle(x - r * 0.18, y + r * 0.12, r * 0.14 * i);
        ctx.stroke();
      }
    } else if (st.feature === 'nebula') {
      ctx.fillStyle = 'rgba(210,90,170,0.32)';
      ctx.beginPath();
      ctx.ellipse(x - r * 0.22, y, r * 0.55, r * 0.28, 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(90,140,255,0.28)';
      ctx.beginPath();
      ctx.ellipse(
        x + r * 0.2,
        y - r * 0.18,
        r * 0.42,
        r * 0.22,
        -0.5,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    } else if (st.feature === 'radiation') {
      ctx.fillStyle = 'rgba(150,250,50,0.42)';
      for (const [dx, dy, dr] of [
        [-0.3, 0.12, 0.2],
        [0.26, 0.28, 0.17],
        [-0.1, -0.32, 0.22],
        [0.38, -0.22, 0.15],
      ]) {
        circle(x + dx * r, y + dy * r, dr * r);
        ctx.fill();
      }
    }
    ctx.fillStyle = 'rgba(0,0,12,0.30)';
    circle(x + r * 0.45, y + r * 0.4, r);
    ctx.fill();
    ctx.restore();

    if (st.feature === 'moon') {
      const a = now / 2400;
      ctx.fillStyle = '#b8c4d8';
      circle(x + Math.cos(a) * r * 1.6, y + Math.sin(a) * r * 0.9, r * 0.16);
      ctx.fill();
    }
  } // end normal-planet body (skipped when rendered as a black hole)

  ctx.strokeStyle = owner.color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = owner.alive ? 0.9 : 0.25;
  circle(x, y, r + 5);
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.textAlign = 'center';
  ctx.font = 'bold 13px Consolas, monospace';
  ctx.fillStyle = '#e8f2ff';
  ctx.fillText(pl.name, x, y - r - 26);
  ctx.font = '11px Consolas, monospace';
  ctx.fillStyle = owner.color;
  ctx.fillText(owner.isHuman ? owner.name + ' ★' : owner.name, x, y - r - 12);

  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#fff';
  ctx.fillText(
    `🪖${pl.troops}${underTruce(pl) ? ' 🕊️' : ''}${owner.pacifistStatus ? ' ☮️' : ''}`,
    x,
    y + r + 18,
  );

  const icons = BUILD_ORDER.filter((b) => pl.buildings[b]).map(
    (b) => BUILDINGS[b].icon + (pl.buildings[b] > 1 ? pl.buildings[b] : ''),
  );
  ctx.font = '11px sans-serif';
  for (let row = 0; row * 5 < icons.length; row++) {
    ctx.fillText(
      icons.slice(row * 5, row * 5 + 5).join(' '),
      x,
      y + r + 33 + row * 14,
    );
  }
}

function drawAnims(now: number): void {
  if (!ctx) return;
  for (let i = anims.length - 1; i >= 0; i--) {
    const a = anims[i];
    const k = (now - a.t0) / a.dur;
    if (k >= 1) {
      anims.splice(i, 1);
      continue;
    }
    if (a.type === 'rocket') {
      const e = k * k * (3 - 2 * k);
      const px = a.fx! + (a.tx! - a.fx!) * e;
      const py = a.fy! + (a.ty! - a.fy!) * e;
      const ang = Math.atan2(a.ty! - a.fy!, a.tx! - a.fx!);
      const tb = Math.max(0, e - 0.15);
      ctx.strokeStyle = a.color!;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(a.fx! + (a.tx! - a.fx!) * tb, a.fy! + (a.ty! - a.fy!) * tb);
      ctx.lineTo(px, py);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(ang);
      ctx.fillStyle = '#e8f2ff';
      ctx.beginPath();
      ctx.moveTo(9, 0);
      ctx.lineTo(-6, 4.5);
      ctx.lineTo(-6, -4.5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = Math.random() < 0.5 ? '#ff9e3d' : '#ffd23d';
      circle(-8, 0, 3);
      ctx.fill();
      ctx.restore();
    } else if (a.type === 'boom') {
      ctx.globalAlpha = 1 - k;
      ctx.strokeStyle = '#ff9e3d';
      ctx.lineWidth = 3;
      circle(a.x!, a.y!, 6 + k * 30);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,215,110,' + 0.5 * (1 - k) + ')';
      circle(a.x!, a.y!, 4 + k * 16);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else if (a.type === 'text') {
      ctx.globalAlpha = 1 - k;
      ctx.font = 'bold 13px Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = a.color!;
      ctx.fillText(a.txt!, a.x!, a.y! - 20 - k * 26);
      ctx.globalAlpha = 1;
    }
  }
}

function frame(now: number): void {
  drawFrame(now || 0);
  raf = requestAnimationFrame(frame);
}

onMounted(() => {
  layoutBoard();
  window.addEventListener('resize', layoutBoard);
  raf = requestAnimationFrame(frame);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(raf);
  window.removeEventListener('resize', layoutBoard);
});
</script>

<template>
  <div id="board-wrap"><canvas id="board" ref="canvas"></canvas></div>
</template>
