# Meta Energy Portfolio Health Tracker v2 — Data Model & Metric Definitions

**Snapshot:** 2026-09-09  
**Purpose:** Public-data learning model for hyperscaler energy portfolio monitoring. Not an internal Meta system.

## 1. Modeling principles

1. **Never mix MWdc and MWac.** MWac is the normalized capacity field. DC-only solar remains visible but excluded from normalized totals.
2. **Do not call compute capacity electrical load.** Hyperion's 5 GW and Prometheus' 1 GW are used only as ultimate compute-scale reference points.
3. **Separate power, energy and firmness.** MW, annual MWh and capacity contribution answer different questions.
4. **Treat firm capacity as a scenario, not a fact.** v2 uses low/base/high screening factors. These are not ELCC, UCAP or ISO-accredited capacity values.
5. **Preserve contract structure.** PPAs, utility-backed generation, nuclear support agreements, prepayments and options are not equivalent.
6. **Unknown is a valid value.** Missing COD, queue data, market allocation, AC rating or technology stays unresolved.
7. **Every score must decompose.** Portfolio health, data confidence and attention ranking expose their inputs and are not black-box outputs.

## 2. Core entities and grain

### `campus`
One publicly named Meta campus/supercluster. Key fields: `id`, `name`, `location`, `market`, `announced_compute_mw`, `load_proxy_mw`, `load_proxy_basis`, `source_url`.

### `asset`
One public project, project block or distinct commercial commitment. Key fields: `asset_name`, `counterparty`, `market`, `technology`, `structure`, `status`, `capacity_mw_ac`, `capacity_mw_dc`, `capacity_basis`, `cod_year`, `campus_link`, `generation_cf`, three risk dimensions, and public source lineage.

## 3. Base metrics

### Normalized disclosed capacity
`sum(capacity_mw_ac)` only where `count_in_normalized_capacity = true`.

### Expected annual generation
`expected_mwh = capacity_mw_ac × 8,760 × generation_cf`

Capacity factors remain screening assumptions, not project-specific P50/P90 forecasts.

### Firm-capacity scenario
`firm_mw_scenario = capacity_mw_ac × scenario_factor(technology, market)`

v2 uses low/base/high ranges. Nuclear, CCGT and geothermal receive dispatchable screening ranges. Solar uses market-varying coincidence ranges. Batteries remain conservative because public duration/accreditation is incomplete. These values are **not reliability-planning accreditation**.

## 4. Portfolio Health Score

The score is a transparent learning construct:

`Health = 35% Delivery + 25% Firm Readiness + 15% Market Diversification + 15% Counterparty Diversification + 10% Data Confidence`

### Delivery
Capacity-weighted penalty across regulatory, interconnection and construction risk. Low = 0 penalty, unknown = partial penalty, medium = elevated penalty, high = maximum penalty.

### Firm readiness
Base-scenario firm MW divided by normalized MWac. It is a composition/readiness indicator, not adequacy certification.

### Diversification
Market and counterparty diversification use MWac-share HHI. Lower HHI produces a higher diversification score.

### Data confidence
Asset-level score from:
- capacity-unit resolution,
- COD visibility,
- market specificity,
- technology specificity,
- source traceability,
- risk-dimension completeness.

Capacity-weighted average confidence feeds the health score.

## 5. “What needs attention” ranking

Each asset receives an explainable priority score using:
- risk severity,
- multiple medium-risk causes,
- share of scoped MWac,
- proximity of public COD,
- data-confidence gap.

The output is not “this project will fail.” It is “this is where a portfolio manager should investigate first.”

## 6. Campus supply timeline

For Hyperion and Prometheus, v2 calculates cumulative committed firm-scenario MW by public COD year and compares it with the announced ultimate compute-scale reference.

It **does not invent a campus demand ramp**. Actual electrical demand, energization schedule, reserve requirements and meter-level load are not public.

## 7. Concentration

Counterparty and market concentration are shown as capacity share and HHI:

`HHI = Σ share_i²`

The displayed HHI is multiplied by 10,000. This is capacity concentration only, not credit exposure, contract value, basis exposure or mark-to-market.

## 8. Annual matched percentage

