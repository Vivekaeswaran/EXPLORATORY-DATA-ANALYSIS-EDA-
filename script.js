/* ===== DATASET CONFIG ===== */
const DS = {
  loan:   { name:'Loan Analytics', records:12847, features:24, missing:1243, dupes:89,  quality:87.3 },
  retail: { name:'Retail Sales',   records:8420,  features:18, missing:634,  dupes:41,  quality:91.5 },
  hr:     { name:'HR Attrition',   records:21300, features:31, missing:2810, dupes:204, quality:82.1 }
};
let current = 'loan';
const charts = {};

const CORR_LABELS = ['Age','Income','Loan','Score','Tenure','Balance'];
const CORR_DATA = [
  [1.00,0.42,0.31,-0.15,0.28,0.19],
  [0.42,1.00,0.87,0.56,0.33,0.61],
  [0.31,0.87,1.00,0.44,0.22,0.55],
  [-0.15,0.56,0.44,1.00,-0.08,0.37],
  [0.28,0.33,0.22,-0.08,1.00,0.29],
  [0.19,0.61,0.55,0.37,0.29,1.00]
];
const COLS = [
  {n:'age',t:'Numeric',null:1.2},{n:'income',t:'Numeric',null:3.4},
  {n:'loan_amount',t:'Numeric',null:0.8},{n:'credit_score',t:'Numeric',null:2.1},
  {n:'gender',t:'Categorical',null:0.5},{n:'region',t:'Categorical',null:1.8},
  {n:'employed',t:'Boolean',null:0.3},{n:'defaulted',t:'Boolean',null:0.0}
];

/* ===== HELPERS ===== */
function rnd(lo,hi,n=20){ return Array.from({length:n},()=>+(Math.random()*(hi-lo)+lo).toFixed(1)); }
function randInt(lo,hi,n=10){ return Array.from({length:n},()=>Math.floor(Math.random()*(hi-lo)+lo)); }
function baseOpts(){ return { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ x:{grid:{color:'rgba(255,255,255,0.05)'},ticks:{color:'#94A3B8',font:{size:10}}}, y:{grid:{color:'rgba(255,255,255,0.05)'},ticks:{color:'#94A3B8',font:{size:10}}} } }; }
function kill(id){ if(charts[id]){ charts[id].destroy(); delete charts[id]; } }
function animCount(el,target,sfx='',dur=1000){
  let v=0,step=target/50;
  const t=setInterval(()=>{ v=Math.min(v+step,target); el.textContent=(Number.isInteger(target)?Math.floor(v).toLocaleString():v.toFixed(1))+sfx; if(v>=target)clearInterval(t); },dur/50);
}
function blueGrad(ctx,alpha=0.6){ const g=ctx.createLinearGradient(0,0,0,280); g.addColorStop(0,`rgba(37,99,235,${alpha})`); g.addColorStop(1,'rgba(37,99,235,0.02)'); return g; }

/* ===== BOOT ===== */
window.addEventListener('DOMContentLoaded',()=>{
  setupNav(); updateOverview(); buildStatsTable(); buildDtypeChart();
  buildMissingHeatmap(); buildNullChart(); buildDupeChart(); buildGauge();
  buildUniCharts(); buildScatter(); buildCorrMatrix(); buildPairplot();
  buildBubble(); buildRadar();
  buildOutlierChart(); buildFeatImp(); buildFilteredChart();
  buildTrendLine(); buildStackedBar(); buildLoanStatusDonut();
  buildCDF(); buildAgeGroupBar(); buildScoreDefaultLine();
  buildInsights(); buildBusiness();
  animateHero();
});

/* ===== SIDEBAR NAV ===== */
function setupNav(){
  const links = document.querySelectorAll('.nav-item[data-sec]');
  const obs = new IntersectionObserver(entries=>{
    entries.forEach(e=>{ if(e.isIntersecting){ links.forEach(l=>l.classList.remove('active')); const l=document.querySelector(`.nav-item[data-sec="${e.target.id}"]`); if(l)l.classList.add('active'); } });
  },{threshold:0.25});
  document.querySelectorAll('section[id]').forEach(s=>obs.observe(s));
}
function toggleSidebar(){ document.getElementById('sidebar').classList.toggle('open'); }

