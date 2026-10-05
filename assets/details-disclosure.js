class SideDrawerOpener extends HTMLElement {
  constructor() {
    super();
    const button = this.querySelector('button');
    if (!button) return;

    button.addEventListener('click', () => {
      const drawer = document.querySelector(this.getAttribute('data-side-drawer'));

      if(button.closest('.header__icon--menu')) {
        if(button.classList.contains('active')) {
          button.classList.remove('active');
          if (drawer) drawer.close();
        } else {
          document.documentElement.style.setProperty('--header-height', `${document.querySelector(".header").offsetHeight}px`);
          button.classList.add('active');
          if (drawer) drawer.open(button);
        }
      } else {
        if (drawer) drawer.open(button);
      }
    });
  }
}
if (!customElements.get('side-drawer-opener')) customElements.define('side-drawer-opener', SideDrawerOpener);

class SideDrawer extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('keyup', (evt) => evt.code === 'Escape' && this.close());
    this.overlay = this.querySelector('[id^="Drawer-Overlay-"]');
    this.overlay?.addEventListener('click', this.close.bind(this));
  }

  get isTabletViewport() {
    try {
      return window.matchMedia('(max-width: 1024px)').matches;
    } catch (e) {
      return window.innerWidth <= 1024;
    }
  }

  connectedCallback() {
    if (!this.dataset.moved) {
      this.dataset.moved = true;
      document.body.appendChild(this);
    }
  }

  open(triggeredBy) {
    if (triggeredBy) this.setActiveElement(triggeredBy);
    setTimeout(() => {
      this.classList.add('animate', 'active');
    });

    let rtl = typeof theme !== "undefined" && theme.config && theme.config.rtl === true;
    let drawerDirection = this.getAttribute("data-drawer-direction");
    const mobileDrawerDirection = this.getAttribute("data-mobile-drawer-direction");
    const contentElement = this.querySelector("[data-drawer-content]");

    if (this.isTabletViewport && mobileDrawerDirection) {
      drawerDirection = mobileDrawerDirection;
    }

    this.classList.add("open");

    if (rtl) {
      drawerDirection = drawerDirection === "left" ? "right" : "left";
    }

    let transform;
    let duration = 0.6;
    if (drawerDirection === "left") {
      transform = ["translateX(-100%)", "translateX(0)"];
    } else if (drawerDirection === "right") {
      transform = ["translateX(100%)", "translateX(0)"];
    } else if (drawerDirection === "center") {
      transform = ['translate(-50%, -40%)', 'translate(-50%, -50%)'];
    } else {
      transform = ["translateX(0)", "translateX(0)"];
    }

    Motion.timeline([
      [
        contentElement,
        {
          opacity: [0, 1],
          transform: transform,
        },
        { duration: duration, easing: theme.config.easing || [0.61, 0.22, 0.23, 1], at: "-0.05" },
      ],
    ]);

    this.addEventListener(
      'transitionend',
      () => {
        const containerToTrapFocusOn = this.querySelector('.drawer__inner, .popup__inner, .blog-posts__sidebar');
        const focusElement = this.querySelector('.search__input, .popup__input, .drawer__close');
        trapFocus(containerToTrapFocusOn, focusElement);
        this.handleTransition(true, 'drawer--opening', 'drawer--open');
      },
      { once: true }
    );

    document.body.classList.add('overflow-hidden');
    document.documentElement.setAttribute('scroll-lock', '');
  }

  async close() {
    if (this.activeElement) removeTrapFocus(this.activeElement);
    document.body.classList.remove('overflow-hidden');
    document.documentElement.removeAttribute('scroll-lock');
    this.handleTransition(false, 'drawer--closing');

    let rtl = typeof theme !== "undefined" && theme.config && theme.config.rtl === true;
    let drawerDirection = this.getAttribute("data-drawer-direction");
    const mobileDrawerDirection = this.getAttribute("data-mobile-drawer-direction");
    const detailsElement = this.overlay.closest("details");
    const contentElement = this.querySelector("[data-drawer-content]");

    if (document.querySelector('.header__icon--menu button.active')) {
      document.querySelector('.header__icon--menu button').classList.remove('active');
    }

    if (this.isTabletViewport && mobileDrawerDirection) {
      drawerDirection = mobileDrawerDirection;
    }

    let transform = ['translateX(0)', 'translateX(0)'];
    let duration = 0.3;

    if (drawerDirection === "left") {
      if (rtl) {
        transform = ["translateX(0)", "translateX(100%)"];
      } else {
        transform = ["translateX(0)", "translateX(-100%)"];
      }
    } else if (drawerDirection === "right") {
      if (rtl) {
        transform = ["translateX(0)", "translateX(-100%)"];
      } else {
        transform = ["translateX(0)", "translateX(100%)"];
      }
    } else if (drawerDirection === "center") {
      transform = ["translate(-50%, -50%)", "translate(-50%, -40%)"];
      duration = 0.6;
    }

    await Motion.timeline ([
      [
        contentElement,
        {
          opacity: [1, 0],
          transform:
            transform,
        },
        { duration: duration, easing: theme.config.easing },
      ]
    ]).finished;

    this.classList.remove('active', 'open');

    if (detailsElement) {
      detailsElement.removeAttribute("open");
      detailsElement.classList.remove("menu-opening");
      document.body.classList.remove('overflow-hidden-mobile')
    }
  }

  handleTransition(checkOpen, startClass, endClass = '') {
    const isDrawer = this.querySelector('.side-drawer:not(.popup__inner)');
    if (!isDrawer) return;

    this.addEventListener('transitionstart', () => {
      document.body.classList.add(startClass);
      checkOpen ? document.body.classList.remove('drawer--open', 'drawer--closing') : document.body.classList.remove('drawer--open', 'drawer--opening');
    }, { once: true });

    this.addEventListener('transitionend', () => {
      checkOpen ? document.body.classList.remove(startClass, 'drawer--opening', 'drawer--closing') : document.body.classList.remove('drawer--closing', 'drawer--opening', 'drawer--open');
      if (endClass) document.body.classList.add(endClass);
    }, { once: true });
  }

  setActiveElement(element) {
    this.activeElement = element;
  }

  trapFocus() {
    this.addEventListener('transitionend', () => {
      const containerToTrapFocusOn = this.querySelector('.drawer__inner, .popup__inner, .blog-posts__sidebar');
      const focusElement = this.querySelector('.search__input, .popup__input, .drawer__close');
      trapFocus(containerToTrapFocusOn, focusElement);
    }, { once: true });
  }
}
if (!customElements.get('side-drawer')) customElements.define('side-drawer', SideDrawer);

