// Tide demo: day picker, scrubbable chart, your-level line, tide clock, tide staff, draggable moon, count-ups.
// Curves are illustrative (semidiurnal + diurnal term, range set by moon phase), not a real station.
(function(){
var $=function(i){return document.getElementById(i)},NS="http://www.w3.org/2000/svg",TAU=2*Math.PI,SYN=29.530588;
var calm=matchMedia("(prefers-reduced-motion: reduce)").matches;
var svg=$("tc");if(!svg)return;
function el(n,at,par){var e=document.createElementNS(NS,n);for(var k in at)e.setAttribute(k,at[k]);par.appendChild(e);return e}
function fmt(t){var m=Math.round((t%24+24)%24*60)%1440,hh=m/60|0,mm=m%60;return(hh%12||12)+":"+(mm<10?"0":"")+mm+(hh<12?" AM":" PM")}
function dur(x){var m=Math.max(0,Math.round(x*60));return m>=60?(m/60|0)+" h "+(m%60)+" min":m+" min"}
var now=new Date(),nt=now.getHours()+now.getMinutes()/60;
var PHI0=(now-Date.UTC(2000,0,6,18,14))/864e5%SYN/SYN*TAU; // tonight's real moon phase, 0 = new moon
var S={d:0,phi:PHI0,pos:calm?nt:0,lv:4.6};
function mp(d){return S.phi+d*TAU/SYN}
function amp(p){return 1.45+.85*Math.abs(Math.cos(p))}
function H(t){var x=t-14.5-.84*S.d;return 3.1+amp(mp(S.d))*Math.cos(TAU*x/12.42)+.3*Math.cos(TAU*(x+3)/24.84)}
function rating(p){var c=Math.abs(Math.cos(p));return c>.85?3:c>.55?2:c>.25?1:0}
var RATE=["Slow","Fair","Good","Excellent"],PH=["New moon","Waxing crescent","First quarter","Waxing gibbous","Full moon","Waning gibbous","Last quarter","Waning crescent"];
var LO=.2,HI=6,W=1000,T=60,B=250;
function X(t){return t/24*W}function Y(v){return B-(v-LO)/(HI-LO)*(B-T)}
var R={};function tween(key,set,ms){cancelAnimationFrame(R[key]);if(calm)return set(1);var t0=performance.now();(function st(n){var k=Math.min(1,(n-t0)/ms);set(1-Math.pow(1-k,3));if(k<1)R[key]=requestAnimationFrame(st)})(t0)}

// chart
var defs=el("defs",{},svg),cpr=el("rect",{x:0,y:0,width:W},el("clipPath",{id:"abvc"},defs));
el("rect",{x:0,y:T-20,width:X(6.6),height:B-T+20,class:"night"},svg);el("rect",{x:X(19.1),y:T-20,width:W-X(19.1),height:B-T+20,class:"night"},svg);
[0,6,12,18,24].forEach(function(t){el("line",{x1:X(t),x2:X(t),y1:B,y2:B+8,class:"tick"},svg);var l=el("text",{x:Math.min(W-4,Math.max(4,X(t))),y:B+30,class:"lab","text-anchor":t?t==24?"end":"middle":"start"},svg);l.textContent=t%24==0?"12 AM":t==12?"NOON":t>12?(t-12)+" PM":t+" AM"});
var water=el("path",{class:"water"},svg),abv=el("path",{class:"abv","clip-path":"url(#abvc)"},svg),curve=el("path",{class:"curve",pathLength:1},svg);
var bites=el("g",{class:"bites"},svg),exg=el("g",{class:"exg"},svg);
var nowl=el("line",{y1:T-34,y2:B,class:"now"},svg),nowt=el("text",{y:T-40,class:"nowlab","text-anchor":"middle"},svg);nowt.textContent="NOW";
var cur=el("line",{y1:T-20,y2:B,class:"cur"},svg),dot=el("circle",{r:8,class:"dot"},svg);
var lvg=el("g",{class:"lvg"},svg);el("line",{x1:0,x2:W,y1:0,y2:0},lvg);
var lvh=el("g",{class:"lvh",tabindex:0,role:"slider","aria-label":"Your level in feet","aria-valuemin":LO,"aria-valuemax":HI},lvg);
el("rect",{x:W-260,y:-45,width:260,height:90,class:"hit"},lvh);el("rect",{x:W-180,y:-16,width:180,height:32,rx:3},lvh);var lvt=el("text",{x:W-90,y:6,"text-anchor":"middle"},lvh);
var ext=[];
function band(c,w,cls){var a=Math.max(0,c-w),z=Math.min(24,c+w);if(z>a)el("rect",{x:X(a),y:B-7,width:X(z)-X(a),height:7,class:cls},bites)}
function draw(){
  var d="",i,t;
  for(i=0;i<=240;i++){t=i/10;d+=(i?"L":"M")+X(t).toFixed(1)+" "+Y(H(t)).toFixed(1)}
  curve.setAttribute("d",d);d+="L"+W+" "+B+"L0 "+B+"Z";water.setAttribute("d",d);abv.setAttribute("d",d);
  ext=[];var a=H(-8.05),b=H(-8);for(t=-8;t<32;t+=.05){var c=H(t+.05);if((b>a&&b>=c)||(b<a&&b<=c))ext.push({t:t,v:b,hi:b>a});a=b;b=c}
  exg.textContent="";ext.forEach(function(p){if(p.t<0||p.t>24)return;var g=el("g",{class:"ex"},exg);el("circle",{cx:X(p.t),cy:Y(p.v),r:5},g);var tx=el("text",{x:Math.min(W-95,Math.max(95,X(p.t))),y:Y(p.v)+(p.hi?-14:26),"text-anchor":"middle"},g);tx.textContent=(p.hi?"HIGH ":"LOW ")+fmt(p.t)});
  bites.textContent="";var tr=12+((mp(S.d)%TAU)+TAU)%TAU/TAU*24.84;for(var k=-3;k<4;k++){band(tr+k*12.42,1,"maj");band(tr+k*12.42+6.21,.5,"min")}
  var today=Math.abs(S.d)<.02;nowl.style.display=nowt.style.display=today?"":"none";nowl.setAttribute("x1",X(nt));nowl.setAttribute("x2",X(nt));nowt.setAttribute("x",X(nt));
  level();days();moon();scrub(S.pos);
}
function level(){
  var y=Y(S.lv);lvg.setAttribute("transform","translate(0 "+y+")");cpr.setAttribute("height",y);lvt.textContent="YOUR LEVEL "+S.lv.toFixed(1);
  lvh.setAttribute("aria-valuenow",S.lv.toFixed(1));lvh.setAttribute("aria-valuetext",S.lv.toFixed(1)+" feet");
  var iv=[],st=null,i,t;for(i=0;i<=288;i++){t=i/12;var up=H(t)>S.lv;if(up&&st==null)st=t;if((!up||i==288)&&st!=null){iv.push([st,t]);st=null}}
  var f=function(t){return t<=0||t>=24?"midnight":fmt(t)};
  $("tc-lv").innerHTML=iv.length?"Water above your level (<b>"+S.lv.toFixed(1)+" ft</b>): "+iv.map(function(r){return f(r[0])+" to "+f(r[1])}).join(", "):"The water stays below <b>"+S.lv.toFixed(1)+" ft</b> all day.";
}
function scrub(t){
  S.pos=Math.max(0,Math.min(24,t));var v=H(S.pos),r=H(S.pos+.05)>v;
  cur.setAttribute("x1",X(S.pos));cur.setAttribute("x2",X(S.pos));dot.setAttribute("cx",X(S.pos));dot.setAttribute("cy",Y(v));
  $("tc-read").innerHTML="<b>"+fmt(S.pos)+"</b><span>"+v.toFixed(1)+" ft</span><span class=\"dir\">"+(r?"Rising ↑":"Falling ↓")+"</span>";
  svg.setAttribute("aria-valuenow",S.pos.toFixed(2));svg.setAttribute("aria-valuetext",fmt(S.pos)+", "+v.toFixed(1)+" feet, "+(r?"rising":"falling"));
  clock(v);staff(v);
}
function at(e){var r=svg.getBoundingClientRect();scrub((e.clientX-r.left)/r.width*24)}
var drag=0,lvDrag=0;
svg.addEventListener("pointerdown",function(e){if(e.target.closest(".lvh"))return;drag=1;svg.setPointerCapture(e.pointerId);at(e)});
svg.addEventListener("pointermove",function(e){if(lvDrag)return;if(drag||e.pointerType=="mouse")at(e)});
svg.addEventListener("pointerup",function(){drag=0});
svg.addEventListener("pointerleave",function(e){if(!drag&&!lvDrag&&e.pointerType=="mouse")glide(nt)});
svg.addEventListener("keydown",function(e){if(e.target!=svg)return;var s={ArrowRight:.25,ArrowLeft:-.25,PageUp:1,PageDown:-1}[e.key];if(e.key=="Home")s=-S.pos;if(e.key=="End")s=24-S.pos;if(s!=null){e.preventDefault();scrub(S.pos+s)}});
function glide(to){var a=S.pos;tween("pos",function(k){scrub(a+(to-a)*k)},700)}
// your level: drag the tab on the right
function setLv(v){S.lv=Math.round(Math.max(LO,Math.min(HI,v))*10)/10;level();staff(H(S.pos))}
function lvAt(e){var r=svg.getBoundingClientRect(),y=(e.clientY-r.top)/r.height*300;setLv(LO+(B-y)/(B-T)*(HI-LO))}
lvh.addEventListener("pointerdown",function(e){e.stopPropagation();lvDrag=1;lvh.setPointerCapture(e.pointerId)});
lvh.addEventListener("pointermove",function(e){if(lvDrag)lvAt(e)});
lvh.addEventListener("pointerup",function(){lvDrag=0});
lvh.addEventListener("keydown",function(e){var s={ArrowUp:.1,ArrowDown:-.1,PageUp:.5,PageDown:-.5}[e.key];if(s!=null){e.preventDefault();setLv(S.lv+s)}});

// day picker
var dbox=$("days"),dbs=[],i;
for(i=0;i<7;i++){var dt=new Date(now);dt.setDate(dt.getDate()+i);var b=document.createElement("button");b.type="button";
  b.innerHTML="<span>"+(i?dt.toLocaleDateString("en-US",{weekday:"short"}):"Today")+"</span><b>"+dt.getDate()+"</b><i class=\"r\"><i></i><i></i><i></i><i></i></i><small></small>";
  b.dataset.label=dt.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});
  b.onclick=(function(d){return function(){var a=S.d;tween("day",function(k){S.d=a+(d-a)*k;draw()},650)}})(i);dbox.appendChild(b);dbs.push(b)}