/* ===== OVERVIEW ===== */
function updateOverview(){
  const d=DS[current];
  document.getElementById('ov-name').textContent=d.name;
  document.getElementById('ov-records').textContent=d.records.toLocaleString();
  document.getElementById('ov-features').textContent=d.features;
  document.getElementById('ov-missing').textContent=d.missing.toLocaleString();
  document.getElementById('ov-dupes').textContent=d.dupes;
  document.getElementById('ov-quality').textContent=d.quality+'%';
  document.getElementById('qb-pct').textContent=d.quality+'%';
  document.getElementById('qb-fill').style.width=d.quality+'%';
  document.getElementById('kv-records').textContent=d.records.toLocaleString();
  document.getElementById('kv-features').textContent=d.features;
  document.getElementById('kv-missing').textContent=d.missing.toLocaleString();
  document.getElementById('kv-dupes').textContent=d.dupes;
  document.getElementById('kv-quality').textContent=d.quality+'%';
}
function animateHero(){
  const d=DS[current];
  animCount(document.getElementById('kv-records'),d.records);
  animCount(document.getElementById('kv-features'),d.features);
  animCount(document.getElementById('kv-missing'),d.missing);
  animCount(document.getElementById('kv-dupes'),d.dupes);
}
function switchDataset(){
  current=document.getElementById('dsSelect').value;
  updateOverview();
  buildNullChart(); buildDupeChart(); buildGauge(); buildFilteredChart();
}
function refreshAll(){ switchDataset(); buildUniCharts(); buildBiCharts(); }

/* ===== STATS TABLE ===== */
function buildStatsTable(){
  const rows=[
    {col:'Age',mean:'34.7',std:'12.3',min:'18',q25:'25',median:'33',q75:'44',max:'72'},
    {col:'Income',mean:'$62,400',std:'$18,200',min:'$8,000',q25:'$48K',median:'$61K',q75:'$78K',max:'$210K'},
    {col:'Loan Amt',mean:'$24,300',std:'$11,800',min:'$500',q25:'$14K',median:'$23K',q75:'$34K',max:'$85K'},
    {col:'Credit Score',mean:'672',std:'112',min:'300',q25:'590',median:'670',q75:'750',max:'850'},
    {col:'Tenure (yr)',mean:'4.2',std:'3.1',min:'0.1',q25:'1.8',median:'3.9',q75:'6.4',max:'15'}
  ];
  const hdr=['Column','Mean','Std','Min','Q25','Median','Q75','Max'];
  document.getElementById('statsTable').innerHTML=`<table class="stats-tbl">
    <thead><tr>${hdr.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r=>`<tr>
      <td>${r.col}</td><td class="num">${r.mean}</td><td class="num">${r.std}</td>
      <td class="num">${r.min}</td><td class="num">${r.q25}</td><td class="num">${r.median}</td>
      <td class="num">${r.q75}</td><td class="num">${r.max}</td>
    </tr>`).join('')}</tbody>
  </table>`;
}

/* ===== DTYPE CHART ===== */
function buildDtypeChart(){
  const ctx=document.getElementById('dtypeChart').getContext('2d');
  const colors=['#2563EB','#0D9488','#16A34A','#F97316'];
  charts.dtype=new Chart(ctx,{ type:'doughnut',
    data:{ labels:['Numeric','Categorical','Boolean','DateTime'], datasets:[{ data:[14,7,2,1], backgroundColor:colors, borderWidth:3, borderColor:'#fff', hoverOffset:8 }] },
    options:{ responsive:true, maintainAspectRatio:false, cutout:'65%', plugins:{ legend:{ display:true, position:'bottom', labels:{ color:'#475569', font:{size:11}, padding:10 } } } }
  });
  document.getElementById('dtypeLegend').innerHTML=['Numeric (14)','Categorical (7)','Boolean (2)','DateTime (1)'].map((l,i)=>`<div class="dl-item"><div class="dl-dot" style="background:${colors[i]}"></div>${l}</div>`).join('');
}

