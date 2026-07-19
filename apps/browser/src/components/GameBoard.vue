<script setup lang="ts">
import type { Anim } from '@seven-planets/effects';
import { getActiveId } from '@seven-planets/game';
import { getBuildingLevel } from '@seven-planets/game';
import { getIsOver } from '@seven-planets/game';
import { getPlanets } from '@seven-planets/game';
import { getPlayers } from '@seven-planets/game';
import { PLANET_STYLES, BUILD_ORDER, BUILDINGS } from '@seven-planets/game';
import { isUnderTruce } from '@seven-planets/game';
import type {
  BuildingType,
  Planet,
  PlanetStyle,
  Player,
} from '@seven-planets/game';
import { setPlanetLayout } from '@seven-planets/game';
import { assign, chunk, forEachRight, noop, remove, times } from 'lodash-es';
import { tryCatch } from 'ramda';
import { match } from 'ts-pattern';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useEffectsStore } from '@/stores';
import { chain } from '@/utils/chain';
import { nonNullable } from '@/utils/p';

const { anims } = useEffectsStore();

const FORCE_BLACK_HOLES = tryCatch(
  (): boolean =>
    localStorage.getItem('seven-planets:debug-black-holes') === 'true',
  (): boolean => false,
)();

interface Star {
  x: number;
  y: number;
  radius: number;
  phase: number;
}

interface BoardState {
  context: CanvasRenderingContext2D | null;
  width: number;
  height: number;
  stars: Star[];
  animationFrame: number;
}

const canvas = ref<HTMLCanvasElement | null>(null);

const board: BoardState = {
  context: null,
  width: 0,
  height: 0,
  stars: [],
  animationFrame: 0,
};

const circle = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
): void =>
  void chain(context)
    .tap((ctx) => ctx.beginPath())
    .tap((ctx) => ctx.arc(x, y, radius, 0, Math.PI * 2))
    .value();

const fillCircle = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
): void =>
  void chain(circle(context, x, y, radius))
    .tap(() => context.fill())
    .value();

const strokeCircle = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
): void =>
  void chain(circle(context, x, y, radius))
    .tap(() => context.stroke())
    .value();

const fillEllipse = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radiusX: number,
  radiusY: number,
  rotation: number,
): void =>
  void chain(context)
    .tap((ctx) => ctx.beginPath())
    .tap((ctx) => ctx.ellipse(x, y, radiusX, radiusY, rotation, 0, Math.PI * 2))
    .tap((ctx) => ctx.fill())
    .value();

const strokeEllipse = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radiusX: number,
  radiusY: number,
  rotation: number,
): void =>
  void chain(context)
    .tap((ctx) => ctx.beginPath())
    .tap((ctx) => ctx.ellipse(x, y, radiusX, radiusY, rotation, 0, Math.PI * 2))
    .tap((ctx) => ctx.stroke())
    .value();

const strokeArc = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): void =>
  void chain(context)
    .tap((ctx) => ctx.beginPath())
    .tap((ctx) => ctx.arc(x, y, radius, startAngle, endAngle))
    .tap((ctx) => ctx.stroke())
    .value();

const computeLayout = (
  width: number,
  height: number,
): { x: number; y: number; r: number }[] =>
  chain({
    centerX: width * 0.5,
    centerY: height * 0.52,
    ellipseRadiusX: width * 0.36,
    ellipseRadiusY: height * 0.345,
    planetRadius: Math.max(20, Math.min(38, Math.min(width, height) * 0.055)),
  })
    .thru(
      ({ centerX, centerY, ellipseRadiusX, ellipseRadiusY, planetRadius }) =>
        times(7, (index) =>
          chain(Math.PI / 2 + index * ((Math.PI * 2) / 7))
            .thru((angle) => ({
              x: centerX + ellipseRadiusX * Math.cos(angle),
              y: centerY + ellipseRadiusY * Math.sin(angle),
              r: planetRadius,
            }))
            .value(),
        ),
    )
    .value();

const createStars = (width: number, height: number): Star[] =>
  times(Math.floor((width * height) / 8000), () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.3 + 0.3,
    phase: Math.random() * 6.28,
  }));

