const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const listeners = {};
const path = { style: {}, getTotalLength: () => 100 };
let frame;
let frameCount = 0;
const window = {
  scrollY: 0,
  innerHeight: 500,
  addEventListener: (name, callback) => { listeners[name] = callback; },
  requestAnimationFrame: (callback) => { frame = callback; return ++frameCount; },
};
const document = {
  documentElement: { scrollHeight: 1500 },
  querySelector: () => path,
  addEventListener: (name, callback) => { listeners[name] = callback; },
};

vm.runInNewContext(fs.readFileSync('assets/back-to-top-progress.js', 'utf8'), { window, document });
listeners.DOMContentLoaded();
assert.equal(frameCount, 0);
window.scrollY = 500;
listeners.scroll();
listeners.scroll();
assert.equal(frameCount, 1);
frame();
assert.equal(path.style.strokeDashoffset, 50);
assert.equal(frameCount, 1);
listeners.resize();
assert.equal(frameCount, 2);
