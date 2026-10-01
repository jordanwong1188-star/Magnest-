// Add the checkout URL for each offer after connecting payment and fulfillment.
// Each URL must point to a checkout containing the exact shelf quantity and
// the matching total: 1 = USD 24.95; 2 = USD 42.42; 3 = USD 56.14.
// Keep URLs empty until the checkout applies these prices and shipping offers.
// Never place API tokens or other credentials in this public file.
window.MAGNANEST_CHECKOUT = {
  currency: 'USD',
  urls: { 1: '', 2: '', 3: '' }
};
