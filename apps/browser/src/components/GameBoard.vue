<script setup lang="ts">
import { getActiveId } from '@seven-planets/game';
import { getIsOver } from '@seven-planets/game';
import { getPlanets } from '@seven-planets/game';
import { getPlayers } from '@seven-planets/game';
import { PLANET_STYLES, BUILD_ORDER, BUILDINGS } from '@seven-planets/game';
import { isUnderTruce } from '@seven-planets/game';
import type { Planet } from '@seven-planets/game';
import { setPlanetLayout } from '@seven-planets/game';
import { useEffectsStore } from '@/stores';
import { onBeforeUnmount, onMounted, ref } from 'vue';

const { anims } = useEffectsStore();

const FORCE_BLACK_HOLES = (() => {
  try {
    return localStorage.getItem('seven-planets:debug-black-holes') === 'true';
  } catch {
    return false;
  }
})();

const canvas = ref<HTMLCanvasElement | null>(null);
let context: CanvasRenderingContext2D | null = null;
let canvasW = 0;
let canvasH = 0;
let stars: { x: number; y: number; radius: number; phase: number }[] = [];
let animationFrame = 0;

function circle(x: number, y: number, radius: number): void {
  context!.beginPath();
  context!.arc(x, y, radius, 0, Math.PI * 2);
}

function layoutBoard(): void {
  const element = canvas.value;
  if (!element || !element.parentElement) return;
  const rect = element.parentElement.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;
  canvasW = Math.max(300, rect.width);
  canvasH = Math.max(300, rect.height);
  element.width = canvasW * pixelRatio;
  element.height = canvasH * pixelRatio;
  context = element.getContext('2d');
  if (!context) return;
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  const centerX = canvasW * 0.5;
  const centerY = canvasH * 0.52;
  const ellipseRadiusX = canvasW * 0.36;
  const ellipseRadiusY = canvasH * 0.345;
  const planetRadius = Math.max(
    20,
    Math.min(38, Math.min(canvasW, canvasH) * 0.055),
  );
  const layout = [];
  for (let index = 0; index < 7; index++) {
    const angle = Math.PI / 2 + index * ((Math.PI * 2) / 7);
    layout.push({
      x: centerX + ellipseRadiusX * Math.cos(angle),
      y: centerY + ellipseRadiusY * Math.sin(angle),
      r: planetRadius,
    });
  }
  setPlanetLayout(layout);
  stars = [];
  const starCount = Math.floor((canvasW * canvasH) / 8000);
  for (let index = 0; index < starCount; index++) {
    stars.push({
      x: Math.random() * canvasW,
      y: Math.random() * canvasH,
      radius: Math.random() * 1.3 + 0.3,
      phase: Math.random() * 6.28,
    });
  }
}

function drawFrame(now: number): void {
  if (!context) return;
  context.clearRect(0, 0, canvasW, canvasH);
  context.fillStyle = '#05070f';
  context.fillRect(0, 0, canvasW, canvasH);
  let gradient = context.createRadialGradient(
    canvasW * 0.25,
    canvasH * 0.3,
    0,
    canvasW * 0.25,
    canvasH * 0.3,
    canvasW * 0.5,
  );
  gradient.addColorStop(0, 'rgba(90,40,140,0.10)');
  gradient.addColorStop(1, 'transparent');
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvasW, canvasH);
  gradient = context.createRadialGradient(
    canvasW * 0.78,
    canvasH * 0.7,
    0,
    canvasW * 0.78,
    canvasH * 0.7,
    canvasW * 0.45,
  );
  gradient.addColorStop(0, 'rgba(30,110,140,0.10)');
  gradient.addColorStop(1, 'transparent');
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvasW, canvasH);

  for (const star of stars) {
    context.globalAlpha =
      0.35 + 0.55 * Math.abs(Math.sin(now / 900 + star.phase));
    context.fillStyle = '#cfe3ff';
    circle(star.x, star.y, star.radius);
    context.fill();
  }
  context.globalAlpha = 1;

  for (const planet of getPlanets()) drawPlanet(planet, now);
  drawAnims(now);
}

