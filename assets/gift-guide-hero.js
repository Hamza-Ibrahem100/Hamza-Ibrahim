  document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.gift-hero__hamburger');
    const menuPanel = document.querySelector('.gift-hero__mobile-menu-panel');
    const outputFrame = document.querySelector('.gift-hero__output-frame');
    if (hamburger && menuPanel) {
      hamburger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = menuPanel.classList.toggle('open');
        hamburger.classList.toggle('active', isOpen);
        if (outputFrame) outputFrame.classList.toggle('menu-open', isOpen);
        
        const hamIcon = hamburger.querySelector('.hamburger-icon');
        const closeIcon = hamburger.querySelector('.close-icon');
        if (hamIcon && closeIcon) {
          hamIcon.style.display = isOpen ? 'none' : 'block';
          closeIcon.style.display = isOpen ? 'block' : 'none';
        }
      });
      
      // Close menu when clicking anywhere else
      document.addEventListener('click', (e) => {
        if (!menuPanel.contains(e.target) && !hamburger.contains(e.target)) {
          menuPanel.classList.remove('open');
          if (outputFrame) outputFrame.classList.remove('menu-open');
          hamburger.classList.remove('active');
          const hamIcon = hamburger.querySelector('.hamburger-icon');
          const closeIcon = hamburger.querySelector('.close-icon');
          if (hamIcon && closeIcon) {
            hamIcon.style.display = 'block';
            closeIcon.style.display = 'none';
          }
        }
      });
    }
  });
