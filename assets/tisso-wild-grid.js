// @ts-nocheck
/* ==========================================================================
   Tisso In The Wild Grid — 3-Step Hotspot Interaction
   Step 1: Hotspot (+/×) is the SOLE toggle for the mini-card.
   Step 2: Click mini-card → open full modal.
   Step 3: Full modal handles variant selection + AJAX Add to Cart.
   ========================================================================== */

let currentProduct  = null;
let selectedOptions = {};
window.productCache = window.productCache || {};

/* ─── Price Formatter ──────────────────────────────────────────────────── */

function formatPrice(cents) {
  return (cents / 100).toFixed(2).replace('.', ',') + '\u20ac';
}

/* ─── Color Variant Hex Mapper ─────────────────────────────────────────── */

function getVariantColorHex(valueName) {
  const val = String(valueName).toLowerCase().trim();
  if (val.includes('blue')) return '#2563EB';
  if (val.includes('red')) return '#EF4444';
  if (val.includes('green')) return '#22C55E';
  if (val.includes('black')) return '#000000';
  if (val.includes('white')) return '#FFFFFF';
  if (val.includes('gray') || val.includes('grey')) return '#9CA3AF';
  if (val.includes('yellow')) return '#FACC15';
  if (val.includes('orange')) return '#F97316';
  if (val.includes('purple')) return '#8B5CF6';
  if (val.includes('pink')) return '#EC4899';
  if (val.includes('brown')) return '#8B5A2B';
  if (val.includes('navy')) return '#1E3A8A';
  if (val.includes('beige')) return '#F5F5DC';
  if (val.includes('tan')) return '#D2B48C';
  if (val.includes('cream')) return '#FFFDD0';

  return '#000000';
}

/* ─── Close: Mini-Cards ─────────────────────────────────────────────────── */
/*    Collapses all open mini-cards and resets their hotspots back to +.     */

function closeAllMiniCards(forceInstant = false) {
  document.querySelectorAll('.hotspot-mini-card').forEach(card => {
    card.classList.remove('is-visible');
    if (forceInstant) {
      card.hidden = true;
    } else {
      card.addEventListener('transitionend', () => { card.hidden = true; }, { once: true });
    }
  });
  document.querySelectorAll('.hotspot-marker').forEach(btn => {
    btn.classList.remove('is-active');
  });
}

/* ─── Close: Full Modal ─────────────────────────────────────────────────── */

function closeFullModal() {
  const overlay = document.getElementById('full-modal-overlay');
  if (overlay) {
    overlay.classList.remove('is-visible');
    overlay.addEventListener('transitionend', () => { overlay.hidden = true; }, { once: true });
  }
  selectedOptions = {};
}

/* ─── Step 1: Hotspot click → show / hide mini-card ────────────────────── */

function openHotspot(btn, handle) {

  // Find the mini-card strictly within its own parent container
  const container = btn.closest('.hotspot-container');
  if (!container) return;
  const card = container.querySelector('.hotspot-mini-card');
  if (!card) return;

  /* ── Toggle: clicking the same hotspot again closes its mini-card ── */
  if (btn.classList.contains('is-active')) {
    btn.classList.remove('is-active');
    card.classList.remove('is-visible');
    card.addEventListener('transitionend', () => { card.hidden = true; }, { once: true });
    return;
  }

  /* ── Independent Toggling: Open this hotspot's mini-card ── */
  // We do NOT close other active mini-cards so multiple can be open
  btn.classList.add('is-active');
  card.hidden = false;
  requestAnimationFrame(() => card.classList.add('is-visible'));

  /* ── Pre-fetch product data for the Full Modal ── */
  if (handle && !window.productCache[handle]) {
    fetch('/products/' + handle + '.js')
      .then(res => res.json())
      .then(data => { window.productCache[handle] = data; })
      .catch(err => console.error('[Tisso] Pre-fetch failed:', err));
  }
}

window.openHotspot = openHotspot;

/* ─── Step 2: Mini-card click → open full modal ────────────────────────── */

function openFullModal() {
  if (!currentProduct) return;

  const overlay = document.getElementById('full-modal-overlay');
  if (!overlay) return;

  // Close mini-cards when full modal opens
  closeAllMiniCards(true);

  selectedOptions = {};

  /* Populate modal fields */
  const imgEl  = document.getElementById('modal-product-image');
  const titleEl= document.getElementById('modal-product-title');
  const priceEl= document.getElementById('modal-product-price');
  const descEl = document.getElementById('modal-product-description');
  const addBtn = document.getElementById('modal-add-to-cart');

  if (imgEl)  { imgEl.src = currentProduct.featured_image || ''; imgEl.alt = currentProduct.title || ''; }
  if (titleEl) titleEl.textContent = currentProduct.title || '';
  if (priceEl) priceEl.textContent = formatPrice(currentProduct.price);
  if (descEl) {
    descEl.innerHTML =
      currentProduct.description && currentProduct.description.trim() !== ''
        ? currentProduct.description : '';
  }
  if (addBtn) {
    addBtn.disabled = true;
    addBtn.style.display = 'flex'; // Permanently visible at all times
    delete addBtn.dataset.variantId;
  }

  renderModalOptions();

  overlay.hidden = false;
  requestAnimationFrame(() => overlay.classList.add('is-visible'));
}

