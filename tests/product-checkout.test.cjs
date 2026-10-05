const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
async function check(main, response, expected) {
  let ProductForm, sent;
  const context = {
    HTMLElement: class {}, console,
    customElements: { get: () => false, define: (_, cls) => ProductForm = cls },
    document: { querySelectorAll: () => [] },
    window: { routes: { cart_url: '/en/cart' }, location: { pathname: '/en/products/shed' } },
    routes: { cart_add_url: '/en/cart/add.js' },
    FormData: class extends Map { constructor() { super([['id', '123'], ['quantity', '2']]); } append(k,v) { this.set(k,v); } },
    fetchConfig: () => ({ headers: {} }),
    fetch: async (_, config) => { sent = config.body; return { json: async () => response }; },
    publish() {}, PUB_SUB_EVENTS: { cartError: 'error', cartUpdate: 'update' },
  };
  vm.runInNewContext(fs.readFileSync('assets/product-form.js', 'utf8'), context);
  const form = Object.create(ProductForm.prototype);
  const classList = { add() {}, remove() {} };
  form.form = {};
  form.submitButton = { getAttribute() {}, setAttribute() {}, removeAttribute() {}, classList, querySelector: s => s === '.loading__spinner' ? { classList } : null };
  form.closest = s => s === '.main-product-information' && main ? {} : null;
  form.handleErrorMessage = message => form.message = message;
  form.onSubmitHandler({ preventDefault() {} });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(sent.get('id'), '123');
  assert.equal(sent.get('quantity'), '2');
  if (expected) assert.equal(context.window.location, expected);
  else { assert.equal(typeof context.window.location, 'object'); assert.equal(form.message, 'Sold out'); }
}
(async () => {
  await check(true, { id: 123 }, '/en/cart/checkout');
  await check(false, { id: 123 }, '/en/cart');
  await check(true, { status: 422, description: 'Sold out' }, null);
  console.log('Product checkout redirect, quantity, variant and inventory error checks pass.');
})().catch(error => { console.error(error); process.exitCode = 1; });
