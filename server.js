import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, 'public');
const STORE = path.join(__dirname, 'data', 'store.json');
const PORT = Number(process.env.PORT || 3000);
const rateState = new Map();

function securityHeaders(res){
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy',"default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'");
}
function json(res,status,data){securityHeaders(res);res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(data));}
function readStore(){return JSON.parse(fs.readFileSync(STORE,'utf8'));}
function saveStore(data){fs.writeFileSync(STORE,JSON.stringify(data,null,2));}
function hashReceipt(value){return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');}
function clean(value,max=80){return String(value ?? '').replace(/[<>]/g,'').trim().slice(0,max);}
function slug(value){return clean(value,30).toLowerCase().replace(/[^a-z0-9]+/g,'').slice(0,24);}
function rateLimit(req,res){const ip=req.socket.remoteAddress||'unknown';const now=Date.now();const recent=(rateState.get(ip)||[]).filter(t=>now-t<60000);if(recent.length>=100){json(res,429,{error:'rate_limited'});return false;}recent.push(now);rateState.set(ip,recent);return true;}
function readBody(req){return new Promise((resolve,reject)=>{let body='';req.on('data',chunk=>{body+=chunk;if(body.length>30000){reject(new Error('too_large'));req.destroy();}});req.on('end',()=>{try{resolve(body?JSON.parse(body):{});}catch{reject(new Error('bad_json'));}});});}
function normalizeTiers(input){if(!Array.isArray(input)||input.length<1||input.length>4)throw new Error('invalid_tiers');return input.map((t,i)=>{const minHoldUsd=Number(t.minHoldUsd),minDays=Number(t.minDays);if(!Number.isFinite(minHoldUsd)||minHoldUsd<0||minHoldUsd>1000000||!Number.isFinite(minDays)||minDays<0||minDays>3650)throw new Error('invalid_tier_rules');return{id:slug(t.name)||`tier${i+1}`,name:clean(t.name,24)||`Tier ${i+1}`,minHoldUsd:+minHoldUsd.toFixed(2),minDays:Math.floor(minDays),multiplier:1};}).sort((a,b)=>a.minHoldUsd-b.minHoldUsd||a.minDays-b.minDays);}
function normalizeBenefits(input){if(!Array.isArray(input)||input.length<1||input.length>8)throw new Error('invalid_benefits');return input.map((b,i)=>{const cost=Number(b.monthlyCostSol);if(!Number.isFinite(cost)||cost<0||cost>100000)throw new Error('invalid_benefit_cost');return{id:slug(b.name)||`benefit${i+1}`,name:clean(b.name,40),category:clean(b.category,24)||'membership',monthlyCostSol:+cost.toFixed(3),description:clean(b.description,180)};});}
function eligibility(program,holdingsUsd,heldDays){const qualified=program.tiers.filter(t=>holdingsUsd>=t.minHoldUsd&&heldDays>=t.minDays);return qualified.length?qualified[qualified.length-1]:null;}

http.createServer(async(req,res)=>{
  if(!rateLimit(req,res))return;
  const url=new URL(req.url,'http://localhost');

  if(req.method==='GET'&&url.pathname==='/api/health')return json(res,200,{ok:true,service:'membership-pad'});
  if(req.method==='GET'&&url.pathname==='/api/programs')return json(res,200,{programs:readStore().programs});
  if(req.method==='GET'&&url.pathname.startsWith('/api/programs/')){const id=clean(url.pathname.split('/').pop(),40);const program=readStore().programs.find(p=>p.id===id);return program?json(res,200,{program}):json(res,404,{error:'not_found'});}

  if(req.method==='POST'&&url.pathname==='/api/check-access'){
    try{const body=await readBody(req),store=readStore(),program=store.programs.find(p=>p.id===clean(body.programId,40));if(!program)return json(res,404,{error:'not_found'});const holdingsUsd=Number(body.holdingsUsd),heldDays=Number(body.heldDays);if(!Number.isFinite(holdingsUsd)||holdingsUsd<0||holdingsUsd>100000000||!Number.isFinite(heldDays)||heldDays<0||heldDays>3650)return json(res,400,{error:'invalid_inputs'});const tier=eligibility(program,holdingsUsd,heldDays);return json(res,200,{eligible:Boolean(tier),tier,programId:program.id,holdingsUsd,heldDays,simulation:true});}catch(e){return json(res,e.message==='too_large'?413:400,{error:e.message});}
  }

  if(req.method==='POST'&&url.pathname==='/api/allocate'){
    try{const body=await readBody(req),store=readStore(),program=store.programs.find(p=>p.id===clean(body.programId,40));if(!program)return json(res,404,{error:'not_found'});const fees=Number(body.monthlyFeesSol);if(!Number.isFinite(fees)||fees<0||fees>1000000)return json(res,400,{error:'invalid_fees'});const pool=fees*program.feeSharePct/100,totalCost=program.benefits.reduce((a,b)=>a+b.monthlyCostSol,0),coverage=totalCost?Math.min(1,pool/totalCost):1;const allocations=program.benefits.map(b=>({benefitId:b.id,name:b.name,neededSol:b.monthlyCostSol,fundedSol:+(b.monthlyCostSol*coverage).toFixed(4),fundedPct:+(coverage*100).toFixed(1)}));return json(res,200,{programId:program.id,monthlyFeesSol:fees,membershipPoolSol:+pool.toFixed(4),benefitCostSol:+totalCost.toFixed(4),coveragePct:+(coverage*100).toFixed(1),surplusSol:+Math.max(0,pool-totalCost).toFixed(4),allocations,simulation:true});}catch(e){return json(res,400,{error:e.message});}
  }

  if(req.method==='POST'&&url.pathname==='/api/programs'){
    try{
      const body=await readBody(req),store=readStore();
      const id=slug(body.ticker||body.name);
      if(!id)return json(res,400,{error:'invalid_identity'});
      if(store.programs.some(p=>p.id===id))return json(res,409,{error:'program_exists'});
      const feeSharePct=Number(body.feeSharePct);
      if(!Number.isFinite(feeSharePct)||feeSharePct<5||feeSharePct>80)return json(res,400,{error:'fee_share_out_of_range'});
      const tiers=normalizeTiers(body.tiers),benefits=normalizeBenefits(body.benefits);
      const program={id,name:clean(body.name,50),ticker:clean(body.ticker,12).toUpperCase(),feeSharePct:+feeSharePct.toFixed(2),monthlyFeesSol:0,members:0,tiers,benefits};
      store.programs.push(program);
      const receipt={type:'membership_program',programId:id,feeSharePct:program.feeSharePct,tiers,benefits:benefits.map(({id,name,monthlyCostSol})=>({id,name,monthlyCostSol})),createdAt:new Date().toISOString(),simulation:true};
      receipt.fingerprint=hashReceipt(receipt);store.events.push(receipt);saveStore(store);
      return json(res,201,{program,receipt});
    }catch(e){return json(res,e.message==='too_large'?413:400,{error:e.message});}
  }

  if(req.method==='GET'&&url.pathname.startsWith('/api/receipts/')){const id=clean(url.pathname.split('/').pop(),80);const event=readStore().events.find(e=>e.fingerprint===id);return event?json(res,200,{receipt:event}):json(res,404,{error:'not_found'});}

  let rel=url.pathname==='/'?'/index.html':url.pathname;rel=path.normalize(rel).replace(/^\.\.(\/|\\|$)/,'');const file=path.join(PUBLIC,rel);if(!file.startsWith(PUBLIC)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){securityHeaders(res);res.writeHead(404);return res.end('Not found');}
  securityHeaders(res);const ext=path.extname(file);const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'};res.writeHead(200,{'content-type':types[ext]||'application/octet-stream','cache-control':ext==='.html'?'no-cache':'public, max-age=3600'});fs.createReadStream(file).pipe(res);
}).listen(PORT,()=>console.log(`MEMBERSHIP listening on :${PORT}`));
