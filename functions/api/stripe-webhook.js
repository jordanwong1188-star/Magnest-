// MagnaNest's existing live Stripe Payment Links, verified October 20, 2026.
// Do not guess quantity from the charged price: shipping, tax and discounts can vary.
const LINK_QUANTITIES = Object.freeze({
  plink_1UQbgSB9mDibMqy4VNA1LK66: 1,
  plink_1UQbgUB9mDibMqy4w6HgTGJP: 2,
  plink_1UQbgVB9mDibMqy4741FbSA6: 3,
  plink_1UQbgWB9mDibMqy4bRNFQkBc: 4,
  plink_1UQbgWB9mDibMqy4C9msE7H6: 5,
  plink_1UQbgXB9mDibMqy403flENCh: 6,
  plink_1UQbgYB9mDibMqy4Jfa2xm6c: 7,
  plink_1UQbgZB9mDibMqy4SpgmxSZM: 8,
  plink_1UQbgaB9mDibMqy4rn9f5kLz: 9,
  plink_1UQbgbB9mDibMqy4RGb17rc1: 10,
  plink_1UQbgcB9mDibMqy4XcpuETAl: 11,
  plink_1UQbgdB9mDibMqy4W0yVjqfC: 12,
});

const decoder = new TextEncoder();
const JSON_HEADERS = { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' };
const reply = (message, status = 200) => new Response(message, { status, headers: JSON_HEADERS });

export async function verifyStripeSignature(body, signatureHeader, signingSecret, nowMs = Date.now()) {
  if (typeof body !== 'string' || !signatureHeader || !signingSecret) return false;
  const fields = signatureHeader.split(',').map(s => s.trim());
  const tField = fields.find(s => s.startsWith('t='));
  const timestamp = tField && Number(tField.slice(2));
  const signatures = fields.filter(s => /^v1=[a-f0-9]{64}$/i.test(s)).map(s => s.slice(3).toLowerCase());
  if (!Number.isSafeInteger(timestamp) || timestamp <= 0 || !signatures.length) return false;
  if (Math.abs(nowMs / 1000 - timestamp) > 300) return false;
  const key = await crypto.subtle.importKey(
    'raw', decoder.encode(signingSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, decoder.encode(timestamp + '.' + body)));
  const expected = Array.from(mac, b => b.toString(16).padStart(2, '0')).join('');
  // Fixed-length comparison rather than short-circuiting on the first mismatch.
  return signatures.some(signature => {
    let difference = 0;
    for (let i = 0; i < 64; i++) difference |= signature.charCodeAt(i) ^ expected.charCodeAt(i);
    return difference === 0;
  });
}

export async function onRequestPost({ request, env }) {
  // A missing D1 binding or webhook secret must NOT acknowledge paid orders.
  if (!env.ORDERS_DB || !env.STRIPE_WEBHOOK_SECRET) return reply('Fulfillment inbox is not configured', 503);
  if (!request.headers.get('Stripe-Signature')) return reply('Missing signature', 400);
  const raw = await request.text();
  if (raw.length > 1024 * 1024) return reply('Payload too large', 413);

  let valid;
  try {
    valid = await verifyStripeSignature(raw, request.headers.get('Stripe-Signature'), env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return reply('Signature verification failed', 400);
  }
  if (!valid) return reply('Invalid signature', 400);

  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    return reply('Invalid JSON', 400);
  }

  if (!['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type)) {
    return reply('ignored');
  }
  const session = event.data?.object;
  const linkId = typeof session?.payment_link === 'string' ? session.payment_link : session?.payment_link?.id;
  if (!session || session.object !== 'checkout.session' || typeof session.id !== 'string' ||
      session.mode !== 'payment' || session.payment_status !== 'paid' || session.status !== 'complete' ||
      session.livemode !== true || event.livemode !== true || session.currency?.toLowerCase() !== 'usd' ||
      !Object.hasOwn(LINK_QUANTITIES, linkId)) {
    // Unknown Payment Links, incomplete/unpaid sessions and test events aren't order-ready.
    return reply('ignored');
  }

  const shipping = session.collected_information?.shipping_details ?? session.shipping_details;
  const address = shipping?.address ?? null;
  const customer = session.customer_details ?? {};
  const country = typeof address?.country === 'string' ? address.country.toUpperCase() : '';
  const name = shipping?.name || customer.name || null;
  const canShip = Boolean(
    name && address?.line1 && address?.city && address?.postal_code &&
    (country === 'CA' || country === 'US')
  );

  try {
    await env.ORDERS_DB.prepare(
      `INSERT OR IGNORE INTO fulfillment_orders
        (session_id, stripe_event_id, payment_link_id, shelf_quantity, amount_total, currency,
         email, shipping_name, shipping_phone, shipping_address_json, fulfillment_state)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      session.id,
      typeof event.id === 'string' ? event.id : 'missing_event_id',
      linkId,
      LINK_QUANTITIES[linkId],
      Number.isInteger(session.amount_total) ? session.amount_total : null,
      'usd',
      customer.email || session.customer_email || null,
      name,
      shipping?.phone || customer.phone || null,
      address ? JSON.stringify(address) : null,
      canShip ? 'awaiting_supplier_configuration' : 'needs_shipping_review'
    ).run();
  } catch {
    // Stripe will retry. Never respond 2xx if the paid order was not persisted.
    return reply('Temporary order storage failure', 503);
  }

  // Intentional safety gate: NO CJ charge, dispatch or automatic order creation here.
  // First confirm Alibaba stock transfer vs CJ catalog sourcing and the verified SKU.
  return reply('ok');
}
