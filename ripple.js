// Full-screen water ripples: 2D wave-equation height field (S px per cell), shaded by slope, tinted with a gradient.
// Usage: <script src="ripple.js" data-colors="#F43F5E,#A855F7,#58CC02"></script>
// Blend mode follows the page background: screen on dark pages, multiply on light ones (override with data-blend).
(function(){
if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
var tag=document.currentScript,
STOPS=(tag.dataset.colors||"#F43F5E,#A855F7,#58CC02").split(",").map(function(h){h=parseInt(h.trim().slice(1),16);return[h>>16,h>>8&255,h&255]}),
DAMP=.988,S=4,
c=document.createElement("canvas"),x=c.getContext("2d"),oc=document.createElement("canvas"),ox=oc.getContext("2d"),
dpr=Math.min(devicePixelRatio||1,2),W,H,w,h,a,b,img,lut,run=0,lx=-1,ly=-1,gl={x:-1e4,y:-1e4,tx:-1e4,ty:-1e4},
G=STOPS[1]||STOPS[0],GLOW="rgba("+G+",";
c.setAttribute("aria-hidden","true");
c.style.cssText="position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:2147483647;mix-blend-mode:"+(tag.dataset.blend||blend());
document.body.appendChild(c);
// on/off toggle, remembered across pages
var on=true;try{on=localStorage.getItem("ripple")!=="off"}catch(e){}
var dark=blend()==="screen",tg=document.createElement("button");
tg.type="button";tg.style.cssText="position:fixed;right:14px;bottom:14px;z-index:2147483646;display:flex;align-items:center;gap:6px;padding:7px 12px;border-radius:999px;font:600 12px/1 Inter,system-ui,sans-serif;cursor:pointer;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);"+(dark?"background:rgba(20,18,16,.6);color:#F3EEE6;border:1px solid rgba(255,255,255,.14)":"background:rgba(255,255,255,.75);color:#1a1a1a;border:1px solid rgba(0,0,0,.12)");
function paint(){tg.setAttribute("aria-pressed",on);tg.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M2 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/>'+(on?'':'<path d="M4 4l16 16"/>')+'</svg>Ripples '+(on?"on":"off");c.style.display=on?"":"none"}
tg.onclick=function(){on=!on;try{localStorage.setItem("ripple",on?"on":"off")}catch(e){}if(!on){a.fill(0);b.fill(0)}paint()};
paint();document.body.appendChild(tg);
function blend(){var m=getComputedStyle(document.body).backgroundColor.match(/\d+/g)||[0,0,0];return m[0]*.3+m[1]*.59+m[2]*.11<128?"screen":"multiply"}
function size(){W=innerWidth;H=innerHeight;c.width=W*dpr;c.height=H*dpr;x.setTransform(dpr,0,0,dpr,0,0);
w=Math.ceil(W/S)+2;h=Math.ceil(H/S)+2;oc.width=w;oc.height=h;a=new Float32Array(w*h);b=new Float32Array(w*h);img=ox.createImageData(w,h);
var n=STOPS.length-1;lut=new Uint8Array(w*3);
for(var i=0;i<w;i++){var t=n?i/(w-1)*n:0,k=Math.min(n-1,t|0),f=t-k;if(!n){k=0;f=0}
for(var j=0;j<3;j++)lut[i*3+j]=STOPS[k][j]+((STOPS[k+1]||STOPS[k])[j]-STOPS[k][j])*f}go()}
function drop(px,py,r,s){var cx=(px/S|0)+1,cy=(py/S|0)+1;
for(var dy=-r;dy<=r;dy++)for(var dx=-r;dx<=r;dx++){var X=cx+dx,Y=cy+dy,d=Math.sqrt(dx*dx+dy*dy);
if(d<=r&&X>0&&Y>0&&X<w-1&&Y<h-1)a[Y*w+X]+=s*(Math.cos(d/r*Math.PI)+1)/2}}
function go(){if(!run){run=1;requestAnimationFrame(draw)}}
function draw(){
var i,y,X,v,max=0,d=img.data;
for(y=1;y<h-1;y++)for(X=1,i=y*w+1;X<w-1;X++,i++){v=((a[i-1]+a[i+1]+a[i-w]+a[i+w])*.5-b[i])*DAMP;b[i]=v;if(v>max)max=v;else if(-v>max)max=-v}
var t=a;a=b;b=t;
for(y=1;y<h-1;y++)for(X=1,i=y*w+1;X<w-1;X++,i++){
var sx=a[i-1]-a[i+1],sy=a[i-w]-a[i+w],sh=(sx+sy)*.7,m=Math.abs(sx)+Math.abs(sy),o=i*4,q=X*3;
if(m<.6){d[o+3]=0;continue}
if(sh>0){var f=Math.min(1,sh/45);d[o]=lut[q]+(255-lut[q])*f;d[o+1]=lut[q+1]+(255-lut[q+1])*f;d[o+2]=lut[q+2]+(255-lut[q+2])*f;d[o+3]=Math.min(210,m*4)}
else{d[o]=lut[q]*.25;d[o+1]=lut[q+1]*.25;d[o+2]=lut[q+2]*.25;d[o+3]=Math.min(150,m*3)}}
ox.putImageData(img,0,0);
x.clearRect(0,0,W,H);x.drawImage(oc,-S,-S,w*S,h*S);
if(gl.x<-9e3){gl.x=gl.tx;gl.y=gl.ty}
gl.x+=(gl.tx-gl.x)*.12;gl.y+=(gl.ty-gl.y)*.12;
var g=x.createRadialGradient(gl.x,gl.y,0,gl.x,gl.y,280);
g.addColorStop(0,GLOW+".13)");g.addColorStop(1,GLOW+"0)");
x.fillStyle=g;x.fillRect(gl.x-280,gl.y-280,560,560);
if(max>.4||Math.abs(gl.tx-gl.x)+Math.abs(gl.ty-gl.y)>.5)requestAnimationFrame(draw);else{run=0;a.fill(0);b.fill(0)}}
addEventListener("resize",size);size();
function trail(px,py){if(!on)return;gl.tx=px;gl.ty=py;
if(lx>=0){var dist=Math.hypot(px-lx,py-ly),n=Math.ceil(dist/10),s=Math.min(30,dist*.8)/Math.max(1,n);
for(var k=1;k<=n;k++)drop(lx+(px-lx)*k/n,ly+(py-ly)*k/n,2,s)}
lx=px;ly=py;go()}
addEventListener("pointermove",function(e){if(e.pointerType!=="touch")trail(e.clientX,e.clientY)},{passive:true});
// touch: pointer events stop once the page starts scrolling, touch events keep firing
addEventListener("touchstart",function(e){var t=e.touches[0];lx=t.clientX;ly=t.clientY},{passive:true});
addEventListener("touchmove",function(e){var t=e.touches[0];trail(t.clientX,t.clientY)},{passive:true});
addEventListener("pointerdown",function(e){if(!on||e.target===tg)return;drop(e.clientX,e.clientY,5,-260);go()},{passive:true});
})();
