# MagnaNest

A product-focused static storefront for the MagnaNest Magnetic Refrigerator Storage Shelf.

## Current offers

- 1 shelf: $24.95
- 2 shelves: $42.42 (15% savings; $7.48 less than two singles)
- 3 shelves: $56.14 (25% savings; $18.71 less than three singles)
- Free shipping on 2+ shelves
- The existing 30-day guarantee remains in the page.

## Website

HTML, CSS and vanilla JavaScript, with no build step. Publish the repository root on Netlify.

The redesign puts the product and bundle selection directly after the hero. It retains the browsing promotion and optional post-add bundle promotion, adds persistent cart state, and improves keyboard use and mobile buying controls.

## Payments

Real checkout is intentionally unavailable until payment and fulfillment are connected. The storefront displays that status. No card information is collected by this site.

Fill the public URLs in `checkout-config.js` only after verifying that each destination contains the exact quantity, price, taxes and shipping offer shown here. Never put API keys or credentials in this public file. Prices and offers must be applied by the checkout provider; this static page cannot enforce them.

## Existing Netlify project

Site: https://magnanest-store.netlify.app
Project ID: a387f3eb-6fa6-46de-a54e-792d352a2f1d

The currently live deployment was uploaded directly; editing this repository alone does not publish changes to it.

To deploy the redesigned files without changing the existing project:

1. Download this branch's source ZIP from GitHub and extract it.
2. In the existing Netlify project's Deploys page, upload the extracted folder that contains `index.html` (including `styles.css`, `app.js`, `checkout-config.js`, and `assets/`).
3. Verify the product gallery, bundle selection, bag, browsing promotion and optional upgrade on mobile and desktop.
4. Connect checkout and verify a real end-to-end order before sending purchase traffic.

Alternatively, with an authenticated Netlify CLI, run from the extracted repository root:

```sh
npx netlify deploy --site a387f3eb-6fa6-46de-a54e-792d352a2f1d --dir .
```

Review the returned preview, then publish to the same project:

```sh
npx netlify deploy --prod --site a387f3eb-6fa6-46de-a54e-792d352a2f1d --dir .
```
