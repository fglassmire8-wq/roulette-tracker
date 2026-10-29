// Pockets: 0..36, and 37 = "00"
const ORDER=[0,28,9,26,30,11,7,20,32,17,5,22,34,15,3,24,36,13,1,37,27,10,25,29,12,8,19,31,18,6,21,33,16,4,23,35,14,2];
const REDS=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const lab=n=>n===37?'00':String(n);
const color=n=>(n===0||n===37)?'green':REDS.has(n)?'red':'black';
const cls=n=>({green:'g',red:'r',black:'b'})[color(n)];
const z=n=>n===0||n===37;
const PROPS={ // returns outcome label or null (null breaks streak)
 'Colour':n=>z(n)?null:color(n),
 'Odd/even':n=>z(n)?null:(n%2?'odd':'even'),
 'Low/high':n=>z(n)?null:(n<=18?'low (1–18)':'high (19–36)'),
 'Dozen':n=>z(n)?null:['1st dozen','2nd dozen','3rd dozen'][Math.floor((n-1)/12)],
 'Column':n=>z(n)?null:['column 1','column 2','column 3'][(n-1)%3],
};
const S={get h(){return JSON.parse(localStorage.getItem('rt_hist')||'[]')},set h(v){localStorage.setItem('rt_hist',JSON.stringify(v))},
 get thr(){return +localStorage.getItem('rt_thr')||5},set thr(v){localStorage.setItem('rt_thr',v)}};
const $=id=>document.getElementById(id);

function drawWheel(){const s=$('wheel'),N=38,R=100,r=62,ns='http://www.w3.org/2000/svg';let h='';
 ORDER.forEach((n,i)=>{const a0=(i-.5)/N*2*Math.PI-Math.PI/2,a1=(i+.5)/N*2*Math.PI-Math.PI/2,P=(a,rr)=>`${(rr*Math.cos(a)).toFixed(2)} ${(rr*Math.sin(a)).toFixed(2)}`;
  const fill={green:'#1e8b4c',red:'#c0392b',black:'#1c1c1c'}[color(n)],am=(a0+a1)/2,tr=88,tx=tr*Math.cos(am),ty=tr*Math.sin(am);
  h+=`<path data-n="${n}" d="M${P(a0,R)} A${R} ${R} 0 0 1 ${P(a1,R)} L${P(a1,r)} A${r} ${r} 0 0 0 ${P(a0,r)}Z" fill="${fill}" stroke="#d4af37" stroke-width=".6"/>`;
  h+=`<text x="${tx}" y="${ty}" fill="#fff" font-size="7" font-weight="700" text-anchor="middle" dominant-baseline="central" transform="rotate(${am*180/Math.PI+90} ${tx} ${ty})" pointer-events="none">${lab(n)}</text>`;});
 h+=`<circle r="62" fill="#5a3a1a" stroke="#d4af37"/><circle r="40" fill="#7a5230"/><circle r="8" fill="#d4af37"/>`;
 s.innerHTML=h;}
function drawGrid(){const g=$('grid');let h=`<button class="g z0" data-n="37">00</button><button class="g z1" data-n="0">0</button>`;
 for(const r of [3,2,1])for(let c=0;c<12;c++){const n=c*3+r;h+=`<button class="${cls(n)}" data-n="${n}">${n}</button>`;}g.innerHTML=h;
 g.onclick=e=>{const n=e.target.dataset.n;if(n!==undefined)log(+n)};}

function streaks(h){ // h newest-first; returns active streaks >= thr ending at latest spin
 const out=[],t=S.thr;if(!h.length)return out;
 for(const[k,f]of Object.entries(PROPS)){const v=f(h[0].n);if(v===null)continue;let c=0;for(const x of h){if(f(x.n)===v)c++;else break}if(c>=t)out.push({k,v,c});}
 return out;}
function log(n){const h=S.h;h.unshift({n,t:Date.now()});S.h=h;navigator.vibrate&&navigator.vibrate(20);
 const st=streaks(h).filter(s=>s.c===S.thr);if(st.length)alertStreak(st);else $('banner').classList.add('hidden');render();}
function alertStreak(st){const msg=st.map(s=>`${s.v} × ${s.c} in a row`).join(' · ');
 $('banner').innerHTML=`🔔 Streak logged: ${msg}<small>Record of past spins. Each spin is independent.</small>`;
 $('banner').classList.remove('hidden');navigator.vibrate&&navigator.vibrate([200,100,200]);
 if('Notification'in window&&Notification.permission==='granted'){try{navigator.serviceWorker?.ready.then(r=>r.showNotification('Roulette streak',{body:msg})).catch(()=>new Notification('Roulette streak',{body:msg}))}catch(e){}}}
