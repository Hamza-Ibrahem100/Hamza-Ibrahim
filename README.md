# Shopify Theme Development Assessment

This repository contains a custom Shopify theme implementation built from scratch using Shopify Liquid, HTML, CSS, and Vanilla JavaScript. The project follows Shopify Theme Development best practices with a modular, maintainable, and scalable architecture.

# 📂 Project Features Directory Index

This project has been organized into modular, maintainable, and reusable components following Shopify Theme Development best practices. Each major feature has its own dedicated files, making the codebase easier to understand, maintain, and extend.

---

# 🎯 1. Tisso In The Wild Grid

An interactive image grid section featuring hotspot (+) buttons, product popups, Quick Add to Cart functionality, and bundle offers.

### Files

#### Main Section
- `sections/tisso-wild-grid.liquid`

#### Styles
- `assets/tisso-wild-grid.css`

#### JavaScript
- `assets/tisso-wild-grid.js`

#### Popup Snippet
- `snippets/tisso-wild-modal.liquid`

---

# 🎯 2. Custom Product Grid

A custom product grid with interactive product cards, Quick View, color swatches, size selector, and Add to Cart popup.

### Files

#### Main Section
- `sections/custom-grid.liquid`

#### Styles
- `assets/custom-grid.css`

#### JavaScript
- `assets/custom-grid.js`

#### Popup Snippet
- `snippets/custom-grid-modal.liquid`

---

# 🎯 3. Additional Custom Sections

### Gift Guide Hero
- `sections/gift-guide-hero.liquid`

### Tisso Illustrations Collage
- `sections/tisso-illustrations-collage.liquid`

---

# 💡 How to Modify Each Feature

### UI / Styling
To update layouts, colors, spacing, typography, or responsive styles, edit the corresponding CSS file inside the **assets** directory.

### JavaScript Logic
To modify interactions such as popups, Quick Add, AJAX requests, product selection, or other dynamic behaviors, edit the corresponding JavaScript file inside **assets**.

### Popup Markup
To update the HTML structure of the product popup or modal, edit the related Liquid snippet inside the **snippets** directory.

### Section Settings
To modify Shopify schema settings, layout structure, or section configuration, edit the corresponding Liquid file inside the **sections** directory.

---

# ✨ Key Features

- Pixel-perfect implementation based on the provided Figma design.
- Fully responsive layout.
- Dynamic product popups.
- AJAX Add to Cart functionality.
- Variant selection.
- Automatic bundle product addition.
- Modular Shopify sections.
- Reusable Liquid snippets.


# 📁 Project Structure

```
sections/
    tisso-wild-grid.liquid
    custom-grid.liquid
    gift-guide-hero.liquid
    tisso-illustrations-collage.liquid

snippets/
    tisso-wild-modal.liquid
    custom-grid-modal.liquid

assets/
    tisso-wild-grid.css
    tisso-wild-grid.js
    custom-grid.css
    custom-grid.js
```

---

# ✅ Development Notes

- Built following Shopify Theme Development best practices.
- Organized into reusable and maintainable components.
- Desktop and mobile layouts are handled independently where required.
- JavaScript and CSS are separated by feature.
- Popups are implemented as reusable Liquid snippets.
- Code has been optimized for readability, maintainability, and future scalability.
- The project is production-ready and suitable for deployment on Shopify.

---

# 🚀 Technologies Used

- Shopify Liquid
- HTML5
- CSS3
- Vanilla JavaScript (ES6)
- AJAX Cart API
- Responsive Design
- Shopify Theme Architecture