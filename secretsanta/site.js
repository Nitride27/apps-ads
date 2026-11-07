(function(){
var still=matchMedia("(prefers-reduced-motion: reduce)").matches,$=function(id){return document.getElementById(id)};
var esc=function(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;")};
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
// Confetti from a point.
function burst(r){if(still)return;var C=["#ffc94a","#ffffff","#e0303a","#2f8a58","#447cf0"],cx=r.left+r.width/2,cy=r.top+r.height/3;
for(var i=0;i<30;i++){var s=document.createElement("span"),a=Math.random()*6.28,v=60+Math.random()*120;s.className="cf";
s.style.cssText="left:"+cx+"px;top:"+cy+"px;background:"+C[i%5]+";--dx:"+Math.cos(a)*v+"px;--dy:"+(Math.sin(a)*v-90)+"px;--r:"+(Math.random()*900-450)+"deg";
s.onanimationend=function(){this.remove()};document.body.appendChild(s)}}
// Where-your-data-goes map.
document.querySelectorAll(".map").forEach(function(m){var F=JSON.parse(m.querySelector("script").textContent),bs=m.querySelectorAll(".pick button");
function show(i){bs.forEach(function(b,j){b.setAttribute("aria-pressed",i===j)});
m.querySelectorAll(".dest li").forEach(function(li){li.classList.toggle("on",F[i][1].indexOf(li.dataset.d)>=0)});m.querySelector(".say").textContent=F[i][2]}
bs.forEach(function(b,i){b.onclick=function(){show(i)}});show(0)});
// Try-a-draw demo: the same rules as the app, by random restarts.
var box=$("names");if(!box)return;var names=["Ana","Ben","Cara","Dev","Eli"],envs=$("envs"),msg=$("msg");
function chips(){box.innerHTML=names.map(function(n,i){return '<span class="chip">'+esc(n)+'<button type="button" data-i="'+i+'" aria-label="Remove '+esc(n)+'">×</button></span>'}).join("")}
box.onclick=function(e){var i=e.target.dataset.i;if(i==null)return;names.splice(+i,1);chips();envs.innerHTML="";msg.textContent=""};
$("add").onsubmit=function(e){e.preventDefault();var v=$("nm").value.trim().slice(0,14);if(!v)return;
if(names.some(function(n){return n.toLowerCase()===v.toLowerCase()})){msg.textContent=v+" is already in the group.";return}
if(names.length>=12){msg.textContent="The demo stops at 12. The app takes as many as you like.";return}
names.push(v);$("nm").value="";chips();envs.innerHTML="";msg.textContent=""};
function ok(g,r,bad){return g!==r&&!bad.some(function(p){return p[0]===g&&p[1]===r||p[1]===g&&p[0]===r})}
function solve(bad){for(var t=0;t<400;t++){var r=names.slice();for(var i=r.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),k=r[i];r[i]=r[j];r[j]=k}
if(names.every(function(g,i){return ok(g,r[i],bad)}))return r}return null}
$("draw").onclick=function(){if(names.length<3){msg.textContent="Add at least 3 names to draw.";return}
var bad=$("couple").checked?[["Ben","Cara"]]:[],res=solve(bad);
if(!res){envs.innerHTML="";msg.textContent="No draw fits these rules. The app tells you the same, and you can loosen a rule.";return}
envs.innerHTML="";msg.textContent="Shuffling…";box.classList.add("shuffle");
setTimeout(function(){box.classList.remove("shuffle");msg.textContent="Done. Each envelope is for one person: tap one to open it.";
envs.innerHTML=names.map(function(g,i){return '<button type="button" class="env" style="--d:'+i*90+'ms" aria-label="Open '+esc(g)+'’s envelope">'
+'<span class="body"></span><span class="note">You’re Secret Santa for<b>'+esc(res[i])+'</b></span><span class="flap"></span><span class="seal"></span><span class="to">For '+esc(g)+'</span></button>'}).join("");
envs.querySelectorAll(".env").forEach(function(b,i){b.onclick=function(){if(b.classList.contains("open"))return;b.classList.add("open");
b.setAttribute("aria-label",names[i]+" is Secret Santa for "+res[i]);msg.textContent=names[i]+" is Secret Santa for "+res[i]+".";burst(b.getBoundingClientRect())}})},still?0:1000)};
chips();
})();
