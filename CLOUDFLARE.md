# MagnaNest on Cloudflare Pages

Target: https://magnanest.pages.dev
Repository: jordanwong1188-star/Magnest-
Production branch: main
Build command: `node scripts/build-cloudflare.mjs`
Publish directory: `dist`
No package installation or secret keys are needed to build the static site.

The build copies the complete storefront, local responsive JPEGs, fallback WebPs and policy pages. It preserves no-store caching for the public checkout configuration and generates the sitemap for CF_PAGES_URL.

Existing Stripe checkout links for quantities 1–12 are preserved from the current production source. Payments remain USD, with shipping to Canada and the USA. One shelf is $24.95 plus $2.99 shipping; 2 shelves are $42.42 and 3 are $56.14 with free shipping. Above 3, the existing 25% subtotal calculation remains. Quantities cannot be changed inside Stripe.

Stripe API verification on 16 October 2026 confirmed all 12 configured links are active, USD-priced, collect CA/US shipping addresses, have fixed quantities and match the storefront totals. The Magnanest account reported charges and payouts enabled. No payment or account configuration was changed.

Orders are manually fulfilled through the merchant's Stripe Dashboard and supplier arrangements. This rebuild does not automate supplier orders or treat a browser return as proof of payment. Future webhook fulfillment must validate signatures and handle duplicate/payment-pending events.

Before paid advertising, confirm supplier delivery performance, support email, return arrangements and the exact physical sample. The AI-assisted product photography is not a supplier sample or load-capacity certification.