const layoutInto = (element: HTMLCanvasElement, parent: HTMLElement): void =>
  chain({
    rect: parent.getBoundingClientRect(),
    pixelRatio: window.devicePixelRatio || 1,
  })
    .thru(({ rect, pixelRatio }) => ({
      pixelRatio,
      width: Math.max(300, rect.width),
      height: Math.max(300, rect.height),
    }))
    .tap(({ width, height }) => assign(board, { width, height }))
    .tap(({ width, height, pixelRatio }) =>
      assign(element, {
        width: width * pixelRatio,
        height: height * pixelRatio,
      }),
    )
    .tap(() => assign(board, { context: element.getContext('2d') }))
    .thru(({ pixelRatio, width, height }) =>
      match(board.context)
        .with(nonNullable, (context) =>
          chain(context)
            .tap((ctx) => ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0))
            .tap(() => setPlanetLayout(computeLayout(width, height)))
            .tap(() => assign(board, { stars: createStars(width, height) }))
            .thru(noop)
            .value(),
        )
        .otherwise(noop),
    )
    .value();

const layoutBoard = (): void =>
  match({ element: canvas.value, parent: canvas.value?.parentElement })
    .with(
      { element: nonNullable, parent: nonNullable },
      ({ element, parent }) => layoutInto(element, parent),
    )
    .otherwise(noop);

const fillRadialGlow = (
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  color: string,
): void =>
  void chain(
    context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius),
  )
    .tap((gradient) => gradient.addColorStop(0, color))
    .tap((gradient) => gradient.addColorStop(1, 'transparent'))
    .tap((gradient) => assign(context, { fillStyle: gradient }))
    .tap(() => context.fillRect(0, 0, board.width, board.height))
    .value();

const drawBackground = (context: CanvasRenderingContext2D): void =>
  void chain(context)
    .tap((ctx) => ctx.clearRect(0, 0, board.width, board.height))
    .tap((ctx) => assign(ctx, { fillStyle: '#05070f' }))
    .tap((ctx) => ctx.fillRect(0, 0, board.width, board.height))
    .tap((ctx) =>
      fillRadialGlow(
        ctx,
        board.width * 0.25,
        board.height * 0.3,
        board.width * 0.5,
        'rgba(90,40,140,0.10)',
      ),
    )
    .tap((ctx) =>
      fillRadialGlow(
        ctx,
        board.width * 0.78,
        board.height * 0.7,
        board.width * 0.45,
        'rgba(30,110,140,0.10)',
      ),
    )
    .value();

const drawStar = (
  context: CanvasRenderingContext2D,
  star: Star,
  now: number,
): void =>
  void chain(context)
    .tap((ctx) =>
      assign(ctx, {
        globalAlpha: 0.35 + 0.55 * Math.abs(Math.sin(now / 900 + star.phase)),
        fillStyle: '#cfe3ff',
      }),
    )
    .tap((ctx) => fillCircle(ctx, star.x, star.y, star.radius))
    .value();

const drawStars = (context: CanvasRenderingContext2D, now: number): void =>
  void chain(board.stars)
    .tap((stars) => stars.forEach((star) => drawStar(context, star, now)))
    .tap(() => assign(context, { globalAlpha: 1 }))
    .value();

const drawHalo = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
): void =>
  void chain(
    context.createRadialGradient(x, y, radius * 0.6, x, y, radius * 2.1),
  )
    .tap((halo) => halo.addColorStop(0, 'rgba(255,170,70,0)'))
    .tap((halo) => halo.addColorStop(0.55, 'rgba(255,150,60,0.28)'))
    .tap((halo) => halo.addColorStop(0.8, 'rgba(150,90,255,0.16)'))
    .tap((halo) => halo.addColorStop(1, 'rgba(0,0,0,0)'))
    .tap((halo) => assign(context, { fillStyle: halo }))
    .tap(() => fillCircle(context, x, y, radius * 2.1))
    .value();

const createDiskGradient = (
  context: CanvasRenderingContext2D,
  ringRadius: number,
  alpha: number,
): CanvasGradient =>
  chain(context.createLinearGradient(-ringRadius, 0, ringRadius, 0))
    .tap((disk) => disk.addColorStop(0, 'rgba(255,120,40,0)'))
    .tap((disk) => disk.addColorStop(0.25, `rgba(255,180,90,${alpha})`))
    .tap((disk) => disk.addColorStop(0.5, `rgba(255,240,200,${alpha + 0.15})`))
    .tap((disk) => disk.addColorStop(0.75, `rgba(255,150,70,${alpha})`))
    .tap((disk) => disk.addColorStop(1, 'rgba(255,120,40,0)'))
    .value();

