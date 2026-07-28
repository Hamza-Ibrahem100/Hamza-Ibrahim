// @ts-nocheck
/* ==========================================================================
   Tisso In The Wild Grid — Two-Step Hotspot Interaction
   Step 1: Click hotspot → Mini-Card (image + title + price)
   Step 2: Click Mini-Card → Full Modal (full details + ATC)
   ========================================================================== */

let currentProduct  = null;
let activeHotspot   = null;
let selectedOptions = {};

/* ─── Price Formatter ──────────────────────────────────────────────────── */

function formatPrice(cents) {
  return (cents / 100).toFixed(2).replace('.', ',') + '\u20ac';
}

/* ─── Mini-Card Positioning (beside the hotspot) ───────────────────────── */

function positionMiniCard(card, btn) {
  const rect   = btn.getBoundingClientRect();
  const cardW  = card.offsetWidth  || 270;
  const cardH  = card.offsetHeight || 120;
  const margin = 14;

  // Default: place to the right of the hotspot, vertically centred on it
  let left = rect.right + margin;
  let top  = rect.top + (rect.height / 2) - (cardH / 2);

  // Flip left if it overflows the right viewport edge
  if (left + cardW > window.innerWidth - margin) {
    left = rect.left - cardW - margin;
  }
  // Clamp edges
  if (left < margin) left = margin;
  if (top + cardH > window.innerHeight - margin) top = window.innerHeight - cardH - margin;
  if (top < margin) top = margin;

  card.style.left = left + 'px';
  card.style.top  = top  + 'px';
}

/* ─── Close: Mini-Card ──────────────────────────────────────────────────── */

function closeMiniCard() {
  const card     = document.getElementById('hotspot-mini-card');
  const backdrop = document.getElementById('mini-card-backdrop');

  if (card) {
    card.classList.remove('is-visible');
    card.addEventListener('transitionend', () => { card.hidden = true; }, { once: true });
  }
  if (backdrop) backdrop.hidden = true;

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

/* ─── Close Everything ──────────────────────────────────────────────────── */

function closeAll() {
  closeMiniCard();
  closeFullModal();
}

/* ─── Step 1: Open Hotspot → Show Mini-Card ────────────────────────────── */

async function openHotspot(btn, handle) {
  const card     = document.getElementById('hotspot-mini-card');
  const backdrop = document.getElementById('mini-card-backdrop');
  if (!card || !backdrop) return;

  // Toggle: same hotspot → close
  if (activeHotspot === btn) {
    closeMiniCard();
    return;
  }

  // Close previous hotspot if any
  if (activeHotspot) activeHotspot.classList.remove('is-active');

  activeHotspot = btn;
  btn.classList.add('is-active');

  // Reset mini-card content to loading state
  const imgEl   = document.getElementById('mini-card-image');
  const titleEl = document.getElementById('mini-card-title');
  const priceEl = document.getElementById('mini-card-price');

  if (imgEl)   { imgEl.src = ''; imgEl.alt = ''; }
  if (titleEl) titleEl.textContent = '\u2026';
  if (priceEl) priceEl.textContent = '';
  currentProduct = null;

  // Show card immediately (measure → position → animate)
  card.hidden    = false;
  backdrop.hidden = false;
  positionMiniCard(card, btn);
  requestAnimationFrame(() => card.classList.add('is-visible'));

  if (!handle) return;

  try {
    const res = await fetch('/products/' + handle + '.js');
    if (!res.ok) throw new Error('Not found');
    currentProduct = await res.json();

    if (imgEl) {
      imgEl.src = currentProduct.featured_image || '';
      imgEl.alt = currentProduct.title || '';
    }
    if (titleEl) titleEl.textContent = currentProduct.title  || '';
    if (priceEl) priceEl.textContent = formatPrice(currentProduct.price);

    // Re-position now content is painted
    requestAnimationFrame(() => positionMiniCard(card, btn));

  } catch (err) {
    console.error('[Tisso] Product fetch failed:', err);
    if (titleEl) titleEl.textContent = 'Unavailable';
  }
}

window.openHotspot = openHotspot;

/* ─── Step 2: Open Full Modal ───────────────────────────────────────────── */

function openFullModal() {
  if (!currentProduct) return;

  const overlay = document.getElementById('full-modal-overlay');
  if (!overlay) return;

  selectedOptions = {};

  // Populate modal fields
  const imgEl   = document.getElementById('modal-product-image');
  const titleEl = document.getElementById('modal-product-title');
  const priceEl = document.getElementById('modal-product-price');
  const descEl  = document.getElementById('modal-product-description');
  const addBtn  = document.getElementById('modal-add-to-cart');

  if (imgEl)  { imgEl.src = currentProduct.featured_image || ''; imgEl.alt = currentProduct.title || ''; }
  if (titleEl) titleEl.textContent = currentProduct.title || '';
  if (priceEl) priceEl.textContent = formatPrice(currentProduct.price);
  if (descEl) {
    descEl.innerHTML =
      currentProduct.description && currentProduct.description.trim() !== ''
        ? currentProduct.description
        : '';
  }
  if (addBtn) { addBtn.disabled = true; delete addBtn.dataset.variantId; }

  renderModalOptions();

  // Show overlay
  overlay.hidden = false;
  requestAnimationFrame(() => overlay.classList.add('is-visible'));
}

/* ─── Render Variant Options (inside Full Modal) ────────────────────────── */

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
    // Single-variant: enable ATC immediately
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
      /* Size: native <select> */
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
      /* Color / other: swatch buttons */
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
        if (vIdx === 0) btn.click(); // auto-select first
      });
      group.appendChild(row);
    }

    wrap.appendChild(group);
  });
}

/* ─── Update Variant (Full Modal) ───────────────────────────────────────── */

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

  /* ── Hotspot click → Step 1 ── */
  document.querySelectorAll('.hotspot-marker').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      openHotspot(btn, btn.dataset.productHandle || '');
    });
  });

  /* ── Mini-card click → Step 2 ── */
  const miniCard = document.getElementById('hotspot-mini-card');
  if (miniCard) {
    miniCard.addEventListener('click', e => {
      // Don't fire if clicking the close button
      if (e.target.closest('#mini-card-close')) return;
      openFullModal();
    });
  }

  /* ── Mini-card close button ── */
  const miniClose = document.getElementById('mini-card-close');
  if (miniClose) miniClose.addEventListener('click', e => { e.stopPropagation(); closeMiniCard(); });

  /* ── Mini-card backdrop ── */
  const miniBackdrop = document.getElementById('mini-card-backdrop');
  if (miniBackdrop) miniBackdrop.addEventListener('click', closeMiniCard);

  /* ── Full modal close button ── */
  const modalClose = document.getElementById('full-modal-close');
  if (modalClose) modalClose.addEventListener('click', closeFullModal);

  /* ── Full modal overlay backdrop click ── */
  const overlay = document.getElementById('full-modal-overlay');
  if (overlay) {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeFullModal();
    });
  }

  /* ── Escape key ── */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      // Close modal first; if not open, close mini-card
      const o = document.getElementById('full-modal-overlay');
      if (o && !o.hidden) closeFullModal();
      else closeMiniCard();
    }
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
          closeAll();
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
