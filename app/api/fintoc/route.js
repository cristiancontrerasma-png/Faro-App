import { NextResponse } from 'next/server';

const FINTOC_API = 'https://api.fintoc.com/v1';

const PAYMENT_KEYWORDS = {
  enel:['enel','enelchile'],aguas_andinas:['aguas andinas'],metrogas:['metrogas'],
  entel:['entel'],vtr:['vtr'],scotiabank:['scotiabank','dividendo'],gastos_comunes:['gastos comunes'],
};
function detectarCompromiso(d){const desc=(d||'').toLowerCase();for(const[k,kws]of Object.entries(PAYMENT_KEYWORDS)){if(kws.some(kw=>desc.includes(kw)))return k;}return null;}

// Intercambia el exchange_token del widget por el link_token definitivo (solo se entrega aquí).
async function intercambiar(exchangeToken, headers){
  const r=await fetch(`${FINTOC_API}/links/exchange?exchange_token=${encodeURIComponent(exchangeToken)}`,{headers});
  const d=await r.json();
  return {token:d.link_token||'', raw:d};
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
  const exchangeToken=searchParams.get('exchange_token');
  const headers={'Authorization':secretKey,'Content-Type':'application/json','Accept':'application/json'};
  try{
    if(action==='movements'){
      if(!linkToken&&exchangeToken){
        const ex=await intercambiar(exchangeToken,headers);
        if(!ex.token)return NextResponse.json({ok:false,error:'No pude intercambiar el token del banco',raw:ex.raw});
        linkToken=ex.token;
      }
      if(!linkToken)return NextResponse.json({ok:false,error:'Falta link_token o exchange_token'},{status:400});
      const mv=await getMovements(linkToken,headers);
      if(mv.error)return NextResponse.json({ok:false,error:mv.error,raw:mv.raw});
      return NextResponse.json({ok:true,data:mv.data,link_token:linkToken});
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