function drawBlackHole(
  x: number,
  y: number,
  radius: number,
  now: number,
): void {
  if (!context) return;
  const seconds = now / 1000;

  const halo = context.createRadialGradient(
    x,
    y,
    radius * 0.6,
    x,
    y,
    radius * 2.1,
  );
  halo.addColorStop(0, 'rgba(255,170,70,0)');
  halo.addColorStop(0.55, 'rgba(255,150,60,0.28)');
  halo.addColorStop(0.8, 'rgba(150,90,255,0.16)');
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  context.fillStyle = halo;
  circle(x, y, radius * 2.1);
  context.fill();

  context.save();
  context.translate(x, y);
  context.rotate(-0.4);
  for (let index = 0; index < 3; index++) {
    const ringRadius = radius * (1.35 + index * 0.16);
    const alpha = 0.5 - index * 0.13;
    const disk = context.createLinearGradient(-ringRadius, 0, ringRadius, 0);
    disk.addColorStop(0, 'rgba(255,120,40,0)');
    disk.addColorStop(0.25, `rgba(255,180,90,${alpha})`);
    disk.addColorStop(0.5, `rgba(255,240,200,${alpha + 0.15})`);
    disk.addColorStop(0.75, `rgba(255,150,70,${alpha})`);
    disk.addColorStop(1, 'rgba(255,120,40,0)');
    context.strokeStyle = disk;
    context.lineWidth = radius * 0.16;
    context.beginPath();
    context.ellipse(0, 0, ringRadius, ringRadius * 0.42, 0, 0, Math.PI * 2);
    context.stroke();
  }
  const angle = seconds * 1.5;
  const hotspotX = Math.cos(angle) * radius * 1.5;
  const hotspotY = Math.sin(angle) * radius * 1.5 * 0.42;
  const spot = context.createRadialGradient(
    hotspotX,
    hotspotY,
    0,
    hotspotX,
    hotspotY,
    radius * 0.3,
  );
  spot.addColorStop(0, 'rgba(255,255,235,0.9)');
  spot.addColorStop(1, 'rgba(255,180,80,0)');
  context.fillStyle = spot;
  circle(hotspotX, hotspotY, radius * 0.3);
  context.fill();
  context.restore();

  context.fillStyle = '#000';
  circle(x, y, radius);
  context.fill();
  context.strokeStyle = 'rgba(255,220,150,0.9)';
  context.lineWidth = 2;
  circle(x, y, radius * 0.98);
  context.stroke();
}

