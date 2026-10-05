    document.querySelectorAll('.inventory-badges').forEach((root) => {
      const dataId = root.id.replace('inventory-badges-', 'inventory-variants-');
      const dataElement = document.getElementById(dataId);

      if (!root || !dataElement || root.dataset.inventoryInitialized === 'true') {
        return;
      }

      root.dataset.inventoryInitialized = 'true';

      let variants;

      try {
        variants = JSON.parse(dataElement.textContent);
      } catch (error) {
        console.error('Unable to parse Shopify variant inventory data.', error);
        return;
      }

      const variantsById = new Map(
        variants.map((variant) => [String(variant.id), variant])
      );

      const stockBadge = root.querySelector('[data-inventory-stock]');
      const stockText = root.querySelector('[data-inventory-stock-text]');

      const lowStockThreshold =
        Number(root.dataset.lowStockThreshold) || 5;

      const section =
        root.closest('.shopify-section') ||
        root.closest('[id^="MainProduct-"]') ||
        document;

      function getVariantStatus(variant) {
        if (!variant) {
          return {
            state: 'out-of-stock',
            text: 'Out of Stock'
          };
        }

        if (!variant.available) {
          return {
            state: 'out-of-stock',
            text: 'Out of Stock'
          };
        }

        const inventoryIsTracked =
          variant.inventory_management !== null &&
          variant.inventory_management !== '';

        const quantity = Number(variant.inventory_quantity);

        if (
          inventoryIsTracked &&
          quantity <= 0 &&
          variant.inventory_policy === 'continue'
        ) {
          return {
            state: 'available-to-order',
            text: 'Available to Order'
          };
        }

        if (
          inventoryIsTracked &&
          quantity > 0 &&
          quantity <= lowStockThreshold
        ) {
          return {
            state: 'low-stock',
            text: `Only ${quantity} left`
          };
        }

        return {
          state: 'in-stock',
          text: 'In Stock'
        };
      }

      function renderVariant(variant) {
        if (!variant || !stockBadge || !stockText) {
          return;
        }

        const status = getVariantStatus(variant);

        stockBadge.dataset.state = status.state;
        stockText.textContent = status.text;
        stockBadge.setAttribute('aria-label', status.text);
      }

      function getVariantFromProductForm() {
        const variantInputs = section.querySelectorAll(
          'form[action*="/cart/add"] [name="id"]'
        );

        for (const input of variantInputs) {
          const variant = variantsById.get(String(input.value));

          if (variant) {
            return variant;
          }
        }

        const variantIdFromUrl =
          new URLSearchParams(window.location.search).get('variant');

        if (variantIdFromUrl) {
          return variantsById.get(String(variantIdFromUrl));
        }

        return null;
      }

      function updateFromProductForm() {
        const variant = getVariantFromProductForm();

        if (variant) {
          renderVariant(variant);
        }
      }

      /*
        一些主题会在选择变体后异步更新隐藏的 variant ID。
        因此短时间内重复检查，兼容 Dawn 和多数第三方主题。
      */
      let syncRun = 0;

      function beginVariantSync() {
        syncRun += 1;
        const currentRun = syncRun;
        let attempts = 0;

        function sync() {
          if (currentRun !== syncRun) {
            return;
          }

          updateFromProductForm();
          attempts += 1;

          if (attempts < 20) {
            window.setTimeout(sync, 100);
          }
        }

        sync();
      }

      function updateFromThemeEvent(event) {
        const detail = event.detail || {};

        const eventVariant =
          detail.variant ||
          detail.selectedVariant ||
          detail.productVariant ||
          null;

        const eventVariantId =
          eventVariant?.id ||
          detail.variantId ||
          detail.variant_id ||
          null;

        if (eventVariantId) {
          const variant = variantsById.get(String(eventVariantId));

          if (variant) {
            renderVariant(variant);
            return;
          }
        }

        beginVariantSync();
      }

      section.addEventListener(
        'change',
        (event) => {
          if (
            event.target.matches(
              'select, input[type="radio"], input[type="checkbox"], [name="id"]'
            )
          ) {
            beginVariantSync();
          }
        },
        true
      );

      document.addEventListener('variant:change', updateFromThemeEvent);
      document.addEventListener('variant-change', updateFromThemeEvent);
      document.addEventListener('product:variant-change', updateFromThemeEvent);
      document.addEventListener('product-variant-change', updateFromThemeEvent);

      window.addEventListener('popstate', beginVariantSync);

      updateFromProductForm();
    });
