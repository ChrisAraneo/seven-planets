import {
  arrow,
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
} from '@floating-ui/dom';
import { assign, noop } from 'lodash-es';
import { match } from 'ts-pattern';
import type { Directive } from 'vue';

import { chain } from '@/utils/chain';
import { nonNullable, not, number } from '@/utils/p';

interface TooltipHandle {
  text: string;
  tip: HTMLDivElement | null;
  content: HTMLDivElement | null;
  stop: (() => void) | null;
  listeners: [keyof HTMLElementEventMap, EventListener][];
}

const HANDLES = new WeakMap<HTMLElement, TooltipHandle>();

const STATIC_SIDE: Record<string, string> = {
  top: 'bottom',
  right: 'left',
  bottom: 'top',
  left: 'right',
};

const TOOLTIP_OFFSET = 8;
const VIEWPORT_PADDING = 6;

const toArrowCoordinate = (value: number | undefined): string =>
  match(value)
    .with(number, (coordinate) => `${coordinate}px`)
    .otherwise(() => '');

const createTipElements = (
  text: string,
): {
  tip: HTMLDivElement;
  content: HTMLDivElement;
  arrowEl: HTMLDivElement;
} =>
  chain({
    tip: document.createElement('div'),
    content: document.createElement('div'),
    arrowEl: document.createElement('div'),
  })
    .tap(({ tip }) => tip.classList.add('fui-tooltip'))
    .tap(({ tip }) => tip.setAttribute('role', 'tooltip'))
    .tap(({ content }) => content.classList.add('fui-tooltip-content'))
    .tap(({ content }) => assign(content, { textContent: text }))
    .tap(({ arrowEl }) => arrowEl.classList.add('fui-tooltip-arrow'))
    .tap(({ tip, content, arrowEl }) => tip.append(content, arrowEl))
    .value();

const reposition = (
  el: HTMLElement,
  tip: HTMLDivElement,
  arrowEl: HTMLDivElement,
): void =>
  void computePosition(el, tip, {
    placement: 'top',
    middleware: [
      offset(TOOLTIP_OFFSET),
      flip(),
      shift({ padding: VIEWPORT_PADDING }),
      arrow({ element: arrowEl }),
    ],
  }).then(({ x, y, placement, middlewareData }) =>
    chain(placement.split('-')[0])
      .tap(() => assign(tip.style, { left: `${x}px`, top: `${y}px` }))
      .tap((side) => assign(tip.dataset, { side }))
      .tap((side) =>
        assign(arrowEl.style, {
          left: toArrowCoordinate(middlewareData.arrow?.x),
          top: toArrowCoordinate(middlewareData.arrow?.y),
          right: '',
          bottom: '',
          [STATIC_SIDE[side]]: '-4px',
        }),
      )
      .thru(noop)
      .value(),
  );

const attachTip = (el: HTMLElement, handle: TooltipHandle): void =>
  chain(createTipElements(handle.text))
    .tap(({ tip }) => document.body.append(tip))
    .tap(({ tip, content }) => assign(handle, { tip, content }))
    .tap(({ tip, arrowEl }) =>
      assign(handle, {
        stop: autoUpdate(el, tip, () => reposition(el, tip, arrowEl)),
      }),
    )
    .thru(noop)
    .value();

const show = (el: HTMLElement): void =>
  match(HANDLES.get(el))
    .with({ tip: null, text: not('') }, (handle) => attachTip(el, handle))
    .otherwise(noop);

const hide = (el: HTMLElement): void =>
  match(HANDLES.get(el))
    .with({ tip: not(null) }, (handle) =>
      chain(handle)
        .tap(({ stop }) => stop?.())
        .tap(({ tip }) => tip.remove())
        .tap(() => assign(handle, { stop: null, tip: null, content: null }))
        .thru(noop)
        .value(),
    )
    .otherwise(noop);

const createHandle = (el: HTMLElement, text: string): TooltipHandle => ({
  text,
  tip: null,
  content: null,
  stop: null,
  listeners: [
    ['mouseenter', (): void => show(el)],
    ['mouseleave', (): void => hide(el)],
    ['focus', (): void => show(el)],
    ['blur', (): void => hide(el)],
    ['click', (): void => hide(el)],
  ],
});

const syncContent = (handle: TooltipHandle): void =>
  match(handle)
    .with(
      { content: not(null) },
      ({ content }) => void assign(content, { textContent: handle.text }),
    )
    .otherwise(noop);

const hideWhenEmptied = (el: HTMLElement, handle: TooltipHandle): void =>
  match(handle)
    .with({ tip: not(null), text: '' }, () => hide(el))
    .otherwise(noop);

export const V_TOOLTIP: Directive<HTMLElement, string | undefined> = {
  mounted: (el, binding): void =>
    chain(createHandle(el, binding.value ?? ''))
      .tap((handle) => HANDLES.set(el, handle))
      .tap((handle) =>
        handle.listeners.forEach(([event, listener]) =>
          el.addEventListener(event, listener),
        ),
      )
      .thru(noop)
      .value(),

  updated: (el, binding): void =>
    match(HANDLES.get(el))
      .with(nonNullable, (handle) =>
        chain(assign(handle, { text: binding.value ?? '' }))
          .tap(syncContent)
          .tap(() => hideWhenEmptied(el, handle))
          .thru(noop)
          .value(),
      )
      .otherwise(noop),

  unmounted: (el): void =>
    chain(hide(el))
      .tap(() =>
        HANDLES.get(el)?.listeners.forEach(([event, listener]) =>
          el.removeEventListener(event, listener),
        ),
      )
      .tap(() => HANDLES.delete(el))
      .thru(noop)
      .value(),
};
