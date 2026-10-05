/* ==========================================================
   TERKKIN — Parts Finder & Claim
   No dependencies. Safe to load with defer.
   ========================================================== */
(function () {
  'use strict';

  var root = document.getElementById('tkp');
  if (!root) return;

  var state = { fam: null, view: 'front', handle: null, area: null };

  var $  = function (s, c) { return (c || root).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || root).querySelectorAll(s)); };

  /* ---------- 1 · family ---------- */
  function setFamily(id) {
    state.fam = id;
    $$('[data-tkp="fam"]').forEach(function (b) {
      b.classList.toggle('is-on', b.dataset.fam === id);
    });
    $$('[data-fam-panel]').forEach(function (p) {
      p.hidden = p.dataset.famPanel !== id;
    });
  }

  /* ---------- 1 · model ---------- */
  function setModel(btn) {
    state.handle = btn.dataset.handle || null;

    $$('[data-tkp="model"]').forEach(function (b) { b.classList.remove('is-on'); });
    btn.classList.add('is-on');

    var chosen = $('#tkpChosen');
    $('#tkpChosenName').textContent = btn.dataset.label || '';
    $('#tkpChosenMeta').textContent = btn.dataset.code || '';
    chosen.hidden = false;

    var fp = $('#tkpFProduct'); if (fp) fp.value = btn.dataset.label || '';
    var fu = $('#tkpFProductUrl'); if (fu) fu.value = btn.dataset.url ? new URL(btn.dataset.url, window.location.origin).href : '';
    var fc = $('#tkpFCode');    if (fc) fc.value = btn.dataset.code || '';

    $('#tkpLocked').hidden = true;
    $('#tkpLocator').hidden = false;

    setView(state.view);
    refreshParts();
    scrollTo_($('#tkpS2'));
  }

  function resetModel() {
    state.handle = null;
    state.area = null;
    $$('[data-tkp="model"]').forEach(function (b) { b.classList.remove('is-on'); });
    $('#tkpChosen').hidden = true;
    $('#tkpLocked').hidden = false;
    $('#tkpLocator').hidden = true;
    $('#tkpDrawer').hidden = true;
    $('#tkpPicked').hidden = true;
    ['#tkpFProduct', '#tkpFProductUrl', '#tkpFCode', '#tkpFArea', '#tkpFPart', '#tkpFPartNumber'].forEach(function (s) {
      var el = $(s); if (el) el.value = '';
    });
    scrollTo_($('#tkpS1'));
  }

  /* ---------- 2 · views ---------- */
  function setView(v) {
    state.view = v;
    $$('.tkp-view').forEach(function (el) {
      el.hidden = !(el.dataset.fam === state.fam && el.dataset.view === v);
    });
    $$('[data-tkp="view"]').forEach(function (b) {
      b.classList.toggle('is-on', b.dataset.view === v);
    });
  }

  /* Fill the little view thumbnails from the active family's images. */
  function paintThumbs() {
    $$('[data-thumb-for]').forEach(function (sp) {
      var view = $$('.tkp-view').filter(function (el) {
        return el.dataset.fam === state.fam && el.dataset.view === sp.dataset.thumbFor;
      })[0];
      var img = view && view.querySelector('img');
      sp.style.backgroundImage = img ? 'url("' + img.getAttribute('src') + '")' : '';
    });
  }

  /* ---------- 2 · parts ---------- */
  function refreshParts() {
    $$('.tkp-partlist').forEach(function (list) {
      var shown = 0;
      $$('.tkp-part', list).forEach(function (p) {
        if (p.classList.contains('tkp-part-other')) return;
        var ok = !!state.handle && (p.dataset.products || '').indexOf('|' + state.handle + '|') !== -1;
        p.hidden = !ok;
        if (ok) shown++;
      });
      var badge = $('[data-count-for="' + list.dataset.listFor + '"]');
      if (badge) badge.textContent = shown ? shown + ' parts' : '';
    });
    paintThumbs();
  }

  function openArea(id, title, blurb) {
    state.area = id;
    $$('[data-tkp="area"]').forEach(function (b) {
      b.classList.toggle('is-on', b.dataset.area === id);
    });
    $$('.tkp-partlist').forEach(function (l) { l.hidden = l.dataset.listFor !== id; });

    $('#tkpDrawerTitle').textContent = title;
    $('#tkpDrawerSub').textContent = blurb || '';
    $('#tkpDrawer').hidden = false;

    var fa = $('#tkpFArea'); if (fa) fa.value = title;
    scrollTo_($('#tkpDrawer'));
  }

  /* ---------- 3 · claim ---------- */
  function pickPart(btn) {
    var area = btn.dataset.area || '';
    var part = btn.dataset.part || '';
    var fa = $('#tkpFArea'); if (fa) fa.value = area;
    var fp = $('#tkpFPart'); if (fp) fp.value = part;
    var fn = $('#tkpFPartNumber'); if (fn) fn.value = btn.dataset.partNumber || '';

    var chip = $('#tkpPicked');
    chip.textContent = area + ' → ' + part;
    chip.hidden = false;

    scrollTo_($('#tkpS3'));
    var desc = $('#tkpDesc'); if (desc) setTimeout(function () { desc.focus(); }, 420);
  }

  function scrollTo_(el) {
    if (!el) return;
    var y = el.getBoundingClientRect().top + window.pageYOffset - 90;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }

  /* ---------- events ---------- */
  root.addEventListener('click', function (e) {
    var t = e.target.closest('[data-tkp]');
    if (!t || !root.contains(t)) return;

    switch (t.dataset.tkp) {
      case 'fam':
        setFamily(t.dataset.fam);
        resetModel();
        setView('front');
        break;
      case 'model':
        setModel(t);
        break;
      case 'reset':
        resetModel();
        break;
      case 'view':
        setView(t.dataset.view);
        break;
      case 'area': {
        var card = $('.tkp-area[data-area="' + t.dataset.area + '"]');
        var title = card ? card.querySelector('.tkp-atx b').textContent.trim() : '';
        var blurb = card ? card.querySelector('.tkp-atx span').textContent.trim() : '';
        openArea(t.dataset.area, title, blurb);
        break;
      }
      case 'closeDrawer':
        $('#tkpDrawer').hidden = true;
        state.area = null;
        $$('[data-tkp="area"]').forEach(function (b) { b.classList.remove('is-on'); });
        break;
      case 'pick':
        pickPart(t);
        break;
    }
  });

  root.addEventListener('change', function (e) {
    if (e.target.matches('[data-tkp="issue"]')) {
      var fi = $('#tkpFIssue'); if (fi) fi.value = e.target.value;
    }
  });

  /* ---------- init ---------- */
  var firstFam = $('[data-tkp="fam"]');
  if (firstFam) setFamily(firstFam.dataset.fam);
  setView('front');
  paintThumbs();

  /* Theme editor: re-init when a block is added or reordered. */
  document.addEventListener('shopify:section:load', function (evt) {
    if (evt.target.contains(root)) window.location.reload();
  });
})();
