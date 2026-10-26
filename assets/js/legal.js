/* Loads the legal text for the current language and fills in company details */
(function(){
  const root=document.body.dataset.root||'';
  let company=null;
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  async function text(url){const r=await fetch(url);if(!r.ok)throw new Error(url);return r.text()}
  async function render(){
    const el=document.getElementById('legal-body'),page=document.body.dataset.legal;
    if(!company)company=await (await fetch(root+'data/company.json')).json();
    const base=`${root}legal/content/${page}.`;
    let html;
    try{html=await text(base+I18n.lang+'.html')}catch(e){html=await text(base+'en.html')}
    el.innerHTML=html.replace(/\{\{(\w+)\}\}/g,(m,k)=>k in company?esc(company[k]):m);
  }
  window.Legal={render};
})();
