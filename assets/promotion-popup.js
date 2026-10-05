class PromotionPopup extends window.HaloPopupElement {
  constructor() {
    super();

    this.expiresDays = this.getAttribute('data-expire') || 1;
    this.timeToShow = parseInt(this.getAttribute('data-delay')) || 0;
    this._storage = this.getBestStorage();

    const popupId = this.id || 'global';
    this.dismissKey = `_halo_promotion_popup_dismiss_${popupId}`;

    this.querySelector('.popup__close')?.addEventListener('click', this.dismiss.bind(this));
    this.overlay?.addEventListener('click', this.dismiss.bind(this));

    if (Shopify.designMode) {
      document.addEventListener('shopify:section:select', (e) => {
        if (!e?.target?.matches?.('.section-promotion-popup')) return;
        const selectedSectionId = e?.detail?.sectionId;
        const mySectionId = (this.id || '').replace('Promotion-popup-', '');
        if (selectedSectionId && mySectionId && selectedSectionId !== mySectionId) return;
        this.setOpenPopup(0);
      });

      document.addEventListener('shopify:section:deselect', (e) => {
        if (!e?.target?.matches?.('.section-promotion-popup')) return;
        const deselectedSectionId = e?.detail?.sectionId;
        const mySectionId = (this.id || '').replace('Promotion-popup-', '');
        if (deselectedSectionId && mySectionId && deselectedSectionId !== mySectionId) return;
        this.close({ persist: false });
      });
    }
  }

  connectedCallback() {
    try { this.load(); } catch (_) { this.setOpenPopup(this.timeToShow); }
  }

  load() {
    this.observeEmailSuccess();

    const hasSuccess = this.querySelector('.email-signup__message--success');
    const hasMessage = this.querySelector('.email-signup__message');

    if (hasSuccess) {
      if (Shopify.designMode) {
        if (hasMessage) this.classList.add('active');
      } else {
        this.showSuccessToast();
        this.dismiss();
      }
      return;
    }

    if (this.getStore(this.dismissKey)) return;

    if (hasMessage) this.classList.add('active');
    if (!Shopify.designMode) this.setOpenPopup(this.timeToShow);
  }

  observeEmailSuccess() {
    const target = this.querySelector('form') || this;
    this.successObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          if (node.classList.contains('email-signup__message--success')) {
            this.showSuccessToast();
            this.dismiss();
          }
        });
      });
    });
    this.successObserver.observe(target, { childList: true, subtree: true });
  }

  setOpenPopup(timeToShow) {
    this.openPopup({ delay: timeToShow, target: this, focusSelector: '.field__input, .popup__close' });
  }

  showSuccessToast() {
    if (document.querySelector('.promotion-popup-toast')) return;

    const message = (
      this.querySelector('.email-signup__message--success .email-signup__message-text')?.textContent ||
      this.querySelector('.email-signup__message--success')?.textContent ||
      ''
    ).trim();
    if (!message) return;

    const toast = document.createElement('div');
    toast.className = 'promotion-popup-toast';
    toast.setAttribute('role', 'status');

    const icon = document.createElement('span');
    icon.className = 'promotion-popup-toast__icon';
    icon.innerHTML = '<svg viewBox="0 0 20 20" width="14" height="14" fill="none" aria-hidden="true"><path d="M4 10.5l4 4 8-9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    const text = document.createElement('span');
    text.textContent = message;

    toast.append(icon, text);
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('is-visible'));
    setTimeout(() => {
      toast.classList.remove('is-visible');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  close({ persist } = { persist: true }) {
    if (persist) this.setStoreDays(this.dismissKey, '1', this.expiresDays);
    this.closePopup({ target: this });
  }

  tempClose() {
    this.closePopup({ target: this });
  }

  dismiss() {
    this.close({ persist: true });
  }

}
if (!customElements.get('promotion-popup')) customElements.define('promotion-popup', PromotionPopup);