const drawDiskRing = (
  context: CanvasRenderingContext2D,
  radius: number,
  index: number,
): void =>
  chain({
    ringRadius: radius * (1.35 + index * 0.16),
    alpha: 0.5 - index * 0.13,
  })
    .tap(({ ringRadius, alpha }) =>
      assign(context, {
        strokeStyle: createDiskGradient(context, ringRadius, alpha),
        lineWidth: radius * 0.16,
      }),
    )
    .tap(({ ringRadius }) =>
      strokeEllipse(context, 0, 0, ringRadius, ringRadius * 0.42, 0),
    )
    .thru(noop)
    .value();

const drawHotspot = (
  context: CanvasRenderingContext2D,
  radius: number,
  seconds: number,
): void =>
  chain({
    hotspotX: Math.cos(seconds * 1.5) * radius * 1.5,
    hotspotY: Math.sin(seconds * 1.5) * radius * 1.5 * 0.42,
  })
    .tap(({ hotspotX, hotspotY }) =>
      assign(context, {
        fillStyle: chain(
          context.createRadialGradient(
            hotspotX,
            hotspotY,
            0,
            hotspotX,
            hotspotY,
            radius * 0.3,
          ),
        )
          .tap((spot) => spot.addColorStop(0, 'rgba(255,255,235,0.9)'))
          .tap((spot) => spot.addColorStop(1, 'rgba(255,180,80,0)'))
          .value(),
      }),
    )
    .tap(({ hotspotX, hotspotY }) =>
      fillCircle(context, hotspotX, hotspotY, radius * 0.3),
    )
    .thru(noop)
    .value();

const drawAccretion = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  seconds: number,
): void =>
  chain(context)
    .tap((ctx) => ctx.save())
    .tap((ctx) => ctx.translate(x, y))
    .tap((ctx) => ctx.rotate(-0.4))
    .tap((ctx) => times(3, (index) => drawDiskRing(ctx, radius, index)))
    .tap((ctx) => drawHotspot(ctx, radius, seconds))
    .tap((ctx) => ctx.restore())
    .thru(noop)
    .value();

const drawEventHorizon = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
): void =>
  chain(context)
    .tap((ctx) => assign(ctx, { fillStyle: '#000' }))
    .tap((ctx) => fillCircle(ctx, x, y, radius))
    .tap((ctx) =>
      assign(ctx, { strokeStyle: 'rgba(255,220,150,0.9)', lineWidth: 2 }),
    )
    .tap((ctx) => strokeCircle(ctx, x, y, radius * 0.98))
    .thru(noop)
    .value();

const drawBlackHole = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  now: number,
): void =>
  chain(now / 1000)
    .tap(() => drawHalo(context, x, y, radius))
    .tap((seconds) => drawAccretion(context, x, y, radius, seconds))
    .tap(() => drawEventHorizon(context, x, y, radius))
    .thru(noop)
    .value();

const drawRings = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
): void =>
  chain(context)
    .tap((ctx) =>
      assign(ctx, { strokeStyle: 'rgba(255,215,110,0.55)', lineWidth: 3 }),
    )
    .tap((ctx) => strokeEllipse(ctx, x, y, radius * 1.7, radius * 0.55, -0.35))
    .thru(noop)
    .value();

const drawContinents = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
): void =>
  void chain([
    [-0.3, -0.2, 0.45],
    [0.28, 0.12, 0.34],
    [-0.05, 0.42, 0.28],
    [0.42, -0.36, 0.22],
  ])
    .tap(() => assign(context, { fillStyle: 'rgba(46,143,79,0.75)' }))
    .tap((blobs) =>
      blobs.forEach(([offsetX, offsetY, sizeFactor]) =>
        fillCircle(
          context,
          x + offsetX * radius,
          y + offsetY * radius,
          sizeFactor * radius,
        ),
      ),
    )
    .value();

const drawBands = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
): void =>
  void chain([
    [-0.55, 0.28],
    [0.05, 0.22],
    [0.55, 0.18],
  ])
    .tap(() => assign(context, { fillStyle: 'rgba(90,45,10,0.30)' }))
    .tap((bands) =>
      bands.forEach(([yFactor, heightFactor]) =>
        context.fillRect(
          x - radius,
          y + yFactor * radius,
          radius * 2,
          heightFactor * radius,
        ),
      ),
    )
    .value();

const drawCity = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
): void =>
  void chain([
    [-0.4, 0.2],
    [-0.15, 0.45],
    [0.15, 0.3],
    [0.4, 0.45],
    [0.05, 0.05],
    [-0.5, 0.5],
    [0.3, 0.1],
    [-0.25, -0.1],
  ])
    .tap(() => assign(context, { fillStyle: 'rgba(255,224,130,0.9)' }))
    .tap((dots) =>
      dots.forEach(([offsetX, offsetY]) =>
        fillCircle(context, x + offsetX * radius, y + offsetY * radius, 1.6),
      ),
    )
    .value();

