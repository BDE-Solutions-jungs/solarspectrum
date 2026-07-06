/* ============================================================
   SOLAR SPECTRUM — shared interactions (multi-page)
   ============================================================ */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;

/* ---- Scroll progress + bar state ---- */
const bar=$('#bar'),prog=$('#prog');
function onScroll(){
  const sc=window.scrollY;
  if(bar)bar.classList.toggle('scrolled',sc>40);
  if(prog){const h=document.documentElement.scrollHeight-window.innerHeight;prog.style.width=(h>0?sc/h*100:0)+'%';}
}
addEventListener('scroll',onScroll,{passive:true});onScroll();

/* ---- Parallax hero image (home only) ---- */
const heroImg=$('#heroImg');
if(heroImg&&!reduce){addEventListener('scroll',()=>{
  const y=window.scrollY;
  if(y<window.innerHeight)heroImg.style.transform=`scale(1.04) translateY(${y*0.18}px)`;
},{passive:true});}

/* ---- Overlay menu ---- */
const menuBtn=$('#menuBtn'),menuLbl=$('#menuLbl');
function toggleMenu(force){
  const open=force!==undefined?force:!document.body.classList.contains('menu-open');
  document.body.classList.toggle('menu-open',open);
  if(menuLbl)menuLbl.textContent=open?'Schließen':'Menü';
  if(menuBtn)menuBtn.setAttribute('aria-label',open?'Menü schließen':'Menü öffnen');
}
if(menuBtn)menuBtn.addEventListener('click',()=>toggleMenu());
const overlayClose=$('#overlayClose');
if(overlayClose)overlayClose.addEventListener('click',()=>toggleMenu(false));
/* close menu on any real navigation (links), but not on the dropdown toggles */
$$('.overlay-aside a, .overlay-sub a, a.overlay-link').forEach(a=>a.addEventListener('click',()=>toggleMenu(false)));
addEventListener('keydown',e=>{if(e.key==='Escape')toggleMenu(false);});

/* ---- Overlay dropdown groups (accordion) ---- */
$$('.overlay-link.has-sub').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const grp=btn.closest('.overlay-group');
    const willOpen=!grp.classList.contains('open');
    $$('.overlay-group.open').forEach(g=>{
      if(g!==grp){g.classList.remove('open');const b=g.querySelector('.has-sub');if(b)b.setAttribute('aria-expanded','false');}
    });
    grp.classList.toggle('open',willOpen);
    btn.setAttribute('aria-expanded',willOpen);
  });
});

/* ---- Magnetic buttons ---- */
if(!reduce&&!matchMedia('(hover:none)').matches){
  $$('.btn,.calc-cta,.avail-form button').forEach(b=>{
    b.addEventListener('mousemove',e=>{
      const r=b.getBoundingClientRect();
      const mx=e.clientX-r.left-r.width/2,my=e.clientY-r.top-r.height/2;
      b.style.transform=`translate(${mx*0.18}px,${my*0.28}px)`;
    });
    b.addEventListener('mouseleave',()=>b.style.transform='');
  });
}

/* ---- Reveal on scroll ---- */
const io=new IntersectionObserver(ents=>{
  ents.forEach(en=>{if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target);}});
},{threshold:0.12,rootMargin:'0px 0px -8% 0px'});
$$('[data-reveal]').forEach(el=>io.observe(el));

/* ---- Count up ---- */
const cio=new IntersectionObserver(ents=>{
  ents.forEach(en=>{
    if(!en.isIntersecting)return;
    const el=en.target,to=+el.dataset.count;cio.unobserve(el);
    const fmt=n=>el.hasAttribute('data-plain')?String(n):n.toLocaleString('de-DE');
    if(reduce){el.textContent=fmt(to);return;}
    const dur=1400,t0=performance.now();
    (function tick(now){
      const p=Math.min((now-t0)/dur,1),e=1-Math.pow(1-p,3);
      el.textContent=fmt(Math.round(to*e));
      if(p<1)requestAnimationFrame(tick);
    })(t0);
  });
},{threshold:0.6});
$$('[data-count]').forEach(el=>cio.observe(el));

