// Loads the published content from the store, then the content layer.
// If the store is unreachable the site still renders with its built-in defaults.
(function(){
'use strict';
var host=location.hostname.split('.');
// Empty config = the store lives on the parent domain (portfolio.example.com -> example.com).
var origin=window.AXIS_STORE_ORIGIN||(host.length>2?location.protocol+'//'+host.slice(1).join('.'):'');
window.AXIS_STORE_ORIGIN=origin;
var started=false;
function next(){
 if(started)return;started=true;
 var s=document.createElement('script');s.src='content.js?v=2';document.body.appendChild(s);
}
if(!origin){next();return}
var s=document.createElement('script');
s.src=origin+'/api/v1/portfolio/content.js?t='+Date.now();
s.onload=s.onerror=next;
document.head.appendChild(s);
setTimeout(next,4000);
})();
