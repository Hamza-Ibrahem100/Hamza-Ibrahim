/* ==========================================================================
   Tisso In The Wild Grid JavaScript Logic
   ========================================================================== */

let currentProduct = null;
let selectedOptions = {};

/**
 * Fetch Product data and Open Popup Modal
 * @param {string} handle 
 */
async function openProductPopup(handle) {
  if (!handle) return;

  try {
    const res = await fetch(`/products/${handle}.js`);
    if (!res.ok) throw new Error('Product not found');
    currentProduct = await res.json();
    selectedOptions = {};

    const imgEl = document.getElementById('popup-product-image');
    if (imgEl) imgEl.src = currentProduct.featured_image;

    const titleEl = document.getElementById('popup-product-title');
    if (titleEl) titleEl.textContent = currentProduct.title;

    const descEl = document.getElementById('popup-product-description');
    if (descEl) {
      descEl.innerHTML = currentProduct.description && currentProduct.description.trim() !== ''
        ? currentProduct.description
        : 'This one-piece swimsuit is crafted from jersey featuring an allover micro Monogram motif in relief.';
    }

    updatePriceDisplay(currentProduct.price);

    renderOptions();
    updateSelectedVariant();

    const overlay = document.getElementById('product-popup-overlay');
    if (overlay) overlay.hidden = false;
  } catch (err) {
    console.error('Failed to open product popup:', err);
  }
}

// Export openProductPopup to window object for global availability
window.openProductPopup = openProductPopup;

function updatePriceDisplay(cents) {
  const formatted = (cents / 100).toFixed(2).replace('.', ',') + '€';
  const priceEl = document.getElementById('popup-product-price');
  if (priceEl) priceEl.textContent = formatted;
}

