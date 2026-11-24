// Habit demos: check-in list (milestones, streak freezes, ideas), miss-a-day simulator, year grid, challenge writer.
// All demo state is in memory only.
(function(){
var $=function(i){return document.getElementById(i)},calm=matchMedia("(prefers-reduced-motion: reduce)").matches;
function bump(e,c){c=c||"bump";if(calm)return;e.classList.remove(c);void e.offsetWidth;e.classList.add(c)}
var R={};function tween(key,set,ms){cancelAnimationFrame(R[key]);if(calm)return set(1);var t0=performance.now();(function st(n){var k=Math.min(1,(n-t0)/ms);set(1-Math.pow(1-k,3));if(k<1)R[key]=requestAnimationFrame(st)})(t0)}
var CK='<svg viewBox="0 0 24 24" aria-hidden="true"><circle class="ring" cx="12" cy="12" r="10" pathLength="1"/><path class="tick" d="M7 12.5l3.2 3.2L17 9" pathLength="1"/></svg>';
var MILES=[3,7,30,100,365],todayCell,todayLv=0;

// 1. Today list
var ul=$("dlist"),habits=[],freezes=2;
function add(name,sub,streak,goal,fresh){
  var o={goal:goal||1,n:0,streak:streak,ok:false,fz:false},li=document.createElement("li");
  li.innerHTML='<button type="button" class="chk" aria-pressed="false">'+CK+'</button><span class="nm"><b></b><small><span></span><button type="button" class="frz">Freeze today</button></small></span>'+(o.goal>1?'<span class="cnt">0/'+o.goal+'</span>':'')+'<span class="st"><b>'+streak+'</b> day streak</span><span class="ms" aria-hidden="true"></span>';
  li.querySelector(".nm b").textContent=name;li.querySelector(".nm small span").textContent=sub;li.querySelector(".chk").setAttribute("aria-label","Check in: "+name);
  var chk=li.querySelector(".chk"),frz=li.querySelector(".frz"),cnt=li.querySelector(".cnt"),stB=li.querySelector(".st b"),ms=li.querySelector(".ms");
  function streakTo(v){stB.textContent=v;bump(stB)}
  chk.onclick=function(){
    if(o.fz)unfreeze();
    o.n=o.n>=o.goal?0:o.n+1;var full=o.n>=o.goal;li.style.setProperty("--p",o.n/o.goal);if(cnt){cnt.textContent=o.n+"/"+o.goal;bump(cnt)}
    chk.setAttribute("aria-pressed",full);
    if(full!=o.ok){o.ok=full;li.classList.toggle("ok",full);streakTo(o.streak+(full?1:0));
      if(full&&MILES.indexOf(o.streak+1)>-1){ms.textContent=(o.streak+1)+"-day milestone";bump(ms,"stampin")}}
    sync()};
  function unfreeze(){o.fz=false;li.classList.remove("fz");freezes++;frz.textContent="Freeze today"}
  frz.onclick=function(){
    if(o.fz){unfreeze();return sync()}
    if(o.ok)return;
    if(!freezes){bump($("dfz"),"shake");return}
    o.fz=true;freezes--;li.classList.add("fz");frz.textContent="Unfreeze";bump(stB,"frost");sync()};
  habits.push(o);ul.appendChild(li);
  if(fresh&&!calm){li.classList.add("enter");li.addEventListener("animationend",function(){li.classList.remove("enter")},{once:true})}
  return o;
}
function sync(){
  var done=habits.filter(function(o){return o.ok||o.fz}).length,all=done==habits.length,anyOk=habits.some(function(o){return o.ok}),left=habits.length-done;
  $("dcount").textContent=all?"All done for today":done+" of "+habits.length+" done · "+left+" to go";
  $("dfz").textContent=freezes+" streak freeze"+(freezes==1?"":"s")+" left";
  var sg=$("dsegs");while(sg.children.length<habits.length)sg.appendChild(document.createElement("i"));
  habits.forEach(function(o,i){sg.children[i].className=o.ok?"on":o.fz?"fz":""});
  $("perfect").classList.toggle("on",all&&anyOk);
  todayLv=all&&anyOk?4:Math.round(done/habits.length*3);
  if(todayCell)todayCell.className="c now"+(todayLv?" l"+todayLv:"")+(all&&anyOk&&!calm?" pop":"");
}
if(ul){
  add("Read 20 pages","Every day",29);add("Drink water","4 bottles",12,4);add("Go for a run","Mon, Wed, Fri",6);add("Meditate","10 minutes",99);
  [].forEach.call(document.querySelectorAll("#ideas button"),function(b){b.onclick=function(){if(habits.length>=6)return;add(b.textContent,b.dataset.sub,0,1,true);b.remove();sync();if(habits.length>=6)$("ideas").classList.add("full")}});
  sync();
}

// 2. Miss-a-day simulator: plain streak vs habit strength (exponential average)
var sd=$("simdays"),sg=$("simg");
if(sd){
  var N=28,days=[],NS="http://www.w3.org/2000/svg",cur={a:[],b:[]};
  for(var i=0;i<N;i++){days.push(i!=9&&i!=17&&i!=18);var b=document.createElement("button");b.type="button";b.setAttribute("aria-label","Day "+(i+1));
    b.onclick=(function(i){return function(){days[i]=!days[i];sim()}})(i);sd.appendChild(b)}
  function mk(n,at){var e=document.createElementNS(NS,n);for(var k in at)e.setAttribute(k,at[k]);sg.appendChild(e);return e}
  for(i=0;i<=4;i++)mk("line",{x1:0,x2:600,y1:10+i*40,y2:10+i*40,class:"gl"});
  var pA=mk("path",{class:"la"}),pB=mk("path",{class:"lb"});
  function series(){var a=[],b=[],s=0,k=0;days.forEach(function(d){s=d?s+1:0;k+=((d?1:0)-k)*.15;a.push(s/N*100);b.push(k*100)});return{a:a,b:b}}
  function path(v){return v.map(function(y,i){return(i?"L":"M")+(i/(N-1)*600).toFixed(1)+" "+(170-y*1.6).toFixed(1)}).join("")}
  function sim(){
    var to=series(),from={a:cur.a.length?cur.a:to.a.map(function(){return 0}),b:cur.b.length?cur.b:to.b.map(function(){return 0})};
    [].forEach.call(sd.children,function(b,i){b.setAttribute("aria-pressed",days[i]);b.title=days[i]?"Done":"Missed"});
    tween("sim",function(k){cur={a:to.a.map(function(v,i){return from.a[i]+(v-from.a[i])*k}),b:to.b.map(function(v,i){return from.b[i]+(v-from.b[i])*k})};pA.setAttribute("d",path(cur.a));pB.setAttribute("d",path(cur.b))},550);
    var s=0;days.forEach(function(d){s=d?s+1:0});$("sims").textContent=s;$("simk").textContent=Math.round(to.b[N-1]);bump($("sims"));bump($("simk"));
  }
  sim();
}

// 3. Year grid with tap-to-read days and weekday strength
var grid=$("year");
if(grid){
  var now=new Date(),y0=new Date(now.getFullYear(),0,1),doy=Math.floor((now-y0)/864e5),seed=7,f=document.createDocumentFragment(),lv=[],wk=[0,0,0,0,0,0,0],wn=[0,0,0,0,0,0,0];
  function rnd(){seed=(seed*16807)%2147483647;return seed/2147483647}
  for(i=0;i<y0.getDay();i++){var s=document.createElement("i");s.className="c x";f.appendChild(s)}
  for(i=0;i<365;i++){var c=document.createElement("i"),r=rnd(),dw=(y0.getDay()+i)%7;r-=dw==1?.15:dw==6?-.12:0;
    var l=i>=doy?0:r<.12?0:r<.3?1:r<.5?2:r<.75?3:4;lv.push(l);if(i<doy){wk[dw]+=l;wn[dw]++}
    c.className="c"+(l?" l"+l:"")+(i==doy?" now":"");c.style.setProperty("--i",i);c.dataset.i=i;if(i==doy)todayCell=c;f.appendChild(c)}
  grid.appendChild(f);if(ul)sync();var yw=grid.parentNode;yw.scrollLeft=yw.scrollWidth;
  var strong=lv.filter(function(l){return l>=3}).length;
  $("ystat").innerHTML='<b data-n="'+doy+'">'+doy+'</b> days in · <b data-n="'+strong+'">'+strong+'</b> strong days';
  var tip=$("ytip");
  function showTip(c){var i=+c.dataset.i,d=new Date(y0);d.setDate(d.getDate()+i);var l=i==doy?todayLv:lv[i];
    tip.textContent=d.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})+" · "+(i>doy?"still ahead":i==doy?"today":["missed","1 of 4 done","2 of 4 done","3 of 4 done","perfect day"][l]);
    tip.hidden=false;tip.style.left=Math.min(grid.parentNode.scrollWidth-tip.offsetWidth-2,Math.max(0,c.offsetLeft-60))+"px";tip.style.top=(c.offsetTop-34)+"px";
    var o=grid.querySelector(".sel");if(o)o.classList.remove("sel");c.classList.add("sel")}
  grid.addEventListener("pointerover",function(e){if(e.target.dataset.i)showTip(e.target)});
  grid.addEventListener("click",function(e){if(e.target.dataset.i)showTip(e.target)});
  grid.addEventListener("pointerleave",function(e){if(e.pointerType=="mouse"){tip.hidden=true;var o=grid.querySelector(".sel");if(o)o.classList.remove("sel")}});
  var W=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],avg=wk.map(function(s,i){return wn[i]?s/wn[i]/4:0}),best=avg.indexOf(Math.max.apply(null,avg)),wb=$("wk");
  wb.innerHTML=[1,2,3,4,5,6,0].map(function(i){return'<div class="'+(i==best?"best":"")+'" style="--h:'+avg[i].toFixed(3)+'"><b>'+Math.round(avg[i]*100)+'%</b><i></i><span>'+W[i]+'</span></div>'}).join("");
  $("wkbest").textContent=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][best]+" is your strongest day. Plan the hard stuff there.";
}

