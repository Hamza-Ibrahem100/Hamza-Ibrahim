// @ts-nocheck
/* ==========================================================================
   Tisso In The Wild Grid JavaScript Logic
   ========================================================================== */

let currentProduct = null;
let selectedOptions  = {};
let activeHotspot    = null;

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function updatePriceDisplay(cents) {
  const formatted = (cents / 100).toFixed(2).replace('.', ',') + '€';
  const priceEl = document.getElementById('popup-product-price');
  if (priceEl) priceEl.textContent = formatted;
}

function hasRealOptions(product) {
  return (
    product &&
    product.options &&
    product.options.length > 0 &&
    !(product.options.length === 1 && product.options[0] === 'Title')
  );
}

/* ─── Popup Positioning ──────────────────────────────────────────────────── */

function positionPopup(popup, triggerBtn) {
  const rect     = triggerBtn.getBoundingClientRect();
  const popupW   = 320;
  const popupH   = Math.min(popup.offsetHeight || 480, window.innerHeight - 24);
  const margin   = 12;

  let left = rect.right + margin;
  let top  = rect.top;

  // Flip left if overflows right edge
  if (left + popupW > window.innerWidth - margin) {
    left = rect.left - popupW - margin;
  }
  // Clamp left edge
  if (left < margin) {
    left = Math.max(margin, (window.innerWidth - popupW) / 2);
  }
  // Clamp vertical
  const maxTop = window.innerHeight - popupH - margin;
  if (top > maxTop) top = maxTop;
  if (top < margin)  top = margin;

  popup.style.left = left + 'px';
  popup.style.top  = top  + 'px';
}

/* ─── Close ──────────────────────────────────────────────────────────────── */

function closePopup() {
  const popup    = document.getElementById('product-popup-card');
  const backdrop = document.getElementById('product-popup-backdrop');
  if (popup)    { popup.hidden    = true; popup.classList.remove('is-visible'); }
  if (backdrop) { backdrop.hidden = true; }

  if (activeHotspot) {
    activeHotspot.classList.remove('is-active');
    activeHotspot = null;
  }
  currentProduct  = null;
  selectedOptions = {};
}

/* ─── Open Hotspot ───────────────────────────────────────────────────────── */

/**
 * Called from the hotspot click listener.
 * @param {HTMLElement} btn   – the clicked hotspot button
 * @param {string}      handle – Shopify product handle
 */
async function openHotspot(btn, handle) {
  const popup    = document.getElementById('product-popup-card');
  const backdrop = document.getElementById('product-popup-backdrop');
  if (!popup || !backdrop) return;

  // Toggle: same hotspot clicked again → close
  if (activeHotspot === btn) {
    closePopup();
    return;
  }

  // Close the previous one
  if (activeHotspot) activeHotspot.classList.remove('is-active');

  activeHotspot = btn;
  btn.classList.add('is-active');

  // Reset popup content to loading state
  const wrap = document.getElementById('popup-options-wrap');
  if (wrap) wrap.innerHTML = '<p class="popup-loading">Loading&hellip;</p>';

  const titleEl = document.getElementById('popup-product-title');
  const priceEl = document.getElementById('popup-product-price');
  const descEl  = document.getElementById('popup-product-description');
  const imgEl   = document.getElementById('popup-product-image');
  const addBtn  = document.getElementById('popup-add-to-cart');

  if (titleEl) titleEl.textContent = '';
  if (priceEl) priceEl.textContent = '';
  if (descEl)  descEl.innerHTML    = '';
  if (imgEl)   imgEl.src           = '';
  if (addBtn)  addBtn.disabled     = true;

  // Show popup (hidden = false lets us measure it for positioning)
  popup.hidden    = false;
  backdrop.hidden = false;
  positionPopup(popup, btn);

  // Animate in
  requestAnimationFrame(() => popup.classList.add('is-visible'));

  if (!handle) return;

  try {
    const res = await fetch(`/products/${handle}.js`);
    if (!res.ok) throw new Error('Product not found');
    currentProduct  = await res.json();
    selectedOptions = {};

    if (imgEl)   imgEl.src           = currentProduct.featured_image || '';
    if (titleEl) titleEl.textContent = currentProduct.title;
    if (descEl) {
      descEl.innerHTML =
        currentProduct.description && currentProduct.description.trim() !== ''
          ? currentProduct.description
          : '';
    }

    updatePriceDisplay(currentProduct.price);
    renderOptions();
    updateSelectedVariant();

    // Re-position now that popup has real content
    positionPopup(popup, btn);

  } catch (err) {
    console.error('Failed to load product:', err);
    if (wrap) wrap.innerHTML = '<p class="popup-error">Could not load product.</p>';
  }
}

// Expose globally so Liquid onclick="" can call it
window.openHotspot = openHotspot;

/* ─── Render Options ─────────────────────────────────────────────────────── */