function drawPlanet(planet: Planet, now: number): void {
  if (!context) return;
  const style =
    PLANET_STYLES[
      planet.styleIdx !== undefined ? planet.styleIdx : planet.id
    ] || PLANET_STYLES[0];
  const owner = getPlayers()[planet.ownerId];
  const { x, y, r: radius } = planet;
  const blackHole =
    FORCE_BLACK_HOLES || (planet.buildings.SINGULARITY || 0) >= 3;

  if (owner.id === getActiveId() && !getIsOver()) {
    const pulse = 0.5 + 0.5 * Math.sin(now / 300);
    context.strokeStyle = owner.color;
    context.globalAlpha = 0.25 + 0.35 * pulse;
    context.lineWidth = 3;
    circle(x, y, radius + 10 + 3 * pulse);
    context.stroke();
    context.globalAlpha = 1;
  }

  if (blackHole) {
    drawBlackHole(x, y, radius, now);
  } else {
    if (style.feature === 'rings') {
      context.strokeStyle = 'rgba(255,215,110,0.55)';
      context.lineWidth = 3;
      context.beginPath();
      context.ellipse(x, y, radius * 1.7, radius * 0.55, -0.35, 0, Math.PI * 2);
      context.stroke();
    }

    const gradient = context.createRadialGradient(
      x - radius * 0.4,
      y - radius * 0.4,
      radius * 0.15,
      x,
      y,
      radius,
    );
    gradient.addColorStop(0, style.light);
    gradient.addColorStop(1, style.dark);
    context.fillStyle = gradient;
    circle(x, y, radius);
    context.fill();

    context.save();
    circle(x, y, radius);
    context.clip();
    if (style.feature === 'continents') {
      context.fillStyle = 'rgba(46,143,79,0.75)';
      const blobs = [
        [-0.3, -0.2, 0.45],
        [0.28, 0.12, 0.34],
        [-0.05, 0.42, 0.28],
        [0.42, -0.36, 0.22],
      ];
      for (const [offsetX, offsetY, sizeFactor] of blobs) {
        circle(x + offsetX * radius, y + offsetY * radius, sizeFactor * radius);
        context.fill();
      }
    } else if (style.feature === 'bands') {
      context.fillStyle = 'rgba(90,45,10,0.30)';
      context.fillRect(
        x - radius,
        y - radius * 0.55,
        radius * 2,
        radius * 0.28,
      );
      context.fillRect(
        x - radius,
        y + 0.05 * radius,
        radius * 2,
        radius * 0.22,
      );
      context.fillRect(
        x - radius,
        y + 0.55 * radius,
        radius * 2,
        radius * 0.18,
      );
    } else if (style.feature === 'city') {
      context.fillStyle = 'rgba(255,224,130,0.9)';
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
      for (const [offsetX, offsetY] of dots) {
        circle(x + offsetX * radius, y + offsetY * radius, 1.6);
        context.fill();
      }
    } else if (style.feature === 'ice') {
      context.fillStyle = 'rgba(255,255,255,0.65)';
      context.beginPath();
      context.ellipse(
        x,
        y - radius * 0.8,
        radius * 0.7,
        radius * 0.32,
        0,
        0,
        Math.PI * 2,
      );
      context.fill();
      context.beginPath();
      context.ellipse(
        x,
        y + radius * 0.85,
        radius * 0.6,
        radius * 0.28,
        0,
        0,
        Math.PI * 2,
      );
      context.fill();
    } else if (style.feature === 'storm') {
      context.strokeStyle = 'rgba(220,200,255,0.4)';
      context.lineWidth = 2;
      context.beginPath();
      context.arc(x - radius * 0.1, y, radius * 0.55, 0.5, 3.5);
      context.stroke();
      context.fillStyle = 'rgba(230,215,255,0.5)';
      context.beginPath();
      context.ellipse(
        x + radius * 0.25,
        y - radius * 0.15,
        radius * 0.28,
        radius * 0.16,
        0.4,
        0,
        Math.PI * 2,
      );
      context.fill();
    } else if (style.feature === 'craters') {
      context.fillStyle = 'rgba(0,0,20,0.25)';
      for (const [offsetX, offsetY, sizeFactor] of [
        [-0.3, 0.1, 0.18],
        [0.25, -0.25, 0.14],
        [0.1, 0.4, 0.12],
      ]) {
        circle(x + offsetX * radius, y + offsetY * radius, sizeFactor * radius);
        context.fill();
      }
    } else if (style.feature === 'lava') {
      context.fillStyle = 'rgba(30,5,5,0.75)';
      for (const [offsetX, offsetY, widthFactor, heightFactor, angle] of [
        [-0.2, 0.1, 0.34, 0.18, 0.5],
        [0.3, -0.2, 0.24, 0.38, 1.2],
        [-0.05, -0.4, 0.3, 0.15, 0.8],
        [0.1, 0.4, 0.36, 0.2, 2.1],
      ]) {
        context.beginPath();
        context.ellipse(
          x + offsetX * radius,
          y + offsetY * radius,
          widthFactor * radius,
          heightFactor * radius,
          angle,
          0,
          Math.PI * 2,
        );
        context.fill();
      }
      context.fillStyle = 'rgba(255,110,0,0.32)';
      for (const [offsetX, offsetY] of [
        [-0.1, 0.06],
        [0.24, -0.14],
        [-0.16, -0.32],
      ]) {
        circle(x + offsetX * radius, y + offsetY * radius, 0.11 * radius);
        context.fill();
      }
    } else if (style.feature === 'forest') {
      context.fillStyle = 'rgba(10,55,15,0.82)';
      for (const [offsetX, offsetY, sizeFactor] of [
        [-0.22, -0.08, 0.46],
        [0.26, 0.22, 0.38],
        [-0.06, 0.42, 0.34],
        [0.38, -0.36, 0.28],
        [-0.42, 0.28, 0.3],
      ]) {
        circle(x + offsetX * radius, y + offsetY * radius, sizeFactor * radius);
        context.fill();
      }
    } else if (style.feature === 'toxic') {
      context.fillStyle = 'rgba(40,210,30,0.55)';
      for (const [offsetX, offsetY, sizeFactor] of [
        [-0.28, 0.22, 0.28],
        [0.22, -0.14, 0.24],
        [0.1, 0.44, 0.2],
        [-0.1, -0.34, 0.26],
      ]) {
        circle(x + offsetX * radius, y + offsetY * radius, sizeFactor * radius);
        context.fill();
      }
    } else if (style.feature === 'desert') {
      context.strokeStyle = 'rgba(130,80,15,0.38)';
      context.lineWidth = 2.5;
      for (let index = 0; index < 4; index++) {
        context.beginPath();
        context.arc(
          x,
          y + (index - 1.5) * radius * 0.38,
          radius * 0.88,
          -Math.PI * 0.65,
          0.05,
        );
        context.stroke();
      }
    } else if (style.feature === 'crystal') {
      context.fillStyle = 'rgba(140,190,255,0.32)';
      for (let index = 0; index < 5; index++) {
        const angle = (index / 5) * Math.PI * 2;
        context.fillRect(
          x + Math.cos(angle) * radius * 0.32 - 0.11 * radius,
          y + Math.sin(angle) * radius * 0.32 - 0.07 * radius,
          0.22 * radius,
          0.14 * radius,
        );
      }
    } else if (style.feature === 'void') {
      context.fillStyle = 'rgba(0,0,15,0.65)';
      context.beginPath();
      context.ellipse(x, y, radius * 0.5, radius * 0.18, 0.4, 0, Math.PI * 2);
      context.fill();
      context.beginPath();
      context.ellipse(
        x + radius * 0.2,
        y - radius * 0.3,
        radius * 0.28,
        radius * 0.1,
        -0.6,
        0,
        Math.PI * 2,
      );
      context.fill();
    } else if (style.feature === 'ocean') {
      context.strokeStyle = 'rgba(20,110,150,0.38)';
      context.lineWidth = 1.8;
      for (let index = 1; index <= 4; index++) {
        circle(x - radius * 0.18, y + radius * 0.12, radius * 0.14 * index);
        context.stroke();
      }
    } else if (style.feature === 'nebula') {
      context.fillStyle = 'rgba(210,90,170,0.32)';
      context.beginPath();
      context.ellipse(
        x - radius * 0.22,
        y,
        radius * 0.55,
        radius * 0.28,
        0.8,
        0,
        Math.PI * 2,
      );
      context.fill();
      context.fillStyle = 'rgba(90,140,255,0.28)';
      context.beginPath();
      context.ellipse(
        x + radius * 0.2,
        y - radius * 0.18,
        radius * 0.42,
        radius * 0.22,
        -0.5,
        0,
        Math.PI * 2,
      );
      context.fill();
    } else if (style.feature === 'radiation') {
      context.fillStyle = 'rgba(150,250,50,0.42)';
      for (const [offsetX, offsetY, sizeFactor] of [
        [-0.3, 0.12, 0.2],
        [0.26, 0.28, 0.17],
        [-0.1, -0.32, 0.22],
        [0.38, -0.22, 0.15],
      ]) {
        circle(x + offsetX * radius, y + offsetY * radius, sizeFactor * radius);
        context.fill();
      }
    }
    context.fillStyle = 'rgba(0,0,12,0.30)';
    circle(x + radius * 0.45, y + radius * 0.4, radius);
    context.fill();
    context.restore();

    if (style.feature === 'moon') {
      const angle = now / 2400;
      context.fillStyle = '#b8c4d8';
      circle(
        x + Math.cos(angle) * radius * 1.6,
        y + Math.sin(angle) * radius * 0.9,
        radius * 0.16,
      );
      context.fill();
    }
  }

  context.strokeStyle = owner.color;
  context.lineWidth = 2;
  context.globalAlpha = owner.isAlive ? 0.9 : 0.25;
  circle(x, y, radius + 5);
  context.stroke();
  context.globalAlpha = 1;

  context.textAlign = 'center';
  context.font = 'bold 13px Consolas, monospace';
  context.fillStyle = '#e8f2ff';
  context.fillText(planet.name, x, y - radius - 26);
  context.font = '11px Consolas, monospace';
  context.fillStyle = owner.color;
  context.fillText(
    owner.isHuman ? owner.name + ' ★' : owner.name,
    x,
    y - radius - 12,
  );

  context.font = '12px sans-serif';
  context.fillStyle = '#fff';
  context.fillText(
    `🪖${planet.troops}${isUnderTruce(planet) ? ' 🕊️' : ''}${owner.hasPacifistStatus ? ' ☮️' : ''}`,
    x,
    y + radius + 18,
  );

  const icons = BUILD_ORDER.filter(
    (building) => planet.buildings[building],
  ).map(
    (building) =>
      BUILDINGS[building].icon +
      (planet.buildings[building] > 1 ? planet.buildings[building] : ''),
  );
  context.font = '11px sans-serif';
  for (let row = 0; row * 5 < icons.length; row++) {
    context.fillText(
      icons.slice(row * 5, row * 5 + 5).join(' '),
      x,
      y + radius + 33 + row * 14,
    );
  }
}