/* ===== MISSING HEATMAP ===== */
function buildMissingHeatmap(){
  const cols=COLS.map(c=>c.n);
  const months=['Jan','Feb','Mar','Apr','May','Jun'];
  const data=cols.map(()=>months.map(()=>+(Math.random()*14).toFixed(1)));
  function bg(v){ const a=(v/14).toFixed(2); return `rgba(249,115,22,${a})`; }
  document.getElementById('missingHeatmap').innerHTML=`<div style="overflow-x:auto"><table class="heat-table">
    <tr><th>Column</th>${months.map(m=>`<th>${m}</th>`).join('')}</tr>
    ${cols.map((c,i)=>`<tr><td style="color:#64748B;white-space:nowrap;font-size:.7rem;padding:4px 8px">${c}</td>${data[i].map(v=>`<td><span class="heat-cell" style="background:${bg(v)};color:${v>8?'#fff':'#92400E'}">${v}%</span></td>`).join('')}</tr>`).join('')}
  </table></div>`;
}

/* ===== NULL CHART ===== */
function buildNullChart(){
  kill('null');
  const ctx=document.getElementById('nullChart').getContext('2d');
  const vals=COLS.map(c=>+(c.null*(1+Math.random()*0.2)).toFixed(1));
  charts.null=new Chart(ctx,{ type:'bar',
    data:{ labels:COLS.map(c=>c.n), datasets:[{ data:vals, backgroundColor:'rgba(249,115,22,0.7)', borderColor:'#F97316', borderWidth:1.5, borderRadius:5 }] },
    options:{ ...baseOpts(), maintainAspectRatio:false, indexAxis:'y' }
  });
}

/* ===== DUPE CHART ===== */
function buildDupeChart(){
  kill('dupe');
  const d=DS[current];
  const ctx=document.getElementById('dupeChart').getContext('2d');
  charts.dupe=new Chart(ctx,{ type:'doughnut',
    data:{ labels:['Unique','Duplicates'], datasets:[{ data:[d.records-d.dupes, d.dupes], backgroundColor:['#2563EB','#EF4444'], borderWidth:3, borderColor:'#fff', hoverOffset:6 }] },
    options:{ responsive:true, maintainAspectRatio:false, cutout:'68%', plugins:{ legend:{ display:true, position:'bottom', labels:{ color:'#475569', font:{size:11} } } } }
  });
}

/* ===== GAUGE ===== */
function buildGauge(){
  const d=DS[current], v=d.quality/100;
  document.getElementById('gaugeNum').textContent=d.quality;
  const canvas=document.getElementById('gaugeCanvas'), ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,240,140);
  ctx.beginPath(); ctx.arc(120,120,90,Math.PI,2*Math.PI); ctx.strokeStyle='#E2E8F0'; ctx.lineWidth=18; ctx.stroke();
  const g=ctx.createLinearGradient(0,0,240,0); g.addColorStop(0,'#2563EB'); g.addColorStop(0.5,'#0D9488'); g.addColorStop(1,'#16A34A');
  ctx.beginPath(); ctx.arc(120,120,90,Math.PI,Math.PI+v*Math.PI); ctx.strokeStyle=g; ctx.lineWidth=18; ctx.lineCap='round'; ctx.stroke();
}

/* ===== UNI CHARTS ===== */
function buildUniCharts(){
  ['hist','box','density'].forEach(kill);
  const bins=['18-25','26-33','34-41','42-49','50-57','58-65','66+']; const data=randInt(300,2200,7);

  const ctx1=document.getElementById('histChart').getContext('2d');
  charts.hist=new Chart(ctx1,{ type:'bar',
    data:{ labels:bins, datasets:[{ data, backgroundColor:blueGrad(ctx1), borderColor:'#2563EB', borderWidth:1.5, borderRadius:6 }] },
    options:{ ...baseOpts(), maintainAspectRatio:false }
  });

  const ctx2=document.getElementById('boxChart').getContext('2d');
  charts.box=new Chart(ctx2,{ type:'bar',
    data:{ labels:['Min','Q1','Median','Q3','Max'], datasets:[
      { data:[18,26,34,46,72], backgroundColor:'rgba(37,99,235,0.15)', borderColor:'#2563EB', borderWidth:2, borderRadius:4 },
      { data:[0,8,6,12,0], backgroundColor:'rgba(13,148,136,0.5)', borderColor:'#0D9488', borderWidth:2, borderRadius:4 }
    ]},
    options:{ ...baseOpts(), maintainAspectRatio:false }
  });

  const pts=rnd(0,100,60); const smooth=pts.map((_,i,a)=>{ const s=Math.max(0,i-3),e=Math.min(a.length-1,i+3); return +(a.slice(s,e+1).reduce((x,y)=>x+y,0)/(e-s+1)).toFixed(2); });
  const ctx3=document.getElementById('densityChart').getContext('2d');
  const g3=ctx3.createLinearGradient(0,0,0,200); g3.addColorStop(0,'rgba(37,99,235,0.4)'); g3.addColorStop(1,'rgba(37,99,235,0)');
  charts.density=new Chart(ctx3,{ type:'line',
    data:{ labels:smooth.map((_,i)=>i), datasets:[{ data:smooth, fill:true, backgroundColor:g3, borderColor:'#2563EB', borderWidth:2, tension:0.5, pointRadius:0 }] },
    options:{ ...baseOpts(), maintainAspectRatio:false, scales:{ x:{display:false}, y:{grid:{color:'rgba(0,0,0,0.04)'},ticks:{color:'#64748B',font:{size:10}}} } }
  });
}