function renderOptions() {
  const wrap = document.getElementById('popup-options-wrap');
  if (!wrap || !currentProduct) return;
  wrap.innerHTML = '';

  if (!hasRealOptions(currentProduct)) return; // ATC button enabled directly

  currentProduct.options.forEach((optionName, index) => {
    const nameLower = optionName.toLowerCase();
    const values    = [
      ...new Set(currentProduct.variants.map(v => v[`option${index + 1}`]))
    ];

    const group = document.createElement('div');
    group.className = 'popup-option-group';

    const label = document.createElement('label');
    label.className   = 'popup-option-label';
    label.textContent = optionName;
    group.appendChild(label);

    if (nameLower.includes('size')) {
      /* ── Size: native <select> ── */
      const select = document.createElement('select');
      select.className = 'popup-size-select';
      select.innerHTML =
        `<option value="">Choose your size</option>` +
        values.map(v => `<option value="${v}">${v}</option>`).join('');
      select.addEventListener('change', e => {
        selectedOptions[optionName] = e.target.value;
        updateSelectedVariant();
      });
      group.appendChild(select);

    } else {
      /* ── Color / other: swatch buttons ── */
      const row = document.createElement('div');
      row.className = 'popup-swatch-row';

      values.forEach((val, vIdx) => {
        const btn = document.createElement('button');
        btn.className  = 'popup-swatch';
        btn.type       = 'button';
        btn.textContent = val;
        btn.addEventListener('click', () => {
          selectedOptions[optionName] = val;
          row.querySelectorAll('.popup-swatch').forEach(b => b.classList.remove('is-selected'));
          btn.classList.add('is-selected');
          updateSelectedVariant();
        });
        row.appendChild(btn);

        // Auto-select the first option
        if (vIdx === 0) btn.click();
      });

      group.appendChild(row);
    }

    wrap.appendChild(group);
  });
}

/* ─── Update Selected Variant ────────────────────────────────────────────── */

function updateSelectedVariant() {
  const addBtn = document.getElementById('popup-add-to-cart');
  if (!addBtn || !currentProduct) return;

  if (!hasRealOptions(currentProduct)) {
    // Single-variant product — pick first variant
    const variant = currentProduct.variants[0];
    if (variant) {
      addBtn.disabled            = !variant.available;
      addBtn.dataset.variantId   = variant.id;
      updatePriceDisplay(variant.price);
    }
    return;
  }

  const allSelected = currentProduct.options.every(opt => selectedOptions[opt]);
  if (!allSelected) { addBtn.disabled = true; return; }

  const variant = currentProduct.variants.find(v =>
    currentProduct.options.every((opt, i) => v[`option${i + 1}`] === selectedOptions[opt])
  );

  if (variant) {
    addBtn.disabled          = !variant.available;
    addBtn.dataset.variantId = variant.id;
    updatePriceDisplay(variant.price);
  }
}

/* ─── Bundle Logic ───────────────────────────────────────────────────────── */

const BUNDLE_TRIGGER_PRODUCT = 'soft-winter-jacket';

function shouldTriggerBundle(variant) {
  if (!variant) return false;
  const vals = [variant.option1, variant.option2, variant.option3]
    .filter(Boolean)
    .map(v => v.toLowerCase());
  return vals.includes('black') && vals.includes('medium');
}

async function getBundleVariantId() {
  try {
    const res     = await fetch(`/products/${BUNDLE_TRIGGER_PRODUCT}.js`);
    if (!res.ok)  return null;
    const product = await res.json();
    const av      = product.variants.find(v => v.available);
    return av ? av.id : null;
  } catch {
    return null;
  }
}

/* ─── DOMContentLoaded ───────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {

  /* Hotspot click listeners */
  document.querySelectorAll('.hotspot-marker').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const handle = btn.dataset.productHandle;
      openHotspot(btn, handle || '');
    });
  });

  /* Add to Cart */
  const addBtn = document.getElementById('popup-add-to-cart');
  if (addBtn) {
    addBtn.addEventListener('click', async e => {
      const variantId = e.currentTarget.dataset.variantId;
      if (!variantId) return;

      e.currentTarget.disabled = true;
      const span        = e.currentTarget.querySelector('span');
      const originalTxt = span ? span.textContent : 'ADD TO CART';
      if (span) span.textContent = 'ADDING\u2026';

      try {
        const itemsToAdd     = [{ id: variantId, quantity: 1 }];
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
          document.dispatchEvent(new CustomEvent('cart:refresh',  { bubbles: true }));
          document.dispatchEvent(new CustomEvent('cart:updated',  { bubbles: true }));
        }

        if (span) span.textContent = 'ADDED!';
        setTimeout(() => {
          closePopup();
          if (span) span.textContent = originalTxt;
          e.currentTarget.disabled = false;
        }, 1500);

      } catch (err) {
        console.error('Add to cart failed:', err);
        e.currentTarget.disabled = false;
        if (span) span.textContent = originalTxt;
      }
    });
  }

  /* Close button inside popup */
  const closeBtn = document.getElementById('product-popup-close');
  if (closeBtn) closeBtn.addEventListener('click', closePopup);

  /* Backdrop click → close */
  const backdrop = document.getElementById('product-popup-backdrop');
  if (backdrop) backdrop.addEventListener('click', closePopup);

  /* Escape key → close */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closePopup();
  });
});