const drawIce = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
): void =>
  chain(context)
    .tap((ctx) => assign(ctx, { fillStyle: 'rgba(255,255,255,0.65)' }))
    .tap((ctx) =>
      fillEllipse(ctx, x, y - radius * 0.8, radius * 0.7, radius * 0.32, 0),
    )
    .tap((ctx) =>
      fillEllipse(ctx, x, y + radius * 0.85, radius * 0.6, radius * 0.28, 0),
    )
    .thru(noop)
    .value();

const drawStorm = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
): void =>
  chain(context)
    .tap((ctx) =>
      assign(ctx, { strokeStyle: 'rgba(220,200,255,0.4)', lineWidth: 2 }),
    )
    .tap((ctx) => strokeArc(ctx, x - radius * 0.1, y, radius * 0.55, 0.5, 3.5))
    .tap((ctx) => assign(ctx, { fillStyle: 'rgba(230,215,255,0.5)' }))
    .tap((ctx) =>
      fillEllipse(
        ctx,
        x + radius * 0.25,
        y - radius * 0.15,
        radius * 0.28,
        radius * 0.16,
        0.4,
      ),
    )
    .thru(noop)
    .value();

const drawCraters = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
): void =>
  void chain([
    [-0.3, 0.1, 0.18],
    [0.25, -0.25, 0.14],
    [0.1, 0.4, 0.12],
  ])
    .tap(() => assign(context, { fillStyle: 'rgba(0,0,20,0.25)' }))
    .tap((craters) =>
      craters.forEach(([offsetX, offsetY, sizeFactor]) =>
        fillCircle(
          context,
          x + offsetX * radius,
          y + offsetY * radius,
          sizeFactor * radius,
        ),
      ),
    )
    .value();

const drawLava = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
): void =>
  chain({
    pools: [
      [-0.2, 0.1, 0.34, 0.18, 0.5],
      [0.3, -0.2, 0.24, 0.38, 1.2],
      [-0.05, -0.4, 0.3, 0.15, 0.8],
      [0.1, 0.4, 0.36, 0.2, 2.1],
    ],
    glows: [
      [-0.1, 0.06],
      [0.24, -0.14],
      [-0.16, -0.32],
    ],
  })
    .tap(() => assign(context, { fillStyle: 'rgba(30,5,5,0.75)' }))
    .tap(({ pools }) =>
      pools.forEach(([offsetX, offsetY, widthFactor, heightFactor, angle]) =>
        fillEllipse(
          context,
          x + offsetX * radius,
          y + offsetY * radius,
          widthFactor * radius,
          heightFactor * radius,
          angle,
        ),
      ),
    )
    .tap(() => assign(context, { fillStyle: 'rgba(255,110,0,0.32)' }))
    .tap(({ glows }) =>
      glows.forEach(([offsetX, offsetY]) =>
        fillCircle(
          context,
          x + offsetX * radius,
          y + offsetY * radius,
          0.11 * radius,
        ),
      ),
    )
    .thru(noop)
    .value();

const drawForest = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
): void =>
  void chain([
    [-0.22, -0.08, 0.46],
    [0.26, 0.22, 0.38],
    [-0.06, 0.42, 0.34],
    [0.38, -0.36, 0.28],
    [-0.42, 0.28, 0.3],
  ])
    .tap(() => assign(context, { fillStyle: 'rgba(10,55,15,0.82)' }))
    .tap((groves) =>
      groves.forEach(([offsetX, offsetY, sizeFactor]) =>
        fillCircle(
          context,
          x + offsetX * radius,
          y + offsetY * radius,
          sizeFactor * radius,
        ),
      ),
    )
    .value();

const drawToxic = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
): void =>
  void chain([
    [-0.28, 0.22, 0.28],
    [0.22, -0.14, 0.24],
    [0.1, 0.44, 0.2],
    [-0.1, -0.34, 0.26],
  ])
    .tap(() => assign(context, { fillStyle: 'rgba(40,210,30,0.55)' }))
    .tap((clouds) =>
      clouds.forEach(([offsetX, offsetY, sizeFactor]) =>
        fillCircle(
          context,
          x + offsetX * radius,
          y + offsetY * radius,
          sizeFactor * radius,
        ),
      ),
    )
    .value();