function render(){const h=S.h;
 $('last').innerHTML=h.length?`Last: <span class="chip ${cls(h[0].n)}">${lab(h[0].n)}</span> &nbsp; ${h.slice(1,10).map(x=>`<span class="chip ${cls(x.n)}">${lab(x.n)}</span>`).join(' ')}`:'No spins logged yet';
 $('hcount').textContent=`(${h.length})`;
 $('hist').innerHTML=h.map((x,i)=>`<li><span>#${h.length-i} <span class="chip ${cls(x.n)}">${lab(x.n)}</span></span><span>${new Date(x.t).toLocaleString()}</span></li>`).join('');
 const cnt={},inc=k=>cnt[k]=(cnt[k]||0)+1;h.forEach(x=>{for(const[k,f]of Object.entries(PROPS)){const v=f(x.n);if(v)inc(v)}if(z(x.n))inc('zero (0/00)')});
 const row=(a)=>a.map(k=>`<td>${k}: <b>${cnt[k]||0}</b></td>`).join('');
 const freq={};h.forEach(x=>freq[x.n]=(freq[x.n]||0)+1);const hot=Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,5);
 $('stats').innerHTML=`<table><tr>${row(['red','black','zero (0/00)'])}</tr><tr>${row(['odd','even'])}</tr><tr>${row(['low (1–18)','high (19–36)'])}</tr>
 <tr>${row(['1st dozen','2nd dozen','3rd dozen'])}</tr><tr>${row(['column 1','column 2','column 3'])}</tr></table>
 <p>Most frequent so far (top 5, count): ${hot.map(([n,c])=>`<span class="chip ${cls(+n)}">${lab(+n)}</span>×${c}`).join(' ')||'—'}</p>`;
 renderFreq(h);
 document.querySelectorAll('#wheel path').forEach(p=>p.classList.toggle('lastp',!!h.length&&+p.dataset.n===h[0].n));
 const act=streaks(h);$('active').innerHTML=act.map(s=>`<div class="status">${s.v[0].toUpperCase()+s.v.slice(1)} streak active · ${s.c} in a row</div>`).join('');
 $('thr').value=S.thr;$('thr1').textContent=S.thr;}
$('undo').onclick=()=>{const h=S.h;h.shift();S.h=h;$('banner').classList.add('hidden');render()};
$('thr').onchange=e=>{S.thr=Math.max(2,Math.min(20,+e.target.value||5));render()};
$('clear').onclick=()=>{if(confirm('Delete all logged spins?')){S.h=[];render()}};
$('notif').onclick=()=>'Notification'in window&&Notification.requestPermission();
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{document.querySelectorAll('nav button,.view').forEach(x=>x.classList.remove('on','active'));b.classList.add('on');$(b.dataset.v).classList.add('active');scrollTo(0,0)});
$('banner').onclick=()=>$('banner').classList.add('hidden');
drawWheel();drawGrid();render();
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');

