# Energy Portfolio Health Tracker

[**Live Demo → energy-portfolio-healthtracker.vercel.app**](https://energy-portfolio-healthtracker.vercel.app/)

**Independent public-data learning project. Not affiliated with or endorsed by any other company. No internal company data is used.**

A decision-oriented energy portfolio health tracker built from public disclosures to explore how hyperscaler-scale and data-center energy portfolios can be normalized, monitored, and stress-tested.

## Current case study

**Meta — public disclosures only.**

The current dataset uses publicly available information associated with Meta's disclosed U.S. energy portfolio and related projects. Meta is the first case study, not the limit of the framework.

The model is intentionally company-agnostic so future portfolio modules can incorporate publicly disclosed energy data from other hyperscalers and large data-center operators such as Google, Microsoft, Amazon/AWS, Oracle, CoreWeave, xAI, and others while keeping the same metric definitions and analytical framework.

## What it shows

- Contracted and disclosed capacity by market and technology
- Low / base / high firm-capacity screening scenarios
- COD and delivery-risk exposure by regulatory, interconnection, and construction cause
- Counterparty and market concentration, including HHI
- Cumulative campus-linked supply against publicly disclosed infrastructure scale
- Asset-level data confidence and source lineage
- A ranked **Needs attention** queue for the highest-priority portfolio issues
- Why a defensible annual matched percentage cannot be reconstructed from public announcements alone

## Why I built it

I wanted to understand the mechanics behind a large energy portfolio rather than treat "contracted MW" as a single clean number. Building the model forces explicit decisions about MWac vs MWdc, power vs energy, capacity factor vs firm capacity, COD uncertainty, contract structure, geography, and missing data.

The project intentionally preserves unknown values instead of manufacturing precision.

## Data discipline

Read [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) before the dashboard code. It defines the entities, grain, units, metric formulas, assumptions, source families, refresh cadence, and known limitations.

Key rules include:

- MWdc and MWac are never added together.
- Expected generation is modeled separately from firm-capacity contribution.
- Firm capacity is presented as a screening scenario, not ELCC, UCAP, or ISO-accredited capacity.
- Public campus-scale figures are treated only as directional infrastructure/compute-scale proxies unless electrical peak load is explicitly disclosed.
- Annual matching remains **not defensible** without internal load, settlement, REC/EAC, curtailment, allocation, and temporal-matching data.

## Public source families

The model uses public information from company and utility announcements, EIA Form 860 / EIA 930, NREL, ISO/RTO interconnection queues, and relevant regulatory dockets where available. Source URLs are retained at the asset level.

## Live deployment

The current production deployment is available at:

**https://energy-portfolio-healthtracker.vercel.app/**

The app is deployed from the `main` branch on Vercel.

## Run locally

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Validate the dataset

```bash
python3 scripts/validate.py
```

The validator checks required fields, unit normalization, risk labels, duplicate-count controls, and portfolio-data consistency.

## Repository structure

```text
.
├── index.html
├── styles.css
├── app.js
├── data-loader.js
├── data/
│   ├── core.json
│   ├── assets-1.json
│   ├── assets-2.json
│   ├── assets-3.json
│   └── assets-4.json
├── docs/
│   └── DATA_MODEL.md
├── scripts/
│   └── validate.py
├── vercel.json
├── CHANGELOG.md
└── LICENSE
```

## Roadmap

- Add additional company case studies using the same normalized schema
- Add a company selector for cross-portfolio comparison
- Expand ISO/RTO queue and regulatory milestone coverage
- Improve public-source refresh automation
- Preserve company-specific uncertainty rather than forcing false comparability

## Interview framing

> “I wanted to understand the portfolio properly, so I tried to build a health view from public data. The biggest lesson was how many judgment calls sit inside a number that looks simple, like contracted capacity.”

## License

MIT. See [`LICENSE`](LICENSE).

<!-- deployment-sync: 2026-09-10 -->
