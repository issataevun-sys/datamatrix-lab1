/**
 * Data Matrix Lab — Cloudflare Worker API proxy
 * The only upstream is NAQTY ONIM's verified /api/v3/check endpoint.
 * Never log, cache, store or commit real Data Matrix strings.
 *
 * Deploy as a Cloudflare Worker and copy the workers.dev URL into
 * "Адрес проверки" in Data Matrix Lab.
 */
const UPSTREAM = 'https://mobile-app.prod.markirovka.ismet.kz/api/v3/check';
const ALLOWED_ORIGINS = new Set([
  'https://issataevun-sys.github.io',
  'https://raw.githack.com',
  'https://rawgit.com'
]);
function cors(origin) {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : 'null',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '600',
    'Vary': 'Origin'
  };
}
function json(value, status, origin) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control':'no-store', ...cors(origin) }
  });
}
export default {
  async fetch(request) {
    const route=new URL(request.url).pathname;
    // Health check without real codes; reports only transport status.
    if (request.method==='GET' && route==='/health') {
      const ctrl=new AbortController();
      const timeout=setTimeout(()=>ctrl.abort(),8000);
      try{
        const upstream=await fetch('https://mobile-app.prod.markirovka.ismet.kz/',{
          method:'HEAD',signal:ctrl.signal,redirect:'manual'
        });
        return new Response(JSON.stringify({worker:'ok',upstreamHttpStatus:upstream.status}),{
          headers:{'Content-Type':'application/json','Cache-Control':'no-store'}
        });
      }catch(e){
        return new Response(JSON.stringify({
          worker:'ok',upstream:'unreachable',
          diagnostic:String(e?.message||e).slice(0,250),
          cause:String(e?.cause?.message||'').slice(0,250)
        }),{status:502,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
      }finally{clearTimeout(timeout);}
    }
    if (request.method==='GET' && route==='/probe') {
      // Synthetic test only: no real pack code is sent.
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),10000);
      try {
        const response=await fetch(UPSTREAM,{
          method:'POST',
          headers:{'Content-Type':'application/json','Accept':'application/json'},
          body:JSON.stringify({
            code:'00000000000000000000000000000',
            codeType:'data_matrix',mode:'SCAN',persistScanResult:false
          }),
          signal:controller.signal,
          redirect:'manual'
        });
        const data=await response.json().catch(()=>null);
        return new Response(JSON.stringify({
          worker:'ok',postHttpStatus:response.status,
          upstreamErrorCode:data?.errorCode||null,
          upstreamCategory:data?.category||null,
          redirected:response.status>=300&&response.status<400
        }),{headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
      }catch(e){
        return new Response(JSON.stringify({
          worker:'ok',post:'failed',name:e?.name||null,
          diagnostic:String(e?.message||e).slice(0,250),
          cause:String(e?.cause?.message||'').slice(0,250)
        }),{status:502,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
      }finally{clearTimeout(timer)}
    }
    const origin = request.headers.get('Origin') || '';
    // Only calls from our test UI; no arbitrary cross-origin browser usage.
    if (!ALLOWED_ORIGINS.has(origin)) return json({error:'origin_not_allowed'},403,origin);
    if (request.method === 'OPTIONS') return new Response(null,{status:204,headers:cors(origin)});
    if (request.method !== 'POST') return json({error:'method_not_allowed'},405,origin);
    if ((Number(request.headers.get('content-length'))||0)>2048) return json({error:'request_too_large'},413,origin);
    if (!request.headers.get('content-type')?.toLowerCase().includes('application/json'))
      return json({error:'content_type_required'},415,origin);
    let input;
    try { input = await request.json(); } catch { return json({error:'bad_json'},400,origin); }
    const code = input && typeof input.code === 'string' ? input.code : '';
    // Only 21-character tobacco identification codes or full 29-character tobacco codes, excluding other product groups.
    if (![21,29].includes(code.length) || !/^\d{14}[\s\S]{7,15}$/.test(code))
      return json({error:'expected_21_or_29_character_tobacco_code'},400,origin);
    const controller = new AbortController();
    const timer = setTimeout(()=>controller.abort(),13000);
    try {
      const result = await fetch(UPSTREAM,{
        method:'POST',
        headers: {'Content-Type':'application/json','Accept':'application/json'},
        body:JSON.stringify({code,codeType:'data_matrix',mode:'SCAN',persistScanResult:false}),
        signal:controller.signal,
        redirect:'manual'
      });
      const responseBody = await result.text();
      if(responseBody.length>120000) return json({error:'upstream_response_too_large'},502,origin);
      let data; try{data=JSON.parse(responseBody)}catch{
        return json({error:'upstream_non_json',httpStatus:result.status},502,origin);
      }
      // Status and fields are forwarded verbatim so UI can map new schemas.
      return json({httpStatus:result.status, data},200,origin);
    } catch(e) {
      return json({error:e.name==='AbortError'?'upstream_timeout':'upstream_unreachable',diagnostic:String(e?.message||e).slice(0,250),cause:String(e?.cause?.message||'').slice(0,250)},502,origin);
    } finally {clearTimeout(timer);}
  }
};