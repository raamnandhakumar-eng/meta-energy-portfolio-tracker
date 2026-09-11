# Energy Portfolio Data Model v2

**Snapshot:** 2026-09-09  
**Purpose:** Public-data model for energy portfolio monitoring, delivery-risk screening, capacity normalization, and source traceability.

## 1. Modeling principles

1. **Never mix MWdc and MWac.** MWac is the normalized capacity field. DC-only solar remains visible but is excluded from normalized totals.
2. **Do not treat compute capacity as electrical load.** Announced compute-scale values may be retained as contextual reference fields, but they are not used as measured or forecast electrical demand.
3. **Separate power, energy, and firmness.** MW, annual MWh, and capacity contribution answer different questions and are modeled separately.
4. **Treat firm capacity as a scenario, not a fact.** Low/base/high screening factors are analytical assumptions, not ELCC, UCAP, or ISO-accredited capacity values.
5. **Preserve commercial structure.** PPAs, utility-backed generation, support agreements, prepayments, options, and other structures are distinct and should not be collapsed into one contract type.
6. **Unknown is a valid value.** Missing COD, queue data, market allocation, AC rating, technology, or source detail remains unresolved rather than inferred.
7. **Every score must decompose.** Portfolio health, data confidence, and attention ranking expose their component inputs.

## 2. Core entities and grain

### `campus`

One publicly identified campus, facility cluster, or compute site.

Key fields:

- `id`
- `name`
- `location`
- `market`
- `announced_compute_mw`
- `load_proxy_mw`
- `load_proxy_basis`
- `source_url`

`announced_compute_mw` is contextual only. It is not assumed to equal electrical peak load.

### `asset`

One public energy project, project block, or distinct commercial commitment.

Key fields:

- `asset_name`
- `counterparty`
- `market`
- `technology`
- `structure`
- `status`
- `capacity_mw_ac`
- `capacity_mw_dc`
- `capacity_basis`
- `count_in_normalized_capacity`
- `cod_year`
- `campus_link`
- `generation_cf`
- regulatory risk
- interconnection risk
- construction risk
- source URL and source metadata

## 3. Capacity normalization

### Normalized disclosed capacity

```text
normalized_mw_ac = sum(capacity_mw_ac)
```

Only rows where:

```text
count_in_normalized_capacity = true
```

are included.

Rules:

- MWdc and MWac are never added together.
- DC-only disclosures remain visible but are excluded from normalized MWac totals.
- Multi-project or multi-market aggregate announcements are not decomposed without a defensible public allocation.
- Duplicate project blocks are excluded from aggregate totals when they represent the same underlying capacity.

## 4. Expected annual generation

```text
expected_mwh = capacity_mw_ac × 8,760 × generation_cf
```

`generation_cf` is a screening assumption unless a project-specific public estimate is available.

Expected annual generation is not treated as:

- contracted settlement volume,
- P50 or P90 production,
- delivered energy,
- environmental-attribute retirement,
- hourly load matching.

## 5. Firm-capacity scenarios

```text
firm_mw_scenario = capacity_mw_ac × scenario_factor(technology, market)
```

The model uses low, base, and high screening ranges.

Typical treatment:

- nuclear, CCGT, and geothermal receive dispatchable screening ranges;
- solar receives market-dependent coincidence ranges;
- batteries remain conservative where public duration or accreditation is incomplete;
- unresolved technology or market data may receive reduced confidence or remain excluded from certain derived views.

These values are not reliability-planning accreditation.

## 6. Portfolio Health Score

The model uses a transparent composite score:

```text
Health =
35% Delivery
+ 25% Firm Readiness
+ 15% Market Diversification
+ 15% Counterparty Diversification
+ 10% Data Confidence
```

### Delivery

Capacity-weighted penalty across:

- regulatory risk,
- interconnection risk,
- construction risk.

Risk states are mapped to increasing penalties:

- low,
- unknown,
- medium,
- high.

### Firm readiness

```text
firm_readiness = base_scenario_firm_mw / normalized_mw_ac
```

This is a portfolio-composition indicator, not a resource-adequacy certification.

### Diversification

Market and counterparty diversification use capacity-share HHI.

```text
HHI = Σ share_i²
```

The displayed HHI is multiplied by 10,000.

Lower concentration produces a higher diversification component score.

### Data confidence

Asset-level confidence is based on:

- capacity-unit resolution,
- COD visibility,
- market specificity,
- technology specificity,
- source traceability,
- risk-dimension completeness.

Portfolio data confidence is calculated as a capacity-weighted average across normalized assets.

