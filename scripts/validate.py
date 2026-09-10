#!/usr/bin/env python3
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
core=json.loads((ROOT/'data'/'core.json').read_text())
parts=[json.loads((ROOT/'data'/f'assets-{i}.json').read_text()) for i in range(1,5)]
DATA={**core,'assets':[a for part in parts for a in part]}
errors=[]; warnings=[]; ids=set(); allowed={'low','medium','high','unknown'}
for a in DATA['assets']:
    aid=a.get('id')
    if not aid: errors.append('Asset missing id')
    elif aid in ids: errors.append(f'Duplicate id: {aid}')
    ids.add(aid)
    for f in ['asset_name','counterparty','market','technology','structure','status','capacity_basis','source_url','source_label']:
        if not a.get(f): errors.append(f'{aid}: missing {f}')
    ac,dc=a.get('capacity_mw_ac'),a.get('capacity_mw_dc')
    if ac is None and dc is None: errors.append(f'{aid}: both AC and DC capacity missing')
    if a.get('count_in_normalized_capacity') and ac is None: errors.append(f'{aid}: normalized without MWac')
    if a.get('structure','').lower().startswith('optional') and a.get('count_in_contracted_view'): errors.append(f'{aid}: optional right counted as contracted')
    for dim in ['regulatory','interconnection','construction']:
        if a.get('risk',{}).get(dim) not in allowed: errors.append(f'{aid}: invalid {dim} risk')
sc=DATA.get('assumptions',{}).get('firm_scenarios',{})
for tech in ['Nuclear','Natural Gas CCGT','Geothermal','Battery','Renewable / undisclosed']:
    if tech not in sc: errors.append(f'missing firm scenario for {tech}')
    else:
        vals=[sc[tech].get(k) for k in ['low','base','high']]
        if any(v is None or not 0<=v<=1 for v in vals): errors.append(f'invalid firm scenario values for {tech}')
        if vals!=sorted(vals): errors.append(f'firm scenario not monotonic for {tech}')
solar=DATA.get('assumptions',{}).get('solar_firm_scenarios_by_market',{})
if 'default' not in solar: errors.append('missing default solar firm scenario')
w=DATA.get('assumptions',{}).get('health_score_weights',{})
if abs(sum(w.values())-1)>1e-9: errors.append('health score weights must sum to 1')
for c in DATA['campuses']:
    if c.get('load_proxy_mw',0)<=0: errors.append(f"{c.get('id')}: non-positive load proxy")
for a in DATA['assets']:
    if a.get('campus_link') not in {c['id'] for c in DATA['campuses']}|{'portfolio'}: errors.append(f"{a['id']}: invalid campus link")
print(f"Validated v2: {len(DATA['assets'])} assets, {len(DATA['campuses'])} campuses, {len(sc)} technology scenario sets.")
for x in warnings: print('WARNING:',x)
if errors:
    for x in errors: print('ERROR:',x)
    raise SystemExit(1)
print('OK: no validation errors.')
