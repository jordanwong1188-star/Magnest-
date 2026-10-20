# CJdropshipping — optional alternative (not the chosen MagnaNest workflow)

**Current decision (20 October 2026):** The existing Alibaba supplier already
ships MagnaNest orders directly to customers. Direct Alibaba fulfillment is
the first choice for minimizing new platform fees and inventory costs.

See **[ALIBABA-DIRECT-FULFILLMENT.md](ALIBABA-DIRECT-FULFILLMENT.md)** for the
chosen paid-order, supplier-order, tracking and privacy workflow.

CJ is NOT authorized to fulfill orders on the existing
`https://magnanest.pages.dev` site. The separate Shopify account's CJ
authorization does not connect Stripe-paid orders to CJ.

## If switching to CJ later

1. Get a fully landed quote from CJ **including shipping**, and compare
   against the Alibaba supplier's confirmed per-order delivered costs.
2. Choose one: CJ sourcing from its catalog; or your Alibaba supplier
   sends pre-purchased stock to CJ's 3PL/private-inventory warehouse.
3. Confirm the exact black MagnaNest shelf, test a sample, verify
   stock, supply model, bundle quantity mapping (1–12), destination coverage,
   processing time, tracking, customer returns and CJ payment requirements.
4. Implement CJ's correct, authenticated API on a secure Cloudflare
   backend; never put the CJ token in browser JavaScript.
5. Test duplicate prevention, order creation, funds, dispatch and tracking
   before switching on any automatic fulfillment.

The draft `functions/api/stripe-webhook.js` currently **only records paid
orders** in private Cloudflare D1 for manual handling. It does not call CJ
or the Alibaba supplier. No supplier charges are triggered.
