document.addEventListener('click',e=>{const o=e.target.closest('[data-open]');if(o){e.preventDefault();const m=document.getElementById(o.dataset.open);m.hidden=false;m.querySelector('.mdl-x').focus();return}
 if(e.target.closest('[data-close]')||e.target.classList.contains('mdl')){const m=e.target.closest('.mdl');if(m)m.hidden=true}});
document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.mdl').forEach(m=>m.hidden=true)});


/* Headlines: rotate one item every 5 seconds */
function startHeadlines(H){
  const ul=document.getElementById('hl'); if(!ul||!H.length) return;
  const esc=s=>String(s).replace(/&(?!amp;)/g,'&amp;').replace(/</g,'&lt;');
  const mk=a=>{const li=document.createElement('li');li.innerHTML=`<time>${esc(a.date)}</time><div><em>${esc(a.tag)}</em><h4><a href="${a.url}" target="_blank" rel="noopener">${esc(a.title)}</a></h4><small>${esc(a.source)}</small></div>`;return li};
  ul.innerHTML=''; let i=0; const N=ul.classList.contains('hl3')?3:4; for(;i<Math.min(N,H.length);i++) ul.appendChild(mk(H[i]));
  if(H.length<=N||matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  setInterval(()=>{const first=ul.firstElementChild; first.classList.add('out');
    setTimeout(()=>{first.remove();const li=mk(H[i%H.length]);i++;li.classList.add('in');ul.appendChild(li);requestAnimationFrame(()=>requestAnimationFrame(()=>li.classList.remove('in')));},600);},5000);
}



/* Mobile menu */
(function(){const b=document.getElementById('burger'),d=document.getElementById('drawer');
 const set=o=>{d.hidden=!o;b.classList.toggle('open',o);b.setAttribute('aria-expanded',o)};
 b.addEventListener('click',e=>{e.stopPropagation();set(d.hidden)});
 d.addEventListener('click',e=>{if(e.target.closest('a'))set(false)});
 document.addEventListener('click',e=>{if(!d.hidden&&!d.contains(e.target))set(false)});})();
async function loadNews(){
  const ticker = document.getElementById('newsTicker');

  // Safe public RSS feeds — headlines + source + link only (no article text)
  // Multiple RSS feeds for variety — BBC Business + Reuters (public feeds)
  const rss = 'https://api.rss2json.com/v1/api.json?api_key=public&count=8&rss_url=';
  const feeds = [
    { url:'https://feeds.bbci.co.uk/news/business/rss.xml',   source:'BBC Business' },
    { url:'https://feeds.reuters.com/reuters/businessNews',    source:'Reuters' },
    { url:'https://feeds.reuters.com/reuters/companyNews',     source:'Reuters' },
  ];

  const fallback = [
    { title:"M&A activity rebounds as deal-makers return to the table in 2026", tag:"M&A", source:"Reuters", url:"https://reuters.com/business", date:"Today" },
    { title:"Private equity shifts focus to operational value creation post-acquisition", tag:"Strategy", source:"Reuters", url:"https://reuters.com/business", date:"This week" },
    { title:"CSRD reporting requirements: what European boards need to know now", tag:"ESG", source:"BBC Business", url:"https://bbc.co.uk/news/business", date:"This week" },
    { title:"Digital transformation spending shifts from infrastructure to AI integration", tag:"Digital", source:"BBC Business", url:"https://bbc.co.uk/news/business", date:"This week" },
    { title:"CFOs increasingly take a seat at the M&A strategy table, survey finds", tag:"Governance", source:"Reuters", url:"https://reuters.com/business", date:"This month" },
    { title:"Commodity markets: managing volatility in an uncertain macro environment", tag:"Commodities", source:"Reuters", url:"https://reuters.com/markets", date:"This month" },
    { title:"Boards under pressure to integrate ESG into core strategy", tag:"ESG", source:"BBC Business", url:"https://bbc.co.uk/news/business", date:"This week" },
    { title:"Capital markets activity picks up as deal valuations stabilise", tag:"Finance", source:"Reuters", url:"https://reuters.com/markets", date:"Today" },
    { title:"Operational resilience becomes board-level priority post-pandemic", tag:"Strategy", source:"BBC Business", url:"https://bbc.co.uk/news/business", date:"This month" },
  ];

  const tagMap = (title) => {
    const t = title.toLowerCase();
    if(t.includes('merger')||t.includes('acqui')||t.includes('deal')||t.includes('takeover')||t.includes('buyout')) return 'M&A';
    if(t.includes('esg')||t.includes('sustainab')||t.includes('climate')||t.includes('carbon')||t.includes('csrd')) return 'ESG';
    if(t.includes('digital')||t.includes(' ai ')||t.includes('tech')||t.includes('transform')) return 'Digital';
    if(t.includes('commodit')||t.includes(' oil')||t.includes('gold')||t.includes('copper')||t.includes('energy')) return 'Commodities';
    if(t.includes('forex')||t.includes('currency')||t.includes(' fx ')||t.includes('dollar')||t.includes('euro')||t.includes('sterling')) return 'Forex';
    if(t.includes('board')||t.includes('cfo')||t.includes('ceo')||t.includes('govern')||t.includes('execut')) return 'Governance';
    if(t.includes('capital')||t.includes('fund')||t.includes('invest')||t.includes('equity')||t.includes('ipo')) return 'Finance';
    return 'Strategy';
  };

  let articles = [];

  // Try multiple feeds in parallel
  try {
    const results = await Promise.allSettled(
      feeds.map(f => fetch(rss + encodeURIComponent(f.url), { signal: AbortSignal.timeout(6000) })
        .then(r => r.json())
        .then(d => ({ items: d.items || [], source: f.source }))
      )
    );
    results.forEach(r => {
      if(r.status === 'fulfilled' && r.value.items.length > 0){
        r.value.items.slice(0,4).forEach(it => {
          articles.push({
            title: it.title,
            tag: tagMap(it.title),
            source: r.value.source,
            url: it.link,
            date: new Date(it.pubDate).toLocaleDateString('en-GB',{day:'numeric',month:'short'})
          });
        });
      }
    });
    // Deduplicate by title
    const seen = new Set();
    articles = articles.filter(a => {
      if(seen.has(a.title)) return false;
      seen.add(a.title); return true;
    });
  } catch(e){ /* use fallback */ }

  if(articles.length < 3) articles = fallback;
  const gridArticles = articles.slice(0, 6);
  const tickerArticles = articles.slice(0, 12);

  startHeadlines(articles.slice(0,10));

  // Populate ticker strip — headline + source, duplicated for infinite scroll
  if(ticker){
    const makeItem = a => `<a class="nw" href="${a.url}" target="_blank" rel="noopener"><em>${a.tag}</em>${a.title}<small>· ${a.source}</small></a>`;
    ticker.innerHTML = [...tickerArticles, ...tickerArticles].map(makeItem).join('');
  }
}
loadNews();
/* ── LIVE MARKET TICKER ──
   Uses Finnhub free API (60 calls/min, no cost).
   Get your free key at: https://finnhub.io/register
   Replace 'YOUR_FINNHUB_KEY' below with your key.
   Without a key, realistic simulated data runs instead.
*/
const FINNHUB_KEY = 'd7g4h5hr01qqb8rialb0d7g4h5hr01qqb8rialbg';

const SYMBOLS = [
  {sym:'EUR/USD', finnhub:'OANDA:EUR_USD', type:'forex'},
  {sym:'GBP/USD', finnhub:'OANDA:GBP_USD', type:'forex'},
  {sym:'USD/JPY', finnhub:'OANDA:USD_JPY', type:'forex'},
  {sym:'S&P 500', finnhub:'SPY',           type:'etf'},
  {sym:'NASDAQ',  finnhub:'QQQ',           type:'etf'},
  {sym:'Gold',    finnhub:'OANDA:XAU_USD', type:'commodity'},
  {sym:'Oil WTI', finnhub:'OANDA:USOIL',   type:'commodity'},
  {sym:'BTC/USD', finnhub:'BINANCE:BTCUSDT',type:'crypto'},
];

const SIMULATED = [
  {sym:'EUR/USD', price:1.0842, chg:0.0014},
  {sym:'GBP/USD', price:1.2713, chg:-0.0023},
  {sym:'USD/JPY', price:154.32, chg:0.48},
  {sym:'S&P 500', price:5248.7, chg:18.3},
  {sym:'NASDAQ',  price:18412.4, chg:-42.1},
  {sym:'Gold',    price:2341.5, chg:8.7},
  {sym:'Oil WTI', price:79.14, chg:-0.38},
  {sym:'BTC/USD', price:63420, chg:810},
];

function fmtPrice(p){
  if(p>=1000)return p.toLocaleString('en',{maximumFractionDigits:1});
  if(p>=100)return p.toFixed(2);
  return p.toFixed(4);
}
function fmtChg(c,p){
  const pct=(c/p*100);
  const sign=c>=0?'+':'';
  return `${sign}${pct.toFixed(2)}%`;
}

function buildTicker(data){
  const track=document.getElementById('tickerTrack'); if(!track||!data.length) return;
  const item=d=>{const dir=d.chg>0?'up':d.chg<0?'dn':'';return `<span class="tk"><b>${d.sym}</b><span>${fmtPrice(d.price)}</span><span class="${dir}">${fmtChg(d.chg,d.price)}</span></span>`};
  track.innerHTML=[...data,...data].map(item).join('');
}

async function fetchFinnhub(){
  if(FINNHUB_KEY==='YOUR_FINNHUB_KEY'){
    /* Simulate realistic live-ish data with small random drift */
    const live=SIMULATED.map(d=>{
      const drift=(Math.random()-0.49)*0.001*d.price;
      return {sym:d.sym,price:+(d.price+drift).toFixed(6),chg:d.chg+drift};
    });
    buildTicker(live);
    return;
  }
  try{
    const results=await Promise.all(SYMBOLS.map(async s=>{
      const r=await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(s.finnhub)}&token=${FINNHUB_KEY}`);
      const j=await r.json();
      return {sym:s.sym,price:j.c||0,chg:(j.c||0)-(j.pc||0)};
    }));
    buildTicker(results.filter(r=>r.price>0));
  }catch(e){
    buildTicker(SIMULATED);
  }
}

fetchFinnhub();
setInterval(fetchFinnhub, 30000);

/* v3: dropdown menus (hover on desktop, click/tap toggles, Esc closes) */
(function(){
  const dds=[...document.querySelectorAll('.dd')];
  dds.forEach(d=>{const b=d.querySelector('.dd-b');
    b.addEventListener('click',e=>{e.stopPropagation();const o=!d.classList.contains('open');dds.forEach(x=>{x.classList.remove('open');x.querySelector('.dd-b').setAttribute('aria-expanded','false')});d.classList.toggle('open',o);b.setAttribute('aria-expanded',o)});});
  document.addEventListener('click',()=>dds.forEach(x=>x.classList.remove('open')));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')dds.forEach(x=>x.classList.remove('open'))});
})();

/* home: Nexus Method flow — steps light up in turn; hover or tap to pick one */
(function(){
  const flow=document.getElementById('flow'); if(!flow) return;
  const steps=[...flow.querySelectorAll('.fs')], fill=document.getElementById('flowFill');
  const vertical=()=>matchMedia('(max-width:760px)').matches;
  let cur=0, timer=null;
  function show(i){cur=i;steps.forEach((s,k)=>{s.classList.toggle('act',k===i);s.classList.toggle('done',k<=i)});
    const pct=(i/(steps.length-1))*100; if(vertical()){fill.style.height=pct+'%';fill.style.width='';}else{fill.style.width=pct+'%';fill.style.height='';}}
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function play(){stop(); if(reduce) return; timer=setInterval(()=>show((cur+1)%steps.length),2800);}
  function stop(){if(timer)clearInterval(timer); timer=null;}
  steps.forEach((s,k)=>{s.addEventListener('mouseenter',()=>{stop();show(k)});s.addEventListener('focus',()=>{stop();show(k)});s.addEventListener('click',()=>{stop();show(k)});});
  flow.addEventListener('mouseleave',play);
  addEventListener('resize',()=>show(cur));
  show(0);
  // start when the flow scrolls into view
  if('IntersectionObserver' in window){const io=new IntersectionObserver(e=>{if(e[0].isIntersecting){play();io.disconnect();}},{threshold:.4});io.observe(flow);}else play();
})();

/* every page opens at its top (unless the link targets a section) */
(function(){
  try{ if('scrollRestoration' in history) history.scrollRestoration='manual'; }catch(e){}
  const toTop=()=>{ if(!location.hash){ document.documentElement.style.scrollBehavior='auto'; window.scrollTo(0,0); document.documentElement.style.scrollBehavior=''; } };
  toTop(); addEventListener('load',toTop); addEventListener('pageshow',toTop);
  // clicking a menu item for the page you are already on goes back to its top
  document.addEventListener('click',e=>{const a=e.target.closest('a[href]'); if(!a||a.hasAttribute('data-open')||a.getAttribute('href').charAt(0)==='#') return;
    const u=new URL(a.getAttribute('href'),location.href);
    if(u.pathname===location.pathname && !u.hash){ e.preventDefault(); window.scrollTo({top:0,behavior:'smooth'}); }});
})();

/* Option A: cycle — a gold dot travels the ring; hover a step or tab to hold it */
(function(){
  const root=document.getElementById('cyc'); if(!root) return;
  const data=JSON.parse(document.getElementById('cycData').textContent);
  const nodes=[...root.querySelectorAll('.cn')], tabs=[...root.querySelectorAll('.cyc-tabs button')];
  const prog=document.getElementById('cycProg'), dot=document.getElementById('cycDot'), ring=root.querySelector('.cyc-ring');
  const N=document.getElementById('cycN'), T=document.getElementById('cycT'), D=document.getElementById('cycD');
  const C=1080.7, reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let a=0, hold=-1, last=0, cur=-1, running=false;
  function place(angle){const r=ring.clientWidth*172/400, rad=(angle-90)*Math.PI/180;
    dot.style.transform=`translate(${r*Math.cos(rad)}px,${r*Math.sin(rad)}px)`;
    prog.style.strokeDashoffset=C*(1-(angle%360)/360);}
  function setStep(i){if(i===cur) return; cur=i;
    nodes.forEach((n,k)=>{n.classList.toggle('act',k===i);n.classList.toggle('done',k<i)});
    tabs.forEach((t,k)=>t.classList.toggle('act',k===i));
    D.style.opacity=0; setTimeout(()=>{N.textContent=data[i].n; T.textContent=data[i].t; D.textContent=data[i].d; D.style.opacity=1;},150);}
  function tick(t){if(!last) last=t; const dt=Math.min(64,t-last); last=t;
    if(hold<0){a=(a+dt*0.03)%360;} else {const target=hold*90; a=(a+((target-a+540)%360-180)*0.12+360)%360;}
    place(a); setStep(Math.floor(((a+0.0001)%360)/90)%4); requestAnimationFrame(tick);}
  [...nodes,...tabs].forEach(el=>{const k=+el.dataset.i; el.addEventListener('mouseenter',()=>hold=k); el.addEventListener('focus',()=>hold=k); el.addEventListener('click',()=>hold=k);});
  root.addEventListener('mouseleave',()=>{hold=-1});
  if(reduce){place(0);setStep(0);[...nodes,...tabs].forEach(el=>el.addEventListener('mouseenter',()=>{place(+el.dataset.i*90);setStep(+el.dataset.i)}));return;}
  const start=()=>{if(!running){running=true;requestAnimationFrame(tick);}};
  if('IntersectionObserver' in window){new IntersectionObserver(e=>{if(e[0].isIntersecting)start();},{threshold:.3}).observe(root);}else start();
  place(0); setStep(0);
})();

/* Option B: the line draws with the page scroll and each step lights up when reached */
(function(){
  const f=document.getElementById('sflow'); if(!f) return;
  const fill=document.getElementById('sflowFill'), steps=[...f.querySelectorAll('.fs')];
  const vertical=()=>matchMedia('(max-width:760px)').matches;
  function upd(){const r=f.getBoundingClientRect(), vh=innerHeight;
    const p=Math.max(0,Math.min(1,(vh*0.85-r.top)/(r.height+vh*0.35)));
    if(vertical()){fill.style.height=(p*100)+'%';fill.style.width='';}else{fill.style.width=(p*100)+'%';fill.style.height='';}
    steps.forEach((s,k)=>{const at=k/(steps.length-1); s.classList.toggle('done',p>=at-0.001); s.classList.toggle('act',p>=at-0.001 && (k===steps.length-1 || p< (k+1)/(steps.length-1)));});}
  addEventListener('scroll',upd,{passive:true}); addEventListener('resize',upd); upd();
})();

/* Nexus Method: chevron pipeline — fills step by step; hover or tap to pick */
(function(){
  const root=document.getElementById('chev'); if(!root) return;
  const steps=[...root.querySelectorAll('.cv')], D=document.getElementById('chevD'), data=JSON.parse(document.getElementById('chevData').textContent);
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches; let cur=-1, timer=null;
  function show(i){if(i===cur) return; cur=i; steps.forEach((s,k)=>{s.classList.toggle('act',k===i); s.classList.toggle('done',k<i);});
    D.style.opacity=0; setTimeout(()=>{D.textContent=data[i]; D.style.opacity=1;},180);}
  const play=()=>{stop(); if(!reduce) timer=setInterval(()=>show((cur+1)%steps.length),2600);}, stop=()=>{if(timer)clearInterval(timer);timer=null;};
  steps.forEach((s,k)=>['mouseenter','focus','click'].forEach(ev=>s.addEventListener(ev,()=>{stop();show(k);})));
  root.addEventListener('mouseleave',play);
  show(0);
  if('IntersectionObserver' in window){const io=new IntersectionObserver(e=>{if(e[0].isIntersecting){play();io.disconnect();}},{threshold:.4});io.observe(root);}else play();
})();

/* Nexus Method: connecting the dots — loose points gather around each step in turn
   and link the steps together, like the network idea tested for the logo */
(function(){
  const root=document.getElementById('dots'); if(!root) return;
  const c=document.getElementById('dotsC'), x=c.getContext('2d');
  const labels=[...root.querySelectorAll('.dl')], D=document.getElementById('dotsD'), data=JSON.parse(document.getElementById('dotsData').textContent);
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W=0,H=0,dpr=1, cur=0, hold=-1, timer=null, shown=-1;
  const P=[]; for(let i=0;i<120;i++){const a=Math.random()*6.283; P.push({hub:i%4, a, r:Math.random(), sp:.4+Math.random()*.9, ph:Math.random()*6.283, gold:i%9===0, x:0,y:0});}
  function size(){const r=c.getBoundingClientRect(); dpr=Math.min(2,devicePixelRatio||1); W=r.width; H=r.height; c.width=W*dpr; c.height=H*dpr; x.setTransform(dpr,0,0,dpr,0,0);}
  const hubX=k=>W*(k+.5)/4, hubY=()=>H*.5;
  let form=[0,0,0,0];
  function frame(t){
    const T=t*0.001; x.clearRect(0,0,W,H);
    const step=hold>=0?hold:cur;
    for(let k=0;k<4;k++){const tgt=k<=step?1:0; form[k]+=(tgt-form[k])*0.05;}
    // links between reached hubs
    for(let k=0;k<3;k++){const f=Math.min(form[k],form[k+1]); if(f<.02) continue;
      const x1=hubX(k),x2=hubX(k)+(hubX(k+1)-hubX(k))*f; x.strokeStyle='rgba(200,162,76,.85)'; x.lineWidth=1.6; x.beginPath(); x.moveTo(x1,hubY()); x.lineTo(x2,hubY()); x.stroke();}
    // particles
    const spread=Math.min(W/4*.42,90);
    for(const p of P){const f=form[p.hub]; const R=(1-f)*(spread*(.35+p.r*.65)+20)+f*(22+p.r*20);
      const ang=p.a+T*p.sp*(f>.5?.35:.15), wob=(1-f)*16;
      p.x=hubX(p.hub)+Math.cos(ang)*R+Math.sin(T*p.sp+p.ph)*wob; p.y=hubY()+Math.sin(ang)*R*.62+Math.cos(T*p.sp*.8+p.ph)*wob;}
    // links between near particles
    const lim=40;
    for(let i=0;i<P.length;i++)for(let j=i+1;j<P.length;j++){const a=P[i],b=P[j],dx=a.x-b.x,dy=a.y-b.y,d=dx*dx+dy*dy; if(d<lim*lim){const o=1-Math.sqrt(d)/lim, f=(form[a.hub]+form[b.hub])/2;
      x.strokeStyle=(a.gold||b.gold)&&f>.5?`rgba(200,162,76,${o*.7})`:`rgba(19,42,74,${o*(.12+.35*f)})`; x.lineWidth=.8; x.beginPath(); x.moveTo(a.x,a.y); x.lineTo(b.x,b.y); x.stroke();}}
    for(const p of P){const f=form[p.hub]; x.beginPath(); x.arc(p.x,p.y,p.gold?2.6:1.4+f*.8,0,6.283); x.fillStyle=p.gold?'#c8a24c':(p.hub===step&&f>.5?'#0f2038':'#132a4a'); x.globalAlpha=p.gold?1:.35+.55*f; x.fill();}
    x.globalAlpha=1;
    // hub cores
    for(let k=0;k<4;k++){const f=form[k]; x.beginPath(); x.arc(hubX(k),hubY(),5+3*(k===step?1:0),0,6.283); x.fillStyle=k===step?'#0f2038':(f>.5?'#c8a24c':'#cfd9e5'); x.fill(); if(k===step){x.beginPath(); x.arc(hubX(k),hubY(),12+Math.sin(T*3)*2,0,6.283); x.strokeStyle='rgba(200,162,76,.5)'; x.lineWidth=1.2; x.stroke();}}
    if(step!==shown){shown=step; labels.forEach((l,k)=>{l.classList.toggle('act',k===step); l.classList.toggle('done',k<=step);}); D.style.opacity=0; setTimeout(()=>{D.textContent=data[step]; D.style.opacity=1;},180);}
    if(!reduce) requestAnimationFrame(frame);
  }
  const play=()=>{if(timer)clearInterval(timer); if(!reduce) timer=setInterval(()=>{if(hold<0) cur=(cur+1)%4; if(cur===0) form=[0,0,0,0];},2800);};
  labels.forEach((l,k)=>['mouseenter','focus','click'].forEach(ev=>l.addEventListener(ev,()=>{hold=k; if(reduce){requestAnimationFrame(frame);}})));
  root.addEventListener('mouseleave',()=>{if(hold>=0){cur=hold;} hold=-1;});
  addEventListener('resize',size); size();
  if(reduce){cur=3; form=[1,1,1,1];}
  requestAnimationFrame(frame);
  if('IntersectionObserver' in window){const io=new IntersectionObserver(e=>{if(e[0].isIntersecting){play();io.disconnect();}},{threshold:.4});io.observe(root);}else play();
})();

/* Nexus Method variants B (constellation) and C (current) */
(function(){
  document.querySelectorAll('.dotsv').forEach(root=>{
    const v=root.dataset.variant, c=root.querySelector('canvas'), x=c.getContext('2d');
    const labels=[...root.querySelectorAll('.dl')], D=root.querySelector('.vd'), data=JSON.parse(root.dataset.desc);
    const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W=0,H=0,step=0,hold=-1,shown=-1,prog=0,timer=null;
    function size(){const r=c.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1);W=r.width;H=r.height;c.width=W*d;c.height=H*d;x.setTransform(d,0,0,d,0,0);}
    const hx=k=>W*(k+.5)/4, hy=()=>H*.5;
    // constellation: fixed stars per step zone
    let seed=11; const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
    const stars=[]; for(let k=0;k<4;k++)for(let i=0;i<11;i++){stars.push({k,u:(rnd()-.5)*.9,w:(rnd()-.5)*.8,t:rnd(),g:rnd()<.18});}
    // current: particles moving along the path
    const flow=[]; for(let i=0;i<70;i++) flow.push({p:rnd(),s:.0006+rnd()*.0009,o:(rnd()-.5)*26,g:rnd()<.15});
    function frame(t){
      const T=t*.001, a=hold>=0?hold:step; x.clearRect(0,0,W,H);
      prog+=((a+1)/4-prog)*.04;
      if(v==='constellation'){
        const zw=W/4;
        stars.forEach(s=>{s.x=hx(s.k)+s.u*zw; s.y=hy()+s.w*H*.9+Math.sin(T*.8+s.t*6)*2;});
        // hub-to-hub path
        const end=prog*4; x.strokeStyle='rgba(200,162,76,.9)'; x.lineWidth=1.6; x.beginPath(); x.moveTo(hx(0),hy());
        for(let k=1;k<4;k++){const f=Math.max(0,Math.min(1,end-k)); if(f<=0) break; x.lineTo(hx(k-1)+(hx(k)-hx(k-1))*f,hy());} x.stroke();
        stars.forEach(s=>{const reach=Math.max(0,Math.min(1,(end-s.k)*1.3-s.t*.3)); 
          if(reach>0){x.strokeStyle=`rgba(19,42,74,${.3*reach})`; x.lineWidth=.8; x.beginPath(); x.moveTo(hx(s.k),hy()); x.lineTo(hx(s.k)+(s.x-hx(s.k))*reach,hy()+(s.y-hy())*reach); x.stroke();}
          x.beginPath(); x.arc(s.x,s.y,s.g?2.4:1.6,0,6.283); x.fillStyle=s.g?'#c8a24c':'#132a4a'; x.globalAlpha=reach>0?.9:.3; x.fill(); x.globalAlpha=1;});
        // neighbouring stars inside lit zones
        for(let i=0;i<stars.length;i++)for(let j=i+1;j<stars.length;j++){const p=stars[i],q=stars[j]; if(p.k!==q.k||p.k>a) continue; const d=Math.hypot(p.x-q.x,p.y-q.y); if(d<60){x.strokeStyle=`rgba(19,42,74,${(1-d/60)*.25})`; x.beginPath(); x.moveTo(p.x,p.y); x.lineTo(q.x,q.y); x.stroke();}}
      } else {
        // gentle wave path through the hubs
        const yAt=px=>hy()+Math.sin(px/W*Math.PI*4)*H*.12;
        x.strokeStyle='#cfd9e5'; x.lineWidth=1.4; x.beginPath(); for(let px=hx(0);px<=hx(3);px+=6){px===hx(0)?x.moveTo(px,yAt(px)):x.lineTo(px,yAt(px));} x.stroke();
        const lit=hx(0)+(hx(3)-hx(0))*Math.max(0,(prog*4-1)/3);
        x.strokeStyle='rgba(200,162,76,.9)'; x.lineWidth=2; x.beginPath(); for(let px=hx(0);px<=lit;px+=6){px===hx(0)?x.moveTo(px,yAt(px)):x.lineTo(px,yAt(px));} x.stroke();
        flow.forEach(f=>{if(!reduce) f.p=(f.p+f.s*16)%1; const px=hx(0)+(hx(3)-hx(0))*f.p, py=yAt(px)+f.o*Math.sin(f.p*Math.PI*8+T)*.5;
          const on=px<=lit+2; x.beginPath(); x.arc(px,py,f.g?2.4:1.5,0,6.283); x.fillStyle=f.g?'#c8a24c':'#132a4a'; x.globalAlpha=on?.85:.25; x.fill(); x.globalAlpha=1;});
      }
      for(let k=0;k<4;k++){const yy=v==='current'?hy()+Math.sin(hx(k)/W*Math.PI*4)*H*.12:hy(); x.beginPath(); x.arc(hx(k),yy,k===a?8:5,0,6.283); x.fillStyle=k===a?'#0f2038':(k<a?'#c8a24c':'#cfd9e5'); x.fill();
        if(k===a){x.beginPath(); x.arc(hx(k),yy,14+Math.sin(T*3)*2,0,6.283); x.strokeStyle='rgba(200,162,76,.5)'; x.lineWidth=1.2; x.stroke();}}
      if(a!==shown){shown=a; labels.forEach((l,k)=>{l.classList.toggle('act',k===a); l.classList.toggle('done',k<=a);}); D.style.opacity=0; setTimeout(()=>{D.textContent=data[a]; D.style.opacity=1;},180);}
      if(!reduce) requestAnimationFrame(frame);
    }
    labels.forEach((l,k)=>['mouseenter','focus','click'].forEach(ev=>l.addEventListener(ev,()=>{hold=k; if(reduce) requestAnimationFrame(frame);})));
    root.addEventListener('mouseleave',()=>{if(hold>=0) step=hold; hold=-1;});
    addEventListener('resize',size); size();
    const play=()=>{if(timer) clearInterval(timer); if(!reduce) timer=setInterval(()=>{if(hold<0){step=(step+1)%4; if(step===0) prog=0;}},2800);};
    if(reduce){step=3; prog=1;}
    requestAnimationFrame(frame);
    if('IntersectionObserver' in window){const io=new IntersectionObserver(e=>{if(e[0].isIntersecting){play();io.disconnect();}},{threshold:.4});io.observe(root);}else play();
  });
})();

/* Nexus Method: dots build the Nexus symbol — Understand draws the frame, then each step adds one blade */
(function(){
  const root=document.getElementById('build'); if(!root) return;
  const c=document.getElementById('buildC'), x=c.getContext('2d'), cfg=JSON.parse(document.getElementById('buildData').textContent);
  const tabs=[...root.querySelectorAll('.cyc-tabs button')], N=document.getElementById('buildN'), T=document.getElementById('buildT'), D=document.getElementById('buildD');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W=0, step=0, hold=-1, shown=-1, timer=null;
  const form=[0,0,0,0];
  const pts=cfg.pts.map(p=>{const a=Math.random()*6.283, r=.12+Math.random()*.22; return {tx:p[0],ty:p[1],part:p[2],tone:p[3],ox:Math.cos(a)*r,oy:Math.sin(a)*r,ph:Math.random()*6.283,sp:.5+Math.random()*.8,cx:0,cy:0}});
  function size(){const r=c.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1); W=r.width; c.width=W*d; c.height=W*d; x.setTransform(d,0,0,d,0,0);}
  function frame(t){
    const tm=t*.001, a=hold>=0?hold:step, S=W*.9, cx=W/2, cy=W/2;
    for(let k=0;k<4;k++){form[k]+=((k<=a?1:0)-form[k])*.06;}
    x.clearRect(0,0,W,W);
    for(const p of pts){const f=form[p.part], l=1-f, wob=reduce?0:l*.02;
      p.cx=cx+(p.tx+p.ox*l+Math.sin(tm*p.sp+p.ph)*wob)*S; p.cy=cy+(p.ty+p.oy*l+Math.cos(tm*p.sp*.8+p.ph)*wob)*S;}
    const lim=S*.05;
    x.lineWidth=.9;
    for(let i=0;i<pts.length;i++){const p=pts[i]; for(let j=i+1;j<pts.length;j++){const q=pts[j], dx=p.cx-q.cx, dy=p.cy-q.cy; if(Math.abs(dx)>lim*1.6||Math.abs(dy)>lim*1.6) continue; const d=Math.hypot(dx,dy);
      const same=p.part===q.part, f=same?form[p.part]:Math.min(form[p.part],form[q.part]), L=lim*(1.5-.5*f);
      if(d<L){const o=1-d/L; x.strokeStyle=f>.5?(p.tone&&q.tone?`rgba(42,109,179,${o*.7*f})`:`rgba(19,42,74,${o*.6*f})`):`rgba(19,42,74,${o*.12})`; x.beginPath(); x.moveTo(p.cx,p.cy); x.lineTo(q.cx,q.cy); x.stroke();}}}
    for(const p of pts){const f=form[p.part]; x.beginPath(); x.arc(p.cx,p.cy,1.2+f*1.1,0,6.283);
      x.fillStyle=(p.part===a+0 && f<.98 && f>.05)?'#c8a24c':(p.tone?'#2a6db3':'#132a4a'); x.globalAlpha=.3+.65*f; x.fill();}
    x.globalAlpha=1;
    if(a!==shown){shown=a; tabs.forEach((b,k)=>b.classList.toggle('act',k===a)); D.style.opacity=0;
      setTimeout(()=>{N.textContent=cfg.steps[a].n; T.textContent=cfg.steps[a].t; D.textContent=cfg.steps[a].d; D.style.opacity=1;},150);}
    if(!reduce) requestAnimationFrame(frame);
  }
  tabs.forEach((b,k)=>['mouseenter','focus','click'].forEach(ev=>b.addEventListener(ev,()=>{hold=k; if(reduce) requestAnimationFrame(frame);})));
  c.addEventListener('mouseenter',()=>{hold=3}); c.addEventListener('click',()=>{hold=3});
  root.addEventListener('mouseleave',()=>{if(hold>=0) step=hold; hold=-1;});
  addEventListener('resize',size); size();
  if(reduce){step=3; for(let k=0;k<4;k++) form[k]=1;}
  requestAnimationFrame(frame);
  const SEQ=[0,1,2,3,3,3]; let si=0;
  const play=()=>{if(timer) clearInterval(timer); if(!reduce) timer=setInterval(()=>{if(hold<0){si=(si+1)%SEQ.length; step=SEQ[si];}},2400);};
  if('IntersectionObserver' in window){const io=new IntersectionObserver(e=>{if(e[0].isIntersecting){play();io.disconnect();}},{threshold:.4});io.observe(root);}else play();
})();

/* Nexus Method clouds: 'evolve' (scattered → structured), 'path' (a gold path lights through the network), 'hubs' (four hubs in one network) */
(function(){
  document.querySelectorAll('.cloud:not([data-variant="chaos"])').forEach(root=>{
    const v=root.dataset.variant, steps=JSON.parse(root.dataset.steps), c=root.querySelector('canvas'), x=c.getContext('2d');
    const tabs=[...root.querySelectorAll('.cyc-tabs button')], N=root.querySelector('.cN'), T=root.querySelector('.cT'), D=root.querySelector('.cD');
    const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W=0,H=0,step=0,hold=-1,shown=-1,timer=null,lv=0;
    let seed=v.length*97+3; const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
    const n=v==='evolve'?110:90;
    const P=[]; for(let i=0;i<n;i++){const u=rnd(),w=rnd(); P.push({u,w,ph:rnd()*6.283,sp:.3+rnd()*.7,
      gu:Math.round(u*9)/9, gw:Math.round(w*5)/5, g:rnd()<.1, x:0,y:0});}
    // hubs and path anchors (fractions of the canvas)
    const HUB=[[.14,.62],[.38,.3],[.64,.64],[.88,.34]];
    // path: nearest points chain through the hubs
    function size(){const r=c.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1);W=r.width;H=r.height;c.width=W*d;c.height=H*d;x.setTransform(d,0,0,d,0,0);}
    function frame(t){
      const tm=t*.001, a=hold>=0?hold:step; lv+=((a+1)/4-lv)*.05; x.clearRect(0,0,W,H);
      const pad=14;
      P.forEach(p=>{let u=p.u,w=p.w;
        if(v==='evolve'){const k=Math.min(1,Math.max(0,(lv*4-1)/3)); u=p.u+(p.gu-p.u)*k; w=p.w+(p.gw-p.w)*k;}
        const wob=(v==='evolve'?(1-lv):1)*6;
        p.x=pad+u*(W-2*pad)+Math.sin(tm*p.sp+p.ph)*wob; p.y=pad+w*(H-2*pad)+Math.cos(tm*p.sp*.8+p.ph)*wob;});
      const lim=v==='evolve'?Math.min(W,H)*(.14+.06*lv):Math.min(W,H)*.17;
      for(let i=0;i<P.length;i++)for(let j=i+1;j<P.length;j++){const p=P[i],q=P[j],d=Math.hypot(p.x-q.x,p.y-q.y); if(d<lim){const o=1-d/lim;
        const al=v==='evolve'?o*(.1+.4*lv):o*.22; x.strokeStyle=`rgba(19,42,74,${al})`; x.lineWidth=.8; x.beginPath(); x.moveTo(p.x,p.y); x.lineTo(q.x,q.y); x.stroke();}}
      if(v==='path'||v==='hubs'){
        const hp=HUB.map(([u,w])=>[pad+u*(W-2*pad),pad+w*(H-2*pad)]);
        // gold route through the hubs up to the active one, via nearby points
        x.strokeStyle='rgba(200,162,76,.95)'; x.lineWidth=v==='path'?2:1.6; x.beginPath(); x.moveTo(hp[0][0],hp[0][1]);
        const reach=lv*4-1;
        for(let k=1;k<4;k++){const f=Math.max(0,Math.min(1,reach-(k-1))); if(f<=0) break;
          const [x0,y0]=hp[k-1],[x1,y1]=hp[k]; const mx=(x0+x1)/2+(k%2?-1:1)*H*.08, my=(y0+y1)/2+(k%2?1:-1)*H*.12;
          // draw quadratic segment partially
          const steps=24; for(let s=1;s<=Math.round(steps*f);s++){const tt=s/steps,ix=(1-tt)*(1-tt)*x0+2*(1-tt)*tt*mx+tt*tt*x1,iy=(1-tt)*(1-tt)*y0+2*(1-tt)*tt*my+tt*tt*y1; x.lineTo(ix,iy);} }
        x.stroke();
        if(v==='hubs'){ // links from each lit hub to nearby points
          hp.forEach(([hx,hy],k)=>{if(k>a) return; P.forEach(p=>{const d=Math.hypot(p.x-hx,p.y-hy); if(d<lim*1.3){x.strokeStyle=`rgba(200,162,76,${(1-d/(lim*1.3))*.55})`; x.lineWidth=.9; x.beginPath(); x.moveTo(hx,hy); x.lineTo(p.x,p.y); x.stroke();}});});}
        hp.forEach(([hx,hy],k)=>{x.beginPath(); x.arc(hx,hy,k===a?8:5,0,6.283); x.fillStyle=k===a?'#0f2038':(k<a?'#c8a24c':'#cfd9e5'); x.fill();
          if(k===a){x.beginPath(); x.arc(hx,hy,14+Math.sin(tm*3)*2,0,6.283); x.strokeStyle='rgba(200,162,76,.5)'; x.lineWidth=1.2; x.stroke();}
          x.fillStyle=k<=a?'#132a4a':'#9aa9bd'; x.font='600 10px DM Sans, sans-serif'; x.textAlign='center'; x.fillText(steps[k].n,hx,hy-18);});
      }
      P.forEach(p=>{x.beginPath(); x.arc(p.x,p.y,p.g?2.4:1.6,0,6.283); x.fillStyle=p.g?'#c8a24c':'#132a4a'; x.globalAlpha=v==='evolve'?.4+.5*lv:.55; x.fill();}); x.globalAlpha=1;
      if(a!==shown){shown=a; tabs.forEach((b,k)=>b.classList.toggle('act',k===a)); D.style.opacity=0; setTimeout(()=>{N.textContent=steps[a].n; T.textContent=steps[a].t; D.textContent=steps[a].d; D.style.opacity=1;},150);}
      if(!reduce) requestAnimationFrame(frame);
    }
    tabs.forEach((b,k)=>['mouseenter','focus','click'].forEach(ev=>b.addEventListener(ev,()=>{hold=k; if(reduce) requestAnimationFrame(frame);})));
    root.addEventListener('mouseleave',()=>{if(hold>=0) step=hold; hold=-1;});
    addEventListener('resize',size); size();
    if(reduce){step=3; lv=1;}
    requestAnimationFrame(frame);
    const SEQ=[0,1,2,3,3]; let si=0;
    const play=()=>{if(timer) clearInterval(timer); if(!reduce) timer=setInterval(()=>{if(hold<0){si=(si+1)%SEQ.length; step=SEQ[si]; if(si===0) lv=0;}},2500);};
    if('IntersectionObserver' in window){const io=new IntersectionObserver(e=>{if(e[0].isIntersecting){play();io.disconnect();}},{threshold:.4});io.observe(root);}else play();
  });
})();

/* Nexus Method — a flowing wave of connected dots. Left to right it goes from noisy and scattered to smooth and ordered;
   the zone of the active phase lights up, and the colour runs grey → blue → navy → gold. */
(function(){
  const root=document.querySelector('.cloud[data-variant="chaos"]'); if(!root) return;
  const c=root.querySelector('canvas'), x=c.getContext('2d'), items=[...root.querySelectorAll('.evo-l li')];
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const COL=[[138,155,178],[42,109,179],[19,42,74],[200,162,76]];
  const mix=(a,b,t)=>a.map((v,i)=>Math.round(v+(b[i]-v)*t));
  const colAt=u=>{const f=Math.max(0,Math.min(.999,u))*3,i=Math.floor(f);return mix(COL[i],COL[i+1],f-i);};
  const COLS=56, ROWS=7;
  let W=0,H=0,step=0,hover=-1,shown=-1,hl=0,timer=null;
  let seed=7; const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
  const J=[]; for(let i=0;i<COLS*ROWS;i++) J.push([rnd()-.5,rnd()-.5,rnd()*6.283]);
  function size(){const r=c.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1);W=r.width;H=r.height;c.width=W*d;c.height=H*d;x.setTransform(d,0,0,d,0,0);}
  function frame(t){
    const tm=t*.001, a=hover>=0?hover:step; hl+=(a-hl)*.06; x.clearRect(0,0,W,H);
    const pts=[];
    for(let r=0;r<ROWS;r++)for(let q=0;q<COLS;q++){
      const u=q/(COLS-1), v=r/(ROWS-1), order=Math.min(1,u*1.25);            // 0 = chaos (left) … 1 = order (right)
      const j=J[r*COLS+q], noise=(1-order);
      const wave=Math.sin(u*5.2+tm*.9+v*1.4)*.16+Math.sin(u*2.1-tm*.5)*.08;
      const px=W*(.01+u*.98)+j[0]*W*.06*noise;
      const py=H*(.5+(v-.5)*(.5-.2*Math.sin(u*3.1+tm*.4))+wave*.9)+j[1]*H*.55*noise+Math.sin(tm*1.3+j[2])*5*noise;
      pts.push([px,py,u]);
    }
    const zone=u=>{const z=Math.min(3,Math.floor(u*4)); return z;};
    const glow=u=>{const d=Math.abs(u*4-(hl+.5)); return Math.max(.18,1-d*.7);};
    x.lineWidth=.8;
    for(let r=0;r<ROWS;r++)for(let q=0;q<COLS;q++){const i=r*COLS+q,p=pts[i],[cr,cg,cb]=colAt(p[2]),g=glow(p[2]);
      const nb=[]; if(q<COLS-1) nb.push(i+1); if(r<ROWS-1) nb.push(i+COLS); if(q<COLS-1&&r<ROWS-1&&p[2]>.4) nb.push(i+COLS+1);
      nb.forEach(k=>{const o=pts[k], d=Math.hypot(o[0]-p[0],o[1]-p[1]); if(d>W*.09) return; x.strokeStyle=`rgba(${cr},${cg},${cb},${(.12+.4*p[2])*g})`; x.beginPath(); x.moveTo(p[0],p[1]); x.lineTo(o[0],o[1]); x.stroke();});}
    pts.forEach(p=>{const [cr,cg,cb]=colAt(p[2]),g=glow(p[2]); x.beginPath(); x.arc(p[0],p[1],1.1+1.1*g,0,6.283); x.fillStyle=`rgba(${cr},${cg},${cb},${(.35+.6*g)})`; x.fill();});
    if(a!==shown){shown=a; items.forEach((li,k)=>{li.classList.toggle('act',k===a); li.classList.toggle('past',k<a);});}
    if(!reduce) requestAnimationFrame(frame);
  }
  items.forEach((li,k)=>{li.addEventListener('mouseenter',()=>{hover=k; if(reduce) requestAnimationFrame(frame);}); li.addEventListener('mouseleave',()=>hover=-1);});
  addEventListener('resize',size); size();
  requestAnimationFrame(frame);
  const play=()=>{if(timer) clearInterval(timer); if(!reduce) timer=setInterval(()=>{step=(step+1)%4;},2800);};
  if('IntersectionObserver' in window){const io=new IntersectionObserver(e=>{if(e[0].isIntersecting){play();io.disconnect();}},{threshold:.4});io.observe(root);}else play();
})();

/* small replica of the method wave (sub-page title) */
(function(){
  document.querySelectorAll('canvas.wave-mini').forEach(c=>{
    const x=c.getContext('2d'), reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const COL=[[138,155,178],[42,109,179],[19,42,74],[200,162,76]], mix=(a,b,t)=>a.map((v,i)=>Math.round(v+(b[i]-v)*t));
    const colAt=u=>{const f=Math.max(0,Math.min(.999,u))*3,i=Math.floor(f);return mix(COL[i],COL[i+1],f-i);};
    const COLS=36, ROWS=5; let W=0,H=0,hl=0,step=0;
    let seed=7; const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
    const J=[]; for(let i=0;i<COLS*ROWS;i++) J.push([rnd()-.5,rnd()-.5,rnd()*6.283]);
    const size=()=>{const r=c.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1);W=r.width;H=r.height;c.width=W*d;c.height=H*d;x.setTransform(d,0,0,d,0,0);};
    function frame(t){const tm=t*.001; hl+=(step-hl)*.05; x.clearRect(0,0,W,H); const pts=[];
      for(let r=0;r<ROWS;r++)for(let q=0;q<COLS;q++){const u=q/(COLS-1),v=r/(ROWS-1),noise=1-Math.min(1,u*1.25),j=J[r*COLS+q];
        const wave=Math.sin(u*5.2+tm*.9+v*1.4)*.14+Math.sin(u*2.1-tm*.5)*.07;
        pts.push([W*(.01+u*.98)+j[0]*W*.05*noise, H*(.5+(v-.5)*.55+wave)+j[1]*H*.5*noise, u]);}
      const glow=u=>Math.max(.25,1-Math.abs(u*4-(hl+.5))*.7);
      x.lineWidth=.7;
      for(let r=0;r<ROWS;r++)for(let q=0;q<COLS;q++){const i=r*COLS+q,p=pts[i],[a,b,cc]=colAt(p[2]),g=glow(p[2]);
        [q<COLS-1?i+1:-1, r<ROWS-1?i+COLS:-1].forEach(k=>{if(k<0) return; const o=pts[k]; if(Math.hypot(o[0]-p[0],o[1]-p[1])>W*.08) return;
          x.strokeStyle=`rgba(${a},${b},${cc},${(.12+.4*p[2])*g})`; x.beginPath(); x.moveTo(p[0],p[1]); x.lineTo(o[0],o[1]); x.stroke();});}
      pts.forEach(p=>{const [a,b,cc]=colAt(p[2]),g=glow(p[2]); x.beginPath(); x.arc(p[0],p[1],.8+.8*g,0,6.283); x.fillStyle=`rgba(${a},${b},${cc},${.35+.6*g})`; x.fill();});
      if(!reduce) requestAnimationFrame(frame);}
    addEventListener('resize',size); size(); requestAnimationFrame(frame);
    if(!reduce) setInterval(()=>{step=(step+1)%4;},2800);
  });
})();