class ModalDialog extends HTMLElement {
  constructor() {
    super();
    this.querySelector('#Modal-Overlay')?.addEventListener('click', this.hide.bind(this));
    this.addEventListener('keyup', (event) => {
      if (event.code.toUpperCase() === 'ESCAPE') this.hide();
    });
    this.addEventListener('click', (event) => {
      if (event.target === this) this.hide();
    });
  }

  connectedCallback() {
    if (!this.dataset.moved) {
      this.dataset.moved = true;
      this.dataset.section = this.closest('.shopify-section')?.id.replace('shopify-section-', '');
      document.body.appendChild(this);
    }
  }

  show(opener) {
    this.openedBy = opener;
    const popup = this.querySelector('.template-popup');
    document.body.classList.add('overflow-hidden');
    document.documentElement.setAttribute('scroll-lock', '');
    this.setAttribute('open', '');
    if (popup) popup.loadContent();
    this.trapFocus();
  }

  hide() {
    document.body.classList.remove('overflow-hidden');
    document.documentElement.removeAttribute('scroll-lock');
    document.body.dispatchEvent(new CustomEvent('modalClosed'));
    this.removeAttribute('open');
    removeTrapFocus(this.openedBy);
    window.pauseAllMedia();
  }

  trapFocus() {
    this.addEventListener('transitionend', () => {
      const containerToTrapFocusOn = this.querySelector('.drawer__inner, .popup__inner');
      const focusElement = this.querySelector('[role="dialog"], .popup__inner');
      trapFocus(containerToTrapFocusOn, focusElement);
    }, { once: true });
  }
}
if (!customElements.get('modal-dialog')) customElements.define('modal-dialog', ModalDialog);

