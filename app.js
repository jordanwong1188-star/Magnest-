(() => {
  'use strict';

  const $ = selector => document.querySelector(selector);
  const $$ = selector => Array.from(document.querySelectorAll(selector));
  const UNIT_CENTS = 2495;
  const MAX_QTY = 12;
  const CART_KEY = 'magnanest.cart.v2';
  const SELECTION_KEY = 'magnanest.selection.v2';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobileQuery = window.matchMedia('(max-width: 700px)');
  const memorySession = new Set();
  const cart = $('#cartDrawer');
  const overlay = $('#overlay');
  const offer = $('#offerModal');
  const promo = $('#promoToast');
  const mobileBuy = $('.mobile-buy');
  const purchaseButton = $('#addToCart');
  const hero = $('.hero');
  let cartIsOpen = false;
  let cartReturnFocus = null;
  let offerReturnFocus = null;
  let offerTimer = null;
  let cartRevision = 0;
  let promoReady = false;
  let purchaseInView = false;
  let galleryRevision = 0;
  const backgroundState = new Map();
  let persistenceAvailable = true;

  const money = cents => '$' + (cents / 100).toFixed(2);
  const text = (selector, value) => {
    const element = $(selector);
    if (element) element.textContent = value;
  };
  const listen = (selector, event, handler) => {
    const element = $(selector);
    if (element) element.addEventListener(event, handler);
  };
  const validQuantity = (value, minimum, maximum) =>
    Number.isInteger(value) && value >= minimum && value <= maximum;
  const readQuantity = (key, fallback, minimum, maximum) => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return fallback;
      const value = JSON.parse(raw);
      return validQuantity(value, minimum, maximum) ? value : fallback;
    } catch {
      persistenceAvailable = false;
      return fallback;
    }
  };
  const persistQuantity = (key, value) => {
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { persistenceAvailable = false; }
  };
  const sessionSeen = key => {
    if (memorySession.has(key)) return true;
    try { return window.sessionStorage.getItem(key) === '1'; } catch { return false; }
  };
  const markSessionSeen = key => {
    memorySession.add(key);
    try { window.sessionStorage.setItem(key, '1'); } catch {}
  };

  let selected = readQuantity(SELECTION_KEY, 1, 1, 3);
  let cartQty = readQuantity(CART_KEY, 0, 0, MAX_QTY);

  function cartPrice(quantity) {
    if (!validQuantity(quantity, 0, MAX_QTY)) return 0;
    if (quantity === 0) return 0;
    if (quantity === 1) return UNIT_CENTS;
    if (quantity === 2) return 4242;
    return Math.round(quantity * UNIT_CENTS * 0.75);
  }

  function checkoutUrl(quantity) {
    if (!validQuantity(quantity, 1, MAX_QTY)) return null;
    const config = window.MAGNANEST_CHECKOUT;
    if (!config || config.currency !== 'USD' || !config.urls ||
        !Object.prototype.hasOwnProperty.call(config.urls, String(quantity))) return null;
    const value = config.urls[quantity];
    if (typeof value !== 'string' || !value.trim()) return null;
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:' || url.hostname !== 'buy.stripe.com' || url.port || url.username || url.password) return null;
      return url.href;
    } catch {
      return null;
    }
  }

  function checkoutQuantities() {
    return Array.from({ length: MAX_QTY }, (_, index) => index + 1)
      .filter(quantity => checkoutUrl(quantity));
  }

  function checkoutQuantityDescription(quantities) {
    const labels = quantities.map(quantity => quantity + (quantity === 1 ? ' shelf' : ' shelves'));
    if (labels.length < 2) return labels[0] || '';
    return labels.slice(0, -1).join(', ') + ' or ' + labels[labels.length - 1];
  }

  function renderCheckout() {
    const enabled = Boolean(cartQty > 0 && checkoutUrl(cartQty));
    const button = $('#checkoutButton');
    if (button) {
      button.disabled = !enabled;
      button.setAttribute('aria-disabled', String(!enabled));
    }
    const stripeCredit = $('#stripeCredit');
    if (stripeCredit) stripeCredit.hidden = !enabled;
    const availableQuantities = checkoutQuantities();
    const available = availableQuantities.length > 0;
    text('#checkoutStatus', enabled
      ? 'Secure Stripe checkout. Ships to Canada and the USA. Prices in USD.'
      : available
        ? 'Please choose ' + checkoutQuantityDescription(availableQuantities) + ' to continue to checkout.'
        : persistenceAvailable
          ? 'Online ordering opens soon. Your selection is saved on this device.'
          : 'Online ordering opens soon. Your selection is kept for this visit.');
    text('#productAvailability', available
      ? 'Choose your setup. Prices in USD. Shipping to Canada and the USA.'
      : persistenceAvailable
        ? 'Online ordering opens soon. You can explore bundles and save your selection on this device.'
        : 'Online ordering opens soon. You can explore bundles during this visit.');
  }

  function chooseBundle(quantity) {
    if (!validQuantity(quantity, 1, 3)) return;
    selected = quantity;
    persistQuantity(SELECTION_KEY, selected);
    $$('.bundle').forEach(button => {
      const active = Number(button.dataset.qty) === selected;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    const price = money(cartPrice(selected));
    text('#buttonPrice', price);
    text('#mobilePrice', price);
    text('#selectionSummary', selected + (selected === 1 ? ' shelf' : ' shelves') + ' · ' + price +
      (selected === 1 ? ' total' : ' total · save ' + money(selected * UNIT_CENTS - cartPrice(selected))));
  }

  function renderUpsell() {
    const card = $('#cartUpsell');
    const button = $('#upsellButton');
    if (!card) return;
    card.hidden = cartQty === 0;
    card.classList.toggle('unlocked', cartQty >= 3);
    if (cartQty === 1 || cartQty === 2) {
      const target = cartQty + 1;
      const extra = money(cartPrice(target) - cartPrice(cartQty));
      const percentage = target === 2 ? '15%' : '25%';
      text('#upsellTitle', target === 2 ? 'Make it a pair.' : 'Complete your setup.');
      text('#upsellCopy', 'Add one more shelf for ' + extra + ' more. Your ' + target +
        '-shelf total is ' + money(cartPrice(target)) + ', with ' + percentage +
        ' bundle savings and free shipping.');
      if (button) {
        button.hidden = false;
        button.dataset.target = String(target);
        button.textContent = 'Add one shelf · +' + extra;
      }
    } else {
      text('#upsellTitle', 'Best-value pricing unlocked');
      text('#upsellCopy', 'Your cart includes 25% bundle savings and free shipping.');
      if (button) button.hidden = true;
    }
  }

  function renderCart() {
    const hasItems = cartQty > 0;
    const empty = $('#cartEmpty');
    const filled = $('#cartFilled');
    if (empty) empty.hidden = hasItems;
    if (filled) filled.hidden = !hasItems;
    text('#cartCount', String(cartQty));
    const cartOpenButton = $('#cartOpen');
    if (cartOpenButton) cartOpenButton.setAttribute('aria-label',
      'Open cart, ' + cartQty + (cartQty === 1 ? ' shelf' : ' shelves'));
    const price = cartPrice(cartQty);
    const saved = cartQty * UNIT_CENTS - price;
    text('#cartQty', String(cartQty));
    text('#itemPrice', money(price));
    text('#subtotal', money(price));
    const shipping = cartQty === 1 ? Math.round(price * 0.12) : 0;
    text('#shippingLabel', cartQty === 1 ? 'Shipping (12%)' : 'Shipping');
    text('#shippingCost', shipping ? money(shipping) : 'Free');
    text('#orderTotal', money(price + shipping));
    text('#cartBundleLabel', cartQty + (cartQty === 1 ? ' Shelf' : ' Shelves'));
    text('#cartUnitPrice', cartQty ? money(Math.round(price / cartQty)) + ' per shelf' : '');
    const progress = $('#progress');
    if (progress) progress.style.width = cartQty >= 2 ? '100%' : cartQty === 1 ? '50%' : '0%';
    text('#shipMessage', cartQty >= 2 ? 'Free shipping included with 2+ shelves.'
      : 'Add one more shelf for free shipping.');
    const savings = $('#cartSavings');
    if (savings) savings.hidden = saved <= 0;
    text('#savingsValue', '−' + money(Math.max(0, saved)));
    const minus = $('#minus');
    const plus = $('#plus');
    if (minus) minus.disabled = cartQty === 0;
    if (plus) plus.disabled = cartQty >= MAX_QTY;
    renderUpsell();
    renderCheckout();
  }

  function cancelPendingOffer() {
    if (offerTimer !== null) window.clearTimeout(offerTimer);
    offerTimer = null;
  }

  function setCartQuantity(quantity) {
    if (!validQuantity(quantity, 0, MAX_QTY)) return false;
    cancelPendingOffer();
    cartRevision += 1;
    cartQty = quantity;
    persistQuantity(CART_KEY, cartQty);
    renderCart();
    if (cartIsOpen && !(offer && !offer.hidden) && !canFocus(document.activeElement)) focusFirst(cart);
    return true;
  }

  function visibleDialog() {
    if (offer && !offer.hidden) return offer;
    return cartIsOpen && cart && !cart.hidden ? cart : null;
  }

  function canFocus(element) {
    return element && element.isConnected && !element.disabled &&
      !element.closest('[hidden], [inert]') && element.getClientRects().length > 0;
  }

  function focusableElements(dialog) {
    return Array.from(dialog.querySelectorAll(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), ' +
      'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(canFocus);
  }

  function focusFirst(dialog) {
    if (!dialog) return;
    const first = focusableElements(dialog)[0];
    (first || dialog).focus({ preventScroll: true });
  }

  function setBackgroundInert(inert) {
    const elements = [ $('main'), $('.site-header'), $('footer'), mobileBuy ];
    elements.filter(Boolean).forEach(element => {
      if (inert) {
        if (!backgroundState.has(element)) backgroundState.set(element, element.hasAttribute('inert'));
        element.inert = true;
        element.setAttribute('inert', '');
      } else {
        const wasInert = backgroundState.get(element) === true;
        element.inert = wasInert;
        if (!wasInert) element.removeAttribute('inert');
      }
    });
    if (!inert) backgroundState.clear();
  }

  function updateMobileBuy() {
    if (!mobileBuy) return;
    const heroPassed = !hero || hero.getBoundingClientRect().bottom <= 0;
    mobileBuy.hidden = !mobileQuery.matches || !heroPassed || purchaseInView ||
      cartIsOpen || Boolean(offer && !offer.hidden) || Boolean(promo && !promo.hidden);
    mobileBuy.classList.toggle('is-visible', !mobileBuy.hidden);
  }

  function hidePromo() {
    if (promo) promo.hidden = true;
    updateMobileBuy();
  }

  function showPromoToast() {
    if (!promoReady || !promo || cartIsOpen || (offer && !offer.hidden) ||
        sessionSeen('mnPromoSeen')) return;
    markSessionSeen('mnPromoSeen');
    promo.hidden = false;
    updateMobileBuy();
  }

  function openCart() {
    if (!cart) return;
    if (!cartIsOpen) cartReturnFocus = document.activeElement;
    cartIsOpen = true;
    renderCart();
    hidePromo();
    setBackgroundInert(true);
    document.body.classList.add('cart-open');
    cart.hidden = false;
    cart.inert = false;
    cart.removeAttribute('inert');
    cart.setAttribute('aria-hidden', 'false');
    cart.setAttribute('aria-modal', 'true');
    cart.classList.add('open');
    if (overlay) overlay.hidden = false;
    const cartOpenButton = $('#cartOpen');
    if (cartOpenButton) cartOpenButton.setAttribute('aria-expanded', 'true');
    focusFirst(cart);
    updateMobileBuy();
  }

  function hideOffer(restoreFocus = true) {
    if (!offer || offer.hidden) return;
    offer.hidden = true;
    offer.setAttribute('aria-hidden', 'true');
    if (cart) {
      cart.inert = false;
      cart.removeAttribute('inert');
      cart.setAttribute('aria-modal', 'true');
    }
    if (restoreFocus && cartIsOpen) {
      if (canFocus(offerReturnFocus)) offerReturnFocus.focus({ preventScroll: true });
      else focusFirst(cart);
    }
    offerReturnFocus = null;
    updateMobileBuy();
  }

  function closeCart() {
    cancelPendingOffer();
    cartRevision += 1;
    hideOffer(false);
    if (!cartIsOpen) return;
    cartIsOpen = false;
    if (overlay) overlay.hidden = true;
    if (cart) {
      cart.hidden = true;
      cart.classList.remove('open');
      cart.setAttribute('aria-hidden', 'true');
    }
    document.body.classList.remove('cart-open');
    setBackgroundInert(false);
    const cartOpenButton = $('#cartOpen');
    if (cartOpenButton) cartOpenButton.setAttribute('aria-expanded', 'false');
    showPromoToast();
    updateMobileBuy();
    if (canFocus(cartReturnFocus)) cartReturnFocus.focus({ preventScroll: true });
    else if (canFocus(cartOpenButton)) cartOpenButton.focus({ preventScroll: true });
    cartReturnFocus = null;
  }

  function configureOffer(target) {
    const extra = cartPrice(target) - cartPrice(cartQty);
    text('#offerBadge', target === 2 ? 'PAIR & SAVE 15%' : 'BEST VALUE · SAVE 25%');
    text('#offerTitle', target === 2 ? 'A little more room.' : 'Make room for everything.');
    text('#offerText', 'Add one more shelf for ' + money(extra) +
      ' more. Your ' + target + '-shelf bundle includes free shipping. This upgrade is optional.');
    text('#offerWas', money(target * UNIT_CENTS) + ' bought separately');
    text('#offerPrice', money(cartPrice(target)) + ' total');
    const accept = $('#acceptOffer');
    if (accept) {
      accept.dataset.target = String(target);
      accept.textContent = 'Add one shelf · +' + money(extra);
    }
  }

  function schedulePostAddOffer() {
    cancelPendingOffer();
    if (!offer || !cartIsOpen || cartQty < 1 || cartQty > 2 || sessionSeen('mnPostAddOfferSeen')) return;
    const scheduledRevision = cartRevision;
    offerTimer = window.setTimeout(() => {
      offerTimer = null;
      if (!cartIsOpen || cartRevision !== scheduledRevision || cartQty < 1 || cartQty > 2 ||
          sessionSeen('mnPostAddOfferSeen')) return;
      configureOffer(cartQty + 1);
      offerReturnFocus = document.activeElement;
      markSessionSeen('mnPostAddOfferSeen');
      offer.hidden = false;
      offer.setAttribute('aria-hidden', 'false');
      if (cart) {
        cart.inert = true;
        cart.setAttribute('inert', '');
        cart.setAttribute('aria-modal', 'false');
      }
      focusFirst(offer);
      updateMobileBuy();
    }, 650);
  }

  function addSelected() {
    const nextQuantity = cartQty + selected;
    if (nextQuantity > MAX_QTY) {
      openCart();
      text('#checkoutStatus', 'Your cart can hold up to ' + MAX_QTY + ' shelves.');
      return;
    }
    setCartQuantity(nextQuantity);
    openCart();
    const pill = $('#cartOpen');
    if (pill && !reducedMotion.matches) {
      pill.classList.remove('bump');
      void pill.offsetWidth;
      pill.classList.add('bump');
    }
    schedulePostAddOffer();
  }

  function upgradeCart() {
    if (!cartIsOpen || (cartQty !== 1 && cartQty !== 2)) return;
    setCartQuantity(cartQty + 1);
  }

  function scrollToShop() {
    const shop = $('#shop');
    if (shop) shop.scrollIntoView({
      behavior: reducedMotion.matches ? 'auto' : 'smooth',
      block: 'start'
    });
  }

  $$('.bundle').forEach(button => button.addEventListener('click', () => chooseBundle(Number(button.dataset.qty))));
  listen('#addToCart', 'click', addSelected);
  listen('#mobileAdd', 'click', addSelected);
  listen('#cartOpen', 'click', openCart);
  listen('#cartClose', 'click', closeCart);
  listen('#overlay', 'click', closeCart);
  listen('#emptyShop', 'click', () => { closeCart(); scrollToShop(); });
  listen('#minus', 'click', () => setCartQuantity(Math.max(0, cartQty - 1)));
  listen('#plus', 'click', () => setCartQuantity(Math.min(MAX_QTY, cartQty + 1)));
  listen('#cartRemove', 'click', () => setCartQuantity(0));
  listen('#upsellButton', 'click', upgradeCart);
  listen('#offerClose', 'click', () => hideOffer());
  listen('#declineOffer', 'click', () => hideOffer());
  listen('#acceptOffer', 'click', () => {
    const target = Number($('#acceptOffer')?.dataset.target);
    if (cartIsOpen && (cartQty === 1 || cartQty === 2) && target === cartQty + 1) upgradeCart();
    hideOffer();
  });
  listen('#offerModal', 'click', event => {
    if (event.target === offer) hideOffer();
  });
  listen('#promoClose', 'click', hidePromo);
  listen('#promoShop', 'click', () => { hidePromo(); chooseBundle(2); scrollToShop(); });
  listen('#checkoutButton', 'click', () => {
    const url = cartQty > 0 ? checkoutUrl(cartQty) : null;
    if (url) window.location.assign(url);
    else renderCheckout();
  });

  document.addEventListener('keydown', event => {
    const dialog = visibleDialog();
    if (!dialog) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      if (offer && !offer.hidden) hideOffer();
      else closeCart();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = focusableElements(dialog);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first) {
      event.preventDefault();
      dialog.focus({ preventScroll: true });
    } else if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
      event.preventDefault();
      last.focus({ preventScroll: true });
    } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
      event.preventDefault();
      first.focus({ preventScroll: true });
    }
  });
  document.addEventListener('focusin', event => {
    const dialog = visibleDialog();
    if (dialog && !dialog.contains(event.target)) focusFirst(dialog);
  });

  /* Keep responsive sources, fallbacks and descriptions aligned with the selected view. */
  const mainImage = $('#productMain');
  const mainFrame = $('.product-main-frame');
  const imageFallbackState = new WeakMap();

  function resolveImageSource(source) {
    try { return new URL(source, document.baseURI).href; } catch { return source; }
  }

  function recoverCdnImage(image) {
    const state = imageFallbackState.get(image);
    const fallback = image.dataset.fallback;
    if (!state || state.used || !fallback) return;
    const currentSource = image.currentSrc;
    const sources = [image.getAttribute('src') || ''];
    const srcset = image.getAttribute('srcset');
    if (srcset) srcset.split(',').forEach(candidate => sources.push(candidate.trim().split(/\s+/)[0]));
    /* Ignore an old request's error after a visitor selects another gallery view. */
    if (currentSource && !sources.some(source =>
      resolveImageSource(source) === resolveImageSource(currentSource))) return;
    state.used = true;
    image.removeAttribute('srcset');
    image.removeAttribute('sizes');
    image.src = fallback;
  }

  $$('.cdn-image').forEach(image => {
    imageFallbackState.set(image, { used: false });
    image.addEventListener('error', () => recoverCdnImage(image));
    /* A deferred script may attach after the initial CDN request has already failed. */
    if (image.complete && image.naturalWidth === 0) recoverCdnImage(image);
  });

  $$('.gallery-thumb').forEach(button => {
    button.setAttribute('aria-pressed', String(button.classList.contains('active')));
    button.addEventListener('click', async () => {
      const next = button.dataset.image;
      if (!mainImage || !next || button.classList.contains('active')) return;
      const revision = ++galleryRevision;
      $$('.gallery-thumb').forEach(thumb => {
        const active = thumb === button;
        thumb.classList.toggle('active', active);
        thumb.setAttribute('aria-pressed', String(active));
      });
      if (mainFrame && !reducedMotion.matches) mainFrame.classList.add('switching');
      imageFallbackState.set(mainImage, { used: false });
      if (button.dataset.fallback) mainImage.dataset.fallback = button.dataset.fallback;
      else delete mainImage.dataset.fallback;
      if (button.dataset.sizes) mainImage.setAttribute('sizes', button.dataset.sizes);
      else mainImage.removeAttribute('sizes');
      if (button.dataset.srcset) mainImage.setAttribute('srcset', button.dataset.srcset);
      else mainImage.removeAttribute('srcset');
      mainImage.alt = button.dataset.alt || button.getAttribute('aria-label') || 'MagnaNest magnetic shelf';
      mainImage.src = next;
      try { if (typeof mainImage.decode === 'function') await mainImage.decode(); } catch {}
      if (revision === galleryRevision && mainFrame) mainFrame.classList.remove('switching');
    });
  });

  /* Content remains visible without JavaScript or motion support. */
  const revealItems = $$('.reveal, .reveal-scale');
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -3% 0px' });
    revealItems.forEach(element => observer.observe(element));
  } else {
    revealItems.forEach(element => element.classList.add('is-visible'));
  }

  const header = $('.site-header');
  const updateScrollState = () => {
    if (header) header.classList.toggle('scrolled', window.scrollY > 40);
    if (!('IntersectionObserver' in window) && purchaseButton) {
      const bounds = purchaseButton.getBoundingClientRect();
      purchaseInView = bounds.bottom > 0 && bounds.top < window.innerHeight;
    }
    updateMobileBuy();
  };
  if (purchaseButton) {
    const bounds = purchaseButton.getBoundingClientRect();
    purchaseInView = bounds.bottom > 0 && bounds.top < window.innerHeight;
    if ('IntersectionObserver' in window) {
      const buyObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => { purchaseInView = entry.isIntersecting; });
        updateMobileBuy();
      });
      buyObserver.observe(purchaseButton);
      if (hero) {
        const heroObserver = new IntersectionObserver(updateMobileBuy);
        heroObserver.observe(hero);
      }
    }
  }
  window.addEventListener('scroll', updateScrollState, { passive: true });
  window.addEventListener('resize', updateScrollState, { passive: true });
  if (typeof mobileQuery.addEventListener === 'function') mobileQuery.addEventListener('change', updateMobileBuy);

  if (window.matchMedia('(pointer: fine)').matches && !reducedMotion.matches) {
    $$('[data-parallax]').forEach(frame => {
      const image = frame.querySelector('img');
      if (!image) return;
      frame.addEventListener('pointermove', event => {
        if (reducedMotion.matches) return;
        const bounds = frame.getBoundingClientRect();
        if (!bounds.width || !bounds.height) return;
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;
        image.style.transform = 'scale(1.025) translate(' + (x * 4) + 'px,' + (y * 4) + 'px)';
      });
      frame.addEventListener('pointerleave', () => { image.style.transform = ''; });
    });
  }

  const announcement = $('.announcement');
  const messages = [
    'A little space. A better kitchen.',
    '2 shelves · $42.42 · save 15% · free shipping',
    '3 shelves · $56.14 · save 25% · free shipping'
  ];
  let messageIndex = 0;
  if (announcement && !reducedMotion.matches) {
    window.setInterval(() => {
      if (document.hidden || reducedMotion.matches) return;
      messageIndex = (messageIndex + 1) % messages.length;
      announcement.textContent = messages[messageIndex];
    }, 6000);
  }

  if (cart) {
    cart.hidden = true;
    cart.setAttribute('aria-hidden', 'true');
    cart.setAttribute('role', 'dialog');
    cart.setAttribute('tabindex', '-1');
    if (!cart.hasAttribute('aria-labelledby')) cart.setAttribute('aria-label', 'Your shopping cart');
  }
  if (offer) {
    offer.hidden = true;
    offer.setAttribute('aria-hidden', 'true');
    offer.setAttribute('tabindex', '-1');
  }
  if (overlay) overlay.hidden = true;
  if (promo) promo.hidden = true;
  text('#year', String(new Date().getFullYear()));
  chooseBundle(selected);
  persistQuantity(CART_KEY, cartQty);
  renderCart();
  updateScrollState();
  window.setTimeout(() => {
    promoReady = true;
    showPromoToast();
  }, 6500);
  const heroArt = $('.hero-art');
  if (heroArt) heroArt.classList.add('is-visible');
  document.documentElement.classList.add('js');
})();
