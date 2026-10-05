if (!customElements.get('quick-add-modal')) {
  customElements.define('quick-add-modal', class QuickAddModal extends window.QuickProductModal {
    constructor() {
      super();
      this.modalContent = this.querySelector('#QuickStandardModal');
    }

    get productView() {
      return 'quick_add';
    }

    get idPrefix() {
      return 'quickadd';
    }
  });
}
