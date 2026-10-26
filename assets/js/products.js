/* Product data and the pages that show products: home, shop, product, gifts, wishlist */
(function(){
  const root=document.body.dataset.root||'';
  const $=id=>document.getElementById(id);
  const t=k=>I18n.t(k),tr=o=>I18n.tr(o);
  const CATS=['ring','earring','necklace','bracelet','brooch','cufflink','belt'];
  const SIZED=['ring','bracelet','belt'];
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  let list=[],sizes={};

  const ICON={
    ring:c=>`<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="58" r="26" fill="none" stroke="var(${c})" stroke-width="7"/><circle cx="50" cy="26" r="8" fill="var(--ink)" opacity=".8"/></svg>`,
    necklace:c=>`<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M14 20 Q50 90 86 20" fill="none" stroke="var(${c})" stroke-width="3"/><circle cx="50" cy="66" r="9" fill="var(${c})"/></svg>`,
    earring:c=>`<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="var(${c})"><circle cx="34" cy="24" r="4"/><path d="M34 30 q-12 22 0 38 q12 -16 0 -38z"/><circle cx="66" cy="24" r="4"/><path d="M66 30 q-12 22 0 38 q12 -16 0 -38z"/></g></svg>`,
    bracelet:c=>`<svg viewBox="0 0 100 100" aria-hidden="true"><ellipse cx="50" cy="52" rx="36" ry="26" fill="none" stroke="var(${c})" stroke-width="9"/></svg>`,
    brooch:c=>`<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="48" r="26" fill="none" stroke="var(${c})" stroke-width="7"/><circle cx="50" cy="48" r="9" fill="var(${c})"/></svg>`,
    cufflink:c=>`<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="30" cy="50" r="17" fill="none" stroke="var(${c})" stroke-width="7"/><circle cx="72" cy="50" r="7" fill="var(${c})"/><path d="M47 50 L65 50" stroke="var(${c})" stroke-width="4"/></svg>`,
    belt:c=>`<svg viewBox="0 0 100 100" aria-hidden="true"><rect x="8" y="40" width="84" height="20" rx="3" fill="none" stroke="var(${c})" stroke-width="6"/><rect x="58" y="34" width="22" height="32" rx="3" fill="none" stroke="var(--ink)" stroke-width="4" opacity=".7"/></svg>`
  };
  const HEART='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.6 3.7 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.3 0 5.4 3.1 4.2 6.6-1.7 4.8-9.2 9.4-9.2 9.4z"/></svg>';
  const RING_TABLE=[['49.3','49','5'],['51.9','52','6'],['54.4','54','7'],['57.0','57','8'],['59.5','59–60','9'],['62.1','62','10']];

  async function load(){
    if(!list.length){
      const [p,s]=await Promise.all([
        fetch(root+'data/products.json').then(r=>r.json()),
        fetch(root+'data/sizes.json').then(r=>r.json()).catch(()=>({}))
      ]);
      list=p;sizes=s;
    }
    return list;
  }
  const byId=id=>list.find(p=>String(p.id)===String(id));
  const forOf=p=>p.for||(['cufflink','belt'].includes(p.category)?'him':'her');
  const forMatch=(p,g)=>forOf(p)===g||forOf(p)==='both';
  const sizesOf=p=>SIZED.includes(p.category)?(sizes[p.category]||[]):[];
  const imgs=p=>p.images&&p.images.length?p.images:(p.image?[p.image]:[]);
  const pic=(src,alt,cls)=>`<img ${cls?`class="${cls}" `:''}src="${root}${src}" alt="${esc(alt)}" loading="lazy" decoding="async">`;
  function media(p){
    const a=imgs(p);
    return a.length?pic(a[0],tr(p.name)):(ICON[p.category]||ICON.ring)('--'+(p.tone||'accent'));
  }
  const heart=(id,cls='')=>`<button class="heart ${cls}" data-wish="${id}" aria-pressed="${Wish.has(id)}" aria-label="${t(Wish.has(id)?'wish.remove':'wish.add')}">${HEART}</button>`;

  function card(p){
    const url=`${root}product.html?id=${p.id}`,a=imgs(p),name=esc(tr(p.name));
    const action=sizesOf(p).length
      ?`<a class="add" href="${url}">${t('product.chooseSize')}</a>`
      :`<button class="add" data-add="${p.id}">${t('product.add')}</button>`;
    return `<article class="card"><div class="media"><a class="thumb" href="${url}" aria-label="${name}">${media(p)}${a[1]?pic(a[1],'','alt'):''}</a>${heart(p.id)}</div><h3><a href="${url}">${name}</a></h3><p class="mat">${esc(tr(p.material))}</p><div class="row"><span class="price">${I18n.fmt(p.price)}</span>${action}</div></article>`;
  }
  function giftTiles(){
    return ['her','him'].map(g=>{
      const p=list.find(x=>forOf(x)===g)||list.find(x=>forOf(x)==='both');
      return p?`<a class="tile" href="${root}shop.html?for=${g}">${media(p)}<span>${t('for.'+g)}</span></a>`:'';
    }).join('');
  }

  /* ---------- home ---------- */
  async function home(){
    await load();
    const first=CATS.map(c=>list.find(p=>p.category===c)).filter(Boolean);
    $('tiles').innerHTML=first.map(p=>`<a class="tile" href="${root}shop.html?cat=${p.category}">${media(p)}<span>${t('filter.'+p.category)}</span></a>`).join('');
    $('featured-grid').innerHTML=first.slice(0,4).map(card).join('');
    $('gift-tiles').innerHTML=giftTiles();
  }

  /* ---------- shop ---------- */
  const DEF={cat:'all',for:'all',price:'all',sort:'featured'};
  const OK={cat:['all',...CATS],for:['all','her','him'],price:['all','u60','m','o100'],sort:['featured','priceAsc','priceDesc','new']};
  const st={...DEF};
  {const q=new URLSearchParams(location.search);for(const k in DEF){const v=q.get(k);if(v&&OK[k].includes(v))st[k]=v}}
  const inPrice=(p,k)=>k==='u60'?p<60:k==='m'?p>=60&&p<=100:k==='o100'?p>100:true;
  function saveUrl(){
    const q=new URLSearchParams();
    for(const k in st)if(st[k]!==DEF[k])q.set(k,st[k]);
    history.replaceState(null,'',location.pathname+(q.toString()?'?'+q:''));
  }
  function drawFilters(){
    $('filters').innerHTML=['all',...CATS].map(k=>`<button data-cat="${k}" aria-pressed="${k===st.cat}">${t('filter.'+k)}</button>`).join('');
  }
  function drawGrid(){
    let items=list.filter(p=>(st.cat==='all'||p.category===st.cat)&&(st.for==='all'||forMatch(p,st.for))&&inPrice(p.price,st.price));
    if(st.sort==='priceAsc')items.sort((a,b)=>a.price-b.price);
    if(st.sort==='priceDesc')items.sort((a,b)=>b.price-a.price);
    if(st.sort==='new')items.sort((a,b)=>b.id-a.id);
    $('count').textContent=t('shop.count').replace('{n}',items.length);
    $('grid').innerHTML=items.length?items.map(card).join(''):`<div class="empty"><p>${t('shop.none')}</p><button class="link" data-clear>${t('shop.clear')}</button></div>`;
    Wish.sync();
  }
  function update(){saveUrl();drawFilters();drawGrid()}
  async function shop(){
    await load();
    const sel=(id,key,opts,label)=>`<select id="${id}" aria-label="${t(label)}">${opts.map(([v,k])=>`<option value="${v}"${v===st[key]?' selected':''}>${t(k)}</option>`).join('')}</select>`;
    $('toolbar').innerHTML=
      sel('f-for','for',[['all','for.all'],['her','for.her'],['him','for.him']],'for.label')+
      sel('f-price','price',[['all','price.all'],['u60','price.u60'],['m','price.m'],['o100','price.o100']],'price.label')+
      sel('f-sort','sort',[['featured','sort.featured'],['priceAsc','sort.priceAsc'],['priceDesc','sort.priceDesc'],['new','sort.new']],'sort.label')+
      '<span class="count" id="count" role="status"></span>';
    update();
  }
  document.addEventListener('change',e=>{
    if(document.body.dataset.page!=='shop'||!/^f-/.test(e.target.id||''))return;
    st.for=$('f-for').value;st.price=$('f-price').value;st.sort=$('f-sort').value;update();
  });
  document.addEventListener('click',e=>{
    if(document.body.dataset.page!=='shop')return;
    const c=e.target.closest('[data-cat]');
    if(c){st.cat=c.dataset.cat;update()}
    if(e.target.closest('[data-clear]')){Object.assign(st,DEF);shop()}
  });

  /* ---------- product ---------- */
  function lightbox(src){
    let lb=$('lightbox');
    if(!lb){
      lb=document.createElement('div');lb.id='lightbox';lb.className='lightbox';
      lb.setAttribute('role','dialog');lb.setAttribute('aria-modal','true');
      lb.innerHTML='<button aria-label="×">×</button><img alt="">';
      lb.onclick=()=>{lb.hidden=true};
      document.body.appendChild(lb);
      document.addEventListener('keydown',e=>{if(e.key==='Escape')lb.hidden=true});
    }
    lb.querySelector('img').src=src;lb.hidden=false;
  }
  function sizeGuide(p){
    let h=`<p>${t('size.'+p.category)}</p>`;
    if(p.category==='ring')h+=`<table class="sizetable"><tr><th>${t('size.circ')}</th><th>${t('size.eu')}</th><th>${t('size.us')}</th></tr>${RING_TABLE.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</table>`;
    return h+`<p>${t('size.note')}</p>`;
  }
  const acc=(title,body,id,open)=>`<details class="acc"${id?` id="${id}"`:''}${open?' open':''}><summary>${title}</summary>${body}</details>`;
  async function product(){
    await load();
    const p=byId(new URLSearchParams(location.search).get('id')),el=$('product');
    if(!p){el.innerHTML=`<p>${t('product.notfound')}</p>`;return}
    const a=imgs(p),sz=sizesOf(p),name=esc(tr(p.name)),story=p.story?tr(p.story):'';
    document.title='Aabora – '+tr(p.name);
    const gallery=a.length
      ?`<div class="gallery"><button class="main" data-zoom aria-label="${t('product.zoom')}"><img id="main-img" src="${root}${a[0]}" alt="${name}"></button>${a.length>1?`<div class="thumbs">${a.map((s,i)=>`<button data-thumb="${i}" aria-pressed="${i===0}"><img src="${root}${s}" alt="" loading="lazy"></button>`).join('')}</div>`:''}</div>`
      :`<div class="gallery"><div class="main icon">${media(p)}</div></div>`;
    el.innerHTML=gallery+`<div class="info">
      <p class="eyebrow">${t('filter.'+p.category)}</p>
      <h1>${name}</h1>
      <p class="mat">${esc(tr(p.material))}</p>
      <span class="price">${I18n.fmt(p.price)}</span>
      ${story?`<p class="story-text">${esc(story)}</p>`:''}
      ${sz.length?`<div class="sizebox"><label for="size">${t('product.size')}</label><select id="size"><option value="">${t('product.selectSize')}</option>${sz.map(s=>`<option>${esc(s)}</option>`).join('')}</select><button class="link" data-sizeguide>${t('product.sizeGuide')}</button></div><p class="err" id="size-note" role="alert"></p>`:''}
      <div class="buy"><button class="cta" data-add="${p.id}"${sz.length?' data-size-from="size"':''}>${t('product.add')}</button>${heart(p.id,'big')}</div>
      <ul class="trust"><li>${t('trust.handmade')}</li><li>${t('trust.returns')}</li><li>${t('trust.pack')}</li></ul>
      ${acc(t('product.details'),`<p>${esc(tr(p.material))}. ${t('details.handmade')}</p>`,'',true)}
      ${sz.length?acc(t('product.sizeGuide'),sizeGuide(p),'sg'):''}
      ${acc(t('product.care'),`<p>${t(p.category==='belt'?'care.leather':'care.jewelry')}</p>`)}
      ${acc(t('product.shipRet'),`<p>${t('ship.summary')}</p><p><a href="${root}legal/shipping-returns.html">${t('footer.shipping')}</a></p>`)}
    </div>`;
    const same=list.filter(x=>x.category===p.category&&x.id!==p.id),k=same.length?p.id%same.length:0;
    let rel=same.slice(k).concat(same.slice(0,k)).slice(0,4);
    if(rel.length<4)rel=rel.concat(list.filter(x=>x.category!==p.category&&x.id!==p.id).slice(0,4-rel.length));
    $('related').innerHTML=`<h2>${t('product.alsoLike')}</h2><div class="grid">${rel.map(card).join('')}</div>`;
    Wish.sync();
  }
  document.addEventListener('click',e=>{
    if(document.body.dataset.page!=='product')return;
    const th=e.target.closest('[data-thumb]');
    if(th){
      const src=th.querySelector('img').src;$('main-img').src=src;
      document.querySelectorAll('[data-thumb]').forEach(b=>b.setAttribute('aria-pressed',b===th));
    }
    if(e.target.closest('[data-zoom]'))lightbox($('main-img').src);
    if(e.target.closest('[data-sizeguide]')){const d=$('sg');if(d){d.open=true;d.scrollIntoView({behavior:'smooth',block:'center'})}}
  });

  /* ---------- gifts and wishlist ---------- */
  async function gifts(){await load();$('gift-tiles').innerHTML=giftTiles()}
  async function wishlist(){
    await load();
    const items=Wish.ids.map(byId).filter(Boolean);
    $('wish-grid').innerHTML=items.length?items.map(card).join(''):`<div class="empty"><p>${t('wish.empty')}</p><a class="cta" href="shop.html">${t('nav.shop')}</a></div>`;
    Wish.sync();
  }

  window.Shop={load,byId,esc,home,shop,product,gifts,wishlist};
})();
