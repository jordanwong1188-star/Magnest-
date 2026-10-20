import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { onRequestPost, verifyStripeSignature } from '../functions/api/stripe-webhook.js';

const secret = 'whsec_example_not_real';
const validEvent = () => ({
  id: 'evt_123', livemode: true, type: 'checkout.session.completed',
  data: { object: {
    id: 'cs_live_MagnaNest01', object: 'checkout.session', mode: 'payment',
    status: 'complete', payment_status: 'paid', livemode: true,
    currency: 'usd', amount_total: 5614,
    payment_link: 'plink_1UQbgVB9mDibMqy4741FbSA6',
    customer_details: { email: 'buyer@example.test', name: 'Buyer Example' },
    collected_information: { shipping_details: {
      name: 'Buyer Example', address: {
        line1: '1 Main St', city: 'Vancouver', state: 'BC', postal_code: 'V6A 1A1', country: 'CA'
      }
    } }
  } }
});
function header(body, time = Math.floor(Date.now() / 1000)) {
  const hmac = createHmac('sha256', secret).update(time + '.' + body).digest('hex');
  return `t=${time},v1=${hmac}`;
}
function db() {
  const recorded = new Map();
  return {
    recorded,
    prepare(sql) {
      assert.match(sql, /INSERT OR IGNORE INTO fulfillment_orders/);
      return { bind(...args) {
        return { async run() {
          if (!recorded.has(args[0])) recorded.set(args[0], args);
          return { success: true };
        } };
      } };
    }
  };
}
async function request(event, database, secretOverride = secret) {
  const body = JSON.stringify(event);
  return onRequestPost({
    request: new Request('https://magnanest.pages.dev/api/stripe-webhook', {
      method: 'POST', headers: { 'Stripe-Signature': header(body) }, body
    }),
    env: { ORDERS_DB: database, STRIPE_WEBHOOK_SECRET: secretOverride }
  });
}

test('accepts an authentic Stripe signature and rejects an expired one', async () => {
  const body = JSON.stringify(validEvent());
  assert.equal(await verifyStripeSignature(body, header(body), secret), true);
  assert.equal(await verifyStripeSignature(body, header(body, 1234), secret), false);
  assert.equal(await verifyStripeSignature(body + 'tampered', header(body), secret), false);
});

test('records confirmed paid shelf quantities exactly once', async () => {
  const database = db();
  assert.equal((await request(validEvent(), database)).status, 200);
  assert.equal((await request(validEvent(), database)).status, 200);
  assert.equal(database.recorded.size, 1);
  const saved = database.recorded.values().next().value;
  assert.equal(saved[3], 3);
  assert.equal(saved[10], 'awaiting_supplier_order');
  assert.equal(JSON.parse(saved[9]).country, 'CA');
});

test('ignores another Payment Link and unpaid checkout', async () => {
  const database = db();
  const unknown = validEvent();
  unknown.data.object.payment_link = 'plink_someone_else';
  await request(unknown, database);
  const unpaid = validEvent();
  unpaid.data.object.payment_status = 'unpaid';
  await request(unpaid, database);
  assert.equal(database.recorded.size, 0);
});

test('records missing address for review instead of pretending it can ship', async () => {
  const database = db();
  const missing = validEvent();
  missing.data.object.collected_information.shipping_details = null;
  assert.equal((await request(missing, database)).status, 200);
  assert.equal(database.recorded.values().next().value[10], 'needs_shipping_review');
});

test('fails closed when configuration or signature is invalid', async () => {
  const database = db();
  const evt = validEvent();
  assert.equal((await request(evt, database, 'wrong_secret')).status, 400);
  const body = JSON.stringify(evt);
  const response = await onRequestPost({
    request: new Request('https://magnanest.pages.dev/api/stripe-webhook', { method: 'POST', body }),
    env: { STRIPE_WEBHOOK_SECRET: secret, ORDERS_DB: database }
  });
  assert.equal(response.status, 400);
  assert.equal(database.recorded.size, 0);
  assert.equal((await onRequestPost({
    request: new Request('https://magnanest.pages.dev/api/stripe-webhook',
      { method: 'POST', body, headers: { 'Stripe-Signature': header(body) } }),
    env: { STRIPE_WEBHOOK_SECRET: secret }
  })).status, 503);
});
