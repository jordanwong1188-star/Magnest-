# MagnaNest — Your counter. Cleared.

A complete storefront rebuild for https://magnanest.pages.dev, prepared 16 October 2026.

## What changed

- A clear ivory, moss and citrus visual system with Manrope typography and restrained Lora headline emphasis.
- Product and bundle selection immediately after the hero, plus lifestyle storytelling, compatibility guidance and useful FAQs.
- Five newly generated product images based on the original MagnaNest shelf, with native 1122 × 1402 pixel detail and portable 360/720/1122 JPEG versions. All 15 responsive files total about 1.7 MB. No Netlify-only image endpoints.
- A product zoom dialog, gentle scroll reveals, reduced-motion support, keyboard navigation, and larger readable mobile text.
- Existing browsing promotion and voluntary bundle upgrade, persistent shopping bag, cumulative quantities, mobile buy control and integer-cent prices retained.
- Static shipping/returns and privacy information accurately describe the current prelaunch status. No invented reviews, customer counts or scarcity claims.

## Publish to the existing Cloudflare Pages project

The folder containing `index.html` is already the finished website. No install or build command is required.

### Existing Direct Upload project

1. Download this branch ZIP and extract it.
2. Open https://dash.cloudflare.com, select Workers & Pages, then the existing `magnanest` Pages project.
3. Choose Create deployment and the production environment.
4. Upload the complete extracted folder containing `index.html`, `styles.css`, `app.js`, `checkout-config.js` and `assets/`.
5. Open the resulting deployment and check desktop/mobile images, all bundle selections, bag, zoom, promotions, policy links and the current ordering status.

### Existing Git-integrated project

Cloudflare does not offer dashboard drag-and-drop for existing Git-integrated Pages projects. Keep its Git connection and deploy this branch, or use an authenticated Wrangler CLI.

For this source tree, the production branch is `magnanest-store-redesign`, framework is None, build command can be `exit 0`, and the output directory is `.` (the folder containing `index.html`). The existing project must be configured to use the correct repository/branch. A GitHub source commit alone is not proof that Cloudflare has published it.

From the extracted folder, an authenticated CLI can deploy to the existing project:

```sh
npx wrangler pages deploy . --project-name magnanest
```

Confirm the project name against your Cloudflare dashboard before using the command. Do not delete the current project or change DNS just to upload these files.

Official guides:
- https://developers.cloudflare.com/pages/get-started/direct-upload/
- https://developers.cloudflare.com/pages/get-started/git-integration/
- https://developers.cloudflare.com/pages/framework-guides/deploy-anything/

Cloudflare account access is not connected in this chat; the rebuilt source is prepared for publishing, and live publication must be verified separately.

## Offers and checkout

All displayed prices are USD:
- 1 shelf: $24.95
- 2 shelves: $42.42, saving $7.48 versus two singles
- 3 shelves: $56.14, saving $18.71 versus three singles
- Free shipping on 2+ shelves
- For cart quantities above three, the existing 25% calculation is retained, capped at 12 shelves.

`checkout-config.js` remains intentionally unconfigured. The storefront truthfully states that online ordering is being prepared; it does not collect payments. Add verified HTTPS checkout URLs only after the provider applies the exact quantity, total, taxes and shipping offer. Every allowed cart quantity needs a matching checkout destination, or the cart limit must be changed consistently. Never put credentials or API keys in that public file.

Before enabling checkout:
- Connect payment/order management and supplier fulfillment.
- Approve the exact supplier shelf and test shipments to Canada and the US.
- Verify every advertised quantity and discount at payment and fulfillment.
- Confirm delivery estimates, import-charge responsibility, support contact, return address and full guarantee conditions.
- Replace the prelaunch shipping/returns and privacy wording with the actual operating terms, and update the “Can I order today?” FAQ.
- Test a real order, tracking notification and refund before paid advertising.

## Photography

Images were generated/edited with AI using the original product reference. They retain the same two-flat-rail shelf design but are not supplier sample verification. Obtain an actual sample and manufacturer-authorized photos before relying on dimensions or load-capacity claims. Props shown in lifestyle images are not included.

Original valid WebP images remain as fallbacks. PNG generation masters are omitted from this deployment to keep the upload light. JPEG conversion/downsampling uses UPNG.js and jpeg-js; notices are in `IMAGE-TOOL-LICENSES.txt`.

## Verification

UI/logic and HTML contract checks cover bundle totals, cart persistence, optional promotions, portable image candidates, zoom focus trapping, Escape, background inertness and reduced motion. Independent source review checks markup and style integration. Any automated browser results are recorded separately when GitHub Actions permissions allow the review workflow to run.
