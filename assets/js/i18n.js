/* Language loading and switching. Strings live in /locales/*.json */
(function(){
  const LANGS=['en','el','it','ru'];
  const NAMES={en:'English',el:'Ελληνικά',it:'Italiano',ru:'Русский'};
  const root=document.body.dataset.root||'';
  let dict={},lang='en';
  function detect(){
    try{const s=localStorage.getItem('aabora-lang');if(LANGS.includes(s))return s}catch(e){}
    const n=(navigator.language||'en').slice(0,2);
    return LANGS.includes(n)?n:'en';
  }
  async function load(l){
    const r=await fetch(root+'locales/'+l+'.json');
    dict=await r.json();lang=l;
    document.documentElement.lang=l;
    try{localStorage.setItem('aabora-lang',l)}catch(e){}
  }
  function t(k){return dict[k]||k}
  function apply(){
    document.querySelectorAll('[data-i18n]').forEach(e=>e.textContent=t(e.dataset.i18n));
    document.querySelectorAll('[data-i18n-placeholder]').forEach(e=>e.placeholder=t(e.dataset.i18nPlaceholder));
    const k=document.body.dataset.title;
    if(k)document.title='Aabora – '+t(k);
  }
  function fmt(n){
    const loc={en:'en-IE',it:'it-IT',el:'el-GR',ru:'ru-RU'}[lang];
    return new Intl.NumberFormat(loc,{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n);
  }
  async function set(l){await load(l);document.dispatchEvent(new Event('lang:change'))}
  window.I18n={LANGS,NAMES,tr:o=>o[lang]||o.en,init:()=>load(detect()),set,t,apply,fmt,get lang(){return lang}};
})();