const drawDesert = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
): void =>
  chain(context)
    .tap((ctx) =>
      assign(ctx, { strokeStyle: 'rgba(130,80,15,0.38)', lineWidth: 2.5 }),
    )
    .tap((ctx) =>
      times(4, (index) =>
        strokeArc(
          ctx,
          x,
          y + (index - 1.5) * radius * 0.38,
          radius * 0.88,
          -Math.PI * 0.65,
          0.05,
        ),
      ),
    )
    .thru(noop)
    .value();

const drawCrystal = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
): void =>
  chain(context)
    .tap((ctx) => assign(ctx, { fillStyle: 'rgba(140,190,255,0.32)' }))
    .tap((ctx) =>
      times(5, (index) =>
        chain((index / 5) * Math.PI * 2)
          .tap((angle) =>
            ctx.fillRect(
              x + Math.cos(angle) * radius * 0.32 - 0.11 * radius,
              y + Math.sin(angle) * radius * 0.32 - 0.07 * radius,
              0.22 * radius,
              0.14 * radius,
            ),
          )
          .value(),
      ),
    )
    .thru(noop)
    .value();

const drawVoid = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
): void =>
  chain(context)
    .tap((ctx) => assign(ctx, { fillStyle: 'rgba(0,0,15,0.65)' }))
    .tap((ctx) => fillEllipse(ctx, x, y, radius * 0.5, radius * 0.18, 0.4))
    .tap((ctx) =>
      fillEllipse(
        ctx,
        x + radius * 0.2,
        y - radius * 0.3,
        radius * 0.28,
        radius * 0.1,
        -0.6,
      ),
    )
    .thru(noop)
    .value();

const drawOcean = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
): void =>
  chain(context)
    .tap((ctx) =>
      assign(ctx, { strokeStyle: 'rgba(20,110,150,0.38)', lineWidth: 1.8 }),
    )
    .tap((ctx) =>
      times(4, (index) =>
        strokeCircle(
          ctx,
          x - radius * 0.18,
          y + radius * 0.12,
          radius * 0.14 * (index + 1),
        ),
      ),
    )
    .thru(noop)
    .value();

const drawNebula = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
): void =>
  chain(context)
    .tap((ctx) => assign(ctx, { fillStyle: 'rgba(210,90,170,0.32)' }))
    .tap((ctx) =>
      fillEllipse(ctx, x - radius * 0.22, y, radius * 0.55, radius * 0.28, 0.8),
    )
    .tap((ctx) => assign(ctx, { fillStyle: 'rgba(90,140,255,0.28)' }))
    .tap((ctx) =>
      fillEllipse(
        ctx,
        x + radius * 0.2,
        y - radius * 0.18,
        radius * 0.42,
        radius * 0.22,
        -0.5,
      ),
    )
    .thru(noop)
    .value();

const drawRadiation = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
): void =>
  void chain([
    [-0.3, 0.12, 0.2],
    [0.26, 0.28, 0.17],
    [-0.1, -0.32, 0.22],
    [0.38, -0.22, 0.15],
  ])
    .tap(() => assign(context, { fillStyle: 'rgba(150,250,50,0.42)' }))
    .tap((spots) =>
      spots.forEach(([offsetX, offsetY, sizeFactor]) =>
        fillCircle(
          context,
          x + offsetX * radius,
          y + offsetY * radius,
          sizeFactor * radius,
        ),
      ),
    )
    .value();

const drawFeature = (
  context: CanvasRenderingContext2D,
  style: PlanetStyle,
  x: number,
  y: number,
  radius: number,
): void =>
  match(style.feature)
    .with('continents', () => drawContinents(context, x, y, radius))
    .with('bands', () => drawBands(context, x, y, radius))
    .with('city', () => drawCity(context, x, y, radius))
    .with('ice', () => drawIce(context, x, y, radius))
    .with('storm', () => drawStorm(context, x, y, radius))
    .with('craters', () => drawCraters(context, x, y, radius))
    .with('lava', () => drawLava(context, x, y, radius))
    .with('forest', () => drawForest(context, x, y, radius))
    .with('toxic', () => drawToxic(context, x, y, radius))
    .with('desert', () => drawDesert(context, x, y, radius))
    .with('crystal', () => drawCrystal(context, x, y, radius))
    .with('void', () => drawVoid(context, x, y, radius))
    .with('ocean', () => drawOcean(context, x, y, radius))
    .with('nebula', () => drawNebula(context, x, y, radius))
    .with('radiation', () => drawRadiation(context, x, y, radius))
    .otherwise(noop);

