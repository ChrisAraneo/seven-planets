const HAS_DOM = typeof document !== 'undefined';
export const IS_AUTO_HUMAN =
  !HAS_DOM ||
  (typeof location !== 'undefined' && /[&?]auto/u.test(location.search));
