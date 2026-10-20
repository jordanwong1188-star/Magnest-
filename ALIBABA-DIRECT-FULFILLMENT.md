# MagnaNest — Alibaba direct fulfillment (recommended launch workflow)

**Chosen model (20 October 2026):** Keep the existing `magnanest.pages.dev`
storefront and Stripe Payment Links. The current Alibaba supplier ships
individual orders directly to customers. Do **not** buy inventory or add a
CJdropshipping warehouse, Shopify checkout or another paid app to process
these orders.

**Status: guidance and webhook code are in a draft PR; not yet on the live site.**
The current store's Stripe-paid orders still require manual supplier fulfillment.

## Simple launch workflow, no new paid tools

1. Confirm with the Alibaba supplier **in writing** that they can supply
   and ship **one order at a time** to Canadian and US consumers. Confirm
   product matches the site photos, package contents, unit inventory,
   processing time, fully delivered cost for 1, 2 and 3 shelves (and
   whether 4–12 are supported), shipping service, carrier and tracking.
2. Purchase a physical sample to your own address and verify shelf dimensions,
   finish, magnet performance, packaging and transit time.
3. When Stripe reports a new payment, open the **Magnanest** Stripe account,
   confirm the Checkout Session is **paid**, and read the collected
   shipping name/address/email. Verify the shelf quantity by the
   corresponding existing MagnaNest Payment Link (never infer from dollars).
4. Create a distinct Alibaba supplier order for exactly that quantity
   using the customer's shipping address via your protected Alibaba account.
   Where eligible, negotiate the terms and pay using Alibaba Trade Assurance
   *on-platform*. Do **not** share card information, Stripe tokens or
   customer payment details with the supplier.
5. Log the Stripe Checkout Session ID and supplier order reference in a
   private spreadsheet or private order system. Never reorder an existing
   Stripe Session ID. If fulfillment costs or stock do not match expectations,
   resolve before committing to dispatch.
6. Ask the supplier for the **real carrier and trackable number** after
   shipping. Forward the carrier tracking to your customer from your
   business email; track late deliveries and resolve exceptions.
7. Follow your advertised 30-day guarantee, applicable consumer protections,
   and a documented replacement/refund agreement with the supplier.
   Your brand remains responsible for the customer.

At low volume, manual order placement is cheaper and safer than a custom
Alibaba automation unless your supplier provides a supported private API or
structured secure order feed and can demonstrate reliable stock and service.

## Supplier quote: copy into Alibaba supplier chat

Hello, I run MagnaNest, a small online store selling your magnetic refrigerator
shelf to customers in Canada and the United States. You mentioned that you can
ship each customer order individually. Before we start, could you confirm:

- Exact product, color, packaging and whether the shelf has any hooks/mesh;
  can you send a real video and ship one sample?
- Price for **1, 2 and 3 shelves** delivered to (a) Canada and (b) the US,
  including packaging, tracked shipping, and any expected duties/taxes/fees.
- Stock availability, handling time, realistic delivery range, and what
  happens if a package is delayed, lost or damaged.
- Can you ship without Alibaba invoices, another seller's branding, or
  promotional inserts? Can you provide carrier and tracking within 48 hours
  after dispatch?
- Can each purchase and its shipment be documented on Alibaba.com using
  Trade Assurance if available? What is the refund/replacement procedure?
- Which customer shipping details do you need, and how should I send them
  securely through Alibaba once I receive a paid order?

Please confirm the complete landed cost and your order process in writing.

## Existing Stripe prices to protect

- **1 shelf:** $24.95 item + $2.99 advertised shipping = $27.94 USD
  before separately applicable taxes.
- **2 shelves:** $42.42 USD delivered under the free-shipping promotion.
- **3 shelves:** $56.14 USD delivered under the free-shipping promotion.
- **4–12:** Existing Stripe Payment Links have fixed quantities; check each
  total in Stripe before promising a margin. Do not change current links
  as part of fulfillment setup.

Compute **contribution margin** separately for each country and bundle:

`sale proceeds (excluding collected remittable tax) − Stripe payment fees − supplier items − direct shipping − duties/fees you cover − replacement/refund allowance = expected contribution before marketing and overhead`

CJ could only be cheaper if its fully delivered quote beats your supplier's
quoted landed price **including** CJ product/3PL/handling/storage and any
integration costs. Do not assume advertised unit price equals landed price.

## Optional free-code upgrade: durable Stripe paid-order inbox

The draft PR includes a secure Cloudflare Pages Function and D1 table.
This logs verified Stripe paid orders for **manual Alibaba fulfillment**.
It does *not* submit, charge or dispatch supplier orders.

Deployment prerequisites:

1. Configure a D1 database `magnanest-orders`; run
   `migrations/0001_fulfillment_orders.sql`.
2. Add a D1 Pages binding named `ORDERS_DB` to the **existing** Pages
   project; confirm the Functions route is deployed through Git integration.
3. In the correct **Magnanest** Stripe account, add
   `https://magnanest.pages.dev/api/stripe-webhook` as a webhook endpoint
   for `checkout.session.completed` and
   `checkout.session.async_payment_succeeded`.
4. Add the endpoint's signing secret as a private Pages secret named
   `STRIPE_WEBHOOK_SECRET`. Never commit secrets.
5. Check GitHub Actions for the draft PR. Deploy only after the above
   bindings exist and a controlled test demonstrates the full end-to-end
   capture. Customers still buy through the same payment links.
6. Review open orders in the private D1 dashboard. Orders are initially
   `awaiting_supplier_order` or `needs_shipping_review`.
   The schema can record supplier order reference, carrier, tracking
   number/URL and states `supplier_ordered`, `shipped`, `delivered`.
   These manual status transitions are **not automated** by this PR.

Without the Cloudflare D1 setup, simply use the Stripe Dashboard and a
private order log. Do not merge an unconfigured production webhook.

## Security, privacy and customer promises

- Share with the supplier only the name, delivery address, contact details
  required for shipping and **quantity**. Do not share customer payment
  details or unrelated information.
- Review the site's privacy policy before sending customer shipping data
  to a third-party supplier (potentially overseas); describe fulfillment
  sharing and retention accurately, consistent with your obligations.
- Do not advertise a guaranteed delivery date until you have real
  fulfillment evidence. Verify return address and who pays replacement,
  customs and return shipping.
- Confirm supplier's tracking service can actually be viewed by a US or
  Canadian customer.
- Paid orders are your legal/customer-service responsibility regardless
  of whether Alibaba ships them.

## When to automate

First complete several clean paid-to-delivered orders with the existing
supplier. Only then consider automating supplier handoff using a *verified*
supplier-specific API or secure order intake. Keep manual approval until
duplicate-prevention, stock checks, shipping terms, notification, refunds
and tracking reconciliation are tested. CJ remains an optional alternative,
not a requirement.