function renderOptions() {
  const wrap = document.getElementById('popup-options-wrap');
  if (!wrap) return;
  wrap.innerHTML = '';

  if (currentProduct && currentProduct.options && currentProduct.options.length > 0 && !(currentProduct.options.length === 1 && currentProduct.options[0] === 'Title')) {
    currentProduct.options.forEach((optionName, index) => {
      const nameLower = optionName.toLowerCase();
      const values = [...new Set(currentProduct.variants.map(v => v[`option${index + 1}`]))];

      const group = document.createElement('div');
      group.className = 'popup-option-group';

      const label = document.createElement('label');
      label.className = 'popup-option-label';
      label.textContent = optionName;
      group.appendChild(label);

      if (nameLower.includes('size')) {
        const select = document.createElement('select');
        select.className = 'popup-size-select';
        select.innerHTML = `<option value="">Choose your size</option>` +
          values.map(v => `<option value="${v}">${v}</option>`).join('');
        select.addEventListener('change', (e) => {
          selectedOptions[optionName] = e.target.value;
          updateSelectedVariant();
        });
        group.appendChild(select);
      } else {
        const row = document.createElement('div');
        row.className = 'popup-swatch-row';
        values.forEach((val, vIdx) => {
          const btn = document.createElement('button');
          btn.className = 'popup-swatch';
          btn.type = 'button';
          btn.textContent = val;
          btn.addEventListener('click', () => {
            selectedOptions[optionName] = val;
            row.querySelectorAll('.popup-swatch').forEach(b => b.classList.remove('is-selected'));
            btn.classList.add('is-selected');
            updateSelectedVariant();
          });
          row.appendChild(btn);

          if (vIdx === 0) {
            btn.click();
          }
        });
        group.appendChild(row);
      }

      wrap.appendChild(group);
    });
  } else {
    // Fallback options matching Figma design (Color: White/Black, Size: Choose your size)
    const colorGroup = document.createElement('div');
    colorGroup.className = 'popup-option-group';
    colorGroup.innerHTML = `
      <label class="popup-option-label">Color</label>
      <div class="popup-swatch-row">
        <button class="popup-swatch is-selected" type="button">White</button>
        <button class="popup-swatch" type="button">Black</button>
      </div>
    `;
    wrap.appendChild(colorGroup);

    const sizeGroup = document.createElement('div');
    sizeGroup.className = 'popup-option-group';
    sizeGroup.innerHTML = `
      <label class="popup-option-label">Size</label>
      <select class="popup-size-select">
        <option value="" selected>Choose your size</option>
        <option value="S">Small (S)</option>
        <option value="M">Medium (M)</option>
        <option value="L">Large (L)</option>
        <option value="XL">Extra Large (XL)</option>
      </select>
    `;
    wrap.appendChild(sizeGroup);

    colorGroup.querySelectorAll('.popup-swatch').forEach(btn => {
      btn.addEventListener('click', () => {
        colorGroup.querySelectorAll('.popup-swatch').forEach(b => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');
      });
    });
  }
}

function updateSelectedVariant() {
  const addBtn = document.getElementById('popup-add-to-cart');
  if (!addBtn) return;

  // If product has no options (or only default "Title"), just pick the first variant
  if (!currentProduct.options || currentProduct.options.length === 0 || (currentProduct.options.length === 1 && currentProduct.options[0] === 'Title')) {
    const variant = currentProduct.variants[0];
    if (variant) {
      addBtn.disabled = !variant.available;
      addBtn.dataset.variantId = variant.id;
      updatePriceDisplay(variant.price);
    }
    return;
  }

  const allSelected = currentProduct.options.every(opt => selectedOptions[opt]);

  if (!allSelected) {
    addBtn.disabled = true;
    return;
  }

  const variant = currentProduct.variants.find(v =>
    currentProduct.options.every((opt, i) => v[`option${i + 1}`] === selectedOptions[opt])
  );

  if (variant) {
    addBtn.disabled = !variant.available;
    addBtn.dataset.variantId = variant.id;
    updatePriceDisplay(variant.price);
  }
}

// ⚙️ Bundle trigger configuration
const BUNDLE_TRIGGER_PRODUCT = 'soft-winter-jacket';

function shouldTriggerBundle(variant) {
  if (!variant) return false;
  const values = [variant.option1, variant.option2, variant.option3]
    .filter(Boolean)
    .map(v => v.toLowerCase());

  return values.includes('black') && values.includes('medium');
}

async function getBundleVariantId() {
  try {
    const res = await fetch(`/products/${BUNDLE_TRIGGER_PRODUCT}.js`);
    if (!res.ok) return null;
    const product = await res.json();
    const availableVariant = product.variants.find(v => v.available);
    return availableVariant ? availableVariant.id : null;
  } catch (err) {
    console.error('Failed to fetch bundle product:', err);
    return null;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Add click listeners to hotspots
  document.querySelectorAll('.hotspot-marker').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const handle = btn.dataset.productHandle;
      if (handle) {
        openProductPopup(handle);
      }
    });
  });

  // Add to cart click
  const addBtn = document.getElementById('popup-add-to-cart');
  if (addBtn) {
    addBtn.addEventListener('click', async (e) => {
      const variantId = e.currentTarget.dataset.variantId;
      if (!variantId) return;

      e.currentTarget.disabled = true;
      const span = e.currentTarget.querySelector('span');
      const originalText = span ? span.textContent : 'ADD TO CART';
      if (span) span.textContent = 'ADDING...';

      try {
        const itemsToAdd = [{ id: variantId, quantity: 1 }];
        const selectedVariant = currentProduct.variants.find(v => String(v.id) === String(variantId));

        if (shouldTriggerBundle(selectedVariant)) {
          const bundleVariantId = await getBundleVariantId();
          if (bundleVariantId) {
            itemsToAdd.push({ id: bundleVariantId, quantity: 1 });
          }
        }

        const response = await fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: itemsToAdd })
        });

        if (response.ok) {
          // Dispatch cart refresh events for theme compatibility
          document.dispatchEvent(new CustomEvent('cart:refresh', { bubbles: true }));
          document.dispatchEvent(new CustomEvent('cart:updated', { bubbles: true }));
        }

        if (span) span.textContent = 'ADDED!';
        setTimeout(() => {
          const overlay = document.getElementById('product-popup-overlay');
          if (overlay) overlay.hidden = true;
          if (span) span.textContent = originalText;
          e.currentTarget.disabled = false;
        }, 1500);

      } catch (err) {
        console.error('Add to cart failed:', err);
        e.currentTarget.disabled = false;
        if (span) span.textContent = originalText;
      }
    });
  }

  // Close buttons
  const closeBtn = document.getElementById('product-popup-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      const overlay = document.getElementById('product-popup-overlay');
      if (overlay) overlay.hidden = true;
    });
  }

  const overlay = document.getElementById('product-popup-overlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target.id === 'product-popup-overlay') {
        overlay.hidden = true;
      }
    });
  }

  // Close popup on Escape key press
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const overlayEl = document.getElementById('product-popup-overlay');
      if (overlayEl) overlayEl.hidden = true;
    }
  });
});