const drawSphere = (
  context: CanvasRenderingContext2D,
  style: PlanetStyle,
  x: number,
  y: number,
  radius: number,
): void =>
  void chain(
    context.createRadialGradient(
      x - radius * 0.4,
      y - radius * 0.4,
      radius * 0.15,
      x,
      y,
      radius,
    ),
  )
    .tap((gradient) => gradient.addColorStop(0, style.light))
    .tap((gradient) => gradient.addColorStop(1, style.dark))
    .tap((gradient) => assign(context, { fillStyle: gradient }))
    .tap(() => fillCircle(context, x, y, radius))
    .value();

const drawSurface = (
  context: CanvasRenderingContext2D,
  style: PlanetStyle,
  x: number,
  y: number,
  radius: number,
): void =>
  chain(context)
    .tap((ctx) => ctx.save())
    .tap((ctx) => circle(ctx, x, y, radius))
    .tap((ctx) => ctx.clip())
    .tap((ctx) => drawFeature(ctx, style, x, y, radius))
    .tap((ctx) => assign(ctx, { fillStyle: 'rgba(0,0,12,0.30)' }))
    .tap((ctx) => fillCircle(ctx, x + radius * 0.45, y + radius * 0.4, radius))
    .tap((ctx) => ctx.restore())
    .thru(noop)
    .value();

const drawMoon = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  now: number,
): void =>
  chain(now / 2400)
    .tap(() => assign(context, { fillStyle: '#b8c4d8' }))
    .tap((angle) =>
      fillCircle(
        context,
        x + Math.cos(angle) * radius * 1.6,
        y + Math.sin(angle) * radius * 0.9,
        radius * 0.16,
      ),
    )
    .thru(noop)
    .value();

const drawPlanetBody = (
  context: CanvasRenderingContext2D,
  planet: Planet,
  style: PlanetStyle,
  now: number,
): void =>
  chain({ x: planet.x, y: planet.y, radius: planet.r })
    .tap(({ x, y, radius }) =>
      match(style.feature)
        .with('rings', () => drawRings(context, x, y, radius))
        .otherwise(noop),
    )
    .tap(({ x, y, radius }) => drawSphere(context, style, x, y, radius))
    .tap(({ x, y, radius }) => drawSurface(context, style, x, y, radius))
    .tap(({ x, y, radius }) =>
      match(style.feature)
        .with('moon', () => drawMoon(context, x, y, radius, now))
        .otherwise(noop),
    )
    .thru(noop)
    .value();

const drawActivePulse = (
  context: CanvasRenderingContext2D,
  planet: Planet,
  owner: Player,
  now: number,
): void =>
  match(owner.id === getActiveId() && !getIsOver())
    .with(true, () =>
      chain(0.5 + 0.5 * Math.sin(now / 300))
        .tap((pulse) =>
          assign(context, {
            strokeStyle: owner.color,
            globalAlpha: 0.25 + 0.35 * pulse,
            lineWidth: 3,
          }),
        )
        .tap((pulse) =>
          strokeCircle(context, planet.x, planet.y, planet.r + 10 + 3 * pulse),
        )
        .tap(() => assign(context, { globalAlpha: 1 }))
        .thru(noop)
        .value(),
    )
    .otherwise(noop);

const drawOwnerRing = (
  context: CanvasRenderingContext2D,
  planet: Planet,
  owner: Player,
): void =>
  chain(context)
    .tap((ctx) =>
      assign(ctx, {
        strokeStyle: owner.color,
        lineWidth: 2,
        globalAlpha: match(owner.isAlive)
          .with(true, () => 0.9)
          .otherwise(() => 0.25),
      }),
    )
    .tap((ctx) => strokeCircle(ctx, planet.x, planet.y, planet.r + 5))
    .tap((ctx) => assign(ctx, { globalAlpha: 1 }))
    .thru(noop)
    .value();

const toOwnerLabel = (owner: Player): string =>
  match(owner.isHuman)
    .with(true, () => `${owner.name} ★`)
    .otherwise(() => owner.name);

const toTruceSuffix = (planet: Planet): string =>
  match(isUnderTruce(planet))
    .with(true, () => ' 🕊️')
    .otherwise(() => '');

const toPacifistSuffix = (owner: Player): string =>
  match(owner.hasPacifistStatus)
    .with(true, () => ' ☮️')
    .otherwise(() => '');

const toTroopsLabel = (planet: Planet, owner: Player): string =>
  `🪖${planet.troops}${toTruceSuffix(planet)}${toPacifistSuffix(owner)}`;

