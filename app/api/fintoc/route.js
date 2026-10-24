import { NextResponse } from 'next/server';

const FINTOC_API = 'https://api.fintoc.com/v1';

const PAYMENT_KEYWORDS = {
  enel:['enel','enelchile'],aguas_andinas:['aguas andinas'],metrogas:['metrogas'],
  entel:['entel'],vtr:['vtr'],scotiabank:['scotiabank','dividendo'],gastos_comunes:['gastos comunes'],
};
function detectarCompromiso(d){const desc=(d||'').toLowerCase();for(const[k,kws]of Object.entries(PAYMENT_KEYWORDS)){if(kws.some(kw=>desc.includes(kw)))return k;}return null;}

// Busca en cualquier parte del objeto un link_token completo (formato link_..._token_...).
function buscarLinkToken(obj){
  let f='';const w=v=>{if(f)return;if(typeof v==='string'){if(v.startsWith('link_')&&v.includes('_token_'))f=v;}else if(Array.isArray(v))v.forEach(w);else if(v&&typeof v==='object')Object.values(v).forEach(w);};w(obj);return f;
}
// Resuelve el link_token definitivo a partir de un link_intent id (flujo widget de Fintoc).
async function resolverLink(intentId, headers){
  const r=await fetch(`${FINTOC_API}/link_intents/${intentId}`,{headers});
  const d=await r.json();
  const token=buscarLinkToken(d)||d.link_token||d.link?.link_token||'';
  return {token, raw:d};
}

async function getMovements(linkToken, headers){
  const since=new Date();since.setDate(since.getDate()-60);const sinceStr=since.toISOString().split('T')[0];
  const lt=encodeURIComponent(linkToken);
  const ar=await fetch(`${FINTOC_API}/accounts?link_token=${lt}`,{headers});
  const accounts=await ar.json();
  if(!Array.isArray(accounts))return {error:'Fintoc no devolvió cuentas', raw:accounts};
  const todos=[];
  for(const account of accounts){
    const mr=await fetch(`${FINTOC_API}/accounts/${account.id}/movements?link_token=${lt}&since=${sinceStr}&per_page=300`,{headers});
    const movs=await mr.json();
    if(Array.isArray(movs))movs.forEach(m=>todos.push({id:m.id,fecha:m.post_date||m.transaction_date,descripcion:m.description||'',monto:Math.abs(m.amount),tipo:m.amount<0?'cargo':'abono',banco:account.institution?.name||'',compromiso:detectarCompromiso(m.description)}));
  }
  return {data:todos};
}

export async function GET(request) {
  const secretKey=process.env.FINTOC_SECRET_KEY;
  if(!secretKey)return NextResponse.json({ok:false,error:'No key'});
  const {searchParams}=new URL(request.url);
  const action=searchParams.get('action');
  let linkToken=searchParams.get('link_token');
  const intentId=searchParams.get('intent_id');
  const headers={'Authorization':secretKey,'Content-Type':'application/json'};
  try{
    if(action==='movements'){
      if(!linkToken&&intentId){
        const res=await resolverLink(intentId,headers);
        if(!res.token)return NextResponse.json({ok:false,error:'El link aún no está listo en Fintoc',raw:res.raw});
        linkToken=res.token;
      }
      if(!linkToken)return NextResponse.json({ok:false,error:'Falta link_token o intent_id'},{status:400});
      const mv=await getMovements(linkToken,headers);
      if(mv.error)return NextResponse.json({ok:false,error:mv.error,raw:mv.raw});
      return NextResponse.json({ok:true,data:mv.data});
    }
    return NextResponse.json({ok:false,error:'Accion no reconocida'});
  }catch(e){return NextResponse.json({ok:false,error:e.message},{status:500});}
}

export async function POST(request) {
  const secretKey=process.env.FINTOC_SECRET_KEY;
  if(!secretKey)return NextResponse.json({ok:false,error:'No key'});
  try{
    const res=await fetch(`${FINTOC_API}/link_intents`,{method:'POST',headers:{'Authorization':secretKey,'Content-Type':'application/json'},body:JSON.stringify({product:'movements',country:'cl',holder_type:'individual'})});
    const data=await res.json();
    const token=data.widget_token||data.token;
    if(token)return NextResponse.json({ok:true,widget_token:token,intent_id:data.id||null});
    return NextResponse.json({ok:false,error:'No token',raw:data});
  }catch(e){return NextResponse.json({ok:false,error:e.message},{status:500});}
}
