# MagnaNest launch media & checkout handoff

## Store connections
- Shopify store: `q7tig2-se.myshopify.com` (trial)
- Draft Shopify product: `gid://shopify/Product/15416876269755`
- 1 shelf: variant ID `67662833746107` — CAD $24.95
- 2 shelves: variant ID `67662833778875` — CAD $42.42
- 3 shelves: variant ID `67662833811643` — CAD $56.14
- Shopify collection: `magnanest-essentials`
- Existing Netlify site: https://magnanest-store.netlify.app

## Launch gate — do not enable until all are true
1. Supplier identified and sampled; dimensions, materials, magnetic holding capacity, hardware and returns tested.
2. Supplier agrees to fulfil single customer orders and provides tracked Canada-bound shipping and shipping lead times.
3. Products and intended variants set to active and published to Online Store, with inventory/fulfilment rules configured.
4. Payments activated on a paid Shopify plan; taxes, chargebacks, customer support and domain verified.
5. Shipping profiles set for the offered regions. Do **not** advertise free shipping unless the rates actually implement it.
6. Returns and privacy policies reviewed for the applicable jurisdiction and activated.
7. Make a controlled checkout test, ensure confirmation and tracking expectations align.
8. Flip `SHOPIFY_CHECKOUT_READY` in `app.js` to `true` only after the above steps, then publish to Netlify.

## Prepared checkout links
The existing cart drawer prepares a link based on the selected 1-, 2- or 3-shelf bundle. A successful checkout opens Shopify's hosted checkout from its cart permalink. The checkout button remains disabled until `SHOPIFY_CHECKOUT_READY=true`.

## 15-second vertical social reel brief (InVideo / Higgsfield)
**Format:** 9:16, 1080x1920 or 720x1280. Warm cream, charcoal, sage. Bold condensed typography. Premium, minimal, calm.
**Important:** Use real product photography or verified demo footage for all shots implying product performance. If using generative video for decorative animations, label it concept visualization and do not depict fake weight capacity or outcomes.

**Scene 1 (0–3 s):** A cramped kitchen counter. On-screen hook: “Running out of kitchen space?”
**Scene 2 (3–6 s):** Show the *actual MagnaNest sample* attached to a tested magnetic fridge side panel. “Use the space you already have.”
**Scene 3 (6–10 s):** Show the real shelf with lightweight kitchen items, filmed safely. “No drilling. Less clutter.”
**Scene 4 (10–13 s):** Graphic showing 1 / 2 / 3-shelf bundles with CAD $24.95 / $42.42 / $56.14.
**Scene 5 (13–15 s):** “MagnaNest. Space that sticks.” CTA while in pre-launch: “Learn more” (not “Buy now”).

**Voiceover:** “Counter full? MagnaNest helps turn compatible magnetic fridge surfaces into useful storage—without drilling. Find room for the everyday things. MagnaNest. Space that sticks.”

**Caption:** “Small kitchen? Test your fridge with a magnet. MagnaNest is getting ready for launch. #smallkitchen #kitchenorganization #magnanest”

## Alternate video hooks
- “Your fridge has unused space.”
- “A small-space kitchen idea worth trying.”
- “Before adding another cabinet, check your fridge.”
- “3 things to check before buying magnetic kitchen storage.”
- “Where would you add extra storage in your kitchen?”
- “Counter clutter? Think vertical.”

## Trust checklist
Do not claim that generated footage is a real customer testimonial or a genuine product performance test. Do not invent product load ratings, delivery times, reviews, return guarantees, or savings that are not implemented in checkout.

## Shopify status
- Product and three bundle variants saved as drafts
- Collection and product photos uploaded
- About, setup, FAQ and contact pages published
- Shipping and returns pages drafted but not published
- Navigation menus updated
- Compatibility article published in the News blog
- Static 13-second pre-launch video created separately; trial Shopify account blocked MP4 upload
- Orders, customers, analytics, payments and fulfilment require real data/owner setup
