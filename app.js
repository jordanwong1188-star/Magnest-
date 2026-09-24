const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];

const bundles={1:24.95,2:42.42,3:56.14};
let selected=1,cartQty=0;
const money=n=>'$'+n.toFixed(2);

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

function renderCart(){
  const has=cartQty>0;
  $('#cartEmpty').hidden=has;
  $('#cartFilled').hidden=!has;
  $('#cartCount').textContent=cartQty;
  if(!has)return;
  const price=cartPrice(cartQty);
  $('#cartQty').textContent=cartQty;
  $('#itemPrice').textContent=money(price);
  $('#subtotal').textContent=money(price);
  $('#cartBundleLabel').textContent=cartQty===1?'1 Shelf':cartQty+' Shelves';
  const free=cartQty>=2;
  $('#progress').style.width=free?'100%':'50%';
  $('#shipMessage').textContent=free?'✓ Free shipping unlocked.':'Add one more shelf to unlock free shipping.';
}

function openCart(){
  renderCart();
  $('#overlay').hidden=false;
  requestAnimationFrame(()=>{
    $('#cartDrawer').classList.add('open');
    $('#cartDrawer').setAttribute('aria-hidden','false');
  });
}

function closeCart(){
  $('#overlay').hidden=true;
  $('#cartDrawer').classList.remove('open');
  $('#cartDrawer').setAttribute('aria-hidden','true');
}

$$('.bundle').forEach(b=>b.addEventListener('click',()=>chooseBundle(+b.dataset.qty)));

$('#addToCart').addEventListener('click',()=>{
  cartQty=selected;
  openCart();
  const pill=$('#cartOpen');
  pill.classList.remove('bump');
  void pill.offsetWidth;
  pill.classList.add('bump');
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
  renderCart();
});
$('#plus').addEventListener('click',()=>{
  cartQty++;
  renderCart();
});

document.addEventListener('keydown',e=>{
  if(e.key==='Escape')closeCart();
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
    frame.addEventListener('pointerleave',()=>{img.style.transform='';});
  });
}

$('#year').textContent=new Date().getFullYear();
chooseBundle(1);
renderCart();

requestAnimationFrame(()=>{
  const hero=$('.hero-art');
  hero?.classList.add('is-visible');
});