/* ---- Marquee duplicate ---- */
const marq=$('#marq');if(marq)marq.innerHTML+=marq.innerHTML;

/* ---- Partner logos ---- */
const pt=$('#plogos');
if(pt){
  const BRANDS=[['solar-fabrik','Solar Fabrik'],['bauer','Bauer Solar'],['trina','Trina'],['aiko','AIKO'],
  ['fronius','Fronius'],['sma','SMA'],['goodwe','GoodWE'],['huawei','Huawei'],['byd','BYD'],
  ['alpha-ess','Alpha ESS'],['goe','go-e'],['keba','KEBA'],['openwb','openWB'],['k2','K2'],
  ['hager','Hager'],['wuerth','Würth']];
  [...BRANDS,...BRANDS].forEach(([f,n])=>{
    const d=document.createElement('div');d.className='plogo';
    d.innerHTML=`<img src="assets/logo-${f}.png" alt="${n}" loading="lazy">`;
    pt.appendChild(d);
  });
}

/* ---- References drag-to-scroll ---- */
const track=$('#refsTrack');
if(track){
  let down=false,sx=0,sl=0,moved=0;
  track.addEventListener('pointerdown',e=>{down=true;moved=0;sx=e.clientX;sl=track.scrollLeft;track.classList.add('drag');track.setPointerCapture(e.pointerId);});
  track.addEventListener('pointermove',e=>{if(!down)return;const dx=e.clientX-sx;moved=Math.abs(dx);track.scrollLeft=sl-dx;});
  const endDrag=()=>{down=false;track.classList.remove('drag');};
  track.addEventListener('pointerup',endDrag);track.addEventListener('pointercancel',endDrag);
  track.addEventListener('click',e=>{if(moved>6)e.preventDefault();},true);
}

/* ---- PLZ availability check ---- */
(function(){
  const inp=$('#plz'),btn=$('#plzBtn'),res=$('#plzRes');
  if(!inp||!btn||!res)return;
  const COVERAGE={
    core:['600','601','602','603','630','631','632','633','634','635','636','637','638','639','604','605','606','607','608','609','611','612','613','614','615','616','617','618','619','653','652','651','650','647'],
    region:['640','641','642','643','644','645','646','648','649','554','555','556','557','558','559','610','656','657','658','659','692','693','694']
  };
  const CITY={'600':'Frankfurt','601':'Frankfurt','602':'Frankfurt','603':'Frankfurt','630':'Frankfurt','631':'Hanau','632':'Neu-Isenburg','633':'Dreieich','634':'Dietzenbach','635':'Egelsbach','636':'Rodgau','637':'Langen','638':'Babenhausen','639':'Bad Vilbel','604':'Frankfurt','605':'Offenbach','606':'Offenbach','614':'Bad Homburg','611':'Wiesbaden','652':'Mainz','647':'Aschaffenburg','649':'Darmstadt'};
  inp.addEventListener('input',()=>inp.value=inp.value.replace(/\D/g,'').slice(0,5));
  inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();check();}});
  btn.addEventListener('click',check);
  function check(){
    const plz=inp.value.trim();res.innerHTML='';
    if(!/^\d{5}$/.test(plz)){res.innerHTML=`<div class="res no"><span class="ic">⚠️</span><div>Bitte eine gültige 5-stellige PLZ eingeben.</div></div>`;return;}
    const pre=plz.substring(0,3),city=CITY[pre]||'Ihrem Ort';
    if(COVERAGE.core.includes(pre))
      res.innerHTML=`<div class="res ok"><span class="ic">✓</span><div><b>Perfekt — wir sind in ${city} aktiv!</b> Kernregion. Beratung & Montage durch unser eigenes Team. Wir melden uns binnen 24 Std.</div></div>`;
    else if(COVERAGE.region.includes(pre))
      res.innerHTML=`<div class="res warn"><span class="ic">📍</span><div><b>Sehr wahrscheinlich machbar.</b> ${city} liegt im erweiterten Einzugsgebiet — kurz anrufen und wir prüfen Ihren konkreten Standort.</div></div>`;
    else
      res.innerHTML=`<div class="res no"><span class="ic">✕</span><div><b>Etwas außerhalb.</b> Aktuell bauen wir vor allem im Rhein-Main-Gebiet. Melden Sie sich — bei größeren Projekten kommen wir auch weiter.</div></div>`;
  }
})();

