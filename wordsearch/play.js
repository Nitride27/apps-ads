// Playable sample puzzle. Drag (or tap first and last letter) to circle a word.
// Generator follows the app: longest words first, crossings preferred, every word appears exactly once.
(function(){
var $=function(i){return document.getElementById(i)},calm=matchMedia("(prefers-reduced-motion: reduce)").matches,NS="http://www.w3.org/2000/svg";
var THEME=[["ROSE","Thorny flower of romance"],["MINT","Herb for tea and toothpaste"],["FERN","Leafy plant that never flowers"],["TULIP","Dutch spring bulb"],["BASIL","The herb in pesto"],["DAISY","White petals around a yellow eye"],["LILAC","Purple shrub with a heavy scent"],["ORCHID","Exotic bloom, fussy houseplant"],["LAVENDER","Purple herb for sleepy pillows"],["SUNFLOWER","Tall bloom that turns to the sun"]];
var COUNT={7:6,9:8,11:10},ALL=[[1,0],[0,1],[1,1],[1,-1],[-1,0],[0,-1],[-1,-1],[-1,1]],EASY=[[1,0],[0,1],[1,1]];
var S={n:7,easy:true,clues:false,custom:null,hints:0,streak:12,solved:false};
var grid=$("wsg"),ov=$("wso"),list=$("wsl"),read=$("wsr");if(!grid)return;
var P,found,start=null,tapStart=null,words=[];

function rng(s){return function(){s=(s*16807)%2147483647;return s/2147483647}}
function count(g,n,w){var c=0;for(var y=0;y<n;y++)for(var x=0;x<n;x++)ALL.forEach(function(d){for(var i=0;i<w.length;i++){var X=x+d[0]*i,Y=y+d[1]*i;if(X<0||Y<0||X>=n||Y>=n||g[Y*n+X]!=w[i])return}c++});return c}
function gen(ws,n,dirs,seed){
  for(var a=0;a<60;a++){
    var r=rng(seed+a*7919),g=new Array(n*n).fill(""),place={},ok=true;
    ws.slice().sort(function(p,q){return q.length-p.length}).forEach(function(w){
      if(!ok)return;var best=null,bs=-1;
      for(var t=0;t<400;t++){var d=dirs[r()*dirs.length|0],x=r()*n|0,y=r()*n|0,ex=x+d[0]*(w.length-1),ey=y+d[1]*(w.length-1);
        if(ex<0||ey<0||ex>=n||ey>=n)continue;var sc=0,fit=true;
        for(var i=0;i<w.length;i++){var c=g[(y+d[1]*i)*n+x+d[0]*i];if(c&&c!=w[i]){fit=false;break}if(c)sc++}
        if(fit&&sc>bs){bs=sc;best=[x,y,d]}}
      if(!best){ok=false;return}
      for(var i=0;i<w.length;i++)g[(best[1]+best[2][1]*i)*n+best[0]+best[2][0]*i]=w[i];place[w]=best});
    if(!ok)continue;
    var pool=ws.join("");for(var i=0;i<g.length;i++)if(!g[i])g[i]=pool[r()*pool.length|0];
    if(ws.every(function(w){return count(g,n,w)==1}))return{g:g,place:place};
  }
  return null;
}

function build(){
  var n=S.n;words=S.custom||THEME.filter(function(t){return t[0].length<=n}).slice(0,COUNT[n]).map(function(t){return t[0]});
  P=gen(words,n,S.easy?EASY:ALL,20261124+n);
  if(!P){$("wsmsg").textContent="Those words don't fit in a "+n+"×"+n+" grid. Try fewer or shorter ones.";return false}
  found={};S.hints=0;S.solved=false;tapStart=null;
  grid.style.setProperty("--n",n);
  grid.innerHTML=P.g.map(function(c,i){return'<span style="--d:'+((i%n)+(i/n|0))+'">'+c+'</span>'}).join("");
  grid.setAttribute("aria-label",n+" by "+n+" letter grid. Drag across a word, or tap its first and last letter.");
  ov.setAttribute("viewBox","0 0 "+n+" "+n);ov.textContent="";
  list.innerHTML=words.map(function(w){var cl=!S.custom&&THEME.filter(function(t){return t[0]==w})[0];
    return'<li data-w="'+w+'"'+(S.clues&&cl?' class="clue"':'')+'><button type="button" tabindex="'+(S.clues&&cl?0:-1)+'"><span class="cl">'+(cl?cl[1]:"")+'</span><span class="ans">'+w+'</span></button></li>'}).join("");
  $("wst").textContent=S.custom?"Your own puzzle":"In the garden";
  $("wsn").textContent="Letters at "+n+"×"+n+" are "+(15/n).toFixed(1)+"× the size of a 15×15 newspaper grid.";
  $("wsback").hidden=!S.custom;
  say("Drag across a word, or tap its first and last letter.");
  if(!calm){grid.classList.remove("set");void grid.offsetWidth;grid.classList.add("set")}
  progress();return true;
}
function say(t){read.textContent=t}
function progress(){var k=Object.keys(found).length;$("wsp").textContent=k+" of "+words.length+" found";$("wsbar").style.setProperty("--p",k/words.length)}

// selection: snap to the nearest of 8 directions, clamp to the grid
function cellAt(e){var r=grid.getBoundingClientRect(),n=S.n;return[Math.max(0,Math.min(n-1,(e.clientX-r.left)/r.width*n|0)),Math.max(0,Math.min(n-1,(e.clientY-r.top)/r.height*n|0))]}
function line(a,b){var dx=b[0]-a[0],dy=b[1]-a[1];if(!dx&&!dy)return[a];var k=Math.round(Math.atan2(dy,dx)/(Math.PI/4)),d=[Math.round(Math.cos(k*Math.PI/4)),Math.round(Math.sin(k*Math.PI/4))],len=Math.max(Math.abs(dx),Math.abs(dy)),out=[];
  for(var i=0;i<=len;i++){var x=a[0]+d[0]*i,y=a[1]+d[1]*i;if(x<0||y<0||x>=S.n||y>=S.n)break;out.push([x,y])}return out}
function word(cs){return cs.map(function(c){return P.g[c[1]*S.n+c[0]]}).join("")}
function el(n,at,par){var e=document.createElementNS(NS,n);for(var k in at)e.setAttribute(k,at[k]);(par||ov).appendChild(e);return e}
function capsule(cs,cls){
  var a=cs[0],b=cs[cs.length-1],L=Math.hypot(b[0]-a[0],b[1]-a[1]),deg=Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI;
  var g=el("g",{class:cls,transform:"translate("+(a[0]+.5)+" "+(a[1]+.5)+") rotate("+deg.toFixed(1)+")"});
  if(cls=="found"){el("rect",{x:-.42,y:-.38,width:L+.84,height:.76,rx:.38,class:"tint"},g);
    // a pen loop drawn by hand: slightly tilted, slightly overshot
    el("rect",{x:-.47,y:-.43,width:L+.94,height:.86,rx:.43,class:"loop",pathLength:1,transform:"rotate("+((Math.random()-.5)*3).toFixed(1)+" "+(L/2)+" 0)"},g)}
  else el("rect",{x:-.4,y:-.36,width:L+.8,height:.72,rx:.36},g);
  return g;
}
var live=null;
function preview(cs){if(live)live.remove();live=cs.length?capsule(cs,"live"):null;say(cs.length>1?word(cs):"Drag across a word, or tap its first and last letter.")}
function check(cs){
  if(live){live.remove();live=null}
  var w=word(cs),r=w.split("").reverse().join(""),hit=words.filter(function(x){return!found[x]&&(x==w||x==r)})[0];
  if(hit){found[hit]=1;capsule(cs,"found");var li=list.querySelector('[data-w="'+hit+'"]');li.classList.add("got");say(hit+". "+(words.length-Object.keys(found).length||"All")+(Object.keys(found).length==words.length?" found.":" to go."));progress();
    if(Object.keys(found).length==words.length)solved();return}
  if(cs.length>1){var m=capsule(cs,"miss");setTimeout(function(){m.remove()},calm?600:900);say(w+" is not on the list.")}
}
grid.addEventListener("pointerdown",function(e){start=cellAt(e);grid.setPointerCapture(e.pointerId);preview([start])});
grid.addEventListener("pointermove",function(e){if(start)preview(line(start,cellAt(e)))});
grid.addEventListener("pointerup",function(e){if(!start)return;var cs=line(start,cellAt(e));start=null;
  if(cs.length==1){ // tap mode: first tap marks, second tap circles
    if(tapStart){var t=line(tapStart,cs[0]);tapStart=null;mark(null);check(t)}else{tapStart=cs[0];mark(cs[0]);if(live){live.remove();live=null}say("Now tap the last letter.")}return}
  tapStart=null;mark(null);check(cs)});
grid.addEventListener("pointercancel",function(){start=null;preview([])});
function mark(c){var o=grid.querySelector(".tap");if(o)o.classList.remove("tap");if(c)grid.children[c[1]*S.n+c[0]].classList.add("tap")}

// clue edition: tapping a clue reveals its answer (counts as a hint, like the app)
list.addEventListener("click",function(e){var li=e.target.closest("li.clue");if(!li||li.classList.contains("shown")||li.classList.contains("got"))return;li.classList.add("shown");S.hints++});
$("wshint").onclick=function(){var left=words.filter(function(w){return!found[w]});if(!left.length)return;var w=left[Math.random()*left.length|0],p=P.place[w],cs=[];
  for(var i=0;i<w.length;i++)cs.push([p[0]+p[2][0]*i,p[1]+p[2][1]*i]);S.hints++;check(cs)};

function solved(){
  S.solved=true;var stars=Math.max(1,3-S.hints),today=$("wk").querySelector(".today");
  if(today&&!today.classList.contains("done")){today.classList.add("done");S.streak++;$("wkn").textContent=S.streak}
  $("wsdone").innerHTML="<b>Solved.</b> "+"★★★".slice(0,stars)+"<span>"+"★★★".slice(stars)+"</span> "+(S.hints?S.hints+" hint"+(S.hints>1?"s":"")+" used.":"No hints.")+" Streak: "+S.streak+" days.";
  $("wsdone").classList.add("on");
}

// toolbar
function group(id,fn){var b=$(id);b.addEventListener("click",function(e){var t=e.target.closest("button");if(!t)return;fn(t,b)})}
group("wssize",function(t,b){[].forEach.call(b.children,function(x){x.setAttribute("aria-pressed",x==t)});S.n=+t.dataset.n;if(S.custom&&Math.max.apply(null,S.custom.map(function(w){return w.length}))>S.n)S.custom=null;$("wsdone").classList.remove("on");build()});
$("wseasy").onclick=function(){S.easy=!S.easy;this.setAttribute("aria-pressed",S.easy);$("wsdone").classList.remove("on");build()};
$("wsclue").onclick=function(){S.clues=!S.clues;this.setAttribute("aria-pressed",S.clues);list.classList.toggle("clues",S.clues);build()};
$("wsnight").onclick=function(){var night=document.documentElement.dataset.ed!="night"&&!(document.documentElement.dataset.ed!="day"&&matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.ed=night?"night":"day";this.setAttribute("aria-pressed",night);this.textContent=night?"Day edition":"Night edition"};
(function(){var dark=matchMedia("(prefers-color-scheme: dark)").matches,b=$("wsnight");b.textContent=dark?"Day edition":"Night edition";b.setAttribute("aria-pressed",dark)})();

// make your own: letters only, 3 to 11 long, no word inside another (same rule as the app)
$("wsm").addEventListener("submit",function(e){e.preventDefault();var msg=$("wsmsg");
  var ws=$("wsmi").value.toUpperCase().split(/[\s,;]+/).map(function(w){return w.replace(/[^A-Z]/g,"")}).filter(function(w,i,a){return w.length>=3&&a.indexOf(w)==i});
  if(ws.length<3){msg.textContent="Type at least 3 words of 3 letters or more.";return}
  ws=ws.slice(0,8);var long=Math.max.apply(null,ws.map(function(w){return w.length}));
  if(long>11){msg.textContent="Keep each word to 11 letters or fewer.";return}
  var nest=ws.filter(function(w){return ws.some(function(o){return o!=w&&o.indexOf(w)>-1})})[0];if(nest){msg.textContent=nest+" is hidden inside another word. Take one out.";return}
  var n=long>9||ws.length>6?11:long>7?9:Math.max(S.n,7);S.n=n;[].forEach.call($("wssize").children,function(x){x.setAttribute("aria-pressed",+x.dataset.n==n)});
  S.custom=ws;$("wsdone").classList.remove("on");if(build()){msg.textContent="Your puzzle is set. "+ws.length+" words.";$("ws").scrollIntoView({behavior:calm?"auto":"smooth",block:"start"})}else S.custom=null});
$("wsback").onclick=function(){S.custom=null;$("wsmsg").textContent="";$("wsdone").classList.remove("on");build()};

// dateline + week strip
var now=new Date();$("date").textContent=now.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"});
var wd=(now.getDay()+6)%7;$("wk").innerHTML=["M","T","W","T","F","S","S"].map(function(d,i){return'<span class="'+(i<wd?"done":i==wd?"today":"later")+'"><i>'+d+'</i><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" pathLength="1"/></svg></span>'}).join("");
$("wkn").textContent=S.streak;

build();
// self-check: every generated sample puzzle has each word exactly once
[7,9,11].forEach(function(n){[true,false].forEach(function(easy){var ws=THEME.filter(function(t){return t[0].length<=n}).slice(0,COUNT[n]).map(function(t){return t[0]}),p=gen(ws,n,easy?EASY:ALL,20261124+n);console.assert(p&&ws.every(function(w){return count(p.g,n,w)==1}),"puzzle "+n+(easy?" easy":""))})});

// reveals
var els=document.querySelectorAll("[data-rv]");
if(calm||!("IntersectionObserver" in window)){els.forEach(function(e){e.classList.add("in")});return}
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}})},{threshold:.15});
els.forEach(function(e,i){e.style.transitionDelay=(i%3)*80+"ms";io.observe(e)});
})();
