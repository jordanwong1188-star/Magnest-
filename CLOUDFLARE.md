# Publish MagnaNest on Cloudflare Pages

Intended address: https://magnanest.pages.dev
Repository: jordanwong1188-star/Magnest-
Build command: `node scripts/build-cloudflare.mjs`
Output directory: `dist`
Production branch for Git integration: `main`

No package installation or secret keys are required to build the static storefront.

## Upload the prepared ZIP

In Workers & Pages, select the intended **Pages** project. Choose **Create a new deployment**, select **Production**, upload the prepared ZIP and choose **Save and Deploy**.

If creating a Pages project, use the Pages/Get started flow before uploading. Cloudflare Workers asset uploads produce workers.dev URLs. To obtain magnanest.pages.dev, the Pages project must receive the name magnanest without an added suffix. Availability is determined by Cloudflare. Preserve an existing project that already owns the desired address and update its deployment.

Dashboard upload accepts the ZIP with index.html at its root. Git-connected Pages projects use their existing Git integration or authenticated Wrangler deployment; dashboard drag-and-drop is for Direct Upload projects.

Official guides:
- https://developers.cloudflare.com/pages/get-started/direct-upload/
- https://developers.cloudflare.com/pages/get-started/git-integration/

## Store behavior

The build includes local product images, all storefront scripts, policy pages, a 404 page, robots.txt, sitemap.xml and no-store caching for the public checkout configuration.

Existing Stripe links for quantities 1–12 remain unchanged. Prices are USD and shipping addresses are Canada/USA. One shelf is $24.95 plus $2.99 shipping; two are $42.42 and three are $56.14 with free shipping. Above three, the existing 25% subtotal calculation remains. Stripe quantities are fixed.

The earlier Stripe API verification on 16 October 2026 confirmed all 12 configured links were active and matched the storefront totals. Charges and payouts were enabled. This visual refinement changes no payment or account settings.

Orders and supplier fulfillment remain manual. Confirm the support email, return arrangements, supplier performance and the physical product before paid advertising.
