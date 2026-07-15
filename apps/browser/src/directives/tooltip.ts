import {
  arrow,
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
} from '@floating-ui/dom';
import type { Directive } from 'vue';

/* v-tooltip="text" — a floating-ui replacement for the native `title`
   attribute: instant, styled to match the game, and kept inside the
   viewport by floating-ui's flip/shift middleware (with an arrow).
   An empty/undefined value shows nothing. */

interface TooltipHandle {
  text: string;
  tip: HTMLDivElement | null;
  content: HTMLDivElement | null;
  /** autoUpdate disposer while the tooltip is visible. */
  stop: (() => void) | null;
  listeners: [keyof HTMLElementEventMap, EventListener][];
}

const handles = new WeakMap<HTMLElement, TooltipHandle>();

const STATIC_SIDE: Record<string, string> = {
  top: 'bottom',
  right: 'left',
  bottom: 'top',
  left: 'right',
};

function show(el: HTMLElement): void {
  const handle = handles.get(el);
  if (!handle || handle.tip || !handle.text) {
    return;
  }

  const tip = document.createElement('div');
  tip.className = 'fui-tooltip';
  tip.setAttribute('role', 'tooltip');
  const content = document.createElement('div');
  content.className = 'fui-tooltip-content';
  content.textContent = handle.text;
  const arrowEl = document.createElement('div');
  arrowEl.className = 'fui-tooltip-arrow';
  tip.append(content, arrowEl);
  document.body.append(tip);
  handle.tip = tip;
  handle.content = content;

  const reposition = (): void =>
    void computePosition(el, tip, {
      placement: 'top',
      middleware: [
        offset(8),
        flip(),
        shift({ padding: 6 }),
        arrow({ element: arrowEl }),
      ],
    }).then(({ x, y, placement, middlewareData }) => {
      Object.assign(tip.style, { left: `${x}px`, top: `${y}px` });
      const side = placement.split('-')[0];
      Object.assign(arrowEl.style, {
        left:
          middlewareData.arrow?.x != null ? `${middlewareData.arrow.x}px` : '',
        top:
          middlewareData.arrow?.y != null ? `${middlewareData.arrow.y}px` : '',
        right: '',
        bottom: '',
        [STATIC_SIDE[side]]: '-4px',
      });
    });

  // Track scrolls/resizes/layout shifts for as long as the tooltip lives.
  handle.stop = autoUpdate(el, tip, reposition);
}

function hide(el: HTMLElement): void {
  const handle = handles.get(el);
  if (!handle?.tip) {
    return;
  }
  handle.stop?.();
  handle.stop = null;
  handle.tip.remove();
  handle.tip = null;
  handle.content = null;
}

export const vTooltip: Directive<HTMLElement, string | undefined> = {
  mounted(el, binding) {
    const handle: TooltipHandle = {
      text: binding.value ?? '',
      tip: null,
      content: null,
      stop: null,
      listeners: [
        ['mouseenter', () => show(el)],
        ['mouseleave', () => hide(el)],
        ['focus', () => show(el)],
        ['blur', () => hide(el)],
        // Clicks open modals / re-render zones: never leave a stale tooltip.
        ['click', () => hide(el)],
      ],
    };
    handles.set(el, handle);
    handle.listeners.forEach(([event, listener]) =>
      el.addEventListener(event, listener),
    );
  },

  updated(el, binding) {
    const handle = handles.get(el);
    if (!handle) {
      return;
    }
    handle.text = binding.value ?? '';
    if (handle.content) {
      handle.content.textContent = handle.text;
    }
    if (handle.tip && !handle.text) {
      hide(el);
    }
  },

  unmounted(el) {
    hide(el);
    handles
      .get(el)
      ?.listeners.forEach(([event, listener]) =>
        el.removeEventListener(event, listener),
      );
    handles.delete(el);
  },
};