class QuickProductModal extends ModalDialog {
  constructor() {
    super();
    this.addEventListener('product-info:loaded', ({ target }) => {
      target.addPreProcessCallback(this.preprocessHTML.bind(this));
    });
  }

  get productView() {
    return '';
  }

  get sourceSelector() {
    return 'product-info';
  }

  get isProductContent() {
    return true;
  }

  get idPrefix() {
    return 'quick-product';
  }

  get keepDrawerSelector() {
    return '.product-popup-modal__drawer--keep';
  }

  get keepDrawerOpenerSelector() {
    return '.product-popup-modal__opener--keep';
  }

  hide(preventFocus = false) {
    const cartDrawer = document.querySelector('cart-drawer');
    if (cartDrawer) cartDrawer.setActiveElement(this.openedBy);
    setTimeout(() => this.modalContent.innerHTML = '', 500);

    if (preventFocus) this.openedBy = null;
    super.hide();
  }

  show(opener) {
    this.setOpenerLoading(opener, true);

    fetch(this.getProductUrl(opener))
      .then((response) => response.text())
      .then((responseText) => {
        const responseHTML = new DOMParser().parseFromString(responseText, 'text/html');
        const contentElement = responseHTML.querySelector(this.sourceSelector);
        if (!contentElement) return;

        if (this.isProductContent) this.preprocessHTML(contentElement);
        HTMLUpdateUtility.setInnerHTML(this.modalContent, contentElement.outerHTML);
        this.afterRender(contentElement);

        if (this.isProductContent) {
          if (window.Shopify && Shopify.PaymentButton) Shopify.PaymentButton.init();
          if (window.ProductModel) window.ProductModel.loadShopifyXR();
        }

        super.show(opener);
      })
      .finally(() => this.setOpenerLoading(opener, false));
  }

  getProductUrl(opener) {
    const productUrl = opener.getAttribute('data-product-url').split('?')[0];
    return this.productView ? `${productUrl}?view=${this.productView}` : productUrl;
  }

  setOpenerLoading(opener, loading) {
    opener.toggleAttribute('aria-disabled', loading);
    opener.classList.toggle('loading', loading);
    opener.querySelector('.loading__spinner')?.classList.toggle('hidden', !loading);
  }

  preprocessHTML(productElement) {
    productElement.classList.forEach((classApplied) => {
      if (classApplied.startsWith('color-') || classApplied === 'gradient') {
        this.modalContent.classList.add(classApplied);
      }
    });
    this.preventDuplicatedIDs(productElement);
    this.removeDOMElements(productElement);
    this.removeGalleryListSemantic(productElement);
    productElement.setAttribute('data-update-url', 'false');
  }

  removeDOMElements(productElement) {
    productElement.querySelector('pickup-availability')?.remove();
    productElement.querySelector('share-button')?.remove();
    productElement.querySelector('product-modal')?.remove();
    productElement.querySelectorAll('modal-dialog').forEach((modal) => modal.remove());
    productElement.querySelectorAll('side-drawer-opener').forEach((button) => {
      if (!button.matches(this.keepDrawerOpenerSelector)) button.remove();
    });
    productElement.querySelectorAll('side-drawer').forEach((drawer) => {
      if (!drawer.matches(this.keepDrawerSelector)) drawer.remove();
    });
  }

  preventDuplicatedIDs(productElement) {
    const sectionId = productElement.dataset.section;
    const newId = `${this.idPrefix}-${sectionId}`;

    productElement.innerHTML = productElement.innerHTML.replaceAll(sectionId, newId);
    Array.from(productElement.attributes).forEach((attribute) => {
      if (attribute.value.includes(sectionId)) {
        productElement.setAttribute(attribute.name, attribute.value.replace(sectionId, newId));
      }
    });

    productElement.dataset.originalSection = sectionId;
  }

  removeGalleryListSemantic(productElement) {
    const galleryList = productElement.querySelector('[id^="Slider-Gallery"]');
    if (!galleryList) return;

    galleryList.setAttribute('role', 'presentation');
    galleryList.querySelectorAll('[id^="Slide-"]').forEach((li) => li.setAttribute('role', 'presentation'));
  }

