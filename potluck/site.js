(function(){
var still=matchMedia("(prefers-reduced-motion: reduce)").matches,$=function(id){return document.getElementById(id)};
var io=!still&&"IntersectionObserver" in window?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}})},{rootMargin:"0px 0px -8% 0px"}):null;
document.querySelectorAll("[data-rv]").forEach(function(el){if(!io){el.classList.add("in");return}
el.style.setProperty("--d",Array.prototype.indexOf.call(el.parentNode.children,el)%4*110+"ms");io.observe(el)});
// Falling leaves.
var c=$("drift");if(c&&!still){var x=c.getContext("2d"),W,H,dpr=Math.min(devicePixelRatio||1,2),fl=[],cols=["#B5432A","#D9A21B","#5F6F23","#C9772B","#6FA7A0"];
var size=function(){W=innerWidth;H=innerHeight;c.width=W*dpr;c.height=H*dpr;x.setTransform(dpr,0,0,dpr,0,0)};size();addEventListener("resize",size);
for(var i=0;i<(W<600?14:26);i++)fl.push({x:Math.random()*W,y:Math.random()*H,s:.6+Math.random()*.8,v:.3+Math.random()*.6,p:Math.random()*6,c:cols[i%5]});
(function loop(t){if(!document.hidden){x.clearRect(0,0,W,H);fl.forEach(function(f){f.y+=f.v;f.x+=Math.sin(t/1400+f.p)*.5;if(f.y>H+10){f.y=-10;f.x=Math.random()*W}
x.save();x.translate(f.x,f.y);x.rotate(Math.sin(t/900+f.p)*1.2);x.scale(f.s,f.s);x.globalAlpha=.32;x.fillStyle=f.c;x.beginPath();x.ellipse(0,0,4,8,0,0,6.3);x.fill();x.restore()})}requestAnimationFrame(loop)})(0)}
document.querySelectorAll(".map").forEach(function(m){var F=JSON.parse(m.querySelector("script").textContent),bs=m.querySelectorAll(".pick button");
function show(i){bs.forEach(function(b,j){b.setAttribute("aria-pressed",i===j)});
m.querySelectorAll(".dest li").forEach(function(li){li.classList.toggle("on",F[i][1].indexOf(li.dataset.d)>=0)});m.querySelector(".say").textContent=F[i][2]}
bs.forEach(function(b,i){b.onclick=function(){show(i)}});show(0)});
})();
