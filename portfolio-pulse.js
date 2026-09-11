(() => {
  'use strict';

  const $ = selector => document.querySelector(selector);
  const fmt = value => new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value);
  const isNormalized = asset => asset.count_in_normalized_capacity && Number.isFinite(asset.capacity_mw_ac);
  const isFlagged = asset => {
    const risks = Object.values(asset.risk || {});
    return risks.includes('high') || risks.filter(risk => risk === 'medium').length >= 2;
  };

  function gw(mw) {
    return `${fmt((mw || 0) / 1000)} GW`;
  }

  function lifecycle(asset) {
    if (/^Operating\b/i.test(asset.status || '')) return 'Operating';
    if (/commissioning/i.test(asset.status || '')) return 'Commissioning';
    if (/construction/i.test(asset.status || '') && !/pre-construction/i.test(asset.status || '')) return 'Construction';
    return 'Development';
  }

  function render() {
    const app = window.PortfolioApp;
    const root = $('#portfolioPulse');
    if (!app || !root) return;

    const rows = app.filterAssets();
    const normalized = rows.filter(isNormalized);
    const totalMW = normalized.reduce((sum, asset) => sum + asset.capacity_mw_ac, 0);
    const flagged = normalized.filter(isFlagged);
    const flaggedMW = flagged.reduce((sum, asset) => sum + asset.capacity_mw_ac, 0);
    const unresolved = normalized.filter(asset => lifecycle(asset) !== 'Operating' && !Number.isInteger(asset.cod_year));
    const unresolvedMW = unresolved.reduce((sum, asset) => sum + asset.capacity_mw_ac, 0);
    const confidence = totalMW
      ? normalized.reduce((sum, asset) => sum + asset.capacity_mw_ac * app.dataConfidence(asset), 0) / totalMW
      : 0;
    const health = normalized.length ? app.health(rows).score : null;
    const riskShare = totalMW ? flaggedMW / totalMW : 0;
    const posture = !normalized.length ? 'No scoped capacity' : riskShare >= 0.4 ? 'Elevated' : riskShare >= 0.15 ? 'Watch' : 'Stable';
    const postureClass = posture === 'Elevated' ? 'pulse-high' : posture === 'Watch' ? 'pulse-watch' : 'pulse-stable';
    const top = [...flagged].sort((a, b) => b.capacity_mw_ac - a.capacity_mw_ac)[0];

    const focus = top
      ? `${top.asset_name} is the largest flagged exposure at ${gw(top.capacity_mw_ac)}. Reconcile milestone confidence, accountable owner and decision date before relying on its delivery schedule.`
      : rows.length
        ? 'No normalized asset is currently flagged in this view. Keep unresolved data, commercial inputs and deliverability assumptions visible before procurement decisions.'
        : 'No assets match the applied filters. Broaden the view to review portfolio condition.';

    root.innerHTML = `
      <div class="pulse-heading">
        <div>
          <span class="pulse-eyebrow">PORTFOLIO PULSE</span>
          <h2>Decision-grade view</h2>
        </div>
        <span class="pulse-posture ${postureClass}">${posture}</span>
      </div>
      <div class="pulse-grid">
        <div class="pulse-metric"><span>Health</span><strong>${health == null ? 'N/A' : Math.round(health) + '/100'}</strong><small>screening score</small></div>
        <div class="pulse-metric"><span>Delivery exposure</span><strong>${gw(flaggedMW)}</strong><small>${totalMW ? Math.round(riskShare * 100) + '% of normalized MWac' : 'no normalized capacity'}</small></div>
        <div class="pulse-metric"><span>Unresolved COD</span><strong>${gw(unresolvedMW)}</strong><small>development capacity without dated COD</small></div>
        <div class="pulse-metric"><span>Data confidence</span><strong>${normalized.length ? Math.round(confidence) + '/100' : 'N/A'}</strong><small>capacity-weighted completeness</small></div>
      </div>
      <div class="pulse-focus">
        <div><span>Management focus</span><p>${focus}</p></div>
        <a href="#integration">Open action register →</a>
      </div>`;
  }

  document.addEventListener('portfolio:updated', render);
  render();
})();
