import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
const port=34621;const child=spawn(process.execPath,['server.js'],{cwd:new URL('..',import.meta.url),env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function req(path,opts){const r=await fetch(`http://127.0.0.1:${port}${path}`,opts);let j;try{j=await r.json()}catch{j=null}return{r,j};}
try{await sleep(500);
let x=await req('/api/health');assert.equal(x.r.status,200);assert.equal(x.j.ok,true);
x=await req('/api/programs');assert.equal(x.r.status,200);assert.ok(x.j.programs.length>=2);
x=await req('/api/check-access',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({programId:'dogclub',holdingsUsd:500,heldDays:14})});assert.equal(x.r.status,200);assert.equal(x.j.tier.name,'Plus');
x=await req('/api/allocate',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({programId:'dogclub',monthlyFeesSol:100})});assert.equal(x.r.status,200);assert.ok(x.j.membershipPoolSol>0);assert.ok(Array.isArray(x.j.allocations));
const ticker='T'+Date.now().toString().slice(-5);x=await req('/api/programs',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:'Test Membership',ticker,feeSharePct:30,tiers:[{name:'Member',minHoldUsd:50,minDays:1},{name:'Plus',minHoldUsd:250,minDays:7}],benefits:[{name:'Gas Pass',category:'onchain',monthlyCostSol:5,description:'Sponsored gas.'}]})});assert.equal(x.r.status,201);assert.ok(x.j.receipt.fingerprint);console.log('MEMBERSHIP smoke tests passed');
}finally{child.kill('SIGTERM');}