function renderFreq(h){const n=h.length,p=1/38,E=n*p,sd=Math.sqrt(n*p*(1-p)),all=[...Array(38).keys()];
 const cnt={},gap={};all.forEach(k=>{cnt[k]=0;gap[k]=n});h.forEach((x,i)=>{cnt[x.n]++;if(gap[x.n]===n)gap[x.n]=i});
 const chip=k=>`<span class="chip ${cls(k)}">${lab(k)}</span>`;
 let above;if(n<38)above=`<p class="muted">Shown after 38 spins (${n} logged so far).</p>`;else{const L=all.filter(k=>cnt[k]>=E+2*sd).sort((a,b)=>cnt[b]-cnt[a]);
  above=L.length?`<table><tr><td>Number</td><td>Actual</td><td>Expected</td></tr>${L.map(k=>`<tr><td>${chip(k)}</td><td>${cnt[k]}</td><td>${E.toFixed(1)}</td></tr>`).join('')}</table>`:`<p class="muted">None. No number is 2 or more standard deviations above expected (${E.toFixed(1)}).</p>`;}
 const G=all.filter(k=>Math.pow(37/38,gap[k])<0.05).sort((a,b)=>gap[b]-gap[a]);
 const absent=G.length?`<table><tr><td>Number</td><td>Spins since last seen</td><td>Typical gap</td></tr>${G.map(k=>`<tr><td>${chip(k)}</td><td>${gap[k]}${gap[k]===n?' (never seen)':''}</td><td>38</td></tr>`).join('')}</table>`:`<p class="muted">None. ${n<113?`A gap needs at least 113 spins to be listed (${n} logged so far).`:'No number has a gap of 113 or more spins.'}</p>`;
 const top=all.filter(k=>cnt[k]).sort((a,b)=>cnt[b]-cnt[a]||a-b).slice(0,5);
 const cold=[...all].sort((a,b)=>cnt[a]-cnt[b]||gap[b]-gap[a]).slice(0,5);
 const lst=L=>L.map(k=>`${chip(k)} ${cnt[k]}`).join(' &nbsp;');
 const CATS=[['Red',k=>color(k)==='red'],['Black',k=>color(k)==='black'],['Green (0/00)',k=>z(k)],['Odd',k=>!z(k)&&k%2===1],['Even',k=>!z(k)&&k%2===0],['Low 1–18',k=>!z(k)&&k<=18],['High 19–36',k=>!z(k)&&k>18],
  ...[1,2,3].map(d=>[`Dozen ${d} (${d*12-11}–${d*12})`,k=>!z(k)&&Math.ceil(k/12)===d]),...[1,2,3].map(c=>[`Column ${c}`,k=>!z(k)&&(k-1)%3===c-1])];
 const catRows=CATS.map(([name,f])=>{const pk=all.filter(f).length,q=pk/38,e=n*q,s=Math.sqrt(n*q*(1-q)),a=h.filter(x=>f(x.n)).length,gi=h.findIndex(x=>f(x.n)),g=gi<0?n:gi;
  const fl=n<38?'':(a-e>=2*s?'Above (≥2 sd)':(e-a>=2*s?'Below (≥2 sd)':''));
  return `<tr><td>${name}</td><td>${a}</td><td>${e.toFixed(1)}</td><td>${g}${gi<0?'*':''}</td><td>${fl}</td></tr>`}).join('');
 const catTable=`<h3>Categories</h3><table class="cats"><tr><td>Category</td><td>Actual</td><td>Expected</td><td>Gap</td><td>Flag</td></tr>${catRows}</table>
 <p class="muted">Expected = spins × pockets in category ÷ 38. Gap = spins since last hit (* = not hit yet). Flag shows when actual differs from expected by 2 or more standard deviations${n<38?`; flags start after 38 spins (${n} logged so far)`:''}.</p>`;
 $('freq').innerHTML=n?`${catTable}<h3>Above expected</h3>${above}<h3>Long absences</h3>${absent}
 <h3>Most frequent (top 5)</h3><p>${lst(top)}</p><h3>Fewest hits (top 5)</h3><p>${lst(cold)}</p>
 <div class="warn"><p><b>How numbers are flagged.</b> Each of the 38 pockets has a 1 in 38 chance per spin. After ${n} spins, chance alone gives each number about ${E.toFixed(1)} hits. A number is listed as “above expected” when its count is at least 2 standard deviations above that (standard deviation = √(spins × 1/38 × 37/38)); this list starts after 38 spins. A number is listed as a “long absence” when the chance of a gap that long is under 5% — that is 113 or more spins without it. The typical gap between appearances is 38 spins. With 38 numbers, a few flags appear from chance alone.</p>
 <p>This compares what happened to what chance alone would give. It does not predict the next spin; every number has the same odds each spin.</p></div>`:'<p class="muted">No spins logged yet.</p>';}

