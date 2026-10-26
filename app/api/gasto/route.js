import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SB_URL = 'https://tiayaaxtiyqobmhojhgm.supabase.co';
const TABLA = 'gastos_pendientes';

function sbHeaders() {
  const key = process.env.SUPABASE_SERVICE_KEY;
  return { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
}

function claveOk(clave) {
  const esperada = process.env.FARO_GASTO_KEY;
  return !!esperada && typeof clave === 'string' && clave === esperada;
}

// Alerta de WhatsApp (CallMeBot). Usa variables de entorno de Vercel; si no existen, no hace nada.
async function avisarWhatsApp(monto, comercio) {
  const phone = process.env.CALLMEBOT_PHONE;
  const apikey = process.env.CALLMEBOT_KEY;
  if (!phone || !apikey) return;
  const texto = `💳 Compra FARO: $${Number(monto).toLocaleString('es-CL')} en ${comercio || 'comercio sin nombre'}`;
  try {
    await fetch(`https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(texto)}&apikey=${encodeURIComponent(apikey)}`);
  } catch {}
}

// El atajo de Wallet envía: { monto, comercio } con el header x-faro-clave
export async function POST(request) {
  try {
    if (!claveOk(request.headers.get('x-faro-clave')))
      return NextResponse.json({ ok: false, error: 'Clave incorrecta' }, { status: 401 });
    const body = await request.json();
    const monto = Math.round(Number(String(body?.monto ?? '').replace(/[^0-9.]/g, '')));
    const comercio = String(body?.comercio ?? '').slice(0, 80);
    if (!monto || monto <= 0) return NextResponse.json({ ok: false, error: 'Monto inválido' }, { status: 400 });
    const r = await fetch(`${SB_URL}/rest/v1/${TABLA}`, {
      method: 'POST',
      headers: { ...sbHeaders(), Prefer: 'return=minimal' },
      body: JSON.stringify({ monto, comercio, creado: new Date().toISOString() }),
    });
    if (!r.ok) return NextResponse.json({ ok: false, error: 'No se pudo guardar' }, { status: 502 });
    await avisarWhatsApp(monto, comercio);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

// La app lee las compras pendientes y las borra del servidor una vez recibidas
export async function GET(request) {
  try {
    const clave = new URL(request.url).searchParams.get('clave');
    if (!claveOk(clave)) return NextResponse.json({ ok: false, error: 'Clave incorrecta' }, { status: 401 });
    const r = await fetch(`${SB_URL}/rest/v1/${TABLA}?select=*&order=creado.asc`, { headers: sbHeaders() });
    const rows = await r.json();
    if (!Array.isArray(rows)) return NextResponse.json({ ok: false, error: 'Error al leer' }, { status: 502 });
    if (rows.length) {
      const ids = rows.map(x => x.id).join(',');
      await fetch(`${SB_URL}/rest/v1/${TABLA}?id=in.(${ids})`, { method: 'DELETE', headers: sbHeaders() });
    }
    return NextResponse.json({ ok: true, data: rows });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
