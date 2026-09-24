const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];

const bundles={1:24.95,2:42.42,3:56.14};
let selected=1,cartQty=0;
const money=n=>'$'+n.toFixed(2);
const sessionGet=k=>{try{return sessionStorage.getItem(k)}catch{return null}};
const sessionSet=(k,v)=>{try{sessionStorage.setItem(k,v)}catch{}};

function selectedPrice(){return bundles[selected]||selected*24.95}

function chooseBundle(q){
  selected=q;
  $$('.bundle').forEach(b=>{
    const on=+b.dataset.qty===q;
    b.classList.toggle('active',on);
    b.setAttribute('aria-pressed',on);
  });
  $('#buttonPrice').textContent=money(selectedPrice());
  $('#mobilePrice').textContent=money(selectedPrice());
}

function cartPrice(q){
  if(q>=3)return 56.14+(q-3)*18.71;
  if(q===2)return 42.42;
  if(q===1)return 24.95;
  return 0;
}

function renderUpsell(q){
  const card=$('#cartUpsell');
  const title=$('#upsellTitle');
  const copy=$('#upsellCopy');
  const btn=$('#upsellButton');
  if(!card||!title||!copy||!btn)return;
  card.classList.remove('unlocked');

  if(q===1){
    card.hidden=false;
    title.textContent='Upgrade to 2 shelves';
    copy.textContent='Add one more for only $17.47 more, unlock free shipping, and save 15% versus buying separately.';
    btn.hidden=false;
    btn.dataset.target='2';
    btn.textContent='Upgrade & save 15%';
  }else if(q===2){
    card.hidden=false;
    title.textContent='Go best value with 3';
    copy.textContent='Add a third shelf for only $13.72 more and move to 25% bundle savings.';
    btn.hidden=false;
    btn.dataset.target='3';
    btn.textContent='Add 3rd shelf & save 25%';
  }else{
    card.hidden=false;
    card.classList.add('unlocked');
    title.textContent='Best-value pricing unlocked';
    copy.textContent='You have the strongest bundle pricing active in your cart.';
    btn.hidden=true;
  }
}

function renderCart(){
  const has=cartQty>0;
  $('#cartEmpty').hidden=has;
  $('#cartFilled').hidden=!has;
  $('#cartCount').textContent=cartQty;
  if(!has)return;

  const price=cartPrice(cartQty);
  const regular=cartQty*24.95;
  const saved=Math.max(0,regular-price);

  $('#cartQty').textContent=cartQty;
  $('#itemPrice').textContent=money(price);
  $('#subtotal').textContent=money(price);
  $('#cartBundleLabel').textContent=cartQty===1?'1 Shelf':cartQty+' Shelves';

  const free=cartQty>=2;
  $('#progress').style.width=free?'100%':'50%';
  $('#shipMessage').textContent=free?'✓ Free shipping unlocked.':'Add one more shelf to unlock free shipping.';

  const savings=$('#cartSavings');
  if(saved>0){
    savings.hidden=false;
    $('#savingsValue').textContent='−'+money(saved);
  }else{
    savings.hidden=true;
  }
  renderUpsell(cartQty);
}

function openCart(){
  renderCart();
  $('#overlay').hidden=false;
  requestAnimationFrame(()=>{
    $('#cartDrawer').classList.add('open');
    $('#cartDrawer').setAttribute('aria-hidden','false');
  });
}

function hideOffer(){
  const modal=$('#offerModal');
  if(!modal)return;
  modal.hidden=true;
  modal.setAttribute('aria-hidden','true');
}

function closeCart(){
  hideOffer();
  $('#overlay').hidden=true;
  $('#cartDrawer').classList.remove('open');
  $('#cartDrawer').setAttribute('aria-hidden','true');
}

function configureOffer(target){
  if(target===2){
    $('#offerBadge').textContent='FREE SHIPPING';
    $('#offerTitle').textContent='Make it a pair and save 15%.';
    $('#offerText').textContent='Add a second shelf before checkout and unlock the 2-pack bundle price plus free shipping.';
    $('#offerWas').textContent='$49.90 regular';
    $('#offerPrice').textContent='$42.42 total';
  }else{
    $('#offerBadge').textContent='BEST VALUE';
    $('#offerTitle').textContent='Add a third and save 25%.';
    $('#offerText').textContent='Upgrade to the 3-shelf bundle for the strongest per-shelf price and keep free shipping unlocked.';
    $('#offerWas').textContent='$74.85 regular';
    $('#offerPrice').textContent='$56.14 total';
  }
  $('#acceptOffer').dataset.target=String(target);
}

function showPostAddOffer(){
  if(cartQty>=3||sessionGet('mnPostAddOfferSeen')==='1')return;
  const target=cartQty===1?2:3;
  configureOffer(target);
  sessionSet('mnPostAddOfferSeen','1');
  setTimeout(()=>{
    if(cartQty<=0)return;
    const modal=$('#offerModal');
    modal.hidden=false;
    modal.setAttribute('aria-hidden','false');
  },520);
}

function showPromoToast(){
  if(cartQty>0||sessionGet('mnPromoSeen')==='1')return;
  sessionSet('mnPromoSeen','1');
  $('#promoToast').hidden=false;
}

