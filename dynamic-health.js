(() => {
  function selectedScenarioLabel() {
    return state.scenario.charAt(0).toUpperCase() + state.scenario.slice(1);
  }

  firmReadinessScore = function(rows) {
    const n = normalizedAssets(rows);
    const cap = sum(n, a => a.capacity_mw_ac);
    const firm = sum(n, a => firmMW(a, state.scenario));
    return cap ? Math.min(100, firm / cap * 100) : 0;
  };

  renderHealth = function() {
    const rows = displayAssets();
    const normalized = normalizedAssets(rows);
    const overallRows = scopeAssets();
    const overallScore = Math.round(health(overallRows).score);
    const scenario = selectedScenarioLabel();
    const scopeLabel = state.scope === 'pipeline' ? 'Committed + pipeline' : 'Committed';
    const filtersActive = state.market !== 'all' || state.tech !== 'all' || state.risk !== 'all';

    if (!normalized.length) {
      $('#healthCard').innerHTML = `<div class="health-score"><div class="health-score-inner"><div class="health-number">N/A</div><div class="health-label">no MWac</div></div></div><div><div class="health-title">Portfolio health · insufficient normalized capacity</div><div class="health-note">The selected view has no normalized MWac rows to score. Overall ${scopeLabel.toLowerCase()} portfolio under the ${scenario.toLowerCase()} scenario: ${overallScore}/100.</div></div>`;
      return;
    }

    const h = health(rows);
    const n = Math.round(h.score);
    const context = filtersActive ? `Filtered view · ${rows.length} rows · ${scenario} firmness` : `${scopeLabel} · ${scenario} firmness`;

    $('#healthCard').innerHTML = `<div class="health-score" style="--score:${n}"><div class="health-score-inner"><div class="health-number">${n}</div><div class="health-label">/ 100</div></div></div><div><div class="health-title">Portfolio health · ${grade(n)}</div><div class="health-note"><strong>${context}</strong><br>Recalculates from the active market, technology, risk and firmness selections. Overall ${scopeLabel.toLowerCase()} benchmark under the same firmness scenario: ${overallScore}/100.</div><div class="health-components">${[['Delivery',h.c.delivery],['Firmness',h.c.firm_readiness],['Markets',h.c.market_diversification],['Counterparty',h.c.counterparty_diversification],['Data',h.c.data_confidence]].map(([k,v])=>`<div class="health-component"><span>${k}</span><strong>${Math.round(v)}</strong></div>`).join('')}</div></div>`;
  };

  renderMethod = function() {
    const w = state.data.assumptions.health_score_weights;
    $('#methodContent').innerHTML = `<h3>Portfolio Health Score</h3><p>Weighted composite: delivery ${pct(w.delivery)}, firm readiness ${pct(w.firm_readiness)}, market diversification ${pct(w.market_diversification)}, counterparty diversification ${pct(w.counterparty_diversification)}, and data confidence ${pct(w.data_confidence)}. The score recalculates for the active filtered view and selected low/base/high firmness scenario. It is a transparent screening construct, not a company KPI.</p><h3>Firmness scenarios</h3><p>Low/base/high ranges stress-test technology contribution. Solar varies by market. Storage is deliberately conservative because duration and accreditation are incomplete. No value is presented as ISO-accredited capacity.</p><h3>COD risk</h3><p>Delivery exposure is capacity-weighted across regulatory, interconnection and construction risk. High risks receive the largest penalty; unknowns remain a penalty rather than being treated as safe.</p><h3>Data confidence</h3><p>Each asset is scored for capacity-unit resolution, COD visibility, market specificity, technology specificity, source traceability and risk completeness.</p><h3>Concentration</h3><p>HHI is calculated from MWac shares. It is a capacity concentration measure, not financial, credit or mark-to-market exposure.</p>`;
  };

  function installEnterButton() {
    const current = document.getElementById('resetBtn');
    if (!current || current.dataset.enterReady === 'true') return;

    const button = current.cloneNode(true);
    button.textContent = 'Enter';
    button.dataset.enterReady = 'true';
    button.setAttribute('aria-label', 'Apply selected portfolio filters');
    current.replaceWith(button);

    button.addEventListener('click', () => {
      state.market = $('#marketFilter').value;
      state.tech = $('#techFilter').value;
      state.risk = $('#riskFilter').value;
      state.scenario = $('#scenarioFilter').value;
      render();
    });
  }

  const watcher = setInterval(() => {
    if (typeof state !== 'undefined' && state.data) {
      installEnterButton();
      render();
      clearInterval(watcher);
    }
  }, 40);
})();