## 7. Attention ranking

Each asset receives an explainable priority score based on:

- high-risk causes,
- multiple medium-risk causes,
- share of scoped normalized MWac,
- proximity of public COD,
- missing COD,
- data-confidence gaps.

The score indicates which rows deserve review first. It is not a forecast that a project will fail.

## 8. Supply timeline

For campus-linked or portfolio-linked assets, the model can calculate cumulative normalized or firm-scenario MW by disclosed COD year.

Rules:

- operating assets are treated as available in the current portfolio view;
- non-operating assets are included only when an integer COD year is present and falls within the selected horizon;
- missing COD remains unresolved and is reported separately;
- no demand ramp is invented;
- no geographic deliverability is inferred solely from commercial linkage.

A dated capacity screen is not the same as confirmed energization, accredited capacity, or load coverage.

## 9. Lifecycle classification

Physical lifecycle is derived from disclosed project status:

- Operating
- Commissioning
- Construction
- Development

Pre-construction rows remain in Development unless a clearer public status is available.

Lifecycle status does not establish the beginning of contractual delivery.

## 10. Concentration metrics

Counterparty and market concentration are shown using:

- normalized MWac share,
- HHI.

These metrics describe physical-capacity concentration only.

They do not represent:

- credit exposure,
- contract value,
- congestion basis,
- mark-to-market,
- settlement exposure.

## 11. Annual matched percentage

A definitive annual matched percentage is intentionally not calculated from public capacity data alone.

Credible matching would require, at minimum:

- facility load,
- asset allocation,
- settled MWh,
- environmental-attribute ownership and retirement,
- curtailment,
- storage dispatch,
- temporal matching rules,
- geographic matching rules.

A portfolio may appear over-covered on annual energy while remaining under-covered during specific hours.

## 12. Risk dimensions

Each asset may carry separate risk values for:

### Regulatory risk

Examples include:

- pending approval,
- open docket,
- permitting dependency,
- unresolved regulatory treatment.

### Interconnection risk

Examples include:

- queue uncertainty,
- network-upgrade dependency,
- milestone uncertainty,
- incomplete public queue matching.

### Construction risk

Examples include:

- early development status,
- construction dependency,
- phased build uncertainty,
- unresolved COD.

Risk dimensions remain separate so one issue does not overwrite another.

## 13. Source lineage

Each asset should retain sufficient source metadata to reconstruct why the row exists and how its fields were populated.

Recommended source fields:

- `source_url`
- `source_type`
- `source_date`
- `source_title`
- `last_verified`
- `notes`

Source presence does not prove field accuracy. It records lineage.

## 14. Source and refresh design

| Source | Grain | Primary use | Refresh concept |
|---|---|---|---|
| Company / developer / utility announcements | deal / project | structure, capacity, status, COD | weekly snapshot |
| EIA Form 860 | generator | nameplate, status, owner | monthly / annual |
| EIA 930 | balancing authority hourly | system context | daily / hourly |
| ISO / RTO interconnection queues | interconnection request | milestone and queue-risk context | weekly / monthly |
| Regulatory dockets | proceeding | approval and schedule risk | weekly while open |
| NREL / EIA technology benchmarks | technology | screening assumptions | annual |

## 15. Missing-data treatment

Missing values are preserved explicitly.

Examples:

- missing AC rating is not converted from DC without a documented basis;
- missing COD is not assigned a midpoint year;
- unresolved market allocation is not split evenly;
- unknown queue identifiers are not guessed;
- missing technology detail is not inferred from counterparty name alone.

Derived metrics must distinguish between zero and unknown.

## 16. Stress treatment

Scenario stress may shift COD by 0–3 years only for non-operating rows meeting predefined risk conditions, such as:

- at least one high-risk dimension, or
- at least two medium-risk dimensions.

Missing COD remains missing under stress.

Deferred MW is a timing screen only. It is not a load deficit or proof of project failure.

## 17. Known limitations

- The dataset is not a complete representation of any company's global energy portfolio.
- Several public announcements disclose MWdc only.
- Multi-market aggregate deals cannot always be allocated cleanly.
- Queue identifiers are not confidently matched for every commercial project.
- Contract price, tenor economics, congestion basis, credit support, and mark-to-market are not modeled.
- Actual facility load profiles are not modeled unless explicitly available from a defensible source.
- Firm-capacity scenarios are analytical screening assumptions, not accredited planning values.
- Portfolio Health is a transparent analytical construct, not an industry-standard metric.
- Source freshness varies by project and data source.
