// "Group chat vs. the sheet": ten guests bring dishes onto the table, with or without a sign-up sheet.
(function(){
var box=document.getElementById("tbl");if(!box)return;
var still=matchMedia("(prefers-reduced-motion: reduce)").matches,$=function(s){return box.querySelector(s)};
var GUESTS=["Ana","Ben","Chloe","Dev","Ema","Finn","Gia","Hugo","Ivy","Jay"];
var NEED=[["Turkey","Mains"],["Lasagna","Mains"],["Mac and cheese","Sides"],["Green salad","Sides"],["Rolls","Sides"],["Pumpkin pie","Desserts"],["Brownies","Desserts"],["Cider","Drinks"],["Lemonade","Drinks"],["Plates and cups","Supplies"]];
var CHAT=["Mac and cheese","Chips","Brownies","Mac and cheese","Chips","Mac and cheese","Brownies","Lasagna","Mac and cheese","Chips"];
var mode="chat",timer=null;
function run(){
  clearTimeout(timer);var cloth=$(".cloth2"),tick=$(".tick"),miss=$(".miss");cloth.textContent="";miss.textContent="";miss.className="miss";
  var picks=mode=="chat"?CHAT:NEED.map(function(n){return n[0]}),piles={},i=0;
  (function next(){
    if(i>=picks.length)return tally(piles);
    var dish=picks[i],g=GUESTS[i];tick.textContent=g+" brings "+dish.toLowerCase()+(mode=="sheet"?" (claimed on the sheet)":"")+".";
    if(piles[dish]){piles[dish].n++;var b=piles[dish].el.querySelector("b");b.textContent="×"+piles[dish].n;b.hidden=false;piles[dish].el.classList.add("dup");if(!still){b.classList.remove("pop");void b.offsetWidth;b.classList.add("pop")}}
    else{var li=document.createElement("li");li.innerHTML="<span></span><b hidden></b><small></small>";li.firstChild.textContent=dish;li.lastChild.textContent=g;cloth.appendChild(li);piles[dish]={n:1,el:li}}
    i++;timer=setTimeout(next,still?0:420);
  })();
}
function tally(piles){
  var miss=$(".miss"),gone=NEED.slice().reverse().filter(function(n){return!piles[n[0]]}).map(function(n){return n[0].toLowerCase()}),dup=Object.keys(piles).filter(function(k){return piles[k].n>1});
  miss.className="miss on "+(gone.length?"bad":"good");
  miss.textContent=gone.length?dup.map(function(k){return piles[k].n+" "+k.toLowerCase()}).join(", ")+". Nobody brought "+(gone.length>3?gone.slice(0,3).join(", ")+" or "+(gone.length-3)+" more things":gone.join(", "))+".":"Every dish covered, one of each, and someone brought the plates.";
}
box.querySelectorAll(".seg button").forEach(function(b){b.onclick=function(){mode=b.dataset.m;box.querySelectorAll(".seg button").forEach(function(x){x.setAttribute("aria-pressed",x==b)});run()}});
$(".again").onclick=run;
if(still||!("IntersectionObserver" in window))return run();
var io=new IntersectionObserver(function(es){if(es[0].isIntersecting){io.disconnect();run()}},{threshold:.35});io.observe(box);
})();
