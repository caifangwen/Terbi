class ProductPromo extends HTMLElement {
  connectedCallback() {
    if (this.initialized) return;

    this.initialized = true;
    this.copyButton = this.querySelector('[data-product-promo-copy]');
    this.savingElement = this.querySelector('[data-product-promo-saving]');
    this.savingsData = this.querySelector('[data-product-promo-savings]');
    this.variantSavings = this.parseSavings();
    this.scope = this.closest('product-info') || this.closest('.shopify-section') || document;
    this.currentVariantId = this.dataset.currentVariantId || null;
    this.handleVariantUpdate = this.handleVariantUpdate.bind(this);

    this.bindCopy();
    this.bindVariantUpdates();
    this.startCountdown();
    this.updateSaving();
  }

  disconnectedCallback() {
    window.clearInterval(this.countdownTimer);
    document.removeEventListener('variant:update', this.handleVariantUpdate);
  }

  parseSavings() {
    if (!this.savingsData?.textContent) return {};

    try {
      return JSON.parse(this.savingsData.textContent);
    } catch (error) {
      return {};
    }
  }

  bindCopy() {
    if (!this.copyButton) return;

    this.copyButton.addEventListener('click', () => {
      const code = this.dataset.code || '';

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(code).then(() => this.showCopied()).catch(() => this.fallbackCopy(code));
        return;
      }

      this.fallbackCopy(code);
    });
  }

  bindVariantUpdates() {
    document.addEventListener('variant:update', this.handleVariantUpdate);

    ['change', 'input'].forEach((eventName) => {
      this.scope.addEventListener(eventName, () => {
        window.setTimeout(() => this.updateSaving(), 80);
        window.setTimeout(() => this.updateSaving(), 250);
      });
    });
  }

  handleVariantUpdate(event) {
    const sourceId = event?.detail?.sourceId;
    const scopeIds = [this.scope?.id, this.scope?.dataset?.section].filter(Boolean);

    if (sourceId && scopeIds.length > 0 && !scopeIds.includes(sourceId)) return;

    const variantId = event?.detail?.resource?.id;

    if (!variantId || !Object.prototype.hasOwnProperty.call(this.variantSavings, String(variantId))) return;

    this.currentVariantId = String(variantId);
    this.updateSaving();
  }

  fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand('copy');
      this.showCopied();
    } catch (error) {
      this.copyButton.textContent = this.dataset.copyFailedText || 'Copy failed';
    }

    document.body.removeChild(textarea);
  }

  showCopied() {
    if (!this.copyButton) return;

    this.copyButton.textContent = this.dataset.copiedText || 'Copied';
    this.copyButton.classList.add('is-copied');
    this.copyButton.disabled = true;

    window.setTimeout(() => {
      this.copyButton.textContent = this.dataset.code || '';
      this.copyButton.classList.remove('is-copied');
      this.copyButton.disabled = false;
    }, 1500);
  }

  updateSaving() {
    if (!this.savingElement) return;

    const variantId = this.getSelectedVariantId();

    if (variantId && this.variantSavings[variantId]) {
      const label = this.savingElement.dataset.savingsLabel || 'Save [amount]';
      this.savingElement.textContent = label.replace('[amount]', this.variantSavings[variantId]);
    }
  }

  getSelectedVariantId() {
    if (this.currentVariantId && Object.prototype.hasOwnProperty.call(this.variantSavings, String(this.currentVariantId))) {
      return String(this.currentVariantId);
    }

    const inputs = this.scope.querySelectorAll('form[action*="/cart/add"] [name="id"]');

    for (const input of inputs) {
      if (Object.prototype.hasOwnProperty.call(this.variantSavings, String(input.value))) {
        return String(input.value);
      }
    }

    const urlVariantId = new URLSearchParams(window.location.search).get('variant');

    if (Object.prototype.hasOwnProperty.call(this.variantSavings, String(urlVariantId))) {
      return String(urlVariantId);
    }

    return null;
  }

  startCountdown() {
    const endTime = new Date(this.dataset.end || '').getTime();
    if (!Number.isFinite(endTime)) return;

    const daysElement = this.querySelector('[data-product-promo-days]');
    const hoursElement = this.querySelector('[data-product-promo-hours]');
    const minutesElement = this.querySelector('[data-product-promo-minutes]');
    const secondsElement = this.querySelector('[data-product-promo-seconds]');

    if (!daysElement || !hoursElement || !minutesElement || !secondsElement) return;

    const updateCountdown = () => {
      const remaining = Math.max(0, endTime - Date.now());
      const days = Math.floor(remaining / 86400000);
      const hours = Math.floor(remaining / 3600000) % 24;
      const minutes = Math.floor(remaining / 60000) % 60;
      const seconds = Math.floor(remaining / 1000) % 60;

      daysElement.textContent = `${this.pad(days)}D`;
      hoursElement.textContent = this.pad(hours);
      minutesElement.textContent = this.pad(minutes);
      secondsElement.textContent = this.pad(seconds);
    };

    updateCountdown();
    this.countdownTimer = window.setInterval(updateCountdown, 1000);
  }

  pad(value) {
    return String(value).padStart(2, '0');
  }
}

if (!customElements.get('product-promo')) {
  customElements.define('product-promo', ProductPromo);
}
