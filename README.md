# MagnaNest storefront

Product-first storefront for https://magnanest.pages.dev, refined 17 October 2026 with an Astra design review.

## Presentation

A single product gallery and purchase section replaces the separate lifestyle hero. DM Sans, warm white, charcoal and a small rust accent keep the layout restrained. Product name and starting price precede the photo on mobile. Supplied product views are the main presentation; high-resolution studio and detail views remain available in the gallery. No fabricated reviews, urgency, customer counts or product specifications are included.

Browsing promotions, optional cart upgrades, persistent selections, accessible photo zoom, reduced-motion support and the mobile purchase bar remain. Copy describes the shelf, compatibility and prices directly.

## Commerce

The existing public Stripe configuration is unchanged for quantities 1–12. Prices are USD. One shelf is $24.95 plus $2.99 shipping ($27.94); two are $42.42; three are $56.14. Shipping is free for 2+. Quantities above three retain the existing 25% subtotal discount. Upgrade prompts quote actual payable differences: $14.48 from one to two, and $13.72 from two to three.

Payment and supplier fulfillment are separate. Orders are manually fulfilled through the merchant's Stripe Dashboard and supplier arrangements. No secret keys belong in this static site.

## Cloudflare Pages

Build: `node scripts/build-cloudflare.mjs`
Output: `dist`
Git production branch: `main`

For dashboard uploads, choose **Pages** in Workers & Pages, then upload the prepared ZIP to the intended Pages project as a Production deployment. A Workers assets upload produces a workers.dev address; a Pages project produces a pages.dev address. If the desired Pages project exists, update it rather than creating another name.

See CLOUDFLARE.md for publishing guidance. Source files and local images work without a hosting-specific image CDN.

## Validation

The isolated review workflow builds dist, verifies the upload ZIP, runs Chromium at five viewport widths, checks gallery/zoom, dialog focus and inert handling, all 12 fixed Stripe destinations with navigation intercepted locally, prices/shipping, mobile layout and promotions. It stores screenshots and results on the review branch. No payment is made during these checks.

Image conversion tooling uses UPNG.js and jpeg-js; notices remain in IMAGE-TOOL-LICENSES.txt. Supplied images and AI-assisted inspection views do not establish supplier stock, dimensions, capacity or delivery performance. Check a physical sample before making those claims.
