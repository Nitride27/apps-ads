(function(){
var still=matchMedia("(prefers-reduced-motion: reduce)").matches,$=function(id){return document.getElementById(id)};
// Scroll reveal, staggered within each row; counters count up as they arrive.
function count(el){var to=+el.dataset.count,t0=null;if(!to)return;
(function step(t){t0=t0||t;var k=Math.min(1,(t-t0)/1300);el.textContent=Math.round(to*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(step)})(performance.now())}
var io=!still&&"IntersectionObserver" in window?new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;
e.target.classList.add("in");io.unobserve(e.target);e.target.querySelectorAll("[data-count]").forEach(count)})},{rootMargin:"0px 0px -8% 0px"}):null;
document.querySelectorAll("[data-rv]").forEach(function(el){
if(!io){el.classList.add("in");return}
el.style.setProperty("--d",Array.prototype.indexOf.call(el.parentNode.children,el)%4*110+"ms");
el.querySelectorAll("[data-count]").forEach(function(n){n.textContent="0"});io.observe(el)});
// Snow.
var c=$("snow");if(c&&!still){var x=c.getContext("2d"),W,H,dpr=Math.min(devicePixelRatio||1,2),fl=[];
var size=function(){W=innerWidth;H=innerHeight;c.width=W*dpr;c.height=H*dpr;x.setTransform(dpr,0,0,dpr,0,0)};size();addEventListener("resize",size);
for(var i=0;i<(W<600?35:70);i++)fl.push({x:Math.random()*W,y:Math.random()*H,r:.8+Math.random()*2.6,v:.25+Math.random()*.7,p:Math.random()*6});
(function loop(t){if(!document.hidden){x.clearRect(0,0,W,H);x.fillStyle="rgba(255,255,255,.8)";
fl.forEach(function(f){f.y+=f.v;f.x+=Math.sin(t/1600+f.p)*.35;if(f.y>H+4){f.y=-4;f.x=Math.random()*W}
x.globalAlpha=.35+f.r/5;x.beginPath();x.arc(f.x,f.y,f.r,0,6.3);x.fill()})}requestAnimationFrame(loop)})(0)}
// Where-your-data-goes map.
document.querySelectorAll(".map").forEach(function(m){var F=JSON.parse(m.querySelector("script").textContent),bs=m.querySelectorAll(".pick button");
function show(i){bs.forEach(function(b,j){b.setAttribute("aria-pressed",i===j)});
m.querySelectorAll(".dest li").forEach(function(li){li.classList.toggle("on",F[i][1].indexOf(li.dataset.d)>=0)});m.querySelector(".say").textContent=F[i][2]}
bs.forEach(function(b,i){b.onclick=function(){show(i)}});show(0)});
})();