const drawLabels = (
  context: CanvasRenderingContext2D,
  planet: Planet,
  owner: Player,
): void =>
  chain(context)
    .tap((ctx) =>
      assign(ctx, {
        textAlign: 'center',
        font: 'bold 13px Consolas, monospace',
        fillStyle: '#e8f2ff',
      }),
    )
    .tap((ctx) => ctx.fillText(planet.name, planet.x, planet.y - planet.r - 26))
    .tap((ctx) =>
      assign(ctx, { font: '11px Consolas, monospace', fillStyle: owner.color }),
    )
    .tap((ctx) =>
      ctx.fillText(toOwnerLabel(owner), planet.x, planet.y - planet.r - 12),
    )
    .tap((ctx) => assign(ctx, { font: '12px sans-serif', fillStyle: '#fff' }))
    .tap((ctx) =>
      ctx.fillText(
        toTroopsLabel(planet, owner),
        planet.x,
        planet.y + planet.r + 18,
      ),
    )
    .thru(noop)
    .value();

const toBuildingIcon = (planet: Planet, building: BuildingType): string =>
  BUILDINGS[building].icon +
  match(planet.buildings[building] > 1)
    .with(true, () => `${planet.buildings[building]}`)
    .otherwise(() => '');

const drawBuildingIcons = (
  context: CanvasRenderingContext2D,
  planet: Planet,
): void =>
  chain(
    BUILD_ORDER.filter((building) => planet.buildings[building]).map(
      (building) => toBuildingIcon(planet, building),
    ),
  )
    .thru((icons) => chunk(icons, 5))
    .tap(() => assign(context, { font: '11px sans-serif' }))
    .tap((rows) =>
      rows.forEach((row, index) =>
        context.fillText(
          row.join(' '),
          planet.x,
          planet.y + planet.r + 33 + index * 14,
        ),
      ),
    )
    .thru(noop)
    .value();

const toStyle = (planet: Planet): PlanetStyle =>
  PLANET_STYLES[planet.styleIdx ?? planet.id] || PLANET_STYLES[0];

const drawPlanet = (
  context: CanvasRenderingContext2D,
  planet: Planet,
  now: number,
): void =>
  chain({
    style: toStyle(planet),
    owner: getPlayers()[planet.ownerId],
    isBlackHole:
      FORCE_BLACK_HOLES || getBuildingLevel(planet, 'SINGULARITY') >= 3,
  })
    .tap(({ owner }) => drawActivePulse(context, planet, owner, now))
    .tap(({ style, isBlackHole }) =>
      match(isBlackHole)
        .with(true, () =>
          drawBlackHole(context, planet.x, planet.y, planet.r, now),
        )
        .otherwise(() => drawPlanetBody(context, planet, style, now)),
    )
    .tap(({ owner }) => drawOwnerRing(context, planet, owner))
    .tap(({ owner }) => drawLabels(context, planet, owner))
    .tap(() => drawBuildingIcons(context, planet))
    .thru(noop)
    .value();

const toFlameColor = (): string =>
  match(Math.random() < 0.5)
    .with(true, () => '#ff9e3d')
    .otherwise(() => '#ffd23d');

const drawRocketTrail = (
  context: CanvasRenderingContext2D,
  anim: Anim,
  pointX: number,
  pointY: number,
  trailStart: number,
): void =>
  chain(context)
    .tap((ctx) =>
      assign(ctx, { strokeStyle: anim.color!, globalAlpha: 0.5, lineWidth: 2 }),
    )
    .tap((ctx) => ctx.beginPath())
    .tap((ctx) =>
      ctx.moveTo(
        anim.fx! + (anim.tx! - anim.fx!) * trailStart,
        anim.fy! + (anim.ty! - anim.fy!) * trailStart,
      ),
    )
    .tap((ctx) => ctx.lineTo(pointX, pointY))
    .tap((ctx) => ctx.stroke())
    .tap((ctx) => assign(ctx, { globalAlpha: 1 }))
    .thru(noop)
    .value();

const drawRocketShip = (
  context: CanvasRenderingContext2D,
  pointX: number,
  pointY: number,
  angle: number,
): void =>
  chain(context)
    .tap((ctx) => ctx.save())
    .tap((ctx) => ctx.translate(pointX, pointY))
    .tap((ctx) => ctx.rotate(angle))
    .tap((ctx) => assign(ctx, { fillStyle: '#e8f2ff' }))
    .tap((ctx) => ctx.beginPath())
    .tap((ctx) => ctx.moveTo(9, 0))
    .tap((ctx) => ctx.lineTo(-6, 4.5))
    .tap((ctx) => ctx.lineTo(-6, -4.5))
    .tap((ctx) => ctx.closePath())
    .tap((ctx) => ctx.fill())
    .tap((ctx) => assign(ctx, { fillStyle: toFlameColor() }))
    .tap((ctx) => fillCircle(ctx, -8, 0, 3))
    .tap((ctx) => ctx.restore())
    .thru(noop)
    .value();

