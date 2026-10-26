/* Cart state (saved in the browser), gift options, and the cart and checkout pages */
(function(){
  const root=document.body.dataset.root||'';
  const $=id=>document.getElementById(id);
  const KEY='aabora-cart',GKEY='aabora-gift';
  let cart={},gift={wrap:false,note:''},cfg=null;
  try{cart=JSON.parse(localStorage.getItem(KEY))||{}}catch(e){}
  try{gift={...gift,...JSON.parse(localStorage.getItem(GKEY))}}catch(e){}
  // keys are "<id>|<size>"; upgrade older carts that only stored the id
  cart=Object.fromEntries(Object.entries(cart).map(([k,v])=>[k.includes('|')?k:k+'|',v]));
  const parse=k=>{const i=k.indexOf('|');return{id:k.slice(0,i),size:k.slice(i+1)}};
  const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(cart));localStorage.setItem(GKEY,JSON.stringify(gift))}catch(e){}};
  function save(){persist();badge();document.dispatchEvent(new Event('cart:change'))}
  async function settings(){
    if(!cfg){try{cfg=await (await fetch(root+'data/company.json')).json()}catch(e){cfg={}}}
    return cfg;
  }
  const wrapPrice=()=>gift.wrap?(Number(cfg&&cfg.giftWrapPrice)||0):0;
  const count=()=>Object.values(cart).reduce((a,n)=>a+n,0);
  const subtotal=()=>Object.entries(cart).reduce((a,[k,n])=>{const p=Shop.byId(parse(k).id);return a+(p?p.price*n:0)},0);
  const total=()=>subtotal()+wrapPrice();
  function badge(){const b=$('cart-count');if(b)b.textContent=count()}
  function add(id,size){const k=id+'|'+size;cart[k]=(cart[k]||0)+1;save()}
  function change(k,d){cart[k]+=d;if(cart[k]<1)delete cart[k];save()}
  function remove(k){delete cart[k];save()}
  function prune(){for(const k of Object.keys(cart))if(!Shop.byId(parse(k).id))delete cart[k];persist()}
  const wrapText=()=>Number(cfg&&cfg.giftWrapPrice)>0?'+ '+I18n.fmt(Number(cfg.giftWrapPrice)):I18n.t('gift.free');

  async function lines(withControls){
    await Shop.load();await settings();prune();
    return Object.keys(cart).map(k=>{
      const {id,size}=parse(k),p=Shop.byId(id),name=Shop.esc(I18n.tr(p.name));
      const sz=size?` <span class="mat">· ${I18n.t('product.size')}: ${Shop.esc(size)}</span>`:'';
      const ke=Shop.esc(k);
      if(!withControls)return `<div class="item"><span>${name}${sz} × ${cart[k]}</span><span></span><span></span><b>${I18n.fmt(p.price*cart[k])}</b></div>`;
      return `<div class="item"><span>${name}${sz}</span><span class="qty"><button data-q="${ke}" data-d="-1" aria-label="−">−</button> ${cart[k]} <button data-q="${ke}" data-d="1" aria-label="+">+</button></span><b>${I18n.fmt(p.price*cart[k])}</b><button class="link" data-remove="${ke}">${I18n.t('cart.remove')}</button></div>`;
    }).join('');
  }
  async function page(){
    const html=await lines(true);
    $('cart-items').innerHTML=html||`<p>${I18n.t('cart.empty')}</p>`;
    $('cart-summary').hidden=!html;
    if(!html)return;
    $('wrap-price').textContent=wrapText();
    $('gift-wrap').checked=gift.wrap;
    $('gift-note').value=gift.note;
    $('cart-total').textContent=I18n.fmt(total());
  }
  async function checkout(){
    let html=await lines(false);
    if(html&&gift.wrap)html+=`<div class="item"><span>${I18n.t('gift.line')}</span><span></span><span></span><b>${wrapText().replace('+ ','')}</b></div>`;
    if(html&&gift.note.trim())html+=`<div class="item"><span class="mat">${I18n.t('gift.msg')}: ${Shop.esc(gift.note.trim())}</span></div>`;
    $('order-lines').innerHTML=html||`<p>${I18n.t('cart.empty')}</p>`;
    $('order-total').textContent=I18n.fmt(total());
    const form=$('checkout-form');
    form.hidden=!html;
    form.onsubmit=async e=>{
      e.preventDefault();
      const note=$('checkout-note'),btn=form.querySelector('button[type=submit]');
      note.textContent=I18n.t('checkout.redirecting');if(btn)btn.disabled=true;
      try{
        const res=await fetch('/.netlify/functions/create-checkout',{
          method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({items:Object.entries(cart).map(([k,n])=>({...parse(k),qty:n})),gift:{wrap:gift.wrap,note:gift.note.trim()},lang:I18n.lang})
        });
        const data=await res.json();
        if(!res.ok||!data.url)throw new Error(data.error||res.status);
        location.href=data.url;
      }catch(err){
        console.error('Checkout failed:',err);
        note.textContent=I18n.t('checkout.error');if(btn)btn.disabled=false;
      }
    };
  }

  document.addEventListener('change',e=>{
    if(e.target.id==='gift-wrap'){gift.wrap=e.target.checked;persist();$('cart-total').textContent=I18n.fmt(total())}
  });
  document.addEventListener('input',e=>{
    if(e.target.id==='gift-note'){gift.note=e.target.value.slice(0,240);persist()}
  });
  document.addEventListener('click',async e=>{
    const a=e.target.closest('[data-add]');
    if(a){
      await Shop.load();
      let size='';
      if(a.dataset.sizeFrom){
        const sel=$(a.dataset.sizeFrom),note=$('size-note');
        if(!sel.value){note.textContent=I18n.t('product.pleaseSize');sel.focus();return}
        note.textContent='';size=sel.value;
      }
      add(a.dataset.add,size);
      a.textContent=I18n.t('product.added');
      setTimeout(()=>{a.textContent=I18n.t('product.add')},1200);
      return;
    }
    const q=e.target.closest('[data-q]');if(q)change(q.dataset.q,+q.dataset.d);
    const r=e.target.closest('[data-remove]');if(r)remove(r.dataset.remove);
  });
  function finish(){
    if(new URLSearchParams(location.search).get('session_id')){cart={};gift={wrap:false,note:''};save()}
  }
  window.Cart={badge,page,checkout,finish};
})();
