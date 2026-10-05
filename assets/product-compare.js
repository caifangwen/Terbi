class ProductCompare extends HTMLElement {
  constructor() {
    super();
    this.storageKey = "productCompareHandles";
    this.legacyStorageKey = "compareItem";
    this.selectedHandles = this.readSelectedHandles();
    this.maxItems = Number(window.compare?.maxItems || 4);
    this.init();
  }

  init() {
    this.handleClick = this.handleClick.bind(this);
    this.handleCompareChange = this.handleCompareChange.bind(this);

    document.addEventListener("click", this.handleClick);
    document.addEventListener("change", this.handleCompareChange);
    this.initCompareProduct();
    this.syncCompareButtons();
  }

  readSelectedHandles() {
    try {
      const storedValue = localStorage.getItem(this.storageKey) || localStorage.getItem(this.legacyStorageKey) || "[]";
      const handles = JSON.parse(storedValue);
      return Array.isArray(handles) ? [...new Set(handles.filter(Boolean))] : [];
    } catch (error) {
      try {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.legacyStorageKey);
      } catch (storageError) {
        console.warn("Compare storage is unavailable:", storageError);
      }
      return [];
    }
  }

  writeSelectedHandles() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.selectedHandles));
      localStorage.removeItem(this.legacyStorageKey);
    } catch (error) {
      console.warn("Compare storage is unavailable:", error);
    }
  }

  getCompareDrawer() {
    return document.querySelector("#ProductComparePopup");
  }

  getCompareTable() {
    return document.querySelector("[data-product-compare-popup] .productCompareTable");
  }

  handleClick(event) {
    const target = event.target;
    const opener = target.closest("[data-compare-link]");
    const removeButton = target.closest("[data-compare-remove]");

    if (opener) {
      event.preventDefault();
      this.handleCompareLink(opener);
    } else if (removeButton) {
      event.preventDefault();
      this.handleCompareRemove(removeButton);
    }
  }

  initCompareProduct() {
    const closeBtn = document.querySelector(
      "[data-close-product-compare-popup]"
    );

    if (window.compare?.show) {
      this.syncCompareButtons();
      const drawer = this.getCompareDrawer();
      const hideComparePopup = () => drawer?.close?.();

      closeBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        hideComparePopup();
      });
    }
  }

  syncCompareButtons() {
    const compareControls = document.querySelectorAll("[data-product-compare-handle]");

    compareControls.forEach((element) => {
      const handle = element.dataset.productCompareHandle;
      const compareButton = element.querySelector(".compare-button");
      const text = element.querySelector(".text-inner") || element.querySelector(".text");
      const input = element.querySelector("input");
      const isSelected = this.selectedHandles.includes(handle);

      compareButton?.classList.toggle("is-checked", isSelected);
      if (text) text.textContent = isSelected ? window.compare.added : window.compare.add;
      if (input) input.checked = isSelected;
    });

    this.updateCounterCompare();
  }

  handleCompareChange(event) {
    const target = event.target;
    if (!target.matches("[data-product-compare] input")) return;

    const item = target.closest("[data-product-compare]");
    const button = target.closest(".compare-button");
    const text = item?.querySelector(".text-inner") || item?.querySelector(".text");
    const handle = target.value;

    if (target.checked) {
      if (this.selectedHandles.length >= this.maxItems && !this.selectedHandles.includes(handle)) {
        target.checked = false;
        alert(window.compare.maxMessage || `You can compare up to ${this.maxItems} products.`);
        return;
      }

      button?.classList.add("is-checked");
      if (text) text.textContent = window.compare.added;
      this.addSelectedHandle(handle);
    } else {
      button?.classList.remove("is-checked");
      if (text) text.textContent = window.compare.add;
      this.removeSelectedHandle(handle);
    }
  }

  handleCompareLink(opener) {
    if (this.selectedHandles.length <= 1) {
      alert(window.compare.message);
      return false;
    }
    opener?.classList?.add('loading');
    opener?.querySelector('.loading__spinner')?.classList?.remove('hidden');
    this.renderCompareRows(this.selectedHandles, opener);
  }

  handleCompareRemove(target) {
    const id = target.dataset.compareItem;
    const productCompareTable = this.getCompareTable();
    const cells = productCompareTable?.querySelectorAll(
      `[data-product-compare-id="${id}"]`
    );
    const handle = cells?.[0]?.dataset.compareProductHandle;
    const drawer = this.getCompareDrawer();
    if (!handle) return;

    cells.forEach((cell) => cell.remove());
    this.removeSelectedHandle(handle);
    this.hideEmptyRows();

    if (productCompareTable?.querySelectorAll("td[data-product-compare-id]").length === 0) {
      drawer?.close?.();
    }

    this.syncCompareHandle(handle, false);
  }

  updateCounterCompare() {
    const compareLinks = document.querySelectorAll("[data-compare-link]");
    if (!compareLinks.length) return;

    compareLinks.forEach((compareLink) => {
      const wrapper = compareLink.closest(".target-block, .product-compare-trigger") || compareLink.parentElement;
      const countPill = compareLink.querySelector("span.countPill");
      const isReady = this.selectedHandles.length > 1;

      wrapper?.classList.toggle("is-show", isReady);
      wrapper?.classList.toggle("hide", !isReady);
      if (countPill) countPill.textContent = isReady ? this.selectedHandles.length : "";
    });
  }

  addSelectedHandle(handle) {
    if (!this.selectedHandles.includes(handle)) {
      this.selectedHandles.push(handle);
      this.writeSelectedHandles();
      this.updateCounterCompare();
    }
  }

  removeSelectedHandle(handle) {
    const index = this.selectedHandles.indexOf(handle);
    if (index > -1) {
      this.selectedHandles.splice(index, 1);
      this.writeSelectedHandles();
      this.updateCounterCompare();
    }
  }

  syncCompareHandle(handle, isSelected) {
    document.querySelectorAll(`[data-product-compare-handle="${handle}"]`).forEach((item) => {
      const button = item.querySelector(".compare-button");
      const text = item.querySelector(".text-inner") || item.querySelector(".text");
      const input = item.querySelector("input[name='compare']");

      button?.classList.toggle("is-checked", isSelected);
      if (text) text.textContent = isSelected ? window.compare.added : window.compare.add;
      if (input) input.checked = isSelected;
    });
  }

  getProductCompareUrl(handle) {
    const rootUrl = window.Shopify?.routes?.root || window.routes?.root || "/";
    const normalizedRoot = rootUrl.endsWith("/") ? rootUrl : `${rootUrl}/`;
    return `${normalizedRoot}products/${encodeURIComponent(handle)}?view=ajax_product_compare_row`;
  }

  async renderCompareRows(handles, opener) {
    const productCompareTable = this.getCompareTable();
    const tableBody = productCompareTable?.querySelector("tbody");
    const drawer = this.getCompareDrawer();

    if (!tableBody) return;

    tableBody
      .querySelectorAll("td[data-product-compare-id]")
      .forEach((cell) => cell.remove());

    for (const handle of handles) {
      try {
        const response = await fetch(this.getProductCompareUrl(handle));
        if (!response.ok) throw new Error(`Compare fetch failed for ${handle}: ${response.status}`);
        const data = await response.text();
        this.appendCompareColumn(data);
      } catch (error) {
        console.error("Error fetching compare product:", error);
      }
    }

    if (tableBody.querySelector("td[data-product-compare-id]")) {
      this.hideEmptyRows();
      drawer?.open?.(opener);
    }
    opener?.classList?.remove('loading');
    opener?.querySelector('.loading__spinner')?.classList?.add('hidden');
  }

  appendCompareColumn(html) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html.trim();

    const columnTemplate = wrapper.querySelector("[data-product-compare-column]");
    if (!columnTemplate?.content) return;

    const cells = Array.from(columnTemplate.content.children);

    cells.forEach((cell) => {
      const field = cell.dataset.productCompareCell;
      const row = this.getCompareTable()?.querySelector(`[data-product-compare-field="${field}"]`);
      if (row) row.appendChild(cell);
    });
  }

  hideEmptyRows() {
    this.getCompareTable()?.querySelectorAll("tr[data-product-compare-field]").forEach((row) => {
      const cells = [...row.querySelectorAll("td[data-product-compare-id]")];
      if (!cells.length) return;
      row.hidden = cells.every((cell) => !cell.textContent.trim() || cell.querySelector(".productCompareTable-empty") || cell.textContent.trim() === "-");
    });
  }
}
if (!customElements.get('product-compare')) customElements.define('product-compare', ProductCompare);