function days(){dbs.forEach(function(b,i){var r=rating(mp(i));b.dataset.r=r;b.lastChild.textContent=RATE[r];b.setAttribute("aria-pressed",Math.round(S.d)==i);b.setAttribute("aria-label",b.dataset.label+", fishing "+RATE[r])})}

// tide clock: high at top, low at bottom; the hand sweeps the right side falling, the left side rising
var ck=$("clock"),hand,cw;
el("circle",{cx:60,cy:60,r:48},el("clipPath",{id:"ckc"},el("defs",{},ck)));
el("circle",{cx:60,cy:60,r:48,class:"face"},ck);cw=el("rect",{x:0,y:60,width:120,height:120,class:"cw","clip-path":"url(#ckc)"},ck);
for(i=0;i<12;i++)el("line",{x1:60,y1:13,x2:60,y2:i%3?18:22,transform:"rotate("+i*30+" 60 60)",class:"tk"},ck);
el("circle",{cx:60,cy:60,r:48,class:"rim"},ck);
el("text",{x:60,y:36,"text-anchor":"middle"},ck).textContent="HIGH";el("text",{x:60,y:92,"text-anchor":"middle"},ck).textContent="LOW";
hand=el("line",{x1:60,y1:60,x2:60,y2:20,class:"hand"},ck);el("circle",{cx:60,cy:60,r:4,class:"hub"},ck);
function clock(v){
  var n=0;while(n<ext.length&&ext[n].t<=S.pos)n++;var pe=ext[n-1],ne=ext[n];if(!pe||!ne)return;
  var fr=(S.pos-pe.t)/(ne.t-pe.t);hand.setAttribute("transform","rotate("+(ne.hi?180+180*fr:180*fr)+" 60 60)");
  cw.setAttribute("y",12+96*(1-(v-LO)/(HI-LO)));
  $("ck-say").textContent=(ne.hi?"High":"Low")+" tide in "+dur(ne.t-S.pos)+".";
}
// tide staff at the dock
var sf=$("staff"),sy=function(v){return 236-v*34},swg,slv;
el("rect",{x:52,y:0,width:16,height:250,class:"post"},sf);el("rect",{x:40,y:16,width:40,height:226,class:"board"},sf);
for(i=0;i<=12;i++){var fy=sy(i/2);el("line",{x1:40,x2:i%2?54:62,y1:fy,y2:fy,class:"mk"},sf);if(!(i%2))el("text",{x:34,y:fy+5,"text-anchor":"end"},sf).textContent=i/2}
swg=el("g",{},sf);el("path",{d:"M-40 0"+" q10 -5 20 0 t20 0".repeat(10)+"V300H-40Z",class:"wv"},swg);
el("rect",{x:0,y:250,width:120,height:10,class:"bed"},sf);
slv=el("g",{class:"slv"},sf);el("line",{x1:30,x2:92,y1:0,y2:0},slv);el("text",{x:94,y:4},slv).textContent="YOU";
function staff(v){swg.setAttribute("transform","translate(0 "+sy(v).toFixed(1)+")");slv.setAttribute("transform","translate(0 "+sy(S.lv).toFixed(1)+")")}
// moon: drag it around the earth; lined up with the sun = spring tides, at right angles = neap tides
var mn=$("moon"),bul,mm;
for(i=0;i<3;i++){var ay=64+i*36;el("line",{x1:4,x2:22,y1:ay,y2:ay,class:"ray"},mn);el("path",{d:"M22 "+(ay-4)+"l6 4-6 4z",class:"rayh"},mn)}
el("text",{x:4,y:50},mn).textContent="SUN";
el("circle",{cx:110,cy:100,r:72,class:"orbit"},mn);
bul=el("ellipse",{cx:110,cy:100,rx:34,ry:26,class:"bulge"},mn);el("circle",{cx:110,cy:100,r:19,class:"earth"},mn);
mm=el("g",{class:"mm"},mn);el("circle",{r:11,class:"dark"},mm);el("path",{d:"M0 -11A11 11 0 0 0 0 11Z",class:"lit"},mm);
function moon(){
  var p=mp(S.d),th=p+Math.PI,k=Math.abs(Math.cos(p)),deg=th*180/Math.PI;
  mm.setAttribute("transform","translate("+(110+72*Math.cos(th)).toFixed(1)+" "+(100+72*Math.sin(th)).toFixed(1)+")");
  bul.setAttribute("rx",(26+14*k).toFixed(1));bul.setAttribute("ry",(26-4*k).toFixed(1));bul.setAttribute("transform","rotate("+deg.toFixed(1)+" 110 100)");
  var pn=PH[Math.round(((p%TAU)+TAU)%TAU/TAU*8)%8];
  $("mn-say").textContent=pn+": "+(k>.7?"spring tides, a big range":k<.35?"neap tides, a small range":"between spring and neap")+", about "+(2*amp(p)).toFixed(1)+" ft.";
  mn.setAttribute("aria-valuenow",Math.round(((p%TAU)+TAU)%TAU*180/Math.PI));mn.setAttribute("aria-valuetext",pn);
  $("mn-reset").hidden=Math.abs(S.phi-PHI0)<.01;
}
var mDrag=0;
function mAt(e){var r=mn.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*200-110,y=(e.clientY-r.top)/r.height*200-100;S.phi=Math.atan2(y,x)-Math.PI-S.d*TAU/SYN;draw()}
mn.addEventListener("pointerdown",function(e){mDrag=1;mn.setPointerCapture(e.pointerId);mAt(e);mn.classList.add("grab")});
mn.addEventListener("pointermove",function(e){if(mDrag)mAt(e)});
mn.addEventListener("pointerup",function(){mDrag=0;mn.classList.remove("grab")});
mn.addEventListener("keydown",function(e){var s={ArrowRight:1,ArrowUp:1,ArrowLeft:-1,ArrowDown:-1}[e.key];if(s){e.preventDefault();S.phi+=s*TAU/36;draw()}});
$("mn-reset").onclick=function(){var a=S.phi,dd=((PHI0-a)%TAU+TAU*1.5)%TAU-Math.PI;tween("moon",function(k){S.phi=k<1?a+dd*k:PHI0;draw()},700)};

draw();
// reveals + count-ups
var fig=svg.closest(".tide");
function count(b){var n=+b.dataset.n;tween("n"+n,function(k){b.textContent=Math.round(n*k).toLocaleString("en-US")},1200)}
function show(e){e.classList.add("in");e.querySelectorAll("[data-n]").forEach(count)}
if(calm||!("IntersectionObserver" in window)){show(fig);document.querySelectorAll("[data-rv]").forEach(show);return}
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;show(e.target);io.unobserve(e.target);if(e.target==fig)setTimeout(function(){glide(nt)},900)})},{threshold:.2});
io.observe(fig);document.querySelectorAll("[data-rv]").forEach(function(e,i){e.style.transitionDelay=(i%4)*80+"ms";io.observe(e)});
})();