const drawRocket = (
  context: CanvasRenderingContext2D,
  anim: Anim,
  progress: number,
): void =>
  chain(progress * progress * (3 - 2 * progress))
    .thru((eased) => ({
      pointX: anim.fx! + (anim.tx! - anim.fx!) * eased,
      pointY: anim.fy! + (anim.ty! - anim.fy!) * eased,
      angle: Math.atan2(anim.ty! - anim.fy!, anim.tx! - anim.fx!),
      trailStart: Math.max(0, eased - 0.15),
    }))
    .tap(({ pointX, pointY, trailStart }) =>
      drawRocketTrail(context, anim, pointX, pointY, trailStart),
    )
    .tap(({ pointX, pointY, angle }) =>
      drawRocketShip(context, pointX, pointY, angle),
    )
    .thru(noop)
    .value();

const drawBoom = (
  context: CanvasRenderingContext2D,
  anim: Anim,
  progress: number,
): void =>
  chain(context)
    .tap((ctx) =>
      assign(ctx, {
        globalAlpha: 1 - progress,
        strokeStyle: '#ff9e3d',
        lineWidth: 3,
      }),
    )
    .tap((ctx) => strokeCircle(ctx, anim.x!, anim.y!, 6 + progress * 30))
    .tap((ctx) =>
      assign(ctx, { fillStyle: `rgba(255,215,110,${0.5 * (1 - progress)})` }),
    )
    .tap((ctx) => fillCircle(ctx, anim.x!, anim.y!, 4 + progress * 16))
    .tap((ctx) => assign(ctx, { globalAlpha: 1 }))
    .thru(noop)
    .value();

const drawFloatText = (
  context: CanvasRenderingContext2D,
  anim: Anim,
  progress: number,
): void =>
  chain(context)
    .tap((ctx) =>
      assign(ctx, {
        globalAlpha: 1 - progress,
        font: 'bold 13px Consolas, monospace',
        textAlign: 'center',
        fillStyle: anim.color!,
      }),
    )
    .tap((ctx) =>
      ctx.fillText(anim.txt!, anim.x!, anim.y! - 20 - progress * 26),
    )
    .tap((ctx) => assign(ctx, { globalAlpha: 1 }))
    .thru(noop)
    .value();

const drawAnim = (
  context: CanvasRenderingContext2D,
  anim: Anim,
  progress: number,
): void =>
  match(anim.type)
    .with('rocket', () => drawRocket(context, anim, progress))
    .with('boom', () => drawBoom(context, anim, progress))
    .with('text', () => drawFloatText(context, anim, progress))
    .exhaustive();

const drawAnims = (context: CanvasRenderingContext2D, now: number): void =>
  chain(anims)
    .tap((animations) =>
      remove(animations, (anim) => (now - anim.t0) / anim.dur >= 1),
    )
    .tap((animations) =>
      forEachRight(animations, (anim) =>
        drawAnim(context, anim, (now - anim.t0) / anim.dur),
      ),
    )
    .thru(noop)
    .value();

const drawFrame = (now: number): void =>
  match(board.context)
    .with(nonNullable, (context) =>
      chain(context)
        .tap((ctx) => drawBackground(ctx))
        .tap((ctx) => drawStars(ctx, now))
        .tap((ctx) =>
          getPlanets().forEach((planet) => drawPlanet(ctx, planet, now)),
        )
        .tap((ctx) => drawAnims(ctx, now))
        .thru(noop)
        .value(),
    )
    .otherwise(noop);

const frame = (now: number): void =>
  chain(drawFrame(now || 0))
    .tap(() => assign(board, { animationFrame: requestAnimationFrame(frame) }))
    .thru(noop)
    .value();

onMounted(() =>
  chain(layoutBoard())
    .tap(() => window.addEventListener('resize', layoutBoard))
    .tap(() => assign(board, { animationFrame: requestAnimationFrame(frame) }))
    .thru(noop)
    .value(),
);

onBeforeUnmount(() =>
  chain(cancelAnimationFrame(board.animationFrame))
    .tap(() => window.removeEventListener('resize', layoutBoard))
    .thru(noop)
    .value(),
);
</script>

<template>
  <div id="board-wrap">
    <canvas id="board" ref="canvas" />
  </div>
</template>