/* ===== BI CHARTS ===== */
function buildBiCharts(){
  kill('scatter'); buildScatter(); buildCorrMatrix(); buildPairplot();
}
function buildScatter(){
  const ctx=document.getElementById('scatterChart').getContext('2d');
  const pts=Array.from({length:80},()=>({x:+(Math.random()*100).toFixed(1),y:+(Math.random()*100+Math.random()*15).toFixed(1)}));
  charts.scatter=new Chart(ctx,{ type:'scatter',
    data:{ datasets:[{ data:pts, backgroundColor:'rgba(37,99,235,0.5)', borderColor:'#2563EB', borderWidth:1, pointRadius:5, pointHoverRadius:8 }] },
    options:{ ...baseOpts(), maintainAspectRatio:false }
  });
}

/* ===== CORR MATRIX (D3) ===== */
function buildCorrMatrix(){
  const el=document.getElementById('corrMatrix'); el.innerHTML='';
  const n=CORR_LABELS.length, sz=36, pad={t:30,l:60};
  const W=n*sz+pad.l+10, H=n*sz+pad.t+10;
  const svg=d3.select(el).append('svg').attr('width','100%').attr('viewBox',`0 0 ${W} ${H}`);
  const g=svg.append('g').attr('transform',`translate(${pad.l},${pad.t})`);
  function clr(v){ if(v>=0.7)return '#1D4ED8'; if(v>=0.4)return '#3B82F6'; if(v>=0.1)return '#BFDBFE'; if(v>=-0.1)return '#F1F5F9'; if(v>=-0.4)return '#FEE2E2'; return '#EF4444'; }
  CORR_DATA.forEach((row,i)=>row.forEach((val,j)=>{
    g.append('rect').attr('x',j*sz).attr('y',i*sz).attr('width',sz-2).attr('height',sz-2).attr('rx',3).attr('fill',clr(val));
    g.append('text').attr('x',j*sz+sz/2).attr('y',i*sz+sz/2+4).attr('text-anchor','middle').attr('fill',Math.abs(val)>0.4?'#fff':'#475569').attr('font-size',9).attr('font-weight','600').text(val.toFixed(2));
  }));
  CORR_LABELS.forEach((l,i)=>{
    g.append('text').attr('x',-6).attr('y',i*sz+sz/2+4).attr('text-anchor','end').attr('fill','#94A3B8').attr('font-size',10).text(l);
    g.append('text').attr('x',i*sz+sz/2).attr('y',-8).attr('text-anchor','middle').attr('fill','#94A3B8').attr('font-size',10).text(l);
  });
}

/* ===== PAIRPLOT ===== */
function buildPairplot(){
  const pairs=[['Age','Income'],['Income','Loan'],['Score','Loan'],['Age','Score']];
  const colors=['#2563EB','#0D9488','#7C3AED','#16A34A'];
  document.getElementById('pairGrid').innerHTML=pairs.map((p,i)=>`<div class="pp-cell"><div class="pp-lbl">${p[0]} × ${p[1]}</div><canvas id="pp${i}" width="160" height="90"></canvas></div>`).join('');
  pairs.forEach((_,i)=>{
    const ctx=document.getElementById('pp'+i).getContext('2d');
    const pts=Array.from({length:35},()=>({x:+(Math.random()*100).toFixed(1),y:+(Math.random()*100).toFixed(1)}));
    new Chart(ctx,{ type:'scatter', data:{ datasets:[{ data:pts, backgroundColor:colors[i]+'80', borderColor:colors[i], borderWidth:1, pointRadius:3 }] }, options:{ responsive:false, plugins:{legend:{display:false}}, scales:{x:{display:false},y:{display:false}} } });
  });
}

