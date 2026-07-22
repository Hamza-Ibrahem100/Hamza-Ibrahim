/* ==========================================================================
   Custom Product Grid JavaScript Logic
   ========================================================================== */

/**
 * Open Modal by ID
 * @param {string} modalId 
 */
function openModal(modalId) {
  var modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

/**
 * Close Modal by ID
 * @param {string} modalId 
 */
function closeModal(modalId) {
  var modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}

// Bind to window object for inline onclick handlers compatibility
window.openModal = openModal;
window.closeModal = closeModal;

// Global Event Listeners
document.addEventListener('DOMContentLoaded', function () {
  // Close modal when clicking on background overlay
  window.addEventListener('click', function (event) {
    if (event.target && event.target.classList.contains('custom-modal-overlay')) {
      event.target.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  });

  // Close modal when pressing Escape key
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      var openModals = document.querySelectorAll('.custom-modal-overlay');
      openModals.forEach(function (modal) {
        if (modal.style.display !== 'none') {
          modal.style.display = 'none';
        }
      });
      document.body.style.overflow = 'auto';
    }
  });

  // Color Swatch Selection Interactive Effect
  document.querySelectorAll('.color-swatch-box').forEach(function (swatch) {
    swatch.addEventListener('click', function () {
      var wrapper = swatch.closest('.color-options-wrapper');
      if (wrapper) {
        wrapper.querySelectorAll('.color-swatch-box').forEach(function (box) {
          box.style.fontWeight = 'normal';
          box.style.backgroundColor = 'transparent';
        });
      }
      swatch.style.fontWeight = 'bold';
      swatch.style.backgroundColor = '#f4f4f4';
    });
  });
});