  afterRender() {}
}

window.QuickProductModal = QuickProductModal;

class ModalOpener extends HTMLElement {
  constructor() {
    super();
    const button = this.querySelector('button');

    if (!button) return;
    button.addEventListener('click', () => {
      const modal = document.querySelector(this.getAttribute('data-modal'));
      if (modal) modal.show(button);
    });
  }
}
if (!customElements.get('modal-opener')) customElements.define('modal-opener', ModalOpener);

class HaloPopupElement extends HTMLElement {
  constructor() {
    super();
    this.popupTarget = this.matches('.modal--popup, .drawer') ? this : this.querySelector('.modal--popup, .drawer');
    this.overlay = this.querySelector('.drawer__overlay') || this.querySelector('[id^="Drawer-Overlay-"], [id^="Modal-Overlay-"], #Modal-Overlay');
    this.content = this.querySelector('.popup__inner');
    this.openTimer = null;
    this.focusTimer = null;
  }

  openPopup({ delay = 0, target = this.popupTarget, focusSelector = '.field__input, .popup__close, .drawer__close' } = {}) {
    clearTimeout(this.openTimer);
    this.openTimer = setTimeout(() => {
      this.activeElement = document.activeElement;
      target?.setAttribute('open', 'true');
      this.animatePopupOpen();
      document.body.classList.add('overflow-hidden');
      document.documentElement.setAttribute('scroll-lock', '');
      this.trapPopupFocus(focusSelector);
    }, delay);
  }

  closePopup({ target = this.popupTarget, afterClose } = {}) {
    clearTimeout(this.openTimer);
    this.animatePopupClose();
    setTimeout(() => {
      target?.removeAttribute('open');
      document.body.classList.remove('overflow-hidden');
      document.documentElement.removeAttribute('scroll-lock');
      removeTrapFocus(this.activeElement);
      if (afterClose) afterClose();
    }, 100);
  }

  animatePopupOpen() {
    if (!this.content) return;
    Motion.timeline([
      [this.content, { opacity: [0, 1], transform: ['translate(-50%, -40%)', 'translate(-50%, -50%)'] }, { duration: 0.3, at: '-0.15' }]
    ]).finished;
  }

  animatePopupClose() {
    if (!this.content) return;
    Motion.timeline([
      [this.content, { opacity: [1, 0], transform: ['translate(-50%, -50%)', 'translate(-50%, -40%)'] }, { duration: 0.2 }]
    ]).finished;
  }

  trapPopupFocus(focusSelector) {
    let trapped = false;
    const trap = () => {
      if (trapped || !this.content) return;
      trapped = true;
      trapFocus(this.content, this.querySelector(focusSelector));
    };

    this.addEventListener('transitionend', trap, { once: true });
    clearTimeout(this.focusTimer);
    this.focusTimer = setTimeout(trap, 350);
  }

  getBestStorage() {
    try {
      const key = '__popup_storage_test__';
      window.localStorage.setItem(key, '1');
      window.localStorage.removeItem(key);
      return window.localStorage;
    } catch (_) {}

    try {
      const key = '__popup_storage_test__';
      window.sessionStorage.setItem(key, '1');
      window.sessionStorage.removeItem(key);
      return window.sessionStorage;
    } catch (_) {}

    return null;
  }

  setStoreDays(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + 24 * 60 * 60 * 1000 * days);
    this.setStoreUntil(name, value, date);
  }

  setStoreUntil(name, value, date) {
    try {
      if (!this._storage) return;
      this._storage.setItem(name, JSON.stringify({ v: value, exp: date.getTime() }));
    } catch (_) {}
  }

  getStore(name) {
    try {
      if (!this._storage) return null;
      const raw = this._storage.getItem(name);
      if (!raw) return null;

      const payload = JSON.parse(raw);
      if (!payload || typeof payload.exp !== 'number') return null;
      if (Date.now() <= payload.exp) return payload.v;

      this._storage.removeItem(name);
      return null;
    } catch (_) {
      return null;
    }
  }
}

window.HaloPopupElement = HaloPopupElement;

