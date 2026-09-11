const assert=require('node:assert/strict');
const {context,messages}=require('../ai-context.js');
const rows=Array.from({length:8},(_,i)=>({asset_name:'Asset '+i,source_url:'https://example.com/'+i,count_in_normalized_capacity:i!==7,capacity_mw_ac:100,market:'MISO',technology:'Solar',status:'Development',cod_year:i?2030:null,cod_label:'2030',risk:{construction:i===3?'high':'low'}}));
const app={state:{scope:'committed',market:'all',tech:'all',risk:'all',scenario:'base'},filterAssets:()=>rows,firmMW:()=>10,health:()=>({score:60})};
const c=context(app);assert.equal(c.facts.normalized_mw_ac,700);assert.equal(c.facts.assets.length,6);assert.equal(c.facts.assets[0].name,'Asset 3');assert.equal(c.sources[0].name,'Asset 3');assert.equal(c.facts.screening_firm_mw,70);
assert.equal(messages(c,'brief').length,2);assert.throws(()=>messages(c,'unknown'));
app.state.market='MISO';assert.notEqual(context(app).key,c.key);
app.filterAssets=()=>[];assert.equal(context(app).facts.health,null);assert.deepEqual(context(app).sources,[]);
console.log('AI grounding checks passed: normalized totals, priority selection, references, tasks, stale view and empty data.');