// ---- Scan (Beta): camera + on-device OCR, always confirm before logging ----
let stream=null,tessP=null;
const parseNum=t=>{const m=(t||'').replace(/[^0-9]/g,' ').trim().split(/\s+/).filter(Boolean);for(const s of m){if(s==='00')return 37;if(/^\d{1,2}$/.test(s)&&+s<=36&&!(s.length===2&&s[0]==='0'))return +s;}return null;};
function loadTess(){return tessP||(tessP=new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';s.onload=()=>res(window.Tesseract);s.onerror=()=>{tessP=null;rej(new Error('OCR could not load (needs internet the first time).'))};document.head.appendChild(s);}));}
let wP=null;function worker(){return wP||(wP=loadTess().then(async T=>{const w=await T.createWorker('eng');await w.setParameters({tessedit_char_whitelist:'0123456789',tessedit_pageseg_mode:'7'});return w}).catch(e=>{wP=null;throw e}));}
async function ocr(canvas){const w=await worker();const {data}=await w.recognize(canvas);return data.text;}
function prep(src){const W=src.width,H=src.height,k=Math.max(1,Math.min(4,160/H)),pad=30,c=document.createElement('canvas');c.width=W*k+2*pad;c.height=H*k+2*pad;const x=c.getContext('2d');
 x.drawImage(src,pad,pad,W*k,H*k);const d=x.getImageData(0,0,c.width,c.height),p=d.data;let sum=0;const L=new Float32Array(p.length/4);
 for(let i=0;i<L.length;i++){L[i]=Math.max(p[i*4],p[i*4+1],p[i*4+2]);sum+=L[i]}const m=sum/L.length;
 let br=0;for(let i=0;i<L.length;i++)if(L[i]>m)br++;const darkText=br>L.length/2; // mostly bright background
 for(let i=0;i<L.length;i++){const ink=darkText?L[i]<m:L[i]>m;const v=(i%c.width<pad||i%c.width>=c.width-pad||i<pad*c.width||i>=L.length-pad*c.width)?255:(ink?0:255);p[i*4]=p[i*4+1]=p[i*4+2]=v;p[i*4+3]=255}
 x.putImageData(d,0,0);return c;}
function padUp(src){const W=src.width,H=src.height,k=Math.max(1,Math.min(4,160/H)),pad=30,c=document.createElement('canvas');c.width=W*k+2*pad;c.height=H*k+2*pad;const x=c.getContext('2d');
 const e=src.getContext?src.getContext('2d').getImageData(0,0,1,1).data:[0,0,0];x.fillStyle=`rgb(${e[0]},${e[1]},${e[2]})`;x.fillRect(0,0,c.width,c.height);x.drawImage(src,pad,pad,W*k,H*k);return c;}
window.ocrAndParse=async c=>{const w=await worker();let t='',n=null;const imgs=[c,padUp(c),prep(c)];
 for(const psm of ['7','8'])for(const im of imgs){await w.setParameters({tessedit_pageseg_mode:psm});const r=(await w.recognize(im)).data.text;if(!t)t=r;n=parseNum(r);if(n!==null){t=r;await w.setParameters({tessedit_pageseg_mode:'7'});return {text:t.trim(),n}}}
 await w.setParameters({tessedit_pageseg_mode:'7'});return {text:t.trim(),n}};
function scanUI(st){['capBtn','okBtn','retryBtn','scanInput'].forEach(x=>$(x).classList.add('hidden'));$('vid').classList.toggle('hidden',st!=='live');$('snap').classList.toggle('hidden',st==='live');
 if(st==='live')$('capBtn').classList.remove('hidden');if(st==='result'){$('okBtn').classList.remove('hidden');$('retryBtn').classList.remove('hidden');$('scanInput').classList.remove('hidden');}}
async function openScan(){$('scan').classList.remove('hidden');$('scanState').textContent='';$('scanMsg').textContent='';scanUI('live');loadTess().catch(()=>{});
 try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});$('vid').srcObject=stream;}
 catch(e){$('scanMsg').textContent='Camera not available or permission denied.';}}
function closeScan(){stream&&stream.getTracks().forEach(t=>t.stop());stream=null;$('scan').classList.add('hidden');}
async function capture(){const v=$('vid'),c=$('snap');if(!v.videoWidth){$('scanMsg').textContent='No camera image yet.';return}
 c.width=v.videoWidth;c.height=v.videoHeight;c.getContext('2d').drawImage(v,0,0);await readFrom(c);}
async function readFrom(c){scanUI('result');$('okBtn').classList.add('hidden');$('scanState').textContent='…';$('scanMsg').textContent='Reading on this device…';
 try{const r=await window.ocrAndParse(c);$('scanInput').value=r.n===null?'':lab(r.n);$('scanState').textContent=r.n===null?'?':lab(r.n);
  $('scanMsg').textContent=r.n===null?`No valid number read${r.text?` (saw “${r.text}”)`:''}. Type it, or retake.`:'Check the number. Edit it if wrong, then tap Log.';}
 catch(e){$('scanState').textContent='?';$('scanMsg').textContent=e.message+' Type the number instead.';}
 $('okBtn').classList.remove('hidden');}
window.scanReadFrom=readFrom;
$('scanBtn').onclick=openScan;$('closeScan').onclick=closeScan;$('capBtn').onclick=capture;$('retryBtn').onclick=()=>{$('scanState').textContent='';scanUI('live')};
$('scanInput').oninput=e=>{$('scanState').textContent=e.target.value||'?'};
$('okBtn').onclick=()=>{const v=$('scanInput').value.trim();const n=v==='00'?37:(/^(0|[1-9]|[12]\d|3[0-6])$/.test(v)?+v:null);
 if(n===null){$('scanMsg').textContent='Only 0, 00 or 1–36 can be logged.';return}closeScan();log(n);};

