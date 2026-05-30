import { NextResponse } from 'next/server';

const FINTOC_API = 'https://api.fintoc.com/v1';
const SANTANDER_TOKEN = 'link_a61GeEi6KN0qGOmv';
const SCOTIABANK_TOKEN = 'link_7RAkpoIWP2gpGzqO';

const PAYMENT_KEYWORDS = {
  enel:['enel','enelchile'],aguas_andinas:['aguas andinas'],metrogas:['metrogas'],
  entel:['entel'],vtr:['vtr'],scotiabank:['scotiabank','dividendo'],gastos_comunes:['gastos comunes'],
};

function detectarCompromiso(d){const desc=(d||'').toLowerCase();for(const[k,kws]of Object.entries(PAYMENT_KEYWORDS)){if(kws.some(kw=>desc.includes(kw)))return k;}return null;}

async function getMovements(linkToken, headers){
  const since=new Date();since.setDate(since.getDate()-60);const sinceStr=since.toISOString().split('T')[0];
  const ar=await fetch(`${FINTOC_API}/links/${linkToken}/accounts`,{headers});
  const accounts=await ar.json();if(!Array.isArray(accounts))return[];
  const todos=[];
  for(const account of accounts){
    const mr=await fetch(`${FINTOC_API}/links/${linkToken}/accounts/${account.id}/movements?since=${sinceStr}`,{headers});
    const movs=await mr.json();
    if(Array.isArray(movs))movs.forEach(m=>todos.push({id:m.id,fecha:m.post_date||m.transaction_date,descripcion:m.description||'',monto:Math.abs(m.amount),tipo:m.amount<0?'cargo':'abono',banco:account.institution?.name||'',compromiso:detectarCompromiso(m.description)}));
  }
  return todos;
}

export async function GET(request) {
  const {searchParams}=new URL(request.url);
  const action=searchParams.get('action');
  const linkToken=searchParams.get('link_token');
  const headers={'Authorization':process.env.FINTOC_SECRET_KEY,'Content-Type':'application/json'};
  try{
    if(action==='movements'){
      const token=linkToken||SANTANDER_TOKEN;
      const todos=await getMovements(token,headers);
      return NextResponse.json({ok:true,data:todos});
    }
    if(action==='all_movements'){
      const s=await getMovements(SANTANDER_TOKEN,headers);
      const sc=await getMovements(SCOTIABANK_TOKEN,headers);
      return NextResponse.json({ok:true,data:[...s,...sc]});
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
    if(token)return NextResponse.json({ok:true,widget_token:token});
    return NextResponse.json({ok:false,error:'No token',raw:data});
  }catch(e){return NextResponse.json({ok:false,error:e.message},{status:500});}
}