/* ===== MULTIVARIATE ===== */
function buildBubble(){
  kill('bubble');
  const ctx=document.getElementById('bubbleChart').getContext('2d');
  const pts=Array.from({length:25},()=>({ x:+(Math.random()*100).toFixed(1), y:+(Math.random()*100).toFixed(1), r:+(Math.random()*18+4).toFixed(1) }));
  charts.bubble=new Chart(ctx,{ type:'bubble',
    data:{ datasets:[{
      label:'Feature Interaction',
      data:pts,
      backgroundColor:'rgba(37,99,235,0.45)',
      borderColor:'#2563EB',
      borderWidth:1.5
    }]},
    options:{ ...baseOpts(), maintainAspectRatio:false,
      plugins:{ legend:{ display:true, position:'bottom', labels:{color:'#475569',font:{size:10}} } }
    }
  });
}
function buildRadar(){
  kill('radar');
  const ctx=document.getElementById('radarChart').getContext('2d');
  charts.radar=new Chart(ctx,{ type:'radar',
    data:{ labels:['Completeness','Accuracy','Consistency','Timeliness','Validity','Uniqueness'],
      datasets:[
        { label:'Current', data:[93,87,82,91,88,97], fill:true, backgroundColor:'rgba(37,99,235,0.15)', borderColor:'#2563EB', pointBackgroundColor:'#2563EB', pointRadius:4 },
        { label:'Target',  data:[98,95,95,98,95,99], fill:true, backgroundColor:'rgba(13,148,136,0.1)', borderColor:'#0D9488', pointBackgroundColor:'#0D9488', pointRadius:4 }
      ]
    },
    options:{ responsive:true, maintainAspectRatio:false,
      scales:{ r:{ angleLines:{color:'rgba(0,0,0,0.08)'}, grid:{color:'rgba(0,0,0,0.08)'}, pointLabels:{color:'#475569',font:{size:10}}, ticks:{display:false} } },
      plugins:{ legend:{ display:true, position:'bottom', labels:{color:'#475569',font:{size:11}} } }
    }
  });
}

/* ===== ADVANCED INSIGHTS ===== */
function buildOutlierChart(){
  const ctx=document.getElementById('outlierChart').getContext('2d');
  const normal=Array.from({length:60},(_,i)=>({x:i,y:+(Math.random()*80+20).toFixed(1)}));
  const outliers=[{x:7,y:168},{x:23,y:175},{x:41,y:9},{x:55,y:170}];
  charts.outlier=new Chart(ctx,{ type:'scatter',
    data:{ datasets:[
      { label:'Normal', data:normal, backgroundColor:'rgba(37,99,235,0.5)', pointRadius:4, borderWidth:0 },
      { label:'Outlier', data:outliers, backgroundColor:'rgba(239,68,68,0.85)', pointRadius:8, borderWidth:0 }
    ]},
    options:{ ...baseOpts(), maintainAspectRatio:false, plugins:{ legend:{ display:true, position:'bottom', labels:{color:'#475569',font:{size:10}} } } }
  });
}
function buildFeatImp(){
  const ctx=document.getElementById('featImpChart').getContext('2d');
  const feats=['Credit Score','Income','Age','Loan Amt','Tenure','Region','Gender','Employed'];
  const scores=[0.87,0.74,0.61,0.58,0.43,0.38,0.22,0.18];
  const bgColors=scores.map(s=>s>0.6?'#1D4ED8':s>0.4?'#3B82F6':'#93C5FD');
  charts.featImp=new Chart(ctx,{ type:'bar',
    data:{ labels:feats, datasets:[{ data:scores, backgroundColor:bgColors, borderRadius:5, borderWidth:0 }] },
    options:{ ...baseOpts(), indexAxis:'y', maintainAspectRatio:false, scales:{ x:{max:1,grid:{color:'rgba(0,0,0,0.04)'},ticks:{color:'#64748B',font:{size:10}}}, y:{grid:{display:false},ticks:{color:'#475569',font:{size:10},font2:{weight:'600'}}} } }
  });
}

