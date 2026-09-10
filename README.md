# Meta Energy Portfolio Tracker

**Independent public-data learning project. Not affiliated with or endorsed by Meta. No internal Meta data is used.**

A decision-oriented energy portfolio health tracker built from public disclosures to explore how a hyperscaler-scale portfolio can be normalized, monitored, and stress-tested.

## What it shows

- Contracted and disclosed capacity by market and technology
- Low / base / high firm-capacity screening scenarios
- COD and delivery-risk exposure by regulatory, interconnection, and construction cause
- Counterparty and market concentration, including HHI
- Cumulative campus-linked supply against the public scale of Hyperion and Prometheus
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
- Hyperion and Prometheus public GW figures are treated only as directional compute-scale proxies, not disclosed electrical peak load.
- Annual matching remains **not defensible** without internal load, settlement, REC/EAC, curtailment, allocation, and temporal-matching data.

## Public source families

The model uses public information from company and utility announcements, EIA Form 860 / EIA 930, NREL, ISO/RTO interconnection queues, and relevant regulatory dockets where available. Source URLs are retained at the asset level.

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

## Deploy

The repository is ready for a static Vercel deployment. Import the GitHub repository into Vercel and use the repository root with no build command required.

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

## Interview framing

> “I wanted to understand the portfolio properly, so I tried to build a health view from public data. The biggest lesson was how many judgment calls sit inside a number that looks simple, like contracted capacity.”

## License

MIT. See [`LICENSE`](LICENSE).