function drawAnims(now: number): void {
  if (!context) return;
  for (let index = anims.length - 1; index >= 0; index--) {
    const anim = anims[index];
    const progress = (now - anim.t0) / anim.dur;
    if (progress >= 1) {
      anims.splice(index, 1);
      continue;
    }
    if (anim.type === 'rocket') {
      const eased = progress * progress * (3 - 2 * progress);
      const pointX = anim.fx! + (anim.tx! - anim.fx!) * eased;
      const pointY = anim.fy! + (anim.ty! - anim.fy!) * eased;
      const angle = Math.atan2(anim.ty! - anim.fy!, anim.tx! - anim.fx!);
      const trailStart = Math.max(0, eased - 0.15);
      context.strokeStyle = anim.color!;
      context.globalAlpha = 0.5;
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(
        anim.fx! + (anim.tx! - anim.fx!) * trailStart,
        anim.fy! + (anim.ty! - anim.fy!) * trailStart,
      );
      context.lineTo(pointX, pointY);
      context.stroke();
      context.globalAlpha = 1;
      context.save();
      context.translate(pointX, pointY);
      context.rotate(angle);
      context.fillStyle = '#e8f2ff';
      context.beginPath();
      context.moveTo(9, 0);
      context.lineTo(-6, 4.5);
      context.lineTo(-6, -4.5);
      context.closePath();
      context.fill();
      context.fillStyle = Math.random() < 0.5 ? '#ff9e3d' : '#ffd23d';
      circle(-8, 0, 3);
      context.fill();
      context.restore();
    } else if (anim.type === 'boom') {
      context.globalAlpha = 1 - progress;
      context.strokeStyle = '#ff9e3d';
      context.lineWidth = 3;
      circle(anim.x!, anim.y!, 6 + progress * 30);
      context.stroke();
      context.fillStyle = 'rgba(255,215,110,' + 0.5 * (1 - progress) + ')';
      circle(anim.x!, anim.y!, 4 + progress * 16);
      context.fill();
      context.globalAlpha = 1;
    } else if (anim.type === 'text') {
      context.globalAlpha = 1 - progress;
      context.font = 'bold 13px Consolas, monospace';
      context.textAlign = 'center';
      context.fillStyle = anim.color!;
      context.fillText(anim.txt!, anim.x!, anim.y! - 20 - progress * 26);
      context.globalAlpha = 1;
    }
  }
}

function frame(now: number): void {
  drawFrame(now || 0);
  animationFrame = requestAnimationFrame(frame);
}

onMounted(() => {
  layoutBoard();
  window.addEventListener('resize', layoutBoard);
  animationFrame = requestAnimationFrame(frame);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(animationFrame);
  window.removeEventListener('resize', layoutBoard);
});
</script>

<template>
  <div id="board-wrap">
    <canvas id="board" ref="canvas" />
  </div>
</template>
