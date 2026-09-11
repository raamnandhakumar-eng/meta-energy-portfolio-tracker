(() => {
  'use strict';
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number = v => new Intl.NumberFormat('en-US', {maximumFractionDigits:0}).format(v);
  const key = 'energy-integration-review-v3';
  let records = {}, storageOK = true, app, latest, baseline = null;
  try { const saved = JSON.parse(localStorage.getItem(key) || '{}'); records = saved.records || {}; baseline = saved.baseline || null; } catch { storageOK = false; }
  const normalized = a => a.count_in_normalized_capacity && Number.isFinite(a.capacity_mw_ac);
  const flagged = a => Object.values(a.risk || {}).includes('high') || Object.values(a.risk || {}).filter(x => x === 'medium').length >= 2;
  const operating = a => /^Operating\b/i.test(a.status || '');
  function delivery(rows, year, delay, firm) {
    let base = 0, stress = 0, unknown = 0;
    for (const a of rows.filter(normalized)) {
      if (!operating(a) && !Number.isInteger(a.cod_year)) { unknown += a.capacity_mw_ac; continue; }
      const value = firm(a);
      if (operating(a) || a.cod_year <= year) base += value;
      if (operating(a) || a.cod_year + (flagged(a) ? delay : 0) <= year) stress += value;
    }
    return {base, stress, deferred: base - stress, unknown};
  }
  function issues(rows) {
    return rows.flatMap(a => {
      const out = [];
      const add = (cause, owner, action, evidence, priority) => out.push({id:a.id+':'+cause, asset:a, cause, owner, action, evidence, priority});
      for (const [cause, risk] of Object.entries(a.risk || {})) if (risk === 'high' || risk === 'medium') {
        const map = {
          regulatory:['Utility / Regulatory','Confirm approval path and decision date','Docket decision or documented approval milestone'],
          interconnection:['Grid / Interconnection','Confirm grid upgrades and energization dependencies','Queue milestone, upgrade schedule and accountable owner'],
          construction:['Asset Management','Review critical path and COD confidence','Updated construction schedule and mitigation plan']
        };
        const spec = map[cause]; if(spec) add(cause,...spec,risk === 'high' ? 3 : 2);
      }
      if ((!operating(a) && !Number.isInteger(a.cod_year)) || !normalized(a) || app.dataConfidence(a)<80) add('data','Analytics / Data','Resolve capacity basis, COD and market allocation','Dated primary-source evidence for each resolved field',2);
      return out;
    }).sort((a,b) => b.priority-a.priority || (normalized(b.asset)?b.asset.capacity_mw_ac:0)-(normalized(a.asset)?a.asset.capacity_mw_ac:0) || a.id.localeCompare(b.id));
  }
  // Export pure scenario math for the dependency-free regression checks.
  if (typeof module !== 'undefined' && module.exports) { module.exports = {delivery, flagged, operating}; return; }
  const $ = s => document.querySelector(s);
  function save() {
    try {localStorage.setItem(key,JSON.stringify({records,baseline}));storageOK=true;} catch {storageOK=false;}
    $('#reviewStorage').textContent = storageOK ? 'Saved in this browser only. Export a brief to share.' : 'Browser storage unavailable. Export your brief before leaving.';
  }
  function shell() {
    const section = document.createElement('section'); section.id='integration'; section.className='ops-section review';
    section.innerHTML=`<div class="section-heading"><div><span class="card-kicker">Weekly integration review</span><h2>Move exceptions toward a decision</h2><p>Suggested functional owners are workflow roles, not actual company assignments.</p></div><button class="button secondary" id="exportReview">Download review brief</button></div>
      <div class="card review-panel"><form id="reviewScenario" class="review-controls"><label>Planning year<input id="planningYear" type="number" min="2026" max="2050" value="2030" required></label><label>Delay flagged development<select id="delayYears"><option value="0">No delay</option><option value="1" selected>1 year</option><option value="2">2 years</option><option value="3">3 years</option></select></label><button class="button" type="submit">Run scenario</button></form><p>Year-end screening. Delays apply to non-operating, COD-risk-flagged assets only. Uses the applied portfolio filters and firmness scenario.</p><div id="reviewMetrics" class="review-metrics" aria-live="polite"></div><p id="scenarioNote"></p></div>
      <div class="card review-panel"><div class="review-controls"><h3>Changes since your saved review</h3><button class="button secondary" id="saveBaseline">Save current baseline</button></div><p id="baselineSummary" aria-live="polite"></p></div>
      <div class="card review-panel"><div class="review-controls"><h3>Action register</h3><label>Show<select id="actionView"><option value="open">Open actions</option><option value="all">All actions</option><option value="closed">Closed actions</option></select></label></div><p id="reviewCount"></p><p>Sorted by risk severity, then normalized MWac. Closing an action records diligence; it does not change the source risk or health score.</p><div id="reviewActions"></div><p id="reviewStorage" role="status"></p></div>`;
    $('#portfolio').after(section);
    const nav=document.createElement('a'); nav.className='nav-item';nav.href='#integration';nav.textContent='Integration review';$('.side-nav').append(nav);
    $('#reviewScenario').addEventListener('submit',e=>{e.preventDefault();render();});
    $('#actionView').addEventListener('change',render);
    $('#saveBaseline').addEventListener('click',()=>{baseline={at:new Date().toISOString(),view:view(),capacity:latest.capacity,health:latest.health,firm:latest.firm,rows:latest.rows.map(a=>({id:a.id,cod:a.cod_year,risk:JSON.stringify(a.risk)}))};save();render();});
    $('#exportReview').addEventListener('click',exportBrief);
    $('#reviewActions').addEventListener('submit',e=>{
      e.preventDefault();const form=e.target, values=new FormData(form), id=form.dataset.issue;
      const next=Object.fromEntries(values); const evidence=form.elements.evidence;
      evidence.setCustomValidity(next.status==='Closed' && !next.evidence.trim() ? 'Add evidence before closing this action.' : '');
      if (!form.reportValidity()) return;
      records[id]={...next,updated:new Date().toISOString()};save();render();
    });
    $('#reviewActions').addEventListener('input',e=>{const form=e.target.closest('form');if(form)form.elements.evidence.setCustomValidity('');});
    save();
  }
  function view() {return JSON.stringify(['scope','market','tech','risk','scenario'].map(k=>app.state[k]));}
  function render() {
    const rows=app.filterAssets(), norm=rows.filter(normalized), capacity=norm.reduce((s,a)=>s+a.capacity_mw_ac,0), health=norm.length?app.health(rows).score:null, firm=norm.reduce((s,a)=>s+app.firmMW(a),0);
    const year=Number($('#planningYear').value), delay=Number($('#delayYears').value);
    if(!Number.isInteger(year)||year<2026||year>2050)return;
    const result=delivery(rows,year,delay,a=>app.firmMW(a));
    const cards=[['By '+year,number(result.base)+' MW','Baseline firm screening'],['With delay',number(result.stress)+' MW','Scenario firm screening'],['Deferred past horizon',number(result.deferred)+' MW','Not a load shortfall'],['Unresolved COD',number(result.unknown)+' MWac','Excluded from dated supply']];
    $('#reviewMetrics').innerHTML=cards.map(([label,value,note])=>`<div><span>${label}</span><strong>${value}</strong><small>${note}</small></div>`).join('');
    $('#scenarioNote').textContent=norm.length?'This is a portfolio supply timing screen, not deliverable capacity at a campus. Contract allocation, transmission deliverability, electrical load and accredited capacity remain unverified.':'No normalized MWac in this view. Scenario totals have no scorable inputs.';
    let changes='No baseline saved. Save this view to compare future reviews.';
    if(baseline){if(baseline.view!==view())changes='Baseline uses different filters or firmness. Restore that view or save a new baseline before comparing.';
      else {const old=new Map(baseline.rows.map(a=>[a.id,a])), changed=rows.filter(a=>old.has(a.id)&&(old.get(a.id).cod!==a.cod_year||old.get(a.id).risk!==JSON.stringify(a.risk))).length;
        changes=`Since ${new Date(baseline.at).toLocaleString()}: ${number(capacity-baseline.capacity)} MWac capacity change; ${health==null||baseline.health==null?'N/A':(health-baseline.health).toFixed(1)} health-point change; ${changed} rows with changed COD or risk; ${rows.filter(a=>!old.has(a.id)).length} added; ${baseline.rows.filter(a=>!rows.some(b=>b.id===a.id)).length} removed. This compares saved snapshots, not a live data feed.`;}}
    $('#baselineSummary').textContent=changes;
    const all=issues(rows), mode=$('#actionView').value, visible=all.filter(i=>mode==='all'||(mode==='closed')=== (records[i.id]?.status==='Closed'));
    const today=new Date().toISOString().slice(0,10), overdue=all.filter(i=>records[i.id]?.due && records[i.id].due<today && records[i.id].status!=='Closed').length;
    $('#reviewCount').textContent=`${all.filter(i=>records[i.id]?.status!=='Closed').length} open · ${overdue} overdue · ${visible.length} shown. Multiple actions can refer to the same asset; do not sum action-row MW.`;
    $('#reviewActions').innerHTML=visible.length?visible.map(i=>{const r=records[i.id]||{}, a=i.asset;return `<details class="review-action"><summary><span>${i.priority===3?'High':'Review'} · ${esc(a.asset_name)} / ${esc(i.cause)}</span><span>${esc(r.status||'Open')}${r.due&&r.due<today&&r.status!=='Closed'?' · Overdue':''}</span></summary><p>${esc(i.action)}. ${normalized(a)?number(a.capacity_mw_ac)+' MWac':'Excluded from normalized capacity'} · Public COD: ${esc(a.cod_label)}.</p><p><strong>Evidence needed:</strong> ${esc(i.evidence)}. <a href="${esc(/^https?:\/\//.test(a.source_url)?a.source_url:'#')}" target="_blank" rel="noreferrer">Source</a></p><form data-issue="${esc(i.id)}" class="review-form"><label>Owner / function<input name="owner" maxlength="120" value="${esc(r.owner||i.owner)}" required></label><label>Review due<input name="due" type="date" value="${esc(r.due||'')}"></label><label>Status<select name="status">${['Open','In progress','Blocked','Closed'].map(s=>`<option${s===(r.status||'Open')?' selected':''}>${s}</option>`).join('')}</select></label><label class="review-wide">Decision / evidence<textarea name="evidence" maxlength="2000" rows="2" placeholder="Record the decision, source and remaining dependency">${esc(r.evidence||'')}</textarea></label><button class="button" type="submit">Save action</button></form></details>`;}).join(''):'<p>No actions match this view.</p>';
    latest={rows,capacity,health,firm,result,year,delay,all,changes};
  }
  function exportBrief(){const x=latest,s=app.state;const lines=['# Energy integration review',`Exported: ${new Date().toISOString()}`,`Applied view: ${s.scope} | ${s.market} | ${s.tech} | ${s.risk} | ${s.scenario} firmness`,`Normalized capacity: ${number(x.capacity)} MWac`,`Health: ${x.health==null?'N/A':x.health.toFixed(1)+'/100'}`,`By ${x.year}, with ${x.delay}-year delay to flagged development: ${number(x.result.base)} MW baseline; ${number(x.result.stress)} MW stressed; ${number(x.result.deferred)} MW deferred.`, `Unresolved COD: ${number(x.result.unknown)} MWac.`,x.changes,'','## Actions',...x.all.map(i=>{const r=records[i.id]||{};return `- ${i.asset.asset_name} / ${i.cause}: ${r.status||'Open'}\n  Owner: ${r.owner||i.owner}; due: ${r.due||'Not set'}\n  Next: ${i.action}\n  Evidence needed: ${i.evidence}\n  Decision / evidence: ${r.evidence||'Not recorded'}\n  Source: ${i.asset.source_url}`;}),'','Public-data screening only. Suggested roles are not company assignments. Browser-local notes are not shared. Supply timing is not load adequacy or procurement approval.'];const blob=new Blob([lines.join('\n')],{type:'text/markdown'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='energy-integration-review.md';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function boot(){if(app||!window.PortfolioApp)return;app=window.PortfolioApp;shell();render();}
  document.addEventListener('portfolio:updated',()=>{boot();if(app)render();});
  boot();
})();