/* ===== FILTERED CHART ===== */
function buildFilteredChart(){
  kill('filtered');
  const ctx=document.getElementById('filteredChart').getContext('2d');
  const lbl=['<30K','30-50K','50-70K','70-90K','90K+']; const data=randInt(500,3000,5);
  const g=ctx.createLinearGradient(0,0,0,200); g.addColorStop(0,'rgba(37,99,235,0.65)'); g.addColorStop(1,'rgba(37,99,235,0.05)');
  charts.filtered=new Chart(ctx,{ type:'bar',
    data:{ labels:lbl, datasets:[{ data, backgroundColor:g, borderColor:'#2563EB', borderWidth:1.5, borderRadius:6 }] },
    options:{ ...baseOpts(), maintainAspectRatio:false }
  });
}

/* ===== INTERACTIVE FILTERS ===== */
function applyFilters(){
  const cat=document.getElementById('catFilter').value;
  const age=document.getElementById('ageFilter').value;
  const inc=document.getElementById('incFilter').value;
  const sc=document.getElementById('scoreFilter').value;
  const active=[cat,age,inc,sc].filter(x=>x!=='all');
  const res=document.getElementById('filterResult');
  if(active.length){
    const cnt=Math.floor(Math.random()*3000+1000);
    res.textContent=`✓ Filter applied — ${cnt.toLocaleString()} records match (${active.length} filter${active.length>1?'s':''} active)`;
    res.classList.add('show');
  } else { res.classList.remove('show'); }
  buildFilteredChart();
}
function resetFilters(){
  ['catFilter','ageFilter','incFilter','scoreFilter'].forEach(id=>document.getElementById(id).value='all');
  document.getElementById('filterResult').classList.remove('show');
  buildFilteredChart();
}

/* ===== INSIGHTS PANEL ===== */
function buildInsights(){
  const trends=[
    {icon:'📈','text':'Income shows strong positive trend (r=0.87) with Loan Amount across all segments.'},
    {icon:'📉','text':'Default rates declined 14% in Q3 among high-credit-score borrowers (670+).'},
    {icon:'🔄','text':'Seasonal spikes in loan applications observed in Q1 and Q4 each year.'},
    {icon:'🏙️','text':'Urban applicants exhibit 22% higher average loan amounts than rural counterparts.'}
  ];
  const obs=[
    {icon:'🔍','text':'3 numeric columns display right skew (skewness > 2.0) — log transform advised.'},
    {icon:'🎯','text':'Bimodal age distribution detected — two clusters: 18–30 and 45–65 years.'},
    {icon:'📌','text':'Income and Credit Score show multicollinearity — VIF score > 5 flagged.'},
    {icon:'⚡','text':'Employment status is the strongest categorical predictor of loan default.'}
  ];
  const outliers=[
    {icon:'⚠️','text':'142 statistical outliers flagged using Z-score (|z| > 3.0) across 4 columns.'},
    {icon:'🔺','text':'Loan Amount: 28 extreme values above $80K identified as potential fraud signals.'},
    {icon:'🔻','text':'Income column: 19 entries below $4,000 — likely data entry errors to review.'},
    {icon:'📊','text':'Credit Score < 300 or > 850 found in 7 rows — outside valid FICO range.'}
  ];
  function render(id, items){
    document.getElementById(id).innerHTML = items.map((it,i)=>
      `<li style="animation-delay:${i*0.08}s"><span class="li-icon">${it.icon}</span>${it.text}</li>`).join('');
  }
  render('trendList',trends); render('obsList',obs); render('outlierList',outliers);
}

