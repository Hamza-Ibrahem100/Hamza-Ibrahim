// @ts-nocheck
/* ==========================================================================
   Tisso In The Wild Grid — Minimal Hotspot Popup
   ========================================================================== */

let currentProduct = null;
let activeHotspot  = null;

/* ─── Price Formatter ──────────────────────────────────────────────────── */

function formatPrice(cents) {
  return (cents / 100).toFixed(2).replace('.', ',') + '\u20ac';
}

/* ─── Popup Positioning ────────────────────────────────────────────────── */

function positionPopup(popup, triggerBtn) {
  const rect   = triggerBtn.getBoundingClientRect();
  const popupW = popup.offsetWidth  || 280;
  const popupH = popup.offsetHeight || 130;
  const margin = 14;

  let left = rect.right + margin;
  let top  = rect.top + (rect.height / 2) - (popupH / 2);

  // Flip left if overflows right edge
  if (left + popupW > window.innerWidth - margin) {
    left = rect.left - popupW - margin;
  }
  // Clamp left edge
  if (left < margin) left = margin;
  // Clamp vertical
  if (top + popupH > window.innerHeight - margin) top = window.innerHeight - popupH - margin;
  if (top < margin) top = margin;

  popup.style.left = left + 'px';
  popup.style.top  = top  + 'px';
}

/* ─── Close ────────────────────────────────────────────────────────────── */

function closePopup() {
  const popup    = document.getElementById('product-popup-card');
  const backdrop = document.getElementById('product-popup-backdrop');

  if (popup) {
    popup.classList.remove('is-visible');
    // Wait for fade-out transition then hide
    popup.addEventListener('transitionend', () => { popup.hidden = true; }, { once: true });
  }
  if (backdrop) backdrop.hidden = true;

  if (activeHotspot) {
    activeHotspot.classList.remove('is-active');
    activeHotspot = null;
  }
  currentProduct = null;
}

/* ─── Open Hotspot ─────────────────────────────────────────────────────── */

async function openHotspot(btn, handle) {
  const popup    = document.getElementById('product-popup-card');
  const backdrop = document.getElementById('product-popup-backdrop');
  if (!popup || !backdrop) return;

  // Toggle: same hotspot clicked again → close
  if (activeHotspot === btn) {
    closePopup();
    return;
  }

  // Close any previously open hotspot
  if (activeHotspot) activeHotspot.classList.remove('is-active');

  activeHotspot = btn;
  btn.classList.add('is-active');

  // Reset content
  const imgEl   = document.getElementById('popup-product-image');
  const titleEl = document.getElementById('popup-product-title');
  const priceEl = document.getElementById('popup-product-price');

  if (imgEl)   { imgEl.src = ''; imgEl.alt = ''; }
  if (titleEl) titleEl.textContent = '\u2026';
  if (priceEl) priceEl.textContent = '';

  // Show popup (measure first, then position)
  popup.hidden = false;
  backdrop.hidden = false;
  positionPopup(popup, btn);
  requestAnimationFrame(() => popup.classList.add('is-visible'));

  if (!handle) return;

  try {
    const res = await fetch('/products/' + handle + '.js');
    if (!res.ok) throw new Error('Not found');
    currentProduct = await res.json();

    if (imgEl) {
      imgEl.src = currentProduct.featured_image || '';
      imgEl.alt = currentProduct.title || '';
    }
    if (titleEl) titleEl.textContent = currentProduct.title || '';
    if (priceEl) priceEl.textContent = formatPrice(currentProduct.price);

    // Re-position after content is painted
    requestAnimationFrame(() => positionPopup(popup, btn));

  } catch (err) {
    console.error('[Tisso] Failed to load product:', err);
    if (titleEl) titleEl.textContent = 'Product unavailable';
  }
}

// Expose globally (used by event delegation below & available for Liquid onclick)
window.openHotspot = openHotspot;

/* ─── DOMContentLoaded ─────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {

  /* Hotspot click listeners */
  document.querySelectorAll('.hotspot-marker').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      openHotspot(btn, btn.dataset.productHandle || '');
    });
  });

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