// ---- Screen read (Beta): share a tab/window, select region, OCR ~1s, confirm before logging ----
const SR={stream:null,box:null,timer:null,prev:null,shown:null,busy:false};
const srBtn=$('srBtn');if(!(navigator.mediaDevices&&navigator.mediaDevices.getDisplayMedia))srBtn.classList.add('hidden');
async function srStart(){$('sr').classList.remove('hidden');$('srMsg').textContent='Choose the tab or window that shows the result number.';
 try{SR.stream=await navigator.mediaDevices.getDisplayMedia({video:true,audio:false});}catch(e){$('srMsg').textContent='Screen sharing was cancelled or is not allowed.';return}
 $('srVid').srcObject=SR.stream;SR.stream.getVideoTracks()[0].onended=srStop;SR.box=null;SR.prev=SR.shown=null;worker().catch(()=>{});
 $('srMsg').textContent='Drag a box around the place where the result number appears.';}
function srStop(){clearInterval(SR.timer);SR.timer=null;SR.stream&&SR.stream.getTracks().forEach(t=>t.stop());SR.stream=null;$('sr').classList.add('hidden');$('srPending').classList.add('hidden');}
(function(){const ov=$('srOv');let s=null;const pt=e=>{const r=ov.getBoundingClientRect();return [(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height]};
 ov.onpointerdown=e=>{s=pt(e);ov.setPointerCapture(e.pointerId)};
 ov.onpointermove=e=>{if(!s)return;const q=pt(e);drawBox(s,q)};
 ov.onpointerup=e=>{if(!s)return;const q=pt(e);const b={x:Math.min(s[0],q[0]),y:Math.min(s[1],q[1]),w:Math.abs(q[0]-s[0]),h:Math.abs(q[1]-s[1])};s=null;
  if(b.w<.01||b.h<.01)return;SR.box=b;drawBox([b.x,b.y],[b.x+b.w,b.y+b.h]);$('srMsg').textContent='Watching the box about once a second. A number is shown for you to confirm after it reads the same twice.';
  clearInterval(SR.timer);SR.timer=setInterval(srTick,1000);};
 function drawBox(a,b){const d=$('srBoxEl');d.style.left=Math.min(a[0],b[0])*100+'%';d.style.top=Math.min(a[1],b[1])*100+'%';d.style.width=Math.abs(b[0]-a[0])*100+'%';d.style.height=Math.abs(b[1]-a[1])*100+'%';d.classList.remove('hidden')}})();
function cropScaled(src,sw,sh,b){const c=document.createElement('canvas'),W=b.w*sw,H=b.h*sh,k=Math.max(1,Math.min(4,120/H));c.width=W*k;c.height=H*k;
 const x=c.getContext('2d');x.imageSmoothingEnabled=true;x.drawImage(src,b.x*sw,b.y*sh,W,H,0,0,c.width,c.height);return c;}
async function srTick(){if(SR.busy||!SR.box)return;const v=$('srVid');if(!v.videoWidth)return;SR.busy=true;
 try{const r=await window.ocrAndParse(cropScaled(v,v.videoWidth,v.videoHeight,SR.box));$('srLast').textContent=r.n===null?`last read: —`:`last read: ${lab(r.n)}`;
  if(r.n!==null&&r.n===SR.prev&&r.n!==SR.shown){SR.shown=r.n;$('srIn').value=lab(r.n);$('srPending').classList.remove('hidden');navigator.vibrate&&navigator.vibrate(30);}
  SR.prev=r.n;}catch(e){$('srMsg').textContent=e.message;}finally{SR.busy=false}}
window.srFeed=async c=>{SR.box={x:0,y:0,w:1,h:1};const r=await window.ocrAndParse(cropScaled(c,c.width,c.height,SR.box));if(r.n!==null&&r.n===SR.prev&&r.n!==SR.shown){SR.shown=r.n;$('srIn').value=lab(r.n);$('srPending').classList.remove('hidden')}SR.prev=r.n;return r};
srBtn.onclick=srStart;$('srStop').onclick=srStop;
$('srOk').onclick=()=>{const v=$('srIn').value.trim();const n=v==='00'?37:(/^(0|[1-9]|[12]\d|3[0-6])$/.test(v)?+v:null);if(n===null){$('srLast').textContent='Only 0, 00 or 1–36 can be logged.';return}
 $('srPending').classList.add('hidden');log(n);};
$('srSkip').onclick=()=>$('srPending').classList.add('hidden');