/* ===== BUSINESS INSIGHTS ===== */
function buildBusiness(){
  const findings=['Credit Score is the top predictor for loan default (importance: 0.87).','Income & Loan Amount have the strongest correlation across all features (r=0.87).','Urban customers have 22% higher loan amounts than rural customers on average.','3 right-skewed columns require log-transformation before ML modeling.'];
  const recs=['Implement risk-based pricing tiers by credit score bands (Poor/Fair/Good/Excellent).','Apply KNN imputation for the 3.4% missing values in the Income column.','Flag 142 outlier records for manual review before model training.','Segment marketing campaigns to the two identified Age clusters for better ROI.'];
  const scope=['Deploy an ML-powered default prediction model (XGBoost) on cleaned data.','Build an automated data quality monitoring pipeline for production ingestion.','Extend the EDA with temporal analysis across quarterly cohorts.','Create a customer segmentation clustering analysis (K-Means / DBSCAN).'];
  function render(id,items){
    document.getElementById(id).innerHTML=items.map((t,i)=>`<li style="animation-delay:${i*0.1}s">${t}</li>`).join('');
  }
  render('bizFindings',findings); render('bizRecs',recs); render('bizScope',scope);
}

/* ===== TREND LINE (Monthly) ===== */
function buildTrendLine(){
  kill('trendLine');
  const ctx=document.getElementById('trendLine').getContext('2d');
  const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const disbursed=randInt(18000,45000,12);
  const approved=disbursed.map(v=>Math.floor(v*0.75+Math.random()*3000));
  const g1=ctx.createLinearGradient(0,0,0,220); g1.addColorStop(0,'rgba(37,99,235,0.35)'); g1.addColorStop(1,'rgba(37,99,235,0)');
  const g2=ctx.createLinearGradient(0,0,0,220); g2.addColorStop(0,'rgba(13,148,136,0.3)'); g2.addColorStop(1,'rgba(13,148,136,0)');
  charts.trendLine=new Chart(ctx,{ type:'line',
    data:{ labels:months, datasets:[
      { label:'Disbursed ($)', data:disbursed, borderColor:'#2563EB', backgroundColor:g1, fill:true, tension:0.45, borderWidth:2.5, pointRadius:4, pointBackgroundColor:'#2563EB' },
      { label:'Approved ($)', data:approved, borderColor:'#0D9488', backgroundColor:g2, fill:true, tension:0.45, borderWidth:2.5, pointRadius:4, pointBackgroundColor:'#0D9488' }
    ]},
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ display:true, position:'top', labels:{color:'#475569',font:{size:11}} } },
      scales:{ x:{grid:{color:'rgba(0,0,0,0.04)'},ticks:{color:'#64748B',font:{size:10}}}, y:{grid:{color:'rgba(0,0,0,0.04)'},ticks:{color:'#64748B',font:{size:10}}} }
    }
  });
}

/* ===== STACKED BAR ===== */
function buildStackedBar(){
  kill('stackedBar');
  const ctx=document.getElementById('stackedBar').getContext('2d');
  const quarters=['Q1 2023','Q2 2023','Q3 2023','Q4 2023'];
  charts.stackedBar=new Chart(ctx,{ type:'bar',
    data:{ labels:quarters, datasets:[
      { label:'Personal', data:randInt(2000,5000,4), backgroundColor:'rgba(37,99,235,0.8)', borderRadius:4 },
      { label:'Home',     data:randInt(3000,7000,4), backgroundColor:'rgba(13,148,136,0.8)', borderRadius:4 },
      { label:'Auto',     data:randInt(1000,3000,4), backgroundColor:'rgba(124,58,237,0.8)', borderRadius:4 },
      { label:'Business', data:randInt(500,2000,4),  backgroundColor:'rgba(249,115,22,0.8)', borderRadius:4 }
    ]},
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ display:true, position:'bottom', labels:{color:'#475569',font:{size:10}} } },
      scales:{ x:{ stacked:true, grid:{display:false}, ticks:{color:'#64748B',font:{size:10}} }, y:{ stacked:true, grid:{color:'rgba(0,0,0,0.04)'}, ticks:{color:'#64748B',font:{size:10}} } }
    }
  });
}

/* ===== LOAN STATUS DONUT ===== */
function buildLoanStatusDonut(){
  kill('loanStatusDonut');
  const ctx=document.getElementById('loanStatusDonut').getContext('2d');
  charts.loanStatusDonut=new Chart(ctx,{ type:'doughnut',
    data:{ labels:['Fully Paid','Current','Default','Late (31–90)','Grace Period'],
      datasets:[{ data:[6820,3241,1243,876,667], backgroundColor:['#16A34A','#2563EB','#EF4444','#F97316','#EAB308'], borderWidth:3, borderColor:'#fff', hoverOffset:8 }]
    },
    options:{ responsive:true, maintainAspectRatio:false, cutout:'60%',
      plugins:{ legend:{ display:true, position:'bottom', labels:{color:'#475569',font:{size:10},padding:8} } }
    }
  });
}