class DetailsDisclosure extends HTMLElement {
  constructor() {
    super();
    this.mainDetailsToggle = this.querySelector('details');
    this.content = this.mainDetailsToggle.querySelector('summary').nextElementSibling;

    this.mainDetailsToggle.addEventListener('focusout', this.onFocusOut.bind(this));
    this.mainDetailsToggle.addEventListener('toggle', this.onToggle.bind(this));
  }

  onFocusOut() {
    setTimeout(() => {
      if (!this.contains(document.activeElement)) this.close();
    });
  }

  onToggle() {
    if (!this.animations) this.animations = this.content.getAnimations();

    if (this.mainDetailsToggle.hasAttribute('open')) {
      this.animations.forEach((animation) => animation.play());
    } else {
      this.animations.forEach((animation) => animation.cancel());
    }
  }

  close() {
    this.mainDetailsToggle.removeAttribute('open');
    this.mainDetailsToggle.querySelector('summary').setAttribute('aria-expanded', false);
  }
}
if (!customElements.get('details-disclosure')) customElements.define('details-disclosure', DetailsDisclosure);

class CollapsibleDetails extends HTMLDetailsElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.init();
  }

  init() {
    this._isOpen = this.hasAttribute('open');
    this.summary = this.querySelector('summary');
    this.content = this.summary.nextElementSibling;
    this.setAttribute('aria-expanded', this._isOpen ? 'true' : 'false');
    this.summary?.addEventListener('click', this._toggleOpen.bind(this));

    if (this.hasAttribute('collapsible-mobile')) {
      this.resizeHandler();
      window.addEventListener('resize', theme.utils.rafThrottle(this.resizeHandler.bind(this)));
      document.addEventListener('unmatchSmall', this.resizeHandler.bind(this));
    }

    if (Shopify.designMode && this.hasAttribute('check-shopify-design-mode')) {
      this.addEventListener('shopify:block:select', () => this.isOpen = true);
      this.addEventListener('shopify:block:deselect', () => this.isOpen = false);
    }
  }

  static get observedAttributes() {
    return ['open'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'open') this.setAttribute('aria-expanded', newValue === '' ? 'true' : 'false');
  }

  get isOpen() {
    return this._isOpen;
  }

  set isOpen(value) {
    if (value !== this._isOpen) {
      this._isOpen = value;

      if (this.isConnected) {
        this._animate(value);
      } else {
        value ? this.setAttribute('open', '') : this.removeAttribute('open');
      }
    }
    this.setAttribute('aria-expanded', value ? 'true' : 'false');
  }

  _toggleOpen(event) {
    event.preventDefault();
    this.isOpen = !this.isOpen;
  }

  close() {
    this._isOpen = false;
    this._animate(false);
  }

  resizeHandler() {
    if (window.matchMedia('(max-width: 749px)').matches) {
      if (this.isOpen) {
        this._isOpen = false;
        this.removeAttribute('open');
        this.setAttribute('aria-expanded', 'false');
      }
    } else {
      this._isOpen = true;
      this.setAttribute('open', '');
      this.setAttribute('aria-expanded', 'true');
    }
  }

  async _animate(open) {
    this.style.overflow = 'hidden';
    if (open) {
      this.setAttribute('open', '');

      await Motion.timeline ([
        [this, { height: [`${this.summary.clientHeight}px`, `${this.scrollHeight}px`] }, { duration: 0.45, easing: 'cubic-bezier(0.7, 0, 0.3, 1)' }],
        [this.content, { opacity: [0, 1], transform: ['translateX(-1rem)', 'translateX(0)'] }, { duration: 0.25, at: '-0.1' }]
      ]).finished;
    } else {
      await Motion.timeline ([
        [this.content, { opacity: 0, transform: ['translateX(0)', 'translateX(1rem)'] }, { duration: 0.15 }],
        [this, { height: [`${this.clientHeight}px`, `${this.summary.clientHeight}px`] }, { duration: 0.35, at: '<', easing: 'cubic-bezier(0.7, 0, 0.3, 1)' }]
      ]).finished;

      this.removeAttribute('open');
    }

    this.style.height = 'auto';
    this.style.overflow = 'visible';
  }
}
if (!customElements.get('collapsible-details')) customElements.define('collapsible-details', CollapsibleDetails, { extends: 'details' });

