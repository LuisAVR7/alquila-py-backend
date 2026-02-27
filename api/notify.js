// api/notify.js
// Endpoint que recibe eventos de Supabase y envía emails a la lista de espera

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { type, record, old_record } = req.body;

    // Detectar qué cambió
    const propiedadId = record?.id;
    const titulo = record?.titulo || 'Propiedad';
    const ciudad = record?.ciudad || '';
    const precio = record?.precio;
    const precioAnterior = old_record?.precio;
    const activo = record?.activo;
    const activoAnterior = old_record?.activo;

    // Determinar el tipo de notificación
    let asunto = '';
    let mensajeHtml = '';
    let notificar = false;

    // Caso 1: propiedad se liberó (pasó de FALSE a TRUE)
    if (activo === true && activoAnterior === false) {
      notificar = true;
      asunto = `🏠 ¡${titulo} está disponible nuevamente!`;
      mensajeHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f97316; padding: 20px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 22px;">🏠 ¡Buenas noticias!</h1>
          </div>
          <div style="background: #fff7ed; padding: 24px; border: 1px solid #fed7aa; border-radius: 0 0 12px 12px;">
            <p style="color: #9a3412; font-size: 16px; margin-top: 0;">
              La propiedad que te interesaba está <strong>disponible nuevamente</strong>:
            </p>
            <div style="background: white; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <h2 style="color: #1e293b; margin: 0 0 8px 0; font-size: 18px;">${titulo}</h2>
              <p style="color: #64748b; margin: 0;">📍 ${ciudad}</p>
              ${precio ? `<p style="color: #16a34a; font-weight: bold; font-size: 18px; margin: 8px 0 0 0;">💰 ${precio.toLocaleString()} Gs/mes</p>` : ''}
            </div>
            <a href="https://alquipy-pwa-developm-r2cs.bolt.host/#propiedad/${propiedadId}" 
               style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
              Ver propiedad →
            </a>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">
              Recibiste este email porque te anotaste en la lista de espera de Alquilá.PY.<br>
              <a href="https://alquipy-pwa-developm-r2cs.bolt.host" style="color: #94a3b8;">Alquilá.PY</a>
            </p>
          </div>
        </div>
      `;
    }

    // Caso 2: bajó el precio
    if (precio && precioAnterior && precio < precioAnterior) {
      notificar = true;
      const baja = precioAnterior - precio;
      const porcentaje = Math.round((baja / precioAnterior) * 100);
      asunto = `📉 Bajó el precio de ${titulo}`;
      mensajeHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #16a34a; padding: 20px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 22px;">📉 ¡Bajó el precio!</h1>
          </div>
          <div style="background: #f0fdf4; padding: 24px; border: 1px solid #bbf7d0; border-radius: 0 0 12px 12px;">
            <p style="color: #14532d; font-size: 16px; margin-top: 0;">
              Una propiedad de tu lista de espera <strong>bajó el precio un ${porcentaje}%</strong>:
            </p>
            <div style="background: white; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <h2 style="color: #1e293b; margin: 0 0 8px 0; font-size: 18px;">${titulo}</h2>
              <p style="color: #64748b; margin: 0;">📍 ${ciudad}</p>
              <div style="display: flex; align-items: center; gap: 12px; margin-top: 8px;">
                <span style="color: #94a3b8; text-decoration: line-through; font-size: 16px;">${precioAnterior.toLocaleString()} Gs</span>
                <span style="color: #16a34a; font-weight: bold; font-size: 20px;">${precio.toLocaleString()} Gs/mes</span>
              </div>
              <p style="color: #16a34a; font-size: 13px; margin: 4px 0 0 0;">¡Ahorrás ${baja.toLocaleString()} Gs por mes!</p>
            </div>
            <a href="https://alquipy-pwa-developm-r2cs.bolt.host/#propiedad/${propiedadId}" 
               style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
              Ver propiedad →
            </a>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">
              Recibiste este email porque te anotaste en la lista de espera de Alquilá.PY.<br>
              <a href="https://alquipy-pwa-developm-r2cs.bolt.host" style="color: #94a3b8;">Alquilá.PY</a>
            </p>
          </div>
        </div>
      `;
    }

    if (!notificar) {
      return res.status(200).json({ message: 'No notification needed' });
    }

    // Buscar todos los interesados en lista de espera para esta propiedad
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    const listaResponse = await fetch(
      `${supabaseUrl}/rest/v1/lista_espera?propiedad_id=eq.${propiedadId}&email=not.is.null`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        }
      }
    );

    const interesados = await listaResponse.json();

    if (!interesados || interesados.length === 0) {
      return res.status(200).json({ message: 'No interested users found' });
    }

    // Enviar email a cada interesado usando Resend
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const emails = interesados.map((i: any) => i.email).filter(Boolean);

    // También notificar al admin
    emails.push('luichivelazquez@gmail.com');

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Alquilá.PY <onboarding@resend.dev>',
        to: emails,
        subject: asunto,
        html: mensajeHtml,
      }),
    });

    if (!emailResponse.ok) {
      const err = await emailResponse.json();
      throw new Error(JSON.stringify(err));
    }

    return res.status(200).json({ 
      success: true, 
      notificados: emails.length,
      tipo: activo === true && activoAnterior === false ? 'liberacion' : 'baja_precio'
    });

  } catch (error) {
    console.error('Error en notify:', error);
    return res.status(500).json({ error: error.message });
  }
}
