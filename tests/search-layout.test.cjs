const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { spawnSync } = require('node:child_process');

for (const name of ['section-header', 'section-editorial-blocks', 'component-resource-card']) {
  assert.doesNotMatch(fs.readFileSync(`assets/${name}.css`, 'utf8'), /\.predictive-search|\.search-modal/,
    `${name}: search rules belong in the search stylesheets`);
}

const chrome = process.env.CHROME_PATH || (process.platform === 'win32'
  ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  : '/usr/bin/google-chrome');
assert.ok(fs.existsSync(chrome), 'Set CHROME_PATH to a Chromium browser');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'search-layout-'));
const assets = ['base', 'base-utilities', 'base-layout', 'component-modal-drawer', 'section-header',
  'component-form', 'component-predictive-search', 'component-card', 'component-resource-card',
  'component-product-badge', 'section-editorial-blocks', 'component-search', 'component-layout-utils', 'collection-wrapper'];
const styles = assets.map(name => `<link rel="stylesheet" href="${pathToFileURL(path.resolve(`assets/${name}.css`))}">`).join('');
const vars = `<style>:root{font-size:10px;--page-content-width:120rem;--page-margin:1rem;--layer-overlay:16;--layer-header-menu:12;--layer-sticky:8;--color-background:#fff;--color-background-rgb:255 255 255;--color-foreground:#222;--color-foreground-rgb:34 34 34;--opacity-0:0;--opacity-100:1;--opacity-4:.04;--opacity-10:.1;--opacity-40:.4;--gap-md:1.6rem;--margin-md:1.6rem;--padding-lg:2rem;--padding-4xl:4rem;--style-border-radius-sm:.8rem}*{box-sizing:border-box}body{margin:0;font:14px Arial}@media(min-width:750px){:root{--page-margin:4rem}}.field{height:54px}.resource-card{opacity:1}.page-badge{position:fixed;top:130px;left:50%;z-index:4}.label-wrapper{position:fixed;top:130px;left:50%;z-index:4}</style>`;
const card = `<li class="predictive-search-results__card"><div class="resource-card-wrapper card-wrapper"><div class="card"><div class="resource-card resource-card--product"><div class="resource-card__media-wrapper" style="--resource-card-aspect-ratio:1 / 1"><card-media class="card__media block"><div class="resource-card__image-placeholder">Product</div></card-media></div><div class="resource-card__content"><p class="resource-card__title"><a href="#product">Long product title with dimensions 12 × 20 ft and a verylongunbrokentitleforoverflowtesting</a></p><div class="price">$1,299.00</div></div></div></div></div></li>`;
const results = `<div class="predictive-search predictive-search--header predictive-search--center"><div id="predictive-search-results"><h6 class="predictive-search__heading">Suggested products</h6><ul class="predictive-search-results__wrapper-products list-unstyled">${card.repeat(6)}</ul><button class="predictive-search__item predictive-search__item--term">Search for garden sheds</button></div></div>`;
const form = `<predictive-search class="search-modal__form" open><form class="search-modal__form"><div class="predictive-search--center"><div class="field">Search</div></div>${results}</form></predictive-search>`;
const full = `<div class="header-group-section"><div class="header__row"><div class="header__search"><details open><summary>Search</summary><div class="search-modal search-modal--full modal__content"><div class="search-modal__content">${form}</div></div></details></div></div><div class="header__row"><span class="label-wrapper">Menu badge</span></div></div><span class="page-badge">Sale</span>`;
const drawer = `<div class="search-drawer"><div class="drawer__inner">${form.replaceAll('search-modal__form', 'search-drawer__form')}</div></div>`;
const searchPage = `<style>:root{--page-width:calc(var(--page-content-width) + var(--page-margin)*2);--layer-heightened:4;--padding-xl:2rem;--margin-4xl:4rem}.template-search__header{opacity:.99}.test-catalog{height:600px;position:relative}.test-catalog .card__badge{position:absolute;top:0;left:50%}</style><div class="template-search"><div class="section"><div class="template-search__header"><h1>Search results</h1><div class="template-search__search"><predictive-search open><main-search><form class="search"><div class="field"><input class="field__input search__input" value="shed">${results.replace('predictive-search--header predictive-search--center', 'predictive-search--search-template')}</div></form></main-search></predictive-search></div><p>25 results found for shed</p></div><div class="collection-wrapper grid-base"><div class="main-collection-grid test-catalog" style="--grid-column--desktop:var(--centered)"><div class="card__badge"><span class="product-badge product-badge--new">New</span></div></div></div></div></div>`;
const fixtures = [
  { width: 1440, mode: 'full' }, { width: 768, mode: 'full' },
  { width: 390, mode: 'full' }, { width: 390, mode: 'drawer' },
  { width: 1440, mode: 'page' }, { width: 1151, mode: 'page' }, { width: 390, mode: 'page' }
].map(test => ({ ...test, html: `<!doctype html>${styles}${vars}${{full, drawer, page: searchPage}[test.mode]}` }));
const file = path.join(dir, 'test.html');
fs.writeFileSync(file, `<!doctype html><pre id="result">pending</pre><script>
const fixtures = ${JSON.stringify(fixtures)};
Promise.all(fixtures.map(test => new Promise(resolve => {
  const frame = document.createElement('iframe');
  frame.style = 'width:' + test.width + 'px;height:1000px;border:0';
  frame.onload = () => {
    const doc = frame.contentDocument, win = frame.contentWindow;
    const box = selector => doc.querySelector(selector).getBoundingClientRect();
    const input = box('.field'), panel = box('.predictive-search'), heading = box('h6'), grid = box('ul');
    const errors = [], check = (ok, message) => { if (!ok) errors.push(message); };
    const near = (a,b) => Math.abs(a-b) < 1.1;
    check(near(input.left, panel.left) && near(input.right, panel.right), 'Input/panel alignment');
    check(near(heading.left, grid.left) && near(heading.right, grid.right), 'Heading/card grid alignment');
    check(doc.documentElement.scrollWidth <= test.width, 'Page overflow');
    check(doc.querySelector('.predictive-search').scrollWidth <= panel.width + 1, 'Panel overflow');
    const cards = [...doc.querySelectorAll('li')].map(el => el.getBoundingClientRect());
    check(cards.every(rect => near(rect.width, cards[0].width)), 'Unequal card widths');
    const image = box('.resource-card__media-wrapper'), text = box('.resource-card__content');
    check(image.width > 0 && near(image.width, image.height), 'Square thumbnail');
    check(text.left >= image.right && text.right <= cards[0].right, 'Card text overflow');
    if (test.mode === 'drawer') check(cards.every(rect => near(rect.left, grid.left) && near(rect.right, grid.right)), 'Drawer must have one column');
    if (test.mode === 'page') {
      const catalog = box('.test-catalog'), badge = box('.test-catalog .card__badge');
      check(near(input.left, catalog.left) && near(input.right, catalog.right), 'Catalog/global alignment');
      check(near(panel.width, Math.min(1200, doc.documentElement.clientWidth - (test.width >= 750 ? 80 : 20))), 'Search page global width');
      const top = doc.elementFromPoint(badge.left + 2, badge.top + 2);
      check(!!top.closest('.predictive-search'), 'New badge covers search page dropdown');
    }
    if (test.mode === 'full') {
      check(near(panel.width, Math.min(1200, doc.documentElement.clientWidth - (test.width >= 750 ? 80 : 20))), 'Global width');
      const top = doc.elementFromPoint(test.width / 2, 135);
      check(!!top.closest('.search-modal'), 'Badge covers search');
    }
    resolve({width:test.width, mode:test.mode, cardWidth:cards[0].width, errors});
  };
  frame.srcdoc = test.html;
  document.body.append(frame);
}))).then(results => document.querySelector('#result').textContent = JSON.stringify(results));
</script>`);
const run = spawnSync(chrome, ['--headless', '--disable-gpu', '--no-first-run', '--allow-file-access-from-files',
  `--user-data-dir=${path.join(dir, 'profile')}`, '--dump-dom', '--virtual-time-budget=5000', pathToFileURL(file).href],
  { encoding: 'utf8', timeout: 30000, maxBuffer: 4 * 1024 * 1024, windowsHide: true });
assert.ifError(run.error);
assert.equal(run.status, 0, run.stderr);
const output = run.stdout.match(/<pre id="result">([^<]+)<\/pre>/)?.[1];
assert.ok(output && output !== 'pending', `Browser did not finish: ${run.stderr}`);
const checks = JSON.parse(output.replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
assert.ok(checks.every(check => !check.errors.length), JSON.stringify(checks, null, 2));
console.log(JSON.stringify(checks));
