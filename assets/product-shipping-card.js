class ProductShippingCard extends HTMLElement {
  connectedCallback() {
    if (this.dataset.initialized === 'true') return;

    this.dataset.initialized = 'true';
    this.toggle = this.querySelector('[data-product-shipping-toggle]');
    this.body = this.querySelector('[data-product-shipping-body]');
    this.arrow = this.querySelector('[data-product-shipping-arrow]');
    this.link = this.querySelector('[data-product-shipping-link]');

    if (!this.toggle || !this.body || !this.arrow) return;

    this.toggle.addEventListener('click', (event) => {
      if (this.link?.contains(event.target)) return;

      if (this.isOpen()) {
        this.close();
      } else {
        this.open();
      }
    });
  }

  isOpen() {
    return this.body.style.maxHeight !== '0px' && this.body.style.maxHeight !== '';
  }

  open() {
    this.body.style.maxHeight = '300px';
    this.arrow.classList.add('open');
  }

  close() {
    this.body.style.maxHeight = '0px';
    this.arrow.classList.remove('open');
  }
}

if (!customElements.get('product-shipping-card')) {
  customElements.define('product-shipping-card', ProductShippingCard);
}
