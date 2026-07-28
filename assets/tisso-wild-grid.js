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

  // Mobile guard clause: strictly bypass mini-card on mobile screens
  if (window.innerWidth <= 768) return;

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
  if (addBtn) { addBtn.disabled = true; delete addBtn.dataset.variantId; }

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

  currentProduct.options.forEach((rawOption, index) => {
    const optionName = getOptionName(rawOption);
    const safeName   = optionName.toLowerCase();
    const values     = [...new Set(currentProduct.variants.map(v => v[`option${index + 1}`]))];

    const group = document.createElement('div');
    group.className = 'modal-option-group';

    const label = document.createElement('label');
    label.className   = 'modal-option-label';
    label.textContent = optionName;
    group.appendChild(label);

    if (safeName.includes('size')) {
      const customSelectWrap = document.createElement('div');
      customSelectWrap.className = 'modal-custom-select-wrap';
      customSelectWrap.style.position = 'relative';
      customSelectWrap.style.width = '100%';

      const customSelectBtn = document.createElement('button');
      customSelectBtn.type = 'button';
      customSelectBtn.className = 'modal-size-select';
      customSelectBtn.textContent = 'Choose your size';

      const customSelectList = document.createElement('div');
      customSelectList.className = 'modal-custom-select-list';
      customSelectList.style.position = 'absolute';
      customSelectList.style.top = '100%';
      customSelectList.style.left = '0';
      customSelectList.style.width = '100%';
      customSelectList.style.zIndex = '100';
      customSelectList.style.display = 'none';

      values.forEach(v => {
        const opt = document.createElement('div');
        opt.className = 'modal-custom-select-option';
        opt.textContent = v;
        opt.addEventListener('click', () => {
          customSelectBtn.textContent = v;
          customSelectList.style.display = 'none';
          customSelectBtn.classList.remove('is-open');
          selectedOptions[optionName] = v;
          updateModalVariant();
        });
        customSelectList.appendChild(opt);
      });

      customSelectBtn.addEventListener('click', () => {
        const isOpen = customSelectList.style.display === 'block';
        customSelectList.style.display = isOpen ? 'none' : 'block';
        if (!isOpen) {
          customSelectBtn.classList.add('is-open');
        } else {
          customSelectBtn.classList.remove('is-open');
        }
      });

      // Close if clicked outside
      document.addEventListener('click', (e) => {
        if (!customSelectWrap.contains(e.target)) {
          customSelectList.style.display = 'none';
          customSelectBtn.classList.remove('is-open');
        }
      });

      customSelectWrap.appendChild(customSelectBtn);
      customSelectWrap.appendChild(customSelectList);
      group.appendChild(customSelectWrap);

    } else {
      const row = document.createElement('div');
      row.className = 'modal-swatch-row';
      values.forEach((val, vIdx) => {
        const btn = document.createElement('button');
        btn.className   = 'modal-swatch';
        btn.type        = 'button';
        btn.textContent = val;
        btn.addEventListener('click', () => {
          selectedOptions[optionName] = val;
          row.querySelectorAll('.modal-swatch').forEach(b => b.classList.remove('is-selected'));
          btn.classList.add('is-selected');
          updateModalVariant();
        });
        row.appendChild(btn);
        if (vIdx === 0) btn.click(); // auto-select first value
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
  if (!allSelected) { addBtn.disabled = true; return; }

  const variant = currentProduct.variants.find(v =>
    currentProduct.options.every((opt, i) => v[`option${i + 1}`] === selectedOptions[getOptionName(opt)])
  );
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
  const miniCard = document.getElementById('hotspot-mini-card');
  let lastHotspotClickTime = 0;

  /* ── Step 1: Hotspot interaction (Event Delegation across touch & click events) ── */
  ['click', 'touchstart', 'touchend', 'pointerdown', 'pointerup'].forEach(eventType => {
    document.addEventListener(eventType, async e => {
      const btn = e.target.closest('.hotspot-marker, .hotspot-button, .tisso-wild__hotspot');
      if (btn) {
        // Aggressively prevent default, stop propagation, and stop immediate propagation on all touch/pointer/click events
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        // Prevent duplicate execution across multiple event types (e.g. pointerdown + touchend + click)
        const now = Date.now();
        if (now - lastHotspotClickTime < 350) return;

        // Process modal trigger on click, touchend, or pointerdown (only once per user tap)
        if (eventType !== 'click' && eventType !== 'pointerdown' && eventType !== 'touchend') return;
        lastHotspotClickTime = now;

        const pHandle = btn.dataset.productHandle || btn.getAttribute('data-product-handle') || '';

        if (window.innerWidth <= 768) {
          // MOBILE EXCLUSIVE: Forcefully close any mini-card/popups and directly open Desktop Full Modal ONLY
          closeAllMiniCards(true);
          closeFullModal();

          if (!pHandle) return;
          await openFullModalByHandle(pHandle);
        } else {
          // DESKTOP EXCLUSIVE: Toggle mini-card only
          openHotspot(btn, pHandle);
        }
      }
    }, true);
  });

  /* ── Step 2: Mini-card click (Event Delegation for Desktop) ── */
  ['click', 'touchend', 'pointerdown'].forEach(eventType => {
    document.addEventListener(eventType, e => {
      const cardWrap = e.target.closest('.hotspot-mini-card');
      if (cardWrap) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        if (window.innerWidth <= 768) {
          closeAllMiniCards(true);
          return;
        }

        const pHandle = cardWrap.dataset.productHandle;
        if (Date.now() - lastHotspotClickTime < 400) return;

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
