/* Starts every page: header, footer, language, page-specific rendering */
(async function(){
  const root=document.body.dataset.root||'';
  const page=document.body.dataset.page;
  const t=k=>I18n.t(k);
  const HEART='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.6 3.7 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.3 0 5.4 3.1 4.2 6.6-1.7 4.8-9.2 9.4-9.2 9.4z"/></svg>';

  function layout(){
    document.getElementById('site-header').innerHTML=
      `<a class="logo" href="${root}index.html" aria-label="Aabora"><img src="${root}assets/images/logo/logo-wordmark.png" alt="Aabora"></a>
       <nav><a href="${root}shop.html">${t('nav.shop')}</a><a href="${root}gifts.html">${t('nav.gifts')}</a><a href="${root}about.html">${t('nav.about')}</a><a href="${root}contact.html">${t('nav.contact')}</a></nav>
       <select class="lang" id="lang-select" aria-label="Language">${I18n.LANGS.map(l=>`<option value="${l}"${l===I18n.lang?' selected':''}>${I18n.NAMES[l]}</option>`).join('')}</select>
       <a class="wishbtn" href="${root}wishlist.html" aria-label="${t('nav.wishlist')}">${HEART}<span id="wish-count">0</span></a>
       <a class="cartbtn" href="${root}cart.html">${t('nav.cart')} (<span id="cart-count">0</span>)</a>`;
    document.getElementById('site-footer').innerHTML=
      `<img class="foot-mark" src="${root}assets/images/logo/logo-monogram.png" alt=""><span>${t('footer.rights')}</span>
       <nav><a href="${root}legal/privacy-policy.html">${t('footer.privacy')}</a><a href="${root}legal/terms.html">${t('footer.terms')}</a><a href="${root}legal/shipping-returns.html">${t('footer.shipping')}</a></nav>`;
  }
  const pages={
    home:()=>Shop.home(),shop:()=>Shop.shop(),product:()=>Shop.product(),
    gifts:()=>Shop.gifts(),wishlist:()=>Shop.wishlist(),
    cart:()=>Cart.page(),checkout:()=>Cart.checkout(),success:()=>Cart.finish(),legal:()=>Legal.render()
  };
  async function render(){
    layout();I18n.apply();
    if(pages[page])await pages[page]();
    Cart.badge();Wish.badge();Wish.sync();
  }
  document.addEventListener('change',e=>{if(e.target.id==='lang-select')I18n.set(e.target.value)});
  document.addEventListener('lang:change',render);
  document.addEventListener('cart:change',()=>{if(page==='cart'||page==='checkout')pages[page]()});
  document.addEventListener('wish:change',()=>{if(page==='wishlist')pages[page]()});
  await I18n.init();
  render();
})();
