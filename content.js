// Content layer. Applies the content published from the store admin panel, then loads app.js.
// The site has no control panel of its own: the editable fields live in schema.js, the content in the store.
(function(){
'use strict';
const APP_SRC='app.js?v=5';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const SCHEMA=window.AXIS_SCHEMA||{fields:[],projects:[]};
// Images uploaded in the store admin are stored as paths on the store's origin.
const ORIGIN=window.AXIS_STORE_ORIGIN||'';
const abs=u=>u&&u[0]==='/'&&u[1]!=='/'?ORIGIN+u:(u||'');
// Only http(s) image URLs are ever written into the page.
const safe=u=>{const v=abs(u);return /^https?:\/\//i.test(v)?v.replace(/["\\\n]/g,''):''};

const fields=SCHEMA.fields.map(f=>Object.assign({},f,{get:()=>f.virtual?null:(f.nth!=null?$$(f.sel)[f.nth]:$(f.sel))}));

function toText(el,f){if(f.attr)return el.getAttribute(f.attr)||'';const c=el.cloneNode(true);$$('.line',c).forEach(n=>n.remove());$$('br',c).forEach(n=>n.replaceWith('\n'));$$('span,b,strong',c).forEach(n=>n.replaceWith('*'+n.textContent+'*'));return c.textContent.trim()}
const toHTML=(text,tag)=>esc(text).replace(/\*([^*\n]+)\*/g,'<'+tag+'>$1</'+tag+'>').replace(/\n/g,'<br>');

let content={texts:{},images:{}};

function applyTexts(){
 fields.forEach(f=>{
  if(f.virtual)return;
  const el=f.get();if(!el)return;
  const def=toText(el,f);
  const hl=el.querySelector('span:not(.line),b,strong'),tag=hl?hl.tagName.toLowerCase():'span';
  const line=el.querySelector(':scope>.line'),keep=line?line.outerHTML+' ':'';
  const v=content.texts[f.key];
  if(v==null||v===def)return;
  if(f.attr)el.setAttribute(f.attr,v);else el.innerHTML=keep+toHTML(v,tag);
 });
 const labels=fields.filter(f=>f.virtual).map(f=>content.texts[f.key]||'');
 if(labels.some(Boolean))window.AXIS_LABELS=labels;
}
function bigTitle(p){
 const lines=String(p.big||'').split('\n').map(s=>s.trim()).filter(Boolean);
 if(!lines.length)return '<div></div>';
 const last=lines.length>1?lines.pop():'',first=lines.map(esc).join('<br>');
 if(p.style==='community')return '<div class="community-title">'+(p.tag?'<span class="community-tag">'+esc(p.tag)+'</span>':'')+'<strong>'+first+(last?'<br><span dir="auto">'+esc(last)+'</span>':'')+'</strong></div>';
 return '<div class="store-title" dir="auto">'+first+(last?'<br><span>'+esc(last)+'</span>':'')+(p.tag?'<small>'+esc(p.tag)+'</small>':'')+'</div>';
}
function applyProjects(){
 const list=content.projects||SCHEMA.projects||[],grid=$('.project-grid');
 if(grid&&content.projects){
  grid.innerHTML=list.map((p,i)=>'<article class="project"><button class="project-visual '+(p.style==='community'?'community':'store')+(safe(p.cover)?' has-cover':'')+'" data-project="'+esc(p.id)+'" aria-label="عرض تفاصيل '+esc(p.title)+'"><div class="visual-top"><span>'+esc(p.eco)+'</span><span>'+String(i+1).padStart(2,'0')+'</span></div>'+bigTitle(p)+'<span class="visual-bottom">'+esc(p.bottom)+' <span>عرض المشروع +</span></span></button><div class="project-info"><h3>'+esc(p.title)+'</h3><span>'+esc(p.meta)+'</span></div><p>'+esc(p.summary)+'</p></article>').join('');
  list.forEach((p,i)=>{const cover=safe(p.cover);if(cover)$$('.project-visual',grid)[i].style.setProperty('--cover','url("'+cover+'")')});
 }
 if(list.length)window.AXIS_PROJECTS=Object.fromEntries(list.map(p=>[p.id,{type:p.type,title:p.title,desc:p.desc,features:p.features||[],url:/^https?:\/\//i.test(p.url||'')?p.url:'',gallery:(p.gallery||[]).map(safe).filter(Boolean)}]));
}
function applyImages(){
 const im=content.images,logo=safe(im.heroLogo),about=safe(im.about);
 if(logo){const w=$('.identity-window');if(w)w.style.backgroundImage='url("'+logo+'")'}
 if(about){const host=$('#about>div');if(host){const img=document.createElement('img');img.className='about-photo';img.alt='';img.src=about;host.append(img)}}
}

function init(){
 const published=window.AXIS_PUBLISHED;
 if(published&&typeof published==='object')content=published;
 content.texts=content.texts||{};content.images=content.images||{};
 [applyTexts,applyProjects,applyImages].forEach(fn=>{try{fn()}catch(e){console.error(e)}});
 const done=()=>document.documentElement.classList.remove('axis-loading');
 const s=document.createElement('script');s.src=APP_SRC;s.onload=s.onerror=done;document.body.append(s);
 // A gallery image opens at full size in a new tab.
 const gallery=$('#modal-gallery');if(gallery)gallery.addEventListener('click',e=>{if(e.target.tagName==='IMG')window.open(e.target.src,'_blank','noopener')});
}
init();
})();
