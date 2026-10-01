// Content layer + admin panel. Applies saved content to the page, then loads app.js.
(function(){
'use strict';
const DEFAULT_PASSWORD='axis2026';
const APP_SRC='app.js?v=5';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=o=>JSON.parse(JSON.stringify(o));
const rows=v=>Math.max(1,String(v??'').split('\n').length);
function hash(str){let h1=0xdeadbeef,h2=0x41c6ce57;for(let i=0;i<str.length;i++){const c=str.charCodeAt(i);h1=Math.imul(h1^c,2654435761);h2=Math.imul(h2^c,1597334677)}h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);return (4294967296*(2097151&h2)+(h1>>>0)).toString(36)}

/* ---------- storage (IndexedDB, so images are not limited by localStorage quota) ---------- */
function idb(mode,fn){return new Promise((res,rej)=>{const o=indexedDB.open('axis-admin',1);o.onupgradeneeded=()=>o.result.createObjectStore('kv');o.onerror=()=>rej(o.error);o.onsuccess=()=>{const tx=o.result.transaction('kv',mode),r=fn(tx.objectStore('kv'));tx.oncomplete=()=>{o.result.close();res(r.result)};tx.onerror=tx.onabort=()=>rej(tx.error)}})}
const idbGet=()=>idb('readonly',s=>s.get('content')),idbSet=v=>idb('readwrite',s=>s.put(v,'content')),idbDel=()=>idb('readwrite',s=>s.delete('content'));

/* ---------- editable text fields ---------- */
const fields=[];
const F=(group,key,label,get,opt)=>fields.push(Object.assign({group,key,label,get:typeof get==='string'?()=>$(get):get},opt));
const nth=(sel,i)=>()=>$$(sel)[i];
const G1='الشريط العلوي',G2='الرئيسية',G3='قسم المشاريع (العناوين)',G4='قسم الخبرات',G5='قسم عن AXIS',G6='قسم منهجنا',G7='قسم لنبدأ (التواصل)',G8='التذييل وشريط التنقل السفلي';
['أعمالنا','خبراتنا','عن AXIS'].forEach((d,i)=>F(G1,'nav.'+i,'رابط القائمة '+(i+1),nth('header nav a',i)));
F(G1,'nav.cta','زر الشريط العلوي','.nav-cta');
F(G2,'hero.eyebrow','السطر الصغير أعلى العنوان','.hero .eyebrow');
F(G2,'hero.h1','العنوان الرئيسي','.hero h1');
F(G2,'hero.p','الشرح','.hero-copy>p');
F(G2,'hero.btn','الزر الرئيسي','.hero-actions .button');
F(G2,'hero.link','الرابط الثانوي','.hero-actions .text-link');
F(G2,'hero.foot1','سطر أسفل (يمين)',nth('.hero-foot span',0));
F(G2,'hero.foot2','سطر أسفل (يسار)',nth('.hero-foot span',1));
F(G2,'hero.artLabel','نص أعلى بطاقة الشعار','.art-label');
F(G2,'hero.artCaption','نص داخل بطاقة الشعار','.art-caption');
F(G2,'hero.artProject','شريط أسفل بطاقة الشعار','.art-project');
[0,1,2,3].forEach(i=>F(G2,'disc.'+i,'شريط التخصصات '+(i+1),nth('.disciplines span',i)));
F(G3,'work.eyebrow','السطر الصغير','#work .section-head .eyebrow');
F(G3,'work.h2','العنوان','#work .section-head h2');
F(G3,'work.p','الشرح','#work .section-head>p');
F(G3,'work.note','الملاحظة أسفل المشاريع','.project-note span');
F(G3,'work.noteLink','رابط الملاحظة','.project-note a');
F(G4,'exp.eyebrow','السطر الصغير','#expertise .section-head .eyebrow');
F(G4,'exp.h2','العنوان','#expertise .section-head h2');
F(G4,'exp.p','الشرح','#expertise .section-head>p');
[0,1,2].forEach(i=>{F(G4,'svc.'+i+'.h3','الخدمة '+(i+1)+' — العنوان',nth('.services article h3',i));F(G4,'svc.'+i+'.p','الخدمة '+(i+1)+' — الشرح',nth('.services article p',i));F(G4,'svc.'+i+'.en','الخدمة '+(i+1)+' — السطر الإنجليزي',nth('.services .service-en',i))});
F(G5,'about.eyebrow','السطر الصغير','#about .eyebrow');
F(G5,'about.h2','العنوان','#about h2');
F(G5,'about.lead','الجملة البارزة','.about-copy .lead');
F(G5,'about.p','الشرح','.about-copy p:not(.lead)');
[0,1,2].forEach(i=>F(G5,'about.val.'+i,'القيمة '+(i+1),nth('.values span',i)));
F(G6,'proc.eyebrow','السطر الصغير','.process .eyebrow');
F(G6,'proc.h2','العنوان','.process h2');
[0,1,2,3].forEach(i=>{F(G6,'step.'+i+'.h3','الخطوة '+(i+1)+' — العنوان',nth('.steps article h3',i));F(G6,'step.'+i+'.p','الخطوة '+(i+1)+' — الشرح',nth('.steps article p',i))});
F(G7,'contact.eyebrow','السطر الصغير','#contact .eyebrow');
F(G7,'contact.h2','العنوان','#contact h2');
F(G7,'contact.p','الشرح','.contact-side>p');
F(G7,'contact.label','عنوان حقل الكتابة','.contact-side label');
F(G7,'contact.ph','النص التوضيحي داخل الحقل','#brief',{attr:'placeholder'});
F(G7,'contact.btn','الزر','#copy-brief');
F(G7,'contact.feedback','الملاحظة أسفل الزر','#feedback');
F(G8,'footer.tag','جملة التذييل',nth('footer>span',0));
F(G8,'footer.copy','حقوق النشر',nth('footer>span',1));
['الرئيسية','المشاريع','الخبرات','عن AXIS','منهجنا','لنبدأ'].forEach((d,i)=>F(G8,'scene.'+i,'اسم القسم '+(i+1)+' في الشريط السفلي',()=>null,{virtual:true,def:d}));

function toText(el,f){if(f.attr)return el.getAttribute(f.attr)||'';const c=el.cloneNode(true);$$('.line',c).forEach(n=>n.remove());$$('br',c).forEach(n=>n.replaceWith('\n'));$$('span,b,strong',c).forEach(n=>n.replaceWith('*'+n.textContent+'*'));return c.textContent.trim()}
const toHTML=(text,tag)=>esc(text).replace(/\*([^*\n]+)\*/g,'<'+tag+'>$1</'+tag+'>').replace(/\n/g,'<br>');

const DEFAULT_PROJECTS=[
{id:'store',style:'store',eco:'AXIS ECOSYSTEM',big:'AXIS\nSTORE',tag:'DIGITAL. CONNECTED. YOURS.',bottom:'تجربة تسوّق رقمية متكاملة',title:'AXIS STORE',meta:'متجر رقمي · تطوير وتصميم',summary:'واجهة واحدة تجمع الخدمات الرقمية مع تجربة عميل واضحة ومترابطة.',type:'01 / متجر رقمي',desc:'مشروع AXIS للتجارة والخدمات الرقمية، يجمع عرض الخدمات وحسابات العملاء ضمن تجربة تحمل هوية الشركة.',features:['واجهة متجر بهوية AXIS البصرية','حسابات وملفات للعملاء','تكامل مع مجتمع AXIS'],url:'https://axissstore.com',cover:'',gallery:[]},
{id:'community',style:'community',eco:'AXIS ECOSYSTEM',big:'مجتمع\nAXIS.',tag:'مساحة تجمعنا',bottom:'أفكار. تجارب. تواصل.',title:'مجتمع AXIS',meta:'منصة اجتماعية · تجربة مستخدم',summary:'مساحة للعملاء لمشاركة اليوميات والأفكار وبناء علاقات داخل عالم AXIS.',type:'02 / مجتمع رقمي',desc:'مساحة اجتماعية داخل منظومة AXIS STORE، تتيح للعملاء مشاركة تجاربهم والتواصل مع بعضهم ومتابعة منشورات الإدارة.',features:['منشورات وصور وملفات شخصية','طلبات صداقة ورسائل بين الأعضاء','إعلانات رسمية وإدارة للمجتمع'],url:'https://axissstore.com/community/',cover:'',gallery:[]}];

let content={texts:{},images:{}};

/* ---------- apply content to the page ---------- */
function applyTexts(){
 fields.forEach(f=>{
  if(f.virtual)return;
  const el=f.get();if(!el)return;
  f.def=toText(el,f);
  const hl=el.querySelector('span:not(.line),b,strong');f.tag=hl?hl.tagName.toLowerCase():'span';
  const line=el.querySelector(':scope>.line');f.keep=line?line.outerHTML+' ':'';
  const v=content.texts[f.key];
  if(v==null||v===f.def)return;
  if(f.attr)el.setAttribute(f.attr,v);else el.innerHTML=f.keep+toHTML(v,f.tag);
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
 const list=content.projects||DEFAULT_PROJECTS,grid=$('.project-grid');
 if(grid&&content.projects){
  grid.innerHTML=list.map((p,i)=>'<article class="project"><button class="project-visual '+(p.style==='community'?'community':'store')+(p.cover?' has-cover':'')+'" data-project="'+esc(p.id)+'" aria-label="عرض تفاصيل '+esc(p.title)+'"><div class="visual-top"><span>'+esc(p.eco)+'</span><span>'+String(i+1).padStart(2,'0')+'</span></div>'+bigTitle(p)+'<span class="visual-bottom">'+esc(p.bottom)+' <span>عرض المشروع +</span></span></button><div class="project-info"><h3>'+esc(p.title)+'</h3><span>'+esc(p.meta)+'</span></div><p>'+esc(p.summary)+'</p></article>').join('');
  list.forEach((p,i)=>{if(p.cover)$$('.project-visual',grid)[i].style.backgroundImage='linear-gradient(#0b204580,#0b2045d0),url("'+p.cover+'")'});
 }
 window.AXIS_PROJECTS=Object.fromEntries(list.map(p=>[p.id,{type:p.type,title:p.title,desc:p.desc,features:p.features||[],url:p.url,gallery:p.gallery||[]}]));
}
function applyImages(){
 const im=content.images;
 if(im.heroLogo){const w=$('.identity-window');if(w)w.style.backgroundImage='url("'+im.heroLogo+'")'}
 if(im.about){const host=$('#about>div');if(host){const img=document.createElement('img');img.className='about-photo';img.alt='';img.src=im.about;host.append(img)}}
}
function toast(msg){const t=document.createElement('div');t.id='axis-toast';t.textContent=msg;document.body.append(t);setTimeout(()=>t.remove(),3200)}

async function init(){
 let draft=null;try{draft=await idbGet()}catch(e){}
 const best=[draft,window.AXIS_PUBLISHED].filter(Boolean).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0))[0];
 if(best)content=best;
 content.texts=content.texts||{};content.images=content.images||{};
 [applyTexts,applyProjects,applyImages].forEach(fn=>{try{fn()}catch(e){console.error(e)}});
 const done=()=>{document.documentElement.classList.remove('axis-loading');if(sessionStorage.getItem('axis-saved')){sessionStorage.removeItem('axis-saved');toast('تم حفظ التعديلات.')}};
 const s=document.createElement('script');s.src=APP_SRC;s.onload=s.onerror=done;document.body.append(s);
 const brand=$('header .brand');
 // The logo opens the panel only on a device where the admin has signed in before; for visitors it stays a normal home link.
 if(brand)brand.addEventListener('click',e=>{if(!isAdminDevice())return;e.preventDefault();e.stopPropagation();openAdmin()});
 // First sign-in on a new device: open the site with #admin at the end of the address.
 const viaHash=()=>{if(location.hash==='#admin'){history.replaceState(null,'',location.pathname+location.search);openAdmin()}};
 window.addEventListener('hashchange',viaHash);viaHash();
}

/* ---------- admin panel ---------- */
const isAdminDevice=()=>{try{return localStorage.getItem('axis-admin-device')==='1'}catch(e){return false}};
let root=null,work=null,dirty=false,tab='texts';const openProj=new Set();
function openAdmin(){
 if(root)return;
 root=document.createElement('div');root.id='axis-admin';
 ['keydown','wheel','touchstart','touchend'].forEach(t=>root.addEventListener(t,e=>e.stopPropagation(),{passive:true}));
 document.body.append(root);
 if(sessionStorage.getItem('axis-admin')==='1')showPanel();else showLogin();
}
function closeAdmin(){if(dirty&&!confirm('لديك تعديلات غير محفوظة. إغلاق بدون حفظ؟'))return;root.remove();root=null;dirty=false}
function showLogin(){
 root.innerHTML='<form class="aa-login"><h2>لوحة تحكم AXIS</h2><label>كلمة المرور<input type="password" autocomplete="current-password"></label><div class="aa-err"></div><div class="aa-row"><button type="submit" class="aa-primary">دخول</button><button type="button" data-act="cancel">رجوع للموقع</button></div></form>';
 const form=$('form',root),input=$('input',root);input.focus();
 $('[data-act=cancel]',root).onclick=()=>{root.remove();root=null};
 form.onsubmit=e=>{e.preventDefault();if(hash(input.value)===(content.passHash||hash(DEFAULT_PASSWORD))){sessionStorage.setItem('axis-admin','1');try{localStorage.setItem('axis-admin-device','1')}catch(e){}showPanel()}else{$('.aa-err',root).textContent='كلمة المرور غير صحيحة.';input.select()}};
}
function showPanel(){
 work=clone(content);work.texts=work.texts||{};work.images=work.images||{};work.projects=work.projects||clone(DEFAULT_PROJECTS);dirty=false;
 root.innerHTML='<div class="aa-bar"><strong>لوحة تحكم AXIS</strong><span class="aa-status"></span><button class="aa-primary" data-act="save">حفظ التعديلات</button><button data-act="close">إغلاق</button></div><div class="aa-tabs"><button data-tab="texts">النصوص والأقسام</button><button data-tab="projects">المشاريع</button><button data-tab="images">الصور</button><button data-tab="settings">النشر والإعدادات</button></div><div class="aa-body"></div>';
 root.addEventListener('click',onClick);root.addEventListener('input',onInput);
 render();
}
function markDirty(){dirty=true;$('.aa-status',root).textContent='تعديلات غير محفوظة'}
function render(){
 $$('.aa-tabs button',root).forEach(b=>b.dataset.tab===tab?b.setAttribute('aria-current','page'):b.removeAttribute('aria-current'));
 $('.aa-body',root).innerHTML={texts:viewTexts,projects:viewProjects,images:viewImages,settings:viewSettings}[tab]();
}
const field=(attrs,label,val,area)=>'<label>'+label+(area?'<textarea '+attrs+' rows="'+rows(val)+'">'+esc(val)+'</textarea>':'<input '+attrs+' value="'+esc(val)+'">')+'</label>';
const thumb=(src,act,contain)=>src?'<div class="aa-thumb'+(contain?' aa-contain':'')+'" style="background-image:url(&quot;'+src+'&quot;)"><button type="button" '+act+' title="حذف الصورة">×</button></div>':'<div class="aa-thumb aa-empty">لا توجد صورة</div>';
function viewTexts(){
 const groups=[...new Set(fields.map(f=>f.group))];
 return '<p class="aa-hint">عدّل أي نص ثم اضغط «حفظ التعديلات». سطر جديد = سطر جديد في الموقع، وضع الكلمة بين نجمتين *هكذا* لتظهر مميّزة باللون.</p>'+groups.map(g=>'<details><summary><span class="aa-grow">'+g+'</span></summary><div class="aa-fields">'+fields.filter(f=>f.group===g&&(f.virtual||f.def!=null)).map(f=>{const v=work.texts[f.key]??f.def;return field('data-key="'+f.key+'"',f.label,v,true)}).join('')+'</div></details>').join('');
}
function viewProjects(){
 return '<p class="aa-hint">أضف مشاريع جديدة أو عدّل الموجودة. صورة الغلاف تظهر على بطاقة المشروع، وصور المعرض تظهر عند فتح تفاصيله.</p>'+work.projects.map((p,i)=>{const a=f=>'data-p="'+i+'" data-f="'+f+'"';
  return '<details'+(openProj.has(p.id)?' open':'')+' data-pid="'+esc(p.id)+'"><summary><span class="aa-grow">'+String(i+1).padStart(2,'0')+' — '+esc(p.title||'مشروع بدون اسم')+'</span><button type="button" class="aa-small" data-act="up" data-i="'+i+'" title="تحريك للأعلى">↑</button><button type="button" class="aa-small" data-act="down" data-i="'+i+'" title="تحريك للأسفل">↓</button><button type="button" class="aa-small aa-danger" data-act="del-project" data-i="'+i+'">حذف</button></summary><div class="aa-fields">'
  +'<div class="aa-two">'+field(a('title'),'اسم المشروع',p.title)+field(a('meta'),'التصنيف (بجانب الاسم)',p.meta)+'</div>'
  +field(a('summary'),'شرح قصير تحت البطاقة',p.summary,true)
  +'<div class="aa-sub">بطاقة المشروع</div>'
  +'<div class="aa-two"><label>شكل البطاقة<select '+a('style')+'><option value="store"'+(p.style!=='community'?' selected':'')+'>عنوان كبير</option><option value="community"'+(p.style==='community'?' selected':'')+'>عنوان مع وسم مائل</option></select></label>'+field(a('eco'),'السطر العلوي الصغير',p.eco)+'</div>'
  +'<div class="aa-two">'+field(a('big'),'العنوان الكبير داخل البطاقة (السطر الأخير ملوّن)',p.big,true)+field(a('tag'),'السطر/الوسم الصغير',p.tag)+'</div>'
  +field(a('bottom'),'السطر السفلي للبطاقة',p.bottom)
  +'<label>صورة الغلاف (اختياري)</label><div class="aa-img">'+thumb(p.cover,'data-act="cover-del" data-i="'+i+'"')+'<button type="button" data-act="cover-pick" data-i="'+i+'">اختيار صورة</button></div>'
  +'<div class="aa-sub">نافذة تفاصيل المشروع</div>'
  +field(a('type'),'السطر الصغير أعلى النافذة',p.type)
  +field(a('desc'),'الشرح الكامل',p.desc,true)
  +field(a('features'),'المميزات (كل ميزة في سطر)',(p.features||[]).join('\n'),true)
  +field(a('url'),'رابط المشروع (اتركه فارغاً لإخفاء زر الزيارة)',p.url)
  +'<label>صور المعرض</label><div class="aa-img">'+(p.gallery||[]).map((g,j)=>thumb(g,'data-act="gal-del" data-i="'+i+'" data-j="'+j+'"')).join('')+'<button type="button" data-act="gal-add" data-i="'+i+'">إضافة صور</button></div>'
  +'</div></details>'}).join('')+'<div><button type="button" class="aa-primary" data-act="add-project">+ إضافة مشروع</button></div>';
}
function viewImages(){
 const im=work.images;
 return '<div class="aa-card"><h3>شعار الصفحة الرئيسية</h3><p>يظهر داخل البطاقة المقوّسة. يُفضّل شعار بخلفية شفافة (PNG).</p><div class="aa-img">'+(im.heroLogo?thumb(im.heroLogo,'data-act="img-del" data-n="heroLogo"',true):'<div class="aa-thumb aa-contain" style="background-image:url(axis-logo.png)"></div>')+'<button type="button" data-act="img-pick" data-n="heroLogo">تغيير الشعار</button></div></div>'
 +'<div class="aa-card"><h3>صورة قسم «عن AXIS»</h3><p>اختيارية، تظهر تحت عنوان القسم.</p><div class="aa-img">'+thumb(im.about,'data-act="img-del" data-n="about"')+'<button type="button" data-act="img-pick" data-n="about">اختيار صورة</button></div></div>'
 +'<p class="aa-hint">صور المشاريع (الغلاف والمعرض) تُضاف من تبويب «المشاريع».</p>';
}
function viewSettings(){
 return '<div class="aa-card"><h3>نشر التعديلات للزوار</h3><p>«حفظ التعديلات» يحفظها في هذا المتصفح فقط. ليراها كل الزوار: نزّل ملف النشر ثم ضعه مكان الملف content-data.js في مجلد الموقع على الاستضافة.</p><div><button type="button" class="aa-primary" data-act="publish">تنزيل ملف النشر content-data.js</button></div></div>'
 +'<div class="aa-card"><h3>كلمة المرور</h3><div class="aa-row"><label>كلمة مرور جديدة<input type="password" id="aa-newpass" autocomplete="new-password"></label><button type="button" data-act="set-pass">تغيير</button></div><p>تُحفظ مع التعديلات، وتنتقل للزوار مع ملف النشر.</p></div>'
 +'<div class="aa-card"><h3>صلاحية هذا الجهاز</h3><p>هذا الجهاز مسجَّل كجهاز أدمن، لذلك يفتح الضغط على الشعار لوحة التحكم. للدخول من جهاز آخر افتح الموقع وأضف <b dir="ltr">#admin</b> في آخر العنوان.</p><div><button type="button" data-act="logout">تسجيل الخروج وإلغاء صلاحية هذا الجهاز</button></div></div>'
 +'<div class="aa-card"><h3>التراجع</h3><p>يحذف كل التعديلات المحفوظة في هذا المتصفح ويعيد الموقع إلى آخر نسخة منشورة.</p><div><button type="button" class="aa-danger" data-act="reset">حذف تعديلات هذا المتصفح</button></div></div>';
}
function onInput(e){
 const t=e.target;
 if(t.dataset.key){const f=fields.find(x=>x.key===t.dataset.key);if(t.value===f.def)delete work.texts[f.key];else work.texts[f.key]=t.value;markDirty()}
 else if(t.dataset.p){const p=work.projects[+t.dataset.p],k=t.dataset.f;p[k]=k==='features'?t.value.split('\n').map(s=>s.trim()).filter(Boolean):t.value;markDirty()}
}
function pickImages(multiple,max){return new Promise(res=>{const inp=document.createElement('input');inp.type='file';inp.accept='image/*';inp.multiple=!!multiple;inp.onchange=async()=>{const out=[];for(const file of inp.files){try{out.push(await readImage(file,max))}catch(e){toast('تعذّر قراءة الصورة: '+file.name)}}res(out)};inp.click()})}
function readImage(file,max){return new Promise((res,rej)=>{const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{const k=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.width*k));c.height=Math.max(1,Math.round(img.height*k));c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);const alpha=/png|webp|svg|gif/.test(file.type);res(alpha?c.toDataURL('image/webp',.9):c.toDataURL('image/jpeg',.82))};img.onerror=()=>{URL.revokeObjectURL(url);rej(new Error('image'))};img.src=url})}
async function persist(){work.updatedAt=Date.now();await idbSet(work);content=clone(work);dirty=false;$('.aa-status',root).textContent=''}
async function onClick(e){
 const b=e.target.closest('button');if(!b||!root.contains(b))return;
 if(b.dataset.tab){$$('details[data-pid]',root).forEach(d=>d.open?openProj.add(d.dataset.pid):openProj.delete(d.dataset.pid));tab=b.dataset.tab;render();return}
 const act=b.dataset.act;if(!act)return;
 if(b.closest('summary'))e.preventDefault();
 const i=+b.dataset.i,P=work.projects;
 const redraw=()=>{$$('details[data-pid]',root).forEach(d=>d.open?openProj.add(d.dataset.pid):openProj.delete(d.dataset.pid));const y=$('.aa-body',root).scrollTop;render();$('.aa-body',root).scrollTop=y;markDirty()};
 try{
  if(act==='close')closeAdmin();
  else if(act==='save'){await persist();sessionStorage.setItem('axis-saved','1');location.reload()}
  else if(act==='add-project'){const id='p'+Date.now();P.push({id,style:'store',eco:'AXIS',big:'',tag:'',bottom:'',title:'مشروع جديد',meta:'',summary:'',type:String(P.length+1).padStart(2,'0')+' / مشروع',desc:'',features:[],url:'',cover:'',gallery:[]});openProj.add(id);redraw()}
  else if(act==='del-project'){if(confirm('حذف المشروع «'+P[i].title+'»؟')){P.splice(i,1);redraw()}}
  else if(act==='up'&&i>0){[P[i-1],P[i]]=[P[i],P[i-1]];redraw()}
  else if(act==='down'&&i<P.length-1){[P[i+1],P[i]]=[P[i],P[i+1]];redraw()}
  else if(act==='cover-pick'){const [src]=await pickImages(false,1400);if(src){P[i].cover=src;redraw()}}
  else if(act==='cover-del'){P[i].cover='';redraw()}
  else if(act==='gal-add'){const list=await pickImages(true,1400);if(list.length){P[i].gallery=(P[i].gallery||[]).concat(list);redraw()}}
  else if(act==='gal-del'){P[i].gallery.splice(+b.dataset.j,1);redraw()}
  else if(act==='img-pick'){const [src]=await pickImages(false,b.dataset.n==='heroLogo'?900:1400);if(src){work.images[b.dataset.n]=src;redraw()}}
  else if(act==='img-del'){delete work.images[b.dataset.n];redraw()}
  else if(act==='publish'){await persist();const blob=new Blob(['// AXIS — ملف النشر. ضعه في مجلد الموقع باسم content-data.js\nwindow.AXIS_PUBLISHED='+JSON.stringify(content)+';\n'],{type:'text/javascript'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='content-data.js';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);toast('تم تنزيل ملف النشر.')}
  else if(act==='set-pass'){const v=$('#aa-newpass',root).value;if(v.length<6){toast('اكتب كلمة مرور من 6 أحرف على الأقل.');return}work.passHash=hash(v);await persist();$('#aa-newpass',root).value='';toast('تم تغيير كلمة المرور.')}
  else if(act==='logout'){if(dirty&&!confirm('لديك تعديلات غير محفوظة. الخروج بدون حفظ؟'))return;sessionStorage.removeItem('axis-admin');try{localStorage.removeItem('axis-admin-device')}catch(e){}dirty=false;root.remove();root=null;toast('تم تسجيل الخروج.')}
  else if(act==='reset'){if(confirm('حذف كل التعديلات المحفوظة في هذا المتصفح؟')){await idbDel();location.reload()}}
 }catch(err){console.error(err);toast('تعذّر تنفيذ العملية: '+(err&&err.message||err))}
}
init();
})();
