/* Wishlist (saved in the browser) */
(function(){
  const KEY='aabora-wishlist';
  let ids=[];
  try{ids=JSON.parse(localStorage.getItem(KEY))||[]}catch(e){}
  const has=id=>ids.includes(String(id));
  function badge(){const b=document.getElementById('wish-count');if(b)b.textContent=ids.length}
  function sync(){
    document.querySelectorAll('[data-wish]').forEach(b=>{
      const on=has(b.dataset.wish);
      b.setAttribute('aria-pressed',on);
      b.setAttribute('aria-label',I18n.t(on?'wish.remove':'wish.add'));
    });
  }
  function toggle(id){
    id=String(id);
    ids=has(id)?ids.filter(x=>x!==id):[...ids,id];
    try{localStorage.setItem(KEY,JSON.stringify(ids))}catch(e){}
    badge();sync();document.dispatchEvent(new Event('wish:change'));
  }
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-wish]');
    if(b){e.preventDefault();toggle(b.dataset.wish)}
  });
  window.Wish={has,badge,sync,toggle,get ids(){return ids}};
})();
