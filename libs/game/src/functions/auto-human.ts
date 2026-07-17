const HAS_DOM = typeof document !== 'undefined';
// Headless (Node) or "?auto" in the URL: the human seat is played by AI (demo/test mode).
export const IS_AUTO_HUMAN =
  !HAS_DOM ||
  (typeof location !== 'undefined' && /[&?]auto/u.test(location.search));