$$('.bundle').forEach(b=>b.addEventListener('click',()=>chooseBundle(+b.dataset.qty)));

$('#addToCart').addEventListener('click',()=>{
  cartQty=selected;
  openCart();
  const pill=$('#cartOpen');
  pill.classList.remove('bump');
  void pill.offsetWidth;
  pill.classList.add('bump');
  showPostAddOffer();
});

$('#cartOpen').addEventListener('click',openCart);
$('#cartClose').addEventListener('click',closeCart);
$('#overlay').addEventListener('click',closeCart);
$('#emptyShop').addEventListener('click',()=>{
  closeCart();
  $('#shop').scrollIntoView({behavior:'smooth'});
});
$('#minus').addEventListener('click',()=>{
  cartQty=Math.max(0,cartQty-1);
  if(cartQty>=1)chooseBundle(cartQty);
  renderCart();
});
$('#plus').addEventListener('click',()=>{
  cartQty=Math.min(3,cartQty+1);
  chooseBundle(cartQty);
  renderCart();
});
$('#upsellButton').addEventListener('click',e=>{
  const target=+e.currentTarget.dataset.target;
  if(!target)return;
  cartQty=target;
  chooseBundle(Math.min(target,3));
  renderCart();
  e.currentTarget.closest('.cart-upsell')?.classList.add('pulse');
  setTimeout(()=>e.currentTarget.closest('.cart-upsell')?.classList.remove('pulse'),420);
});
$('#offerClose').addEventListener('click',hideOffer);
$('#declineOffer').addEventListener('click',hideOffer);
$('#acceptOffer').addEventListener('click',e=>{
  const target=+e.currentTarget.dataset.target;
  cartQty=target;
  chooseBundle(target);
  renderCart();
  hideOffer();
  const card=$('#cartUpsell');
  card?.classList.add('pulse');
  setTimeout(()=>card?.classList.remove('pulse'),420);
});
$('#promoClose').addEventListener('click',()=>{$('#promoToast').hidden=true});
$('#promoShop').addEventListener('click',()=>{
  $('#promoToast').hidden=true;
  chooseBundle(2);
  $('#shop').scrollIntoView({behavior:'smooth',block:'center'});
});

document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    if(!$('#offerModal').hidden)hideOffer();
    else closeCart();
  }
});

/* Product gallery */
const mainFrame=$('.product-main-frame');
const mainImage=$('#productMain');
$$('.gallery-thumb').forEach(btn=>{
  btn.addEventListener('click',()=>{
    if(btn.classList.contains('active'))return;
    $$('.gallery-thumb').forEach(x=>x.classList.remove('active'));
    btn.classList.add('active');
    mainFrame?.classList.add('switching');
    const next=btn.dataset.image;
    const swap=()=>{
      if(mainImage)mainImage.src=next;
      requestAnimationFrame(()=>mainFrame?.classList.remove('switching'));
    };
    setTimeout(swap,150);
  });
});

/* Scroll reveal */
const revealItems=$$('.reveal,.reveal-scale');
if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  },{threshold:.12,rootMargin:'0px 0px -5% 0px'});
  revealItems.forEach(el=>observer.observe(el));
}else{
  revealItems.forEach(el=>el.classList.add('is-visible'));
}

/* Sticky header state */
const header=$('.site-header');
const setHeader=()=>header?.classList.toggle('scrolled',window.scrollY>40);
setHeader();
window.addEventListener('scroll',setHeader,{passive:true});

/* Subtle product-image depth */
if(window.matchMedia('(pointer:fine)').matches&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  $$('[data-parallax]').forEach(frame=>{
    const img=frame.querySelector('img');
    if(!img)return;
    frame.addEventListener('pointermove',e=>{
      const r=frame.getBoundingClientRect();
      const x=(e.clientX-r.left)/r.width-.5;
      const y=(e.clientY-r.top)/r.height-.5;
      img.style.transform=`scale(1.045) translate(${x*7}px,${y*7}px)`;
    });
    frame.addEventListener('pointerleave',()=>{img.style.transform=''});
  });
}


/* Rotating truthful promo bar */
const announcement=$('.announcement');
const promoMessages=[
  'FREE SHIPPING ON 2+ SHELVES • SAVE 15% ON 2',
  'BEST VALUE: 3 SHELVES SAVE 25% • FREE SHIPPING',
  '30-DAY SATISFACTION GUARANTEE • TOOL-FREE SETUP'
];
let promoMessageIndex=0;
if(announcement&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  setInterval(()=>{
    promoMessageIndex=(promoMessageIndex+1)%promoMessages.length;
    announcement.classList.add('changing');
    setTimeout(()=>{
      announcement.textContent=promoMessages[promoMessageIndex];
      announcement.classList.remove('changing');
    },180);
  },4200);
}

$('#year').textContent=new Date().getFullYear();
chooseBundle(1);
renderCart();
setTimeout(showPromoToast,6500);

requestAnimationFrame(()=>{
  const hero=$('.hero-art');
  hero?.classList.add('is-visible');
});
