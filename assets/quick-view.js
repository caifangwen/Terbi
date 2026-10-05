if (!customElements.get('quick-view-modal')) {
  customElements.define('quick-view-modal', class QuickViewModal extends window.QuickProductModal {
    constructor() {
      super();
      this.modalContent = this.querySelector('#QuickViewModal');
    }

    get idPrefix() {
      return 'quickview';
    }

    get keepDrawerSelector() {
      return '.agree-condition-popup-modal__drawer--keep';
    }

    get keepDrawerOpenerSelector() {
      return '.agree-condition-popup-modal__opener--keep';
    }

    afterRender() {
      if (typeof window.compareColor === 'function' && !customElements.get('compare-color')) {
        try { window.compareColor(); } catch (_) {}
      }
    }
  });
}
