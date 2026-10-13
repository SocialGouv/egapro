// jsdom has no Web Animations, ResizeObserver nor IntersectionObserver, which @formkit/auto-animate
// instantiates as soon as it is imported: import this module before it.
class NoopObserver {
  public observe() {}
  public unobserve() {}
  public disconnect() {}
}

Object.assign(window, {
  ResizeObserver: NoopObserver,
  IntersectionObserver: NoopObserver,
  requestIdleCallback: (callback: () => void) => setTimeout(callback, 0),
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
});

Element.prototype.animate = function animate() {
  const onFinish: Array<() => void> = [];
  setTimeout(() => onFinish.forEach(listener => listener()), 10);
  return {
    addEventListener: (_type: string, listener: () => void) => onFinish.push(listener),
    cancel() {},
    finished: Promise.resolve(),
  } as unknown as Animation;
};