Still intentionally **not calculated as a definitive KPI**. Credible matching requires actual facility load, asset allocation, settled MWh, environmental-attribute ownership/retirement, curtailment, storage dispatch and temporal/geographic matching rules.

v2 adds an illustrative 24-hour technology-shape experiment only to demonstrate why annual energy can look adequate while specific hours are not. It is not Meta load or settlement data.

## 9. Source and refresh design

| Source | Grain | Use | Refresh concept |
|---|---|---|---|
| Meta / developer / utility announcements | deal / project | terms, capacity, COD | weekly snapshot |
| EIA Form 860 | generator | nameplate, status, owner | monthly/annual |
| EIA 930 | balancing authority hourly | system context / future hourly experiment | daily/hourly |
| ERCOT / MISO / SPP / PJM queues | interconnection request | queue milestone risk | weekly/monthly |
| LPSC / PUCO dockets | regulatory proceeding | approval and schedule risk | weekly while open |
| NREL / EIA technology benchmarks | technology | screening assumptions | annual |

## 10. Known limitations

- This is not Meta's full global portfolio.
- Several public announcements disclose MWdc only.
- Multi-market aggregate deals cannot be allocated cleanly without public project-level detail.
- Queue identifiers are not confidently matched for every commercial project.
- No contract price, tenor economics, congestion basis, credit support or mark-to-market is modeled.
- No actual Meta campus load profile is modeled.
- Firm scenarios and Portfolio Health are learning constructs, not industry-standard accredited metrics.

## 11. Interview framing

> “I wanted to understand the portfolio properly, so I tried to build a health view from public data. I found that the hard part was not charting MW. It was defining what should count, what should stay unresolved, how much of a project is actually useful for a given planning question, and which missing inputs prevent a number from becoming decision-grade.”


## Integration review model

The review reads the same filtered asset objects and firmness function as the dashboard, without parsing formatted cards. Each action is keyed by asset ID and cause; one asset may have several actions. Actions are ranked by high/medium severity and normalized capacity. Excluded capacity remains visible for data diligence but does not affect exposure ranking.

Supply by the selected year includes operating rows and non-operating rows with integer COD at or before the horizon. Stress shifts COD by 0–3 years only for non-operating rows with a high risk or at least two medium risks. Missing COD stays excluded from dated supply and is reported separately in MWac. Unknown dates are never assumed available. A deferred MW screen is not a load deficit, accredited capacity or proof of geographic deliverability.

Local action records store owner, due date, status, evidence and update timestamp. Closure requires nonblank evidence but does not revise the public asset model. Saved review baselines compare only identical scope/market/technology/risk/firmness filters. No automatic source refresh is performed. Notes and baselines use browser local storage; Markdown export is the sharing path.


## Portfolio monitor and procurement readiness

Physical lifecycle is derived from the disclosed status: operating, commissioning, construction (excluding pre-construction), or development. Lifecycle does not establish the start of contractual delivery. The COD chart sums normalized MWac from operating rows and rows with integer COD through the displayed year, excludes unresolved COD, and never invents phase allocations. Full project blocks may therefore appear only at their model COD. These are disclosed timing inputs, not electrical-load coverage.

Procurement gates flag missing source/definition fields, missing COD or high risks, and unresolved/multi-market allocation. A fields-present label does not verify factual accuracy. Commercial economics, load/deliverability and asset-level freshness remain not available. The executive draft is rule-based and selects the largest normalized flagged exposure; it is not generated by an LLM and does not authorize procurement.


## Free local AI

WebLLM 0.2.85 runs Qwen2.5 1.5B in a Web Worker using WebGPU. The model is q4f16 when shader-f16 is supported, otherwise q4f32. A user click initiates the download; no inference service receives portfolio prompts. Runtime and weights are downloaded from external CDNs/model hosts.

Grounding uses deterministic filtered totals and six priority asset rows maximum, ranked by high/medium risk, missing COD and then AC capacity. It does not send local action notes or fetch live source content. The prompt separates evidence from instructions and prohibits invented economics and approvals. The output is untrusted plain text, never executable markup. Source links are built from the dataset, not model URLs. Unknown source references are flagged, but this is not factual verification. Filters changing mark existing output stale. Calls are single-flight and generation times out after two minutes. Human review remains required.
