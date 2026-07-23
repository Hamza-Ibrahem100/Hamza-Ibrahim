/* ---------- Quick Add Modal — Tisso Vison ---------- */
(function () {
  const backdrop = document.getElementById('qaBackdrop');
  if (!backdrop) return; // modal not on this page

  const modal        = document.getElementById('qaModal');
  const closeBtn      = document.getElementById('qaClose');
  const loadingEl      = document.getElementById('qaLoading');
  const contentEl      = document.getElementById('qaContent');
  const imgEl        = document.getElementById('qaImg');
  const titleEl        = document.getElementById('qaTitle');
  const priceEl        = document.getElementById('qaPrice');
  const descEl        = document.getElementById('qaDesc');
  const optionsEl      = document.getElementById('qaOptions');
  const errorEl        = document.getElementById('qaError');
  const addBtn        = document.getElementById('qaAddBtn');
  const addBtnLabel      = document.getElementById('qaAddBtnLabel');

  let currentProduct = null;
  let selectedOptions = [];

  function formatMoney(cents) {
    if (window.Shopify && Shopify.formatMoney && window.themeMoneyFormat) {
      return Shopify.formatMoney(cents, window.themeMoneyFormat);
    }
    return '€' + (cents / 100).toFixed(2);
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

    currentProduct.options.forEach((optionName, index) => {
      // gather this option's possible values, in the product's own order
      const values = [];
      currentProduct.variants.forEach(v => {
        const val = v.options[index];
        if (!values.includes(val)) values.push(val);
      });

      const isColorLike = /colou?r/i.test(optionName);
      const wrap = document.createElement('div');

      const label = document.createElement('div');
      label.className = 'qa-field-label';
      label.textContent = optionName;
      wrap.appendChild(label);

      if (isColorLike || values.length <= 4) {
        const row = document.createElement('div');
        row.className = 'qa-swatches';
        values.forEach(val => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'qa-swatch' + (selectedOptions[index] === val ? ' active' : '');
          btn.textContent = val;
          btn.addEventListener('click', () => {
            selectedOptions[index] = val;
            renderOptions();
            updateForSelection();
          });
          row.appendChild(btn);
        });
        wrap.appendChild(row);
      } else {
        const selectWrap = document.createElement('div');
        selectWrap.className = 'qa-select-wrap';
        const select = document.createElement('select');
        values.forEach(val => {
          const opt = document.createElement('option');
          opt.value = val;
          opt.textContent = val;
          if (selectedOptions[index] === val) opt.selected = true;
          select.appendChild(opt);
        });
        select.addEventListener('change', () => {
          selectedOptions[index] = select.value;
          updateForSelection();
        });
        selectWrap.appendChild(select);
        selectWrap.innerHTML += `<svg viewBox="0 0 24 24" fill="none"><path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        selectWrap.insertBefore(select, selectWrap.firstChild);
        wrap.appendChild(selectWrap);
      }

      optionsEl.appendChild(wrap);
    });
  }

  function updateForSelection() {
    const variant = findVariant();
    errorEl.hidden = true;

    if (variant) {
      priceEl.textContent = formatMoney(variant.price);
      if (variant.featured_image && variant.featured_image.src) {
        imgEl.src = variant.featured_image.src + '&width=300';
      }
      addBtn.disabled = !variant.available;
      addBtnLabel.textContent = variant.available ? 'Add to Cart' : 'Sold Out';
    } else {
      addBtn.disabled = true;
      addBtnLabel.textContent = 'Unavailable';
    }
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
      .catch(() => {
        loadingEl.textContent = 'Sorry, this product could not be loaded.';
      });
  };

  addBtn.addEventListener('click', () => {
    const variant = findVariant();
    if (!variant || !variant.available) return;

    addBtn.disabled = true;
    const originalLabel = addBtnLabel.textContent;
    addBtnLabel.textContent = 'Adding…';

    fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: variant.id, quantity: 1 })
    })
      .then(res => {
        if (!res.ok) return res.json().then(err => { throw new Error(err.description || 'Could not add to cart'); });
        return res.json();
      })
      .then(() => {
        addBtnLabel.textContent = 'Added ✓';
        document.dispatchEvent(new CustomEvent('cart:updated'));
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
})();
