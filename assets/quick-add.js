/* ---------- Quick Add Modal — Tisso Vison ---------- */
(function () {
  const backdrop = document.getElementById('qaBackdrop');
  if (!backdrop) return; // modal not on this page

  const modal = document.getElementById('qaModal');
  const closeBtn = document.getElementById('qaClose');
  const loadingEl = document.getElementById('qaLoading');
  const contentEl = document.getElementById('qaContent');
  const imgEl = document.getElementById('qaImg');
  const titleEl = document.getElementById('qaTitle');
  const priceEl = document.getElementById('qaPrice');
  const descEl = document.getElementById('qaDesc');
  const optionsEl = document.getElementById('qaOptions');
  const errorEl = document.getElementById('qaError');
  const addBtn = document.getElementById('qaAddBtn');
  const addBtnLabel = document.getElementById('qaAddBtnLabel');

  let currentProduct = null;
  let selectedOptions = [];

  function formatMoney(cents) {
    if (window.Shopify && Shopify.formatMoney && window.themeMoneyFormat) {
      return Shopify.formatMoney(cents, window.themeMoneyFormat);
    }
    return (cents / 100).toFixed(2).replace('.', ',') + '€';
  }

  function closeModal() {
    backdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  function openModalShell() {
    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
    loadingEl.hidden = false;
    contentEl.hidden = true;
    errorEl.hidden = true;
  }

  function findVariant() {
    return currentProduct.variants.find(v =>
      v.options.every((val, i) => val === selectedOptions[i])
    );
  }

  function renderOptions() {
    optionsEl.innerHTML = '';
    if (!currentProduct || !currentProduct.options) return;

    // Order options so Color is first and Size is second
    const optionItems = currentProduct.options.map((opt, originalIndex) => ({
      opt,
      originalIndex
    }));

    optionItems.sort((a, b) => {
      const nameA = (typeof a.opt === 'object' && a.opt !== null ? a.opt.name : String(a.opt)).toLowerCase();
      const nameB = (typeof b.opt === 'object' && b.opt !== null ? b.opt.name : String(b.opt)).toLowerCase();
      const isColorA = nameA.includes('color') || nameA.includes('colour');
      const isColorB = nameB.includes('color') || nameB.includes('colour');
      if (isColorA && !isColorB) return -1;
      if (!isColorA && isColorB) return 1;
      return a.originalIndex - b.originalIndex;
    });

    optionItems.forEach(({ opt, originalIndex }) => {
      const index = originalIndex;
      // BUG FIX: Handle both String and Object option shapes ({ name: "Size", values: [...] })
      const optionNameStr = typeof opt === 'object' && opt !== null ? opt.name : String(opt);

      // gather values
      const values = [];
      if (currentProduct.variants && currentProduct.variants.length > 0) {
        currentProduct.variants.forEach(v => {
          const val = v.options ? v.options[index] : null;
          if (val && !values.includes(val)) values.push(val);
        });
      } else if (typeof opt === 'object' && opt.values) {
        values.push(...opt.values);
      }

      const wrap = document.createElement('div');
      wrap.className = 'qa-option-group';

      const label = document.createElement('div');
      label.className = 'qa-field-label';
      label.textContent = optionNameStr;
      wrap.appendChild(label);

      const isSizeLike = optionNameStr.toLowerCase().includes('size');

      if (isSizeLike) {
        // Size option -> Dropdown Select Frame (Width 271px, Height 40.44px)
        const selectWrap = document.createElement('div');
        selectWrap.className = 'qa-select-wrap';

        const selectedVal = selectedOptions[index] || '';
        const trigger = document.createElement('div');
        trigger.className = 'qa-select-trigger';
        trigger.innerHTML = `<span>${selectedVal || 'Choose your size'}</span><div class="qa-arrow-section"><svg viewBox="0 0 12 8" fill="none"><path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`;

        const dropdown = document.createElement('div');
        dropdown.className = 'qa-select-dropdown';

        values.forEach(val => {
          const item = document.createElement('div');
          item.className = 'qa-dropdown-item' + (selectedOptions[index] === val ? ' selected' : '');
          item.textContent = val;
          item.addEventListener('click', (e) => {
            e.stopPropagation();
            selectedOptions[index] = val;
            trigger.querySelector('span').textContent = val;
            selectWrap.classList.remove('open');
            
            // Manually update selected styling instead of tearing down the DOM
            dropdown.querySelectorAll('.qa-dropdown-item').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            
            updateForSelection();
          });
          dropdown.appendChild(item);
        });

        trigger.addEventListener('click', (e) => {
          e.stopPropagation();
          const isOpen = selectWrap.classList.contains('open');
          document.querySelectorAll('.qa-select-wrap').forEach(w => w.classList.remove('open'));
          if (!isOpen) selectWrap.classList.add('open');
        });

        selectWrap.appendChild(trigger);
        selectWrap.appendChild(dropdown);
        wrap.appendChild(selectWrap);
      } else {
        // Color / Other option -> Swatches Row (Shared Sliding Background)
        const row = document.createElement('div');
        row.className = 'qa-swatches';

        // Reverse the values order specifically for this option so White is on the left and Black on the right
        const displayValues = [...values].reverse();

        // Set total count so CSS can size the slider correctly
        row.style.setProperty('--swatch-count', displayValues.length);

        // Find the initially active index
        const initialActiveIdx = displayValues.findIndex(v => v === selectedOptions[index]);
        row.style.setProperty('--swatch-active', initialActiveIdx >= 0 ? initialActiveIdx : 0);

        displayValues.forEach((val, btnIdx) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'qa-swatch' + (selectedOptions[index] === val ? ' active' : '');
          btn.dataset.color = String(val).toLowerCase().trim();

          // Build the color chip — map common color names to actual CSS colors
          const colorMap = {
            white: '#ffffff', black: '#000000', red: '#cc0000',
            blue: '#0044cc', navy: '#001f5b', green: '#1a7a1a',
            grey: '#808080', gray: '#808080', pink: '#e75480',
            orange: '#e8681a', yellow: '#f5c518', purple: '#6a0dad',
            brown: '#7b3f00', beige: '#f5f0e8', cream: '#fffdd0',
            khaki: '#c3b091', olive: '#6b6b2a', coral: '#ff6b5b',
            teal: '#008080', mint: '#98e4c8', lavender: '#b57bee'
          };
          const colorKey = String(val).toLowerCase().trim();
          let chipColor = colorMap[colorKey] || colorKey; // fallback: use the value itself as CSS color

          // Override color specifically for Accordion Pleated Dress / Chequered Red Shirt
          const productTitle = (currentProduct.title || '').toLowerCase();
          const productHandle = (currentProduct.handle || '').toLowerCase();
          if ((productTitle.includes('accordion') || productHandle.includes('red-shirt')) && colorKey === 'red') {
            chipColor = '#7c1a22';
          } else if ((productTitle.includes('tennis') || productHandle.includes('denim-top')) && colorKey === 'blue') {
            chipColor = '#3b6582';
          }

          const chip = document.createElement('span');
          chip.className = 'qa-swatch-chip';
          chip.style.background = chipColor;
          // Light chips need a right-side border to stay visible on white background
          const isLight = ['white', 'cream', 'beige', 'ivory', 'off-white'].includes(colorKey);
          if (isLight) chip.dataset.light = 'true';

          btn.appendChild(chip);
          btn.appendChild(document.createTextNode(val));

          btn.addEventListener('click', () => {
            selectedOptions[index] = val;
            // Slide the shared background to this button's position
            row.style.setProperty('--swatch-active', btnIdx);
            // Update active text styling
            row.querySelectorAll('.qa-swatch').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateForSelection();
          });
          row.appendChild(btn);
        });

        wrap.appendChild(row);
      }

      optionsEl.appendChild(wrap);
    });
  }

  function updateForSelection() {
    const variant = findVariant();
    errorEl.hidden = true;

    const displayPrice = variant ? variant.price : currentProduct.price;
    if (displayPrice !== undefined) {
      priceEl.textContent = formatMoney(displayPrice);
    }

    if (variant) {
      if (variant.featured_image && variant.featured_image.src) {
        const newSrc = variant.featured_image.src + '&width=300';
        if (imgEl.src !== newSrc) {
          imgEl.style.opacity = '0';
          setTimeout(() => {
            imgEl.src = newSrc;
            imgEl.style.opacity = '1';
          }, 150);
        }
      }
      addBtn.disabled = !variant.available;
    } else {
      addBtn.disabled = true;
    }

    addBtnLabel.textContent = 'ADD TO CART';
  }

  window.openProductPopup = function (handle) {
    if (!handle) return;
    openModalShell();

    fetch(`/products/${handle}.js`)
      .then(res => {
        if (!res.ok) throw new Error('Product not found');
        return res.json();
      })
      .then(product => {
        currentProduct = product;
        selectedOptions = product.variants[0].options.slice();

        // Clear size-like options so dropdown shows "Choose your size" by default
        if (product.options) {
          product.options.forEach((opt, i) => {
            const name = (typeof opt === 'object' && opt !== null ? opt.name : String(opt)).toLowerCase();
            if (name.includes('size')) {
              selectedOptions[i] = null;
            }
          });
        }

        titleEl.textContent = product.title;
        imgEl.src = (product.featured_image || '') + (product.featured_image ? '&width=300' : '');
        imgEl.alt = product.title;
        descEl.innerHTML = product.description
          ? product.description.replace(/<[^>]*>/g, '').slice(0, 140)
          : '';

        renderOptions();
        updateForSelection();

        loadingEl.hidden = true;
        contentEl.hidden = false;
      })
      .catch(err => {
        console.error('Error loading product popup:', err);
        loadingEl.textContent = 'Sorry, this product could not be loaded.';
      });
  };

  // Delegate click for trigger buttons (e.g. .hotspot-marker)
  document.addEventListener('click', function (e) {
    const trigger = e.target.closest('[data-product-handle]');
    if (trigger) {
      const handle = trigger.getAttribute('data-product-handle');
      if (handle) {
        e.preventDefault();
        window.openProductPopup(handle);
      }
    }
  });

  addBtn.addEventListener('click', () => {
    const variant = findVariant();
    if (!variant || !variant.available) return;

    addBtn.disabled = true;
    const originalLabel = addBtnLabel.textContent;
    addBtnLabel.textContent = 'Adding…';

    fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ id: variant.id, quantity: 1 }] })
    })
      .then(res => {
        if (!res.ok) return res.json().then(err => { throw new Error(err.description || 'Could not add to cart'); });
        return res.json();
      })
      .then(() => {
        addBtnLabel.textContent = 'Added ✓';
        document.dispatchEvent(new CustomEvent('cart:updated', { bubbles: true }));
        document.dispatchEvent(new CustomEvent('cart:refresh', { bubbles: true }));
        setTimeout(() => { addBtn.disabled = false; addBtnLabel.textContent = originalLabel; }, 1400);
      })
      .catch(err => {
        errorEl.textContent = err.message;
        errorEl.hidden = false;
        addBtn.disabled = false;
        addBtnLabel.textContent = originalLabel;
      });
  });

  closeBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', e => { if (e.target === backdrop) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  document.addEventListener('click', () => {
    document.querySelectorAll('.qa-select-wrap').forEach(w => w.classList.remove('open'));
  });
})();