/* ---- Solar calculator ---- */
(function(){
  if(!$('#persons')||!$('#rKwp'))return;
  const st={persons:4,eff:1.0,store:true};
  const USAGE={1:1800,2:2800,3:3600,4:4500,5:5500,6:6500};
  const YIELD=950,PRICE=0.35,FEED=0.0778,CO2=0.366;
  const fmt=n=>Math.round(n).toLocaleString('de-DE');
  function update(){
    const usage=USAGE[st.persons],ev=st.store?0.70:0.30;
    const kwp=Math.round((usage*1.3/(YIELD*st.eff))*10)/10;
    const prod=Math.round(kwp*YIELD*st.eff);
    const self=Math.min(prod*ev,usage),feed=prod-self;
    const save=Math.round(self*PRICE+feed*FEED);
    const co2=Math.round(prod*CO2);
    const invest=kwp*1450+(st.store?6500:0);
    const pay=Math.round(invest/save);
    $('#cUsage').textContent=fmt(usage)+' kWh';
    $('#cCost').textContent='~'+fmt(usage*PRICE)+' €/Jahr';
    $('#cEv').textContent='~'+Math.round(ev*100)+'%';
    $('#cPersons').textContent=st.persons+(st.persons===6?'+ Personen':' Personen');
    $('#rKwp').textContent=kwp.toString().replace('.',',');
    $('#rSave').textContent=fmt(save);
    $('#rProd').textContent=fmt(prod);
    $('#rCo2').textContent=fmt(co2);
    $('#rPay').textContent=pay;
  }
  $$('#persons .chip').forEach(b=>b.addEventListener('click',()=>{
    $$('#persons .chip').forEach(x=>x.classList.remove('on'));b.classList.add('on');
    st.persons=+b.dataset.n;update();
  }));
  $$('#dirs .chip').forEach(b=>b.addEventListener('click',()=>{
    $$('#dirs .chip').forEach(x=>x.classList.remove('on'));b.classList.add('on');
    st.eff=+b.dataset.eff;
    $('#cDir').textContent=b.dataset.lbl+(st.eff===1.0?' (optimal)':'');update();
  }));
  $('#cStore').addEventListener('click',function(){this.classList.toggle('on');st.store=this.classList.contains('on');update();});
  update();
})();

/* ---- Toast for demo CTAs ---- */
(function(){
  const toast=$('#toast'),toastTx=$('#toastTx');if(!toast)return;
  let tT;
  window.showToast=msg=>{toastTx.innerHTML=msg;toast.classList.add('show');clearTimeout(tT);tT=setTimeout(()=>toast.classList.remove('show'),3800);};
  $$('[data-toast]').forEach(el=>el.addEventListener('click',e=>{
    if(el.tagName==='FORM')return;
    showToast(el.dataset.toast||'<b>Danke!</b> Im Live-Betrieb öffnet sich hier das Anfrageformular.');
  }));
  const form=$('#contactForm');
  if(form)form.addEventListener('submit',e=>{e.preventDefault();showToast('<b>Danke!</b> Im Live-Betrieb wird Ihre Anfrage hier versendet.');form.reset();});
})();