class DropdownDetails extends HTMLDetailsElement {
  constructor() {
    super();

    if (!theme.config.isTouch || Shopify.designMode) {
      Motion.inView(this, this.init.bind(this));
    } else {
      theme.initWhenVisible(this.init.bind(this));
    }

    if (Shopify.designMode) {
      this.addEventListener('shopify:block:select', () => this.isOpen = true);
      this.addEventListener('shopify:block:deselect', () => this.isOpen = false);
    }
  }

  connectedCallback() {
  }

  init() {
    this._isOpen = this.hasAttribute('open') && this.getAttribute('open') === 'true';
    this.elements = {
      button: this.querySelector('.details__summary'),
      dropdown: this.querySelector('.details__list')
    };

    if (!this.elements.button || !this.elements.dropdown) return;

    this.setAttribute('open', 'false');
    this.elements.button.addEventListener('click', this._toggleOpen.bind(this));

    this.onClickOutsideListener = this.onClickOutside.bind(this);
    this.onEscKeyboardListener = this.onEscKeyboard.bind(this);
    this.onFocusOutListener = this.onFocusOut.bind(this);

    if (theme.config.isTouch) return;
    if (theme.config.mqlDesktop && this.getAttribute('activate-event') === 'hover') {
      this.addEventListener('mouseenter', this.onHover.bind(this));
      this.addEventListener('mouseleave', this.onHover.bind(this));
    }
  }

  static get observedAttributes() {
    return ['open'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'open' && this.elements.button) {
      this.elements.button.setAttribute('aria-expanded', newValue === 'true');
    }
  }

  get isOpen() {
    return this._isOpen;
  }

  set isOpen(value) {
    if (value !== this._isOpen) {
      this._isOpen = value;
      if (this.isConnected) {
        this._animate(value);
      } else {
        this.setAttribute('open', value ? 'true' : 'false');
      }
    }
    if (this.elements.button) {
      this.elements.button.setAttribute('aria-expanded', value ? 'true' : 'false');
    }
  }

  onFocusOut() {
    if (!this.contains(document.activeElement)) this.close();
  }

  onClickOutside(event) {
    if (!this.contains(event.target) && !(event.target.closest('details') instanceof DetailsDropdown)) {
      this.open = false;
    }
  }

  onEscKeyboard(event) {
    if (event.code === 'Escape') {
      const targetMenu = event.target.closest('details[open]');
      if (targetMenu) {
        targetMenu.open = false;
      }
    }
  }

  onFocusOut(event) {
    if (event.relatedTarget && !this.contains(event.relatedTarget)) {
      this.open = false;
    }
  }

  onHover(event) {
    cancelAnimationFrame(this._hoverRaf);
    this._hoverRaf = requestAnimationFrame(() => {
      this.isOpen = event.type === 'mouseenter';
    });
  }

  _toggleOpen(event) {
    if (!event.target.closest('a')) event.preventDefault();
    this.isOpen = !this.isOpen;
  }

  close() {
    this.isOpen = false;
    this._animate(false);
  }

  _animate(open) {
    if (!this.elements.dropdown || !this.elements.dropdown.firstElementChild) return;

    if (open) {
      this.setAttribute('open', 'true');

      document.addEventListener('click', this.onClickOutsideListener);
      document.addEventListener('keydown', this.onEscKeyboardListener);
      document.addEventListener('focusout', this.onFocusOutListener);
      this.transitionIn()
    } else {
      this.elements.dropdown.removeAttribute('open');
      document.removeEventListener('click', this.onClickOutsideListener);
      document.removeEventListener('keydown', this.onEscKeyboardListener);
      document.removeEventListener('focusout', this.onFocusOutListener);
      this.transitionOut()
      if (!this.isOpen) this.removeAttribute('open');
    }
  }

