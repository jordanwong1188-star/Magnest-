# MagnaNest: Stripe order inbox and CJ handoff

**Status: code prepared, not active.** This branch leaves the existing customer website,
Stripe Payment Links, prices and bundles unchanged. It DOES NOT send orders to CJ.
Do not claim CJ fulfillment is connected until all checks in the final section pass.

## How an order travels

1. Customer shops at `https://magnanest.pages.dev` and pays via the existing Stripe Payment Link.
2. Stripe sends `checkout.session.completed` or `checkout.session.async_payment_succeeded` to `/api/stripe-webhook`.
3. A Cloudflare Pages Function validates the signature, ensures the payment is **paid and live**, verifies that it is one of the 12 known MagnaNest Payment Links, and stores the order in Cloudflare D1.
4. Repeated webhook deliveries with the same Checkout Session ID do not create duplicate orders.
5. Orders stay in `awaiting_supplier_configuration` or `needs_shipping_review` until you confirm the Alibaba/CJ stock relationship. Nothing is automatically charged or dispatched.

## Required Cloudflare configuration (before production testing)

The site is Git-deployed Cloudflare Pages (`magnanest.pages.dev`) from
`jordanwong1188-star/Magnest-`, production branch `main`, build
`node scripts/build-cloudflare.mjs`, output `dist`.
Cloudflare Pages Functions come from the **repository-root** `functions/`
directory, NOT the `dist/` directory. Dashboard ZIP Direct Upload does not
support Pages Functions; use Git integration or Wrangler.

1. Cloudflare dashboard → **D1** → Create database named `magnanest-orders`.
2. In that database's SQL console, execute `migrations/0001_fulfillment_orders.sql`.
3. Cloudflare → Workers & Pages → your existing **magnanest Pages project** →
   Settings → Bindings / Functions bindings → D1 database → binding name
   **`ORDERS_DB`**, database `magnanest-orders` (Production; configure Preview separately if needed).
4. Stripe dashboard → switch to the verified **Magnanest** live account
   (NOT the separate Calvren account) → Developers → Webhooks / Event destinations →
   add endpoint `https://magnanest.pages.dev/api/stripe-webhook`.
   Subscribe to **`checkout.session.completed`** and
   **`checkout.session.async_payment_succeeded`**.
   Copy the endpoint-specific `whsec_...` signing secret.
5. Cloudflare Pages → Settings → Variables and Secrets → add a **secret**, key
   `STRIPE_WEBHOOK_SECRET`, value copied from that exact Stripe endpoint.
   Do not paste secrets into GitHub, checkout-config.js, browser JavaScript or this chat.
6. Review this PR, then merge to main only after settings are ready.
   Git integration must build and publish both `dist` and the Pages Function.
7. In Stripe check **Webhook deliveries** are successful (HTTP 200) and run:
   `SELECT session_id, shelf_quantity, fulfillment_state, created_at FROM fulfillment_orders ORDER BY created_at DESC LIMIT 10;`
   in your D1 console after a real paid order.
   Test-mode webhooks deliberately do not create records in this live-only inbox.
   Local signed-event unit tests are available below.

If the webhook fails to store an order (e.g., missing D1 binding), it returns
503 so Stripe retries. This is why you must configure D1 and the secret **before**
relying on the endpoint. Existing Payment Link checkout still functions independently.

## Alibaba supplier + CJ: choose one fulfillment model

- **Alibaba ships each order directly:** you can fulfill from the supplier
  manually (or build a separate direct supplier integration). CJ is optional.
- **Alibaba sends stock to CJ's warehouse:** arrange CJ **3PL / private inventory**,
  establish CJ product IDs, available physical inventory, warehouse and shipping methods.
  CJ's private-inventory order API has a different flow from its standard
  dropshipping order API. Do not use unverified public-product SKUs for this stock.
- **CJ sources a matching shelf instead:** compare samples and total shipping cost.
  After CJ verifies the product, collect the CJ variant ID, logistics options,
  warehouse/origin, and API access; then integrate CJ's standard order API.

No CJ orders should be created or paid until the **exact shelf**, bundle quantity,
destination, shipping fee, stock, returns handling and funding arrangement are verified.
CJ will normally require its own payment/warehouse balance or billing; receiving
a Stripe payment does not automatically pay CJ.

The connected Shopify store `q7tig2-se` is a separate sales channel.
Authorizing it in CJ does **not** transmit payments from the custom Stripe website
or make Stripe-paid orders appear as Shopify orders.

## Technical / security notes

- Payment Link ID determines shelf quantity (1–12), rather than guessing from charged price.
- Checkout Session ID is the database primary key, preventing retries from duplicating orders.
- The signed raw body is verified with HMAC-SHA256 and a 5-minute timestamp tolerance.
- Only paid, completed, live USD Stripe Checkout Sessions from whitelisted MagnaNest links are stored.
- Shipping fields are private personal data in D1; restrict access, decide retention,
  and handle personal information under the store privacy policy.
- Orders missing usable US/Canada shipping addresses require manual review.
- `_routes.json` ensures the existing static website does not run server code on
  every visitor's request.
- Tests: `node --test tests/stripe-webhook.test.mjs`.
- Build check: `node scripts/build-cloudflare.mjs`.
- No CJ API credentials or Stripe secret keys are stored in this repository.

## Next development step

Once CJ confirms the chosen fulfillment model, add an authenticated,
idempotent server-only handoff from D1 to the **correct CJ order API**.
Validate inventory, address, selected logistics and costs. Begin with a
manual approval mode, then optionally enable automatic paid-order processing.
Implement a safe tracking / exception reconciliation workflow before scaling.