/* ─── Helper: Open Full Modal via Handle ────────────────────────────────── */

async function openFullModalByHandle(handle) {
  if (!handle) return;
  window.productCache = window.productCache || {};
  let pData = window.productCache[handle];
  
  if (!pData) {
    try {
      const res = await fetch('/products/' + handle + '.js');
      if (res.ok) {
        pData = await res.json();
        window.productCache[handle] = pData;
      }
    } catch (err) {
      console.error('[Tisso] Fetch failed for handle:', handle, err);
    }
  }
  
  if (pData) {
    currentProduct = pData;
    openFullModal();
  }
}
window.openFullModalByHandle = openFullModalByHandle;

/* ─── Render Variant Options inside Full Modal ──────────────────────────── */

function getOptionName(opt) {
  if (typeof opt === 'object' && opt !== null) {
    return opt.name || '';
  }
  return opt ? String(opt) : '';
}

function hasRealOptions(product) {
  if (!product || !product.options || product.options.length === 0) return false;
  const firstOpt = getOptionName(product.options[0]);
  return !(product.options.length === 1 && firstOpt === 'Title');
}

function renderModalOptions() {
  const wrap = document.getElementById('modal-options-wrap');
  if (!wrap || !currentProduct) return;
  wrap.innerHTML = '';

  if (!hasRealOptions(currentProduct)) {
    updateModalVariant();
    return;
  }

  // Sort option indices so 'Color' options appear above 'Size' options
  const optionIndices = currentProduct.options.map((opt, idx) => {
    const name = getOptionName(opt);
    return {
      rawOption: opt,
      index: idx,
      name: name,
      titleName: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
      safeName: name.toLowerCase()
    };
  });

  optionIndices.sort((a, b) => {
    const aIsColor = a.safeName.includes('color');
    const bIsColor = b.safeName.includes('color');
    if (aIsColor && !bIsColor) return -1;
    if (!aIsColor && bIsColor) return 1;

    const aIsSize = a.safeName.includes('size');
    const bIsSize = b.safeName.includes('size');
    if (aIsSize && !bIsSize) return 1;
    if (!aIsSize && bIsSize) return -1;

    return a.index - b.index;
  });

  optionIndices.forEach(({ index, name: optionName, titleName, safeName }) => {
    let values = [...new Set(currentProduct.variants.map(v => v[`option${index + 1}`]))];
    if (safeName.includes('size')) {
      values = ['XS', 'S', 'M', 'L', 'XL'];
    }

    const group = document.createElement('div');
    group.className = 'modal-option-group';

    const label = document.createElement('label');
    label.className   = 'modal-option-label';
    label.textContent = titleName; // Title Case: 'Color', 'Size'
    group.appendChild(label);

    if (safeName.includes('size')) {
      const customSelectWrap = document.createElement('div');
      customSelectWrap.className = 'modal-custom-select-wrap';

      const selectBox = document.createElement('div');
      selectBox.className = 'modal-size-select-box';

      const customSelectBtn = document.createElement('button');
      customSelectBtn.type = 'button';
      customSelectBtn.className = 'modal-size-select-main';
      customSelectBtn.textContent = 'Choose your size';

      const arrowBtn = document.createElement('button');
      arrowBtn.type = 'button';
      arrowBtn.className = 'modal-size-select-arrow';
      arrowBtn.setAttribute('aria-label', 'Toggle size options');
      arrowBtn.innerHTML = `
        <svg class="modal-caret-icon" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 4L6 8L10 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;

      selectBox.appendChild(customSelectBtn);
      selectBox.appendChild(arrowBtn);

      const customSelectList = document.createElement('div');
      customSelectList.className = 'modal-custom-select-list';

      values.forEach(v => {
        const opt = document.createElement('div');
        opt.className = 'modal-custom-select-option';
        opt.textContent = v;
        opt.addEventListener('click', (e) => {
          if (e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
          }
          customSelectBtn.textContent = v;
          customSelectList.classList.remove('is-visible');
          selectBox.classList.remove('is-open');

          setTimeout(() => {
            if (!customSelectList.classList.contains('is-visible')) {
              customSelectList.style.display = 'none';
            }
          }, 200);

          selectedOptions[optionName] = v;
          updateModalVariant();
        });
        customSelectList.appendChild(opt);
      });

      const toggleDropdown = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        }
        const isOpen = customSelectList.classList.contains('is-visible');
        if (isOpen) {
          customSelectList.classList.remove('is-visible');
          selectBox.classList.remove('is-open');

          setTimeout(() => {
            if (!customSelectList.classList.contains('is-visible')) {
              customSelectList.style.display = 'none';
            }
          }, 200);
        } else {
          customSelectList.style.display = 'block';

          // Trigger reflow for CSS transition
          void customSelectList.offsetWidth;
          customSelectList.classList.add('is-visible');
          selectBox.classList.add('is-open');
        }
      };

      customSelectBtn.addEventListener('click', toggleDropdown);
      arrowBtn.addEventListener('click', toggleDropdown);

      // Close if clicked outside
      document.addEventListener('click', (e) => {
        if (!customSelectWrap.contains(e.target)) {
          customSelectList.classList.remove('is-visible');
          selectBox.classList.remove('is-open');

          setTimeout(() => {
            if (!customSelectList.classList.contains('is-visible')) {
              customSelectList.style.display = 'none';
            }
          }, 200);
        }
      });

      customSelectWrap.appendChild(selectBox);
      customSelectWrap.appendChild(customSelectList);
      group.appendChild(customSelectWrap);

    } else {
      const row = document.createElement('div');
      row.className = 'modal-swatch-row';

      // Shared Single Active Background Glider Layer (GPU Accelerated 280ms cubic-bezier)
      const glider = document.createElement('div');
      glider.className = 'modal-swatch-glider';
      row.appendChild(glider);

      const count = values.length || 1;
      glider.style.width = `calc(100% / ${count})`;

      values.forEach((val, vIdx) => {
        const btn = document.createElement('button');
        btn.className   = 'modal-swatch';
        btn.type        = 'button';

        // Stationary 5px Left Vertical Rectangle with Variant Color
        const indicator = document.createElement('span');
        indicator.className = 'modal-swatch-indicator';

        const hexColor = getVariantColorHex(val);
        indicator.style.backgroundColor = hexColor;
        if (String(val).toLowerCase().trim() === 'white') {
          indicator.style.borderRight = '1px solid #d9d9d9';
        }

        btn.appendChild(indicator);

        const textSpan = document.createElement('span');
        textSpan.className = 'modal-swatch-text';
        textSpan.textContent = val;
        btn.appendChild(textSpan);

        btn.addEventListener('click', (e) => {
          if (e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
          }
          selectedOptions[optionName] = val;
          row.querySelectorAll('.modal-swatch').forEach(b => b.classList.remove('is-selected'));
          btn.classList.add('is-selected');

          // Slide active glider using GPU-accelerated transform: translateX(vIdx * 100%)
          glider.style.transform = `translateX(${vIdx * 100}%)`;

          updateModalVariant();
        });

        row.appendChild(btn);

        if (vIdx === 0) {
          btn.classList.add('is-selected');
          glider.style.transform = 'translateX(0%)';
          selectedOptions[optionName] = val;
        }
      });
      group.appendChild(row);
    }

    wrap.appendChild(group);
  });
}

/* ─── Update Selected Variant ───────────────────────────────────────────── */

function updateModalVariant() {
  const addBtn = document.getElementById('modal-add-to-cart');
  if (!addBtn || !currentProduct) return;

  addBtn.style.display = 'flex'; // Permanently visible at all times

  const hasSizeOption = currentProduct.options.some(opt => getOptionName(opt).toLowerCase().includes('size'));
  const sizeOptionName = currentProduct.options.find(opt => getOptionName(opt).toLowerCase().includes('size'));
  const isSizeSelected = sizeOptionName ? Boolean(selectedOptions[getOptionName(sizeOptionName)]) : true;

  if (hasSizeOption && !isSizeSelected) {
    addBtn.disabled = true;
    return;
  }

  if (!hasRealOptions(currentProduct)) {
    const variant = currentProduct.variants[0];
    if (variant) {
      addBtn.disabled          = !variant.available;
      addBtn.dataset.variantId = variant.id;
      updateModalPrice(variant.price);
    }
    return;
  }

  const allSelected = currentProduct.options.every(opt => selectedOptions[getOptionName(opt)]);
  if (!allSelected) {
    addBtn.disabled = true;
    return;
  }

  let variant = currentProduct.variants.find(v =>
    currentProduct.options.every((opt, i) => v[`option${i + 1}`] === selectedOptions[getOptionName(opt)])
  );
  if (!variant) {
    variant = currentProduct.variants.find(v => v.available) || currentProduct.variants[0];
  }
  if (variant) {
    addBtn.disabled          = !variant.available;
    addBtn.dataset.variantId = variant.id;
    updateModalPrice(variant.price);
  }
}

function updateModalPrice(cents) {
  const priceEl = document.getElementById('modal-product-price');
  if (priceEl) priceEl.textContent = formatPrice(cents);
}

/* ─── Bundle Logic ──────────────────────────────────────────────────────── */

const BUNDLE_TRIGGER_PRODUCT = 'soft-winter-jacket';

function shouldTriggerBundle(variant) {
  if (!variant) return false;
  const vals = [variant.option1, variant.option2, variant.option3]
    .filter(Boolean).map(v => v.toLowerCase());
  return vals.includes('black') && vals.includes('medium');
}

async function getBundleVariantId() {
  try {
    const res = await fetch(`/products/${BUNDLE_TRIGGER_PRODUCT}.js`);
    if (!res.ok) return null;
    const product = await res.json();
    const av = product.variants.find(v => v.available);
    return av ? av.id : null;
  } catch { return null; }
}

/* ─── DOMContentLoaded ──────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  let lastHotspotInteractionTime = 0;
  let lastMiniCardInteractionTime = 0;

  /* ── Step 1: Hotspot interaction (Hotspot (+) -> opens Mini-card on Desktop & Mobile) ── */
  ['click', 'touchstart', 'touchend', 'pointerdown', 'pointerup'].forEach(eventType => {
    document.addEventListener(eventType, e => {
      const btn = e.target.closest('.hotspot-marker, .hotspot-button, .tisso-wild__hotspot');
      if (btn) {
        // Aggressively prevent default, stop propagation, and stop immediate propagation to kill theme quick-views
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const now = Date.now();
        if (now - lastHotspotInteractionTime < 300) return;

        // Process open action on click, touchend, or pointerdown (strictly once per user tap)
        if (eventType !== 'click' && eventType !== 'pointerdown' && eventType !== 'touchend') return;
        lastHotspotInteractionTime = now;

        const pHandle = btn.dataset.productHandle || btn.getAttribute('data-product-handle') || '';
        
        // UNIFIED FLOW: Hotspot (+) ALWAYS opens/toggles the mini-card (First Popup)
        openHotspot(btn, pHandle);
      }
    }, true);
  });

  /* ── Step 2: Mini-card interaction (Mini-card -> opens Full Modal on Desktop & Mobile) ── */
  ['click', 'touchend', 'pointerdown'].forEach(eventType => {
    document.addEventListener(eventType, e => {
      const cardWrap = e.target.closest('.hotspot-mini-card');
      if (cardWrap) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const now = Date.now();
        if (now - lastMiniCardInteractionTime < 400) return;
        lastMiniCardInteractionTime = now;

        const pHandle = cardWrap.dataset.productHandle;
        openFullModalByHandle(pHandle);
      }
    }, true);
  });

  /* ── Full modal × button ── */
  const modalClose = document.getElementById('full-modal-close');
  if (modalClose) modalClose.addEventListener('click', closeFullModal);

  /* ── Full modal backdrop click ── */
  const overlay = document.getElementById('full-modal-overlay');
  if (overlay) {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeFullModal();
    });
  }

  /* ── Escape key:
        - If full modal is open → close modal only
        - If mini-card is open but no modal → close all mini-cards ── */
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const o = document.getElementById('full-modal-overlay');
    if (o && !o.hidden) closeFullModal();
    else closeAllMiniCards();
  });

  /* ── Add to Cart (Full Modal) ── */
  const addBtn = document.getElementById('modal-add-to-cart');
  if (addBtn) {
    addBtn.addEventListener('click', async e => {
      const variantId = e.currentTarget.dataset.variantId;
      if (!variantId) return;

      e.currentTarget.disabled = true;
      const span        = e.currentTarget.querySelector('span');
      const originalTxt = span ? span.textContent : 'ADD TO CART';
      if (span) span.textContent = 'ADDING\u2026';

      try {
        const itemsToAdd      = [{ id: variantId, quantity: 1 }];
        const selectedVariant = currentProduct && currentProduct.variants.find(
          v => String(v.id) === String(variantId)
        );

        if (shouldTriggerBundle(selectedVariant)) {
          const bundleId = await getBundleVariantId();
          if (bundleId) itemsToAdd.push({ id: bundleId, quantity: 1 });
        }

        const response = await fetch('/cart/add.js', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ items: itemsToAdd })
        });

        if (response.ok) {
          document.dispatchEvent(new CustomEvent('cart:refresh', { bubbles: true }));
          document.dispatchEvent(new CustomEvent('cart:updated', { bubbles: true }));
        }

        if (span) span.textContent = 'ADDED!';
        setTimeout(() => {
          closeFullModal();
          closeAllMiniCards();
          if (span) span.textContent = originalTxt;
          e.currentTarget.disabled = false;
        }, 1500);

      } catch (err) {
        console.error('[Tisso] Add to cart failed:', err);
        e.currentTarget.disabled = false;
        if (span) span.textContent = originalTxt;
      }
    });
  }
});
