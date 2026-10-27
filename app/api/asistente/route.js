import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Asistente de FARO: recibe una pregunta y un resumen de finanzas, y responde con Claude.
export async function POST(request) {
  try {
    const clave = request.headers.get('x-faro-clave');
    const esperada = process.env.FARO_GASTO_KEY;
    if (!esperada || clave !== esperada)
      return NextResponse.json({ ok: false, error: 'Clave incorrecta' }, { status: 401 });

    const body = await request.json();
    const pregunta = typeof body?.pregunta === 'string' ? body.pregunta.slice(0, 500) : '';
    const resumen = typeof body?.resumen === 'string' ? body.resumen.slice(0, 6000) : '';
    if (!pregunta.trim()) return NextResponse.json({ ok: false, error: 'Pregunta vacía' }, { status: 400 });

    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) return NextResponse.json({ ok: false, error: 'Falta ANTHROPIC_API_KEY en Vercel' }, { status: 500 });

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-5-5',
        max_tokens: 600,
        system: 'Eres el asistente de finanzas personales de FARO. Responde en español chileno, claro y breve, usando solo los datos del resumen. Si falta un dato, dilo. Los montos son en pesos chilenos.',
        messages: [{ role: 'user', content: `Resumen de mis finanzas:\n${resumen}\n\nPregunta: ${pregunta}` }],
      }),
    });
    const j = await r.json();
    const texto = (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
    if (!r.ok || !texto) return NextResponse.json({ ok: false, error: 'IA: ' + (j?.error?.message || ('HTTP ' + r.status)) }, { status: 502 });
    return NextResponse.json({ ok: true, respuesta: texto });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