/* ===== CDF CHART ===== */
function buildCDF(){
  kill('cdf');
  const ctx=document.getElementById('cdfChart').getContext('2d');
  const pts=Array.from({length:50},(_,i)=>({ x: 10000+i*4000, y: +(i/49).toFixed(3) }));
  const g=ctx.createLinearGradient(0,0,0,230); g.addColorStop(0,'rgba(124,58,237,0.3)'); g.addColorStop(1,'rgba(124,58,237,0)');
  charts.cdf=new Chart(ctx,{ type:'line',
    data:{ datasets:[{ label:'CDF — Income', data:pts, borderColor:'#7C3AED', backgroundColor:g, fill:true, tension:0.4, borderWidth:2.5, pointRadius:0 }] },
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ display:true, position:'top', labels:{color:'#475569',font:{size:11}} } },
      scales:{ x:{type:'linear',title:{display:true,text:'Income ($)',color:'#94A3B8',font:{size:10}},grid:{color:'rgba(0,0,0,0.04)'},ticks:{color:'#64748B',font:{size:9}}}, y:{title:{display:true,text:'Cumulative %',color:'#94A3B8',font:{size:10}},max:1,grid:{color:'rgba(0,0,0,0.04)'},ticks:{color:'#64748B',font:{size:9}}} }
    }
  });
}

/* ===== AGE GROUP BAR ===== */
function buildAgeGroupBar(){
  kill('ageGroupBar');
  const ctx=document.getElementById('ageGroupBar').getContext('2d');
  const groups=['18–25','26–33','34–41','42–49','50–57','58–65','65+'];
  const avgLoan=[12400,19800,27600,31200,28900,22100,14300];
  const avgIncome=[28000,46000,62000,71000,67000,55000,38000];
  charts.ageGroupBar=new Chart(ctx,{ type:'bar',
    data:{ labels:groups, datasets:[
      { label:'Avg Loan ($)', data:avgLoan, backgroundColor:'rgba(37,99,235,0.75)', borderRadius:5 },
      { label:'Avg Income ($)', data:avgIncome, backgroundColor:'rgba(22,163,74,0.6)', borderRadius:5 }
    ]},
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ display:true, position:'top', labels:{color:'#475569',font:{size:11}} } },
      scales:{ x:{grid:{display:false},ticks:{color:'#64748B',font:{size:10}}}, y:{grid:{color:'rgba(0,0,0,0.04)'},ticks:{color:'#64748B',font:{size:10}}} }
    }
  });
}

/* ===== CREDIT SCORE DEFAULT LINE ===== */
function buildScoreDefaultLine(){
  kill('scoreDefault');
  const ctx=document.getElementById('scoreDefaultLine').getContext('2d');
  const bands=['<500','500–549','550–599','600–649','650–699','700–749','750–799','800+'];
  const defaultRate=[42.1,31.8,24.3,17.6,11.2,6.4,3.1,0.8];
  const g=ctx.createLinearGradient(0,0,0,200); g.addColorStop(0,'rgba(239,68,68,0.4)'); g.addColorStop(1,'rgba(239,68,68,0)');
  charts.scoreDefault=new Chart(ctx,{ type:'line',
    data:{ labels:bands, datasets:[{ label:'Default Rate (%)', data:defaultRate, borderColor:'#EF4444', backgroundColor:g, fill:true, tension:0.4, borderWidth:2.5, pointRadius:5, pointBackgroundColor:'#EF4444', pointHoverRadius:8 }] },
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ display:true, position:'top', labels:{color:'#475569',font:{size:11}} } },
      scales:{ x:{grid:{color:'rgba(0,0,0,0.04)'},ticks:{color:'#64748B',font:{size:10}}}, y:{grid:{color:'rgba(0,0,0,0.04)'},ticks:{color:'#64748B',font:{size:10}},title:{display:true,text:'Default %',color:'#94A3B8',font:{size:10}}} }
    }
  });
}

