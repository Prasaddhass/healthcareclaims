import '@testing-library/jest-dom';

// antd requires window.matchMedia which jsdom doesn't implement
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches:             false,
    media:               query,
    onchange:            null,
    addListener:         () => {},
    removeListener:      () => {},
    addEventListener:    () => {},
    removeEventListener: () => {},
    dispatchEvent:       () => false,
  }),
});

// antd message requires getComputedStyle
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: () => '',
  }),
});

// antd Table (ResizeObserver) requires this API which jsdom lacks
global.ResizeObserver = class ResizeObserver {
  observe()    {}
  unobserve()  {}
  disconnect() {}
};