// 4. Challenge writer: types the message, copies it
var chm=$("chm");
if(chm){
  var pick={h:"Read 20 pages",d:30},typing;
  function write(){
    var msg="Want to do a "+pick.d+"-day challenge with me? "+pick.h+", every day. I'm tracking it in Habit Tracker; get it free and we'll keep each other going: https://play.google.com/store/apps/details?id=com.giftdraw.resolutions";
    clearInterval(typing);chm.dataset.msg=msg;$("chc").textContent="Copy message";
    if(calm){chm.textContent=msg;return}
    var n=0;chm.textContent="";chm.classList.add("typing");typing=setInterval(function(){n+=3;chm.textContent=msg.slice(0,n);if(n>=msg.length){clearInterval(typing);chm.classList.remove("typing")}},16);
  }
  [["chh","h"],["chd","d"]].forEach(function(g){var box=$(g[0]);box.addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;
    [].forEach.call(box.children,function(x){x.setAttribute("aria-pressed",x==b)});pick[g[1]]=b.dataset.v||b.textContent;write()})});
  $("chc").onclick=function(){var t=chm.dataset.msg,btn=this;function ok(){btn.textContent="Copied";bump(btn)}
    if(navigator.clipboard)navigator.clipboard.writeText(t).then(ok,function(){fallback()});else fallback();
    function fallback(){var a=document.createElement("textarea");a.value=t;document.body.appendChild(a);a.select();try{document.execCommand("copy");ok()}catch(e){}a.remove()}};
  var chStarted=false;
}

// reveals + count-ups (the challenge starts typing when it scrolls in)
function count(b){var n=+b.dataset.n;tween("n"+n+Math.random(),function(k){b.textContent=Math.round(n*k)},1100)}
function show(e){e.classList.add("in");e.querySelectorAll("[data-n]").forEach(count);if(chm&&!chStarted&&e.contains(chm)){chStarted=true;write()}}
var els=document.querySelectorAll("[data-rv]");
if(calm||!("IntersectionObserver" in window)){els.forEach(show);return}
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){show(e.target);io.unobserve(e.target)}})},{threshold:.2});
els.forEach(function(e,i){e.style.transitionDelay=(i%3)*90+"ms";io.observe(e)});
})();
