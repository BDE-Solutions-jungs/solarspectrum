/* ============================================================
   SOLAR SPECTRUM — shared interactions (multi-page)
   Calm motion: no parallax, magnetic buttons, count-ups or marquees.
   ============================================================ */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const fmtN=n=>Math.round(n).toLocaleString('de-DE');

/* ---- Scroll progress + bar state ---- */
const bar=$('#bar'),prog=$('#prog');
function onScroll(){
  const sc=window.scrollY;
  if(bar)bar.classList.toggle('scrolled',sc>40);
  if(prog){const h=document.documentElement.scrollHeight-window.innerHeight;prog.style.width=(h>0?sc/h*100:0)+'%';}
}
addEventListener('scroll',onScroll,{passive:true});onScroll();

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

/* ---- Partner logos (static row, rendered once) ---- */
const pt=$('#plogos');
if(pt){
  const BRANDS=[['solar-fabrik','Solar Fabrik'],['bauer','Bauer Solar'],['trina','Trina'],['aiko','AIKO'],
  ['fronius','Fronius'],['sma','SMA'],['goodwe','GoodWE'],['huawei','Huawei'],['byd','BYD'],
  ['alpha-ess','Alpha ESS'],['goe','go-e'],['keba','KEBA'],['openwb','openWB'],['k2','K2'],
  ['hager','Hager'],['wuerth','Würth']];
  BRANDS.forEach(([f,n])=>{
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

/* ============================================================
   Calculators — Solar & Förderung (shared logic)
   ============================================================ */
const SOLAR={USAGE:{1:1800,2:2800,3:3600,4:4500,5:5500,6:6500},YIELD:950,PRICE:0.35,FEED:0.0778,CO2:0.366};
function computeSolar(persons,eff,store){
  const usage=SOLAR.USAGE[persons],ev=store?0.70:0.30;
  const kwp=Math.round((usage*1.3/(SOLAR.YIELD*eff))*10)/10;
  const prod=Math.round(kwp*SOLAR.YIELD*eff);
  const self=Math.min(prod*ev,usage),feed=prod-self;
  const save=Math.round(self*SOLAR.PRICE+feed*SOLAR.FEED);
  const co2=Math.round(prod*SOLAR.CO2);
  const invest=kwp*1450+(store?6500:0);
  const pay=Math.round(invest/save);
  return {usage,ev,kwp,prod,save,co2,pay,invest};
}
const FOERDER_DATA={
  frankfurt:{name:'Frankfurt am Main',items:[
    {name:'Klimabonus Frankfurt',desc:'20 % auf PV-Anlage',calc:s=>Math.min(s*280,8000),unit:'Zuschuss',avail:true},
    {name:'Speicher-Förderung',desc:'20 % auf Speicherkosten',calc:(s,st)=>st?Math.min(6500*0.20,1300):0,unit:'Zuschuss',avail:'storage'},
    {name:'Wallbox-Förderung',desc:'Stadt-Programm Wallbox',calc:(s,st,wb)=>wb?400:0,unit:'Zuschuss',avail:'wallbox'}]},
  darmstadt:{name:'Darmstadt',items:[
    {name:'Darmstadt PV-Programm',desc:'200 €/kWp · max. 6.000 €',calc:s=>Math.min(s*200,6000),unit:'Zuschuss',avail:true},
    {name:'Speicher (kommunal)',desc:'Pauschale für Speicher',calc:(s,st)=>st?500:0,unit:'Zuschuss',avail:'storage'}]},
  wiesbaden:{name:'Wiesbaden',items:[
    {name:'Wiesbaden Klimaprogramm',desc:'Pauschale + Kombi-Bonus',calc:s=>Math.min(s*100,1500),unit:'Zuschuss',avail:true}]},
  badhomburg:{name:'Bad Homburg',items:[
    {name:'Energiesparmaßnahmen',desc:'Pauschale Bezuschussung',calc:()=>800,unit:'Zuschuss',avail:true}]},
  andere:{name:'Andere Kommune',items:[]}
};
const FOERDER_BASE=[
  {name:'0 % Mehrwertsteuer',desc:'Bundesweit, PV bis 30 kWp',calc:(s,st)=>Math.round((s*1450+(st?6500:0))*0.19),unit:'Ersparnis MwSt'},
  {name:'Einspeisevergütung (20 J.)',desc:'7,78 ct/kWh, 20 Jahre garantiert',calc:(s,st)=>{const yp=s*950,ev=st?0.70:0.30;return Math.round(yp*(1-ev)*0.0778*20);},unit:'20 Jahre'},
  {name:'KfW-270 Kredit',desc:'Zinsgünstig ab ~3,8 % eff.',calc:()=>null,unit:'Kredit',kredit:true}
];
function computeFoerder(loc,size,store,wallbox){
  const L=FOERDER_DATA[loc]||FOERDER_DATA.andere;const items=[];let kommunal=0;
  L.items.forEach(it=>{
    let ok=true;
    if(it.avail==='storage'&&!store)ok=false;
    if(it.avail==='wallbox'&&!wallbox)ok=false;
    const val=ok?it.calc(size,store,wallbox):0;
    items.push({name:it.name,desc:it.desc,val,type:it.unit,available:ok&&val>0});
    if(ok&&val>0)kommunal+=val;
  });
  FOERDER_BASE.forEach(it=>{
    const val=it.calc(size,store,wallbox);
    items.push({name:it.name,desc:it.desc,val,type:it.unit,available:val>0,kredit:it.kredit});
  });
  const mwst=(items.find(i=>i.name==='0 % Mehrwertsteuer')||{val:0}).val;
  return {name:L.name,total:kommunal+mwst,items,kommunal,mwst};
}

/* input helpers */
function wireChips(root,onpick){if(!root)return;$$('.chip',root).forEach(b=>b.addEventListener('click',()=>{$$('.chip',root).forEach(x=>x.classList.remove('on'));b.classList.add('on');onpick(b);}));}
function wireToggle(el,onchange){if(!el)return;el.addEventListener('click',()=>{el.classList.toggle('on');onchange(el.classList.contains('on'));});}
const setTxt=(sel,v)=>{const e=sel&&$(sel);if(e)e.textContent=v;};

let lastSolar=null,lastFoerder=null;

function initSolar(o){
  const pRoot=$(o.persons);if(!pRoot)return;
  const st={persons:4,eff:1.0,store:o.store!==false};
  function update(){
    const r=computeSolar(st.persons,st.eff,st.store),S=o.set;
    setTxt(S.kwp,String(r.kwp).replace('.',','));setTxt(S.save,fmtN(r.save));setTxt(S.pay,r.pay);
    setTxt(S.prod,fmtN(r.prod));setTxt(S.co2,fmtN(r.co2));
    setTxt(S.usage,fmtN(r.usage)+' kWh');setTxt(S.cost,'~'+fmtN(r.usage*SOLAR.PRICE)+' €/Jahr');
    setTxt(S.ev,'~'+Math.round(r.ev*100)+'%');
    setTxt(S.personsLbl,st.persons+(st.persons===6?'+ Personen':' Personen'));
    lastSolar=Object.assign({},r,{persons:st.persons,store:st.store});
  }
  wireChips(pRoot,b=>{st.persons=+b.dataset.n;update();});
  if(o.dirs)wireChips($(o.dirs),b=>{st.eff=+b.dataset.eff;setTxt(o.set.dirLbl,b.dataset.lbl+(st.eff===1?' (optimal)':''));update();});
  wireToggle($(o.storeSel),v=>{st.store=v;update();});
  update();
  const p=o.pdf&&$(o.pdf);if(p)p.addEventListener('click',()=>solarPdf(lastSolar));
}

function initFoerder(o){
  if(!$(o.size))return;
  const st={loc:'frankfurt',size:8,store:true,wallbox:false};
  function render(){
    const r=computeFoerder(st.loc,st.size,st.store,st.wallbox),S=o.set;
    setTxt(S.total,fmtN(r.total));setTxt(S.locLbl,r.name);setTxt(S.sizeLbl,st.size+' kWp');
    const itemsEl=S.items&&$(S.items);
    if(itemsEl)itemsEl.innerHTML=r.items.map(it=>{
      const val=it.kredit?'<div class="fi-val">Verfügbar</div><div class="fi-type">Kredit</div>'
        :it.val>0?`<div class="fi-val">${fmtN(it.val)} €</div><div class="fi-type">${it.type}</div>`
        :'<div class="fi-val" style="opacity:.4">—</div><div class="fi-type">n. zutreffend</div>';
      return `<div class="foerder-item${(it.available||it.kredit)?'':' off'}"><div><div class="fi-name"><span class="ck">${(it.available||it.kredit)?'✓':'○'}</span>${it.name}</div><div class="fi-desc">${it.desc}</div></div><div>${val}</div></div>`;
    }).join('');
    lastFoerder=Object.assign({},r,{size:st.size,store:st.store,wallbox:st.wallbox});
  }
  const locEl=$(o.loc);
  if(locEl){
    if(locEl.tagName==='SELECT')locEl.addEventListener('change',()=>{st.loc=locEl.value;render();});
    else wireChips(locEl,b=>{st.loc=b.dataset.key;render();});
  }
  wireChips($(o.size),b=>{st.size=+b.dataset.size;render();});
  wireToggle($(o.storeSel),v=>{st.store=v;render();});
  if(o.wallbox)wireToggle($(o.wallbox),v=>{st.wallbox=v;render();});
  render();
  const p=o.pdf&&$(o.pdf);if(p)p.addEventListener('click',()=>foerderPdf(lastFoerder));
}

/* Full page widgets */
initSolar({persons:'#persons',dirs:'#dirs',storeSel:'#cStore',pdf:'#solarPdf',
  set:{kwp:'#rKwp',save:'#rSave',pay:'#rPay',prod:'#rProd',co2:'#rCo2',usage:'#cUsage',cost:'#cCost',ev:'#cEv',personsLbl:'#cPersons',dirLbl:'#cDir'}});
initFoerder({loc:'#fdrLoc',size:'#fdrSize',storeSel:'#fdrStore',wallbox:'#fdrWallbox',pdf:'#foerderPdf',
  set:{total:'#fdrTotal',items:'#fdrItems',locLbl:'#fdrLocLabel',sizeLbl:'#fdrSizeLabel'}});
/* Home compact widgets */
initSolar({persons:'#hcPersons',storeSel:'#hcStore',pdf:'#hcSolarPdf',
  set:{kwp:'#hcKwp',save:'#hcSave',pay:'#hcPay'}});
initFoerder({loc:'#hfLoc',size:'#hfSize',storeSel:'#hfStore',pdf:'#hfFoerderPdf',
  set:{total:'#hfTotal'}});

/* ============================================================
   PDF export (print to PDF, no backend)
   ============================================================ */
function ensurePrintArea(){let el=$('#printArea');if(!el){el=document.createElement('div');el.id='printArea';document.body.appendChild(el);}return el;}
function doPrint(html){const el=ensurePrintArea();el.innerHTML=html;window.print();setTimeout(()=>{el.innerHTML='';},600);}
function pdfHead(title){
  const today=new Date().toLocaleDateString('de-DE',{day:'2-digit',month:'long',year:'numeric'});
  return `<div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #fcc600;padding-bottom:18px;margin-bottom:26px">
    <div><div style="font-weight:800;font-size:22px;letter-spacing:-.02em">SOLAR<span style="color:#e0a800">SPECTRUM</span></div>
    <div style="font-size:12px;color:#6b675f;margin-top:3px">Photovoltaik · Speicher · Wallbox — Rhein-Main-Gebiet</div></div>
    <div style="text-align:right;font-size:12px;color:#6b675f">Berechnung vom<br><b style="color:#141210">${today}</b></div></div>
    <h1 style="font-size:28px;font-weight:600;letter-spacing:-.02em;margin:0 0 6px">${title}</h1>
    <p style="color:#6b675f;font-size:13px;margin:0 0 24px;line-height:1.6">Unverbindliche Schätzung auf Basis von Durchschnittswerten für das Rhein-Main-Gebiet. Die genaue Berechnung erfolgt im persönlichen Beratungsgespräch.</p>`;
}
function pdfRow(k,v){return `<div style="display:flex;justify-content:space-between;padding:13px 0;border-bottom:1px solid #e6e1d6"><span style="font-size:13px;color:#6b675f">${k}</span><span style="font-size:19px;font-weight:600">${v}</span></div>`;}
function pdfFoot(){return `<div style="margin-top:26px;background:#fcc600;border-radius:12px;padding:18px 20px;font-size:13px"><b>Kostenlose Beratung:</b> 06102 / 555 0 100 · info@solar-spectrum.de<br><span style="color:#3a3833">Frankfurter Str. · 63263 Neu-Isenburg</span></div>`;}
function wrapPdf(inner){return `<div style="font-family:'Inter Tight',Arial,sans-serif;color:#141210;max-width:680px;margin:0 auto">${inner}</div>`;}

function solarPdf(r){
  if(!r){r=computeSolar(4,1.0,true);r.persons=4;r.store=true;}
  doPrint(wrapPdf(pdfHead('Ihre Solarrechner-Auswertung')+
    `<div style="background:#f4efe3;border-radius:12px;padding:18px 20px;margin-bottom:20px">
      <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#6b675f;margin-bottom:8px">Ihre Eingaben</div>
      <div style="display:flex;gap:28px;flex-wrap:wrap;font-size:14px">
        <div>Haushalt: <b>${r.persons}${r.persons===6?'+':''} Personen</b></div>
        <div>Stromspeicher: <b>${r.store?'Ja':'Nein'}</b></div>
        <div>Jahresverbrauch: <b>${fmtN(r.usage)} kWh</b></div></div></div>
    <div style="background:#141210;color:#fff;border-radius:14px;padding:24px;margin-bottom:20px">
      <div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#fcc600;margin-bottom:6px">Empfohlene Anlage</div>
      <div style="font-size:46px;font-weight:400;letter-spacing:-.03em;line-height:1">${String(r.kwp).replace('.',',')} <span style="font-size:20px;color:rgba(255,255,255,.6)">kWp</span></div></div>`+
    pdfRow('Jährliche Ersparnis',fmtN(r.save)+' €')+
    pdfRow('Jährliche Stromproduktion',fmtN(r.prod)+' kWh')+
    pdfRow('CO₂-Einsparung pro Jahr',fmtN(r.co2)+' kg')+
    pdfRow('Amortisationsdauer','~'+r.pay+' Jahre')+
    pdfFoot()));
}
function foerderPdf(r){
  if(!r)r=Object.assign(computeFoerder('frankfurt',8,true,false),{size:8,store:true,wallbox:false});
  const rows=r.items.map(it=>{
    const v=it.kredit?'Verfügbar':(it.val>0?fmtN(it.val)+' €':'—');
    return `<tr><td style="padding:11px 0;border-bottom:1px solid #e6e1d6"><b style="font-size:14px">${it.name}</b><div style="font-size:12px;color:#6b675f">${it.desc}</div></td><td style="padding:11px 0;border-bottom:1px solid #e6e1d6;text-align:right;font-weight:600;white-space:nowrap">${v}</td></tr>`;
  }).join('');
  doPrint(wrapPdf(pdfHead('Ihre Förderrechner-Auswertung')+
    `<div style="background:#f4efe3;border-radius:12px;padding:18px 20px;margin-bottom:20px">
      <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#6b675f;margin-bottom:8px">Ihre Eingaben</div>
      <div style="display:flex;gap:28px;flex-wrap:wrap;font-size:14px">
        <div>Standort: <b>${r.name}</b></div><div>Anlagengröße: <b>${r.size} kWp</b></div>
        <div>Speicher: <b>${r.store?'Ja':'Nein'}</b></div><div>Wallbox: <b>${r.wallbox?'Ja':'Nein'}</b></div></div></div>
    <div style="background:#141210;color:#fff;border-radius:14px;padding:24px;margin-bottom:20px">
      <div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#fcc600;margin-bottom:6px">Direkter Förder-Vorteil</div>
      <div style="font-size:46px;font-weight:400;letter-spacing:-.03em;line-height:1">${fmtN(r.total)} <span style="font-size:20px;color:rgba(255,255,255,.6)">€</span></div></div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:6px">${rows}</table>
    <p style="font-size:12px;color:#6b675f;line-height:1.6;margin:14px 0 0">Einspeisevergütung und KfW-Kredit sind laufende bzw. Finanzierungs-Vorteile und nicht im direkten Förder-Vorteil enthalten.</p>`+
    pdfFoot()));
}

/* ---- Toast for demo CTAs ---- */
(function(){
  const toast=$('#toast'),toastTx=$('#toastTx');if(!toast)return;
  let tT;
  window.showToast=msg=>{toastTx.innerHTML=msg;toast.classList.add('show');clearTimeout(tT);tT=setTimeout(()=>toast.classList.remove('show'),3800);};
  $$('[data-toast]').forEach(el=>el.addEventListener('click',()=>{
    if(el.tagName==='FORM')return;
    showToast(el.dataset.toast||'<b>Danke!</b> Im Live-Betrieb öffnet sich hier das Anfrageformular.');
  }));
  const form=$('#contactForm');
  if(form)form.addEventListener('submit',e=>{e.preventDefault();showToast('<b>Danke!</b> Im Live-Betrieb wird Ihre Anfrage hier versendet.');form.reset();});
})();