  transitionIn() {
    Motion.animate(this.elements.dropdown, { opacity: [0, 1], visibility: 'visible', overflow: 'visible' }, { duration: theme.config.motionReduced ? 0 : 0.3, easing: [.7, 0, .2, 1], delay: theme.config.motionReduced ? 0 : 0.2 });
    const translateY = '-20%';
    return Motion.animate(this.elements.dropdown.firstElementChild, { transform: [`translateY(${translateY})`, 'translateY(0)'] }, { duration: theme.config.motionReduced ? 0 : 0.6, easing: [.7, 0, .2, 1] }).finished;
  }

  transitionOut() {
    Motion.animate(this.elements.dropdown, { opacity: 0, visibility: 'hidden', overflow: 'hidden' }, { duration: theme.config.motionReduced ? 0 : 0.3, easing: [.7, 0, .2, 1] });
    const translateY = '-20%';
    return Motion.animate(this.elements.dropdown.firstElementChild, { transform: `translateY(${translateY})` }, { duration: theme.config.motionReduced ? 0 : 0.6, easing: [.7, 0, .2, 1] }).finished;
  }
}

if (!customElements.get('dropdown-details')) {
  customElements.define('dropdown-details', DropdownDetails, { extends: 'details' });
}

class MegaMenuDetails extends DropdownDetails {
  constructor() {
    super();
  }

  connectedCallback() {
    theme.initWhenVisible(() => {
      this.renderContent();
      this.init();
    });
  }

  renderContent() {
    const template = this.querySelector('template');
    if (template) {
      const templateContent = theme.renderTemplate(template);
      this.appendChild(templateContent);
    }
  }
}
if (!customElements.get('mega-menu-details')) customElements.define('mega-menu-details', MegaMenuDetails, { extends: 'details' });

(function() {
  function isSafari() {
    const userAgent = navigator.userAgent;
    return /^((?!chrome|android).)*safari/i.test(userAgent);
  }

  if (isSafari()) {
    function transitionIn(dropdown) {
      if (!dropdown || !dropdown.firstElementChild) return;
      Motion.animate(dropdown, { opacity: [0, 1], visibility: 'visible', overflow: 'visible' }, { duration: theme.config.motionReduced ? 0 : 0.3, easing: [.7, 0, .2, 1], delay: theme.config.motionReduced ? 0 : 0.2 });
      const translateY = '-20%';
      return Motion.animate(dropdown.firstElementChild, { transform: [`translateY(${translateY})`, 'translateY(0)'] }, { duration: theme.config.motionReduced ? 0 : 0.6, easing: [.7, 0, .2, 1] }).finished;
    }

    function transitionOut(dropdown) {
      if (!dropdown || !dropdown.firstElementChild) return;
      Motion.animate(dropdown, { opacity: 0, visibility: 'hidden', overflow: 'hidden' }, { duration: theme.config.motionReduced ? 0 : 0.3, easing: [.7, 0, .2, 1] });
      const translateY = '-20%';
      return Motion.animate(dropdown.firstElementChild, { transform: `translateY(${translateY})` }, { duration: theme.config.motionReduced ? 0 : 0.6, easing: [.7, 0, .2, 1] }).finished;
    }

    function setupSafariHoverFallback(details) {
      const summary = details.querySelector('summary');
      const dropdown = details.querySelector('.details__list');
      
      if (summary && dropdown) {
        summary.addEventListener('mouseenter', () => {
          details.setAttribute('open', 'true');
          transitionIn(dropdown);
        });
        
        details.addEventListener('mouseleave', () => {
          const transitionPromise = transitionOut(dropdown);
          if (transitionPromise && transitionPromise.then) {
            transitionPromise.then(() => {
              details.setAttribute('open', 'false');
            });
          } else {
            details.setAttribute('open', 'false');
          }
        });
      }
    }

    function initSafariHoverFallback() {
      document.querySelectorAll('details[activate-event="hover"]').forEach(details => {
        setupSafariHoverFallback(details);
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initSafariHoverFallback);
    } else {
      initSafariHoverFallback();
    }

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            if (node.matches && node.matches('details[activate-event="hover"]')) {
              setupSafariHoverFallback(node);
            }
            const hoverDetails = node.querySelectorAll && node.querySelectorAll('details[activate-event="hover"]');
            if (hoverDetails) {
              hoverDetails.forEach(details => {
                setupSafariHoverFallback(details);
              });
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
})();
