// @ts-nocheck
/* ==========================================================================
   Tisso In The Wild Grid — 3-Step Hotspot Interaction
   Step 1: Hotspot (+/×) is the SOLE toggle for the mini-card.
   Step 2: Click mini-card → open full modal.
   Step 3: Full modal handles variant selection + AJAX Add to Cart.
   ========================================================================== */

let currentProduct  = null;
let activeHotspot   = null;
let selectedOptions = {};

/* ─── Price Formatter ──────────────────────────────────────────────────── */

function formatPrice(cents) {
  return (cents / 100).toFixed(2).replace('.', ',') + '\u20ac';
}

/* ─── Close: Mini-Card ──────────────────────────────────────────────────── */
/*    Collapses the mini-card and resets the hotspot back to +.              */

function closeMiniCard() {
  const card = document.getElementById('hotspot-mini-card');
  if (card) {
    card.classList.remove('is-visible');
    card.addEventListener('transitionend', () => { card.hidden = true; }, { once: true });
  }
  if (activeHotspot) {
    activeHotspot.classList.remove('is-active');
    activeHotspot = null;
  }
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

async function openHotspot(btn, handle) {
  const card = document.getElementById('hotspot-mini-card');
  if (!card) return;

  /* ── Toggle: clicking the same hotspot again closes the mini-card ── */
  if (activeHotspot === btn) {
    closeMiniCard();
    return;
  }

  /* ── Close any previously open mini-card from another hotspot ── */
  if (activeHotspot) activeHotspot.classList.remove('is-active');

  activeHotspot = btn;
  btn.classList.add('is-active');

  /* ── Append mini-card to the new relative container ── */
  const container = btn.closest('.hotspot-container');
  if (container) {
    container.appendChild(card);
  }

  /* ── Reset mini-card content ── */
  const imgEl   = document.getElementById('mini-card-image');
  const titleEl = document.getElementById('mini-card-title');
  const priceEl = document.getElementById('mini-card-price');

  if (imgEl)   { imgEl.src = ''; imgEl.alt = ''; }
  if (titleEl) titleEl.textContent = '\u2026';
  if (priceEl) priceEl.textContent = '';
  currentProduct = null;
  card.dataset.productHandle = handle || '';

  /* ── Show card (CSS top/right handles positioning) ── */
  card.hidden = false;
  requestAnimationFrame(() => card.classList.add('is-visible'));

  if (!handle) return;

  /* ── Fetch product data from Shopify AJAX API ── */
  try {
    const res = await fetch('/products/' + handle + '.js');
    if (!res.ok) throw new Error('Not found');
    currentProduct = await res.json();

    if (imgEl)   { imgEl.src = currentProduct.featured_image || ''; imgEl.alt = currentProduct.title || ''; }
    if (titleEl) titleEl.textContent = currentProduct.title  || '';
    if (priceEl) priceEl.textContent = formatPrice(currentProduct.price);

  } catch (err) {
    console.error('[Tisso] Product fetch failed:', err);
    if (titleEl) titleEl.textContent = 'Unavailable';
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

/* ─── Render Variant Options inside Full Modal ──────────────────────────── */

function hasRealOptions(product) {
  return (
    product &&
    product.options &&
    product.options.length > 0 &&
    !(product.options.length === 1 && product.options[0] === 'Title')
  );
}

function renderModalOptions() {
  const wrap = document.getElementById('modal-options-wrap');
  if (!wrap || !currentProduct) return;
  wrap.innerHTML = '';

  if (!hasRealOptions(currentProduct)) {
    updateModalVariant();
    return;
  }

  currentProduct.options.forEach((optionName, index) => {
    const nameLower = optionName.toLowerCase();
    const values    = [...new Set(currentProduct.variants.map(v => v[`option${index + 1}`]))];

    const group = document.createElement('div');
    group.className = 'modal-option-group';

    const label = document.createElement('label');
    label.className   = 'modal-option-label';
    label.textContent = optionName;
    group.appendChild(label);

    if (nameLower.includes('size')) {
      const select = document.createElement('select');
      select.className = 'modal-size-select';
      select.innerHTML =
        `<option value="">Choose your size</option>` +
        values.map(v => `<option value="${v}">${v}</option>`).join('');
      select.addEventListener('change', e => {
        selectedOptions[optionName] = e.target.value;
        updateModalVariant();
      });
      group.appendChild(select);

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

  const allSelected = currentProduct.options.every(opt => selectedOptions[opt]);
  if (!allSelected) { addBtn.disabled = true; return; }

  const variant = currentProduct.variants.find(v =>
    currentProduct.options.every((opt, i) => v[`option${i + 1}`] === selectedOptions[opt])
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

  /* ── Step 1: Hotspot click → toggle mini-card ── */
  document.querySelectorAll('.hotspot-marker').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      lastHotspotClickTime = Date.now();
      openHotspot(btn, btn.dataset.productHandle || '');
    });
  });

  /* ── Step 2: Mini-card click (Event Delegation) ── */
  document.addEventListener('click', e => {
    const cardWrap = e.target.closest('.hotspot-mini-card');
    if (cardWrap) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      const pHandle = cardWrap.dataset.productHandle;
      console.log('Mini card clicked!', pHandle);
      
      // Prevent mobile ghost-clicks or accidental double-taps opening modal instantly
      if (Date.now() - lastHotspotClickTime < 400) return;
      
      if (currentProduct) openFullModal();
    }
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
        - If full modal is open → close modal only (mini-card stays)
        - If mini-card is open but no modal → close mini-card           ── */
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const o = document.getElementById('full-modal-overlay');
    if (o && !o.hidden) closeFullModal();
    else closeMiniCard();
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
          closeMiniCard();
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
