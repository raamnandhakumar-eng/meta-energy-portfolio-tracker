(() => {
  'use strict';
  const $=s=>document.querySelector(s),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=v=>new Intl.NumberFormat('en-US',{maximumFractionDigits:0}).format(v);
  let installed=false;
  function lifecycle(a){if(/^Operating\b/i.test(a.status))return 'Operating';if(/commissioning/i.test(a.status))return 'Commissioning';if(/construction/i.test(a.status)&&!/pre-construction/i.test(a.status))return 'Construction';return 'Development';}
  function render(){const app=window.PortfolioApp;if(!app)return;
    if(!installed){installed=true;
      const panel=document.createElement('div');panel.id='portfolioMonitor';$('#overview .section-heading').after(panel);
      $('#overview').append($('#kpis'));$('#overview .section-heading').after($('#kpis'));
      const controls=document.createElement('div');controls.className='register-controls';controls.innerHTML='<label>Find an asset<input id="assetSearch" type="search" placeholder="Asset, counterparty or market"></label><label>Lifecycle<select id="assetStage"><option value="all">All stages</option><option>Operating</option><option>Commissioning</option><option>Construction</option><option>Development</option></select></label><span id="registerVisible" role="status"></span>';
      $('#assets .table-card').before(controls);$('#assetSearch').addEventListener('input',filterTable);$('#assetStage').addEventListener('change',filterTable);
    }
    const rows=app.filterAssets(),norm=rows.filter(a=>a.count_in_normalized_capacity&&Number.isFinite(a.capacity_mw_ac)),total=norm.reduce((s,a)=>s+a.capacity_mw_ac,0),stages=['Operating','Commissioning','Construction','Development'],colors=['#13776b','#418ab7','#b3771b','#8192ab'];
    const flag=a=>Object.values(a.risk).includes('high')||Object.values(a.risk).filter(x=>x==='medium').length>=2;
    const high=norm.filter(flag),risk=high.reduce((s,a)=>s+a.capacity_mw_ac,0),unknown=norm.filter(a=>a.cod_year==null&&lifecycle(a)!=='Operating'),unknownMW=unknown.reduce((s,a)=>s+a.capacity_mw_ac,0);
    const years=[2026,2027,2028,2029,2030,2031,2032,2033,2034,2035];
    const values=years.map(y=>norm.filter(a=>lifecycle(a)==='Operating'||Number.isInteger(a.cod_year)&&a.cod_year<=y).reduce((s,a)=>s+a.capacity_mw_ac,0)),max=Math.max(...values,1);
    const groups=stages.map((stage,i)=>({stage,color:colors[i],rows:norm.filter(a=>lifecycle(a)===stage)}));
    const label=total?(risk/total>=.5?'High delivery exposure':risk/total>=.2?'Delivery review needed':'Monitor delivery'):'No normalized capacity';
    $('#portfolioMonitor').innerHTML=`<div class="monitor-headline"><div><span class="monitor-eyebrow">PORTFOLIO CONDITION</span><h3>${label}</h3><p>${fmt(risk)} MWac flagged for delivery review${total?' · '+Math.round(risk/total*100)+'% of selected capacity':''}. ${fmt(unknownMW)} MWac has unresolved COD.</p></div><a class="button secondary" href="#integration">Review actions</a></div><div class="monitor-grid"><article class="card"><div class="card-head"><div><span class="card-kicker">Asset lifecycle</span><h3>Where capacity stands</h3></div><span class="unit">MWac</span></div><div class="lifecycle-bar" role="img" aria-label="Capacity by lifecycle">${groups.map(g=>{const value=g.rows.reduce((s,a)=>s+a.capacity_mw_ac,0);return `<span style="width:${total?value/total*100:0}%;background:${g.color}" title="${g.stage}: ${fmt(value)} MWac"></span>`;}).join('')}</div><div class="lifecycle-legend">${groups.map(g=>`<div><span><i style="background:${g.color}"></i>${g.stage}</span><strong>${fmt(g.rows.reduce((s,a)=>s+a.capacity_mw_ac,0))} <small>MWac</small></strong><small>${g.rows.length} assets</small></div>`).join('')}</div><p class="monitor-note">Physical project status from the dataset. Operating capacity does not imply contract delivery has started.</p></article><article class="card"><div class="card-head"><div><span class="card-kicker">Delivery outlook</span><h3>Capacity by disclosed COD</h3></div><span class="unit">Cumulative MWac</span></div><div class="cod-chart" role="img" aria-label="Cumulative disclosed capacity from 2026 to 2035">${years.map((y,i)=>`<div class="cod-column"><strong>${fmt(values[i])}</strong><div class="cod-space"><span style="height:${values[i]/max*100}%"></span></div><small>${y}</small></div>`).join('')}</div><p class="monitor-note">Operating rows plus disclosed COD through each year. Unknown COD excluded. Full asset blocks; no inferred phase ramp or load coverage.</p></article></div>`;
    filterTable();
  }
  function filterTable(){const app=window.PortfolioApp;if(!app||!$('#assetSearch'))return;const query=$('#assetSearch').value.toLowerCase().trim(),stage=$('#assetStage').value,map=new Map(app.filterAssets().map(a=>[a.id,a]));let count=0;
    document.querySelectorAll('#assetRows tr').forEach(tr=>{const id=tr.querySelector('[data-asset]')?.dataset.asset,a=map.get(id);if(!a)return;const visible=(!query||[a.asset_name,a.counterparty,a.market,a.technology].join(' ').toLowerCase().includes(query))&&(stage==='all'||lifecycle(a)===stage);tr.hidden=!visible;if(visible)count++;});
    $('#registerVisible').textContent=`${count} assets shown · table search does not change portfolio totals`;
  }
  document.addEventListener('portfolio:updated',render);render();
})();
