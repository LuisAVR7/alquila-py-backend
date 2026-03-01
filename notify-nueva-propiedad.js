// api/notify-nueva-propiedad.js
// Webhook de Supabase: se dispara cuando se inserta una nueva propiedad verificada
// O cuando una propiedad pasa a verificado=true

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { record, old_record } = req.body;

    // Solo notificar cuando una propiedad pasa a verificado=true
    const recienVerificada = record?.verificado === true && old_record?.verificado === false;
    if (!recienVerificada) {
      return res.status(200).json({ message: 'No notification needed' });
    }

    const { id, titulo, ciudad, barrio, tipo, precio, moneda, habitaciones, requisitos, acepta_mascotas } = record;

    // Buscar alertas activas que coincidan
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    const alertasResponse = await fetch(
      `${supabaseUrl}/rest/v1/alertas_inquilino?activo=eq.true&email=not.is.null`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        }
      }
    );

    const alertas = await alertasResponse.json();
    if (!alertas || alertas.length === 0) {
      return res.status(200).json({ message: 'No active alerts' });
    }

    // Filtrar alertas que coincidan con la propiedad
    const coincidentes = alertas.filter(alerta => {
      if (alerta.ciudad && alerta.ciudad !== ciudad) return false;
      if (alerta.tipo && alerta.tipo !== tipo) return false;
      if (alerta.precio_max && precio > alerta.precio_max) return false;
      if (alerta.habitaciones_min && habitaciones < alerta.habitaciones_min) return false;
      if (alerta.sin_garante && requisitos?.garante !== 'no') return false;
      if (alerta.sin_garantia && requisitos?.garantia !== 'no') return false;
      if (alerta.mascotas && acepta_mascotas !== 'si') return false;
      return true;
    });

    if (coincidentes.length === 0) {
      return res.status(200).json({ message: 'No matching alerts' });
    }

    const precioFormateado = moneda === 'USD'
      ? `USD ${precio.toLocaleString()}`
      : `${precio.toLocaleString()} Gs`;

    const mensajeHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #7c3aed; padding: 20px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 22px;">🔔 ¡Nueva propiedad disponible!</h1>
        </div>
        <div style="background: #faf5ff; padding: 24px; border: 1px solid #e9d5ff; border-radius: 0 0 12px 12px;">
          <p style="color: #6b21a8; font-size: 16px; margin-top: 0;">
            Encontramos una propiedad que coincide con tus alertas:
          </p>
          <div style="background: white; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #e9d5ff;">
            <h2 style="color: #1e293b; margin: 0 0 8px 0; font-size: 18px;">${titulo}</h2>
            <p style="color: #64748b; margin: 0 0 4px 0;">📍 ${ciudad}${barrio ? ` · ${barrio}` : ''}</p>
            <p style="color: #64748b; margin: 0 0 4px 0; text-transform: capitalize;">🏠 ${tipo?.replace('_', ' ')}</p>
            ${habitaciones ? `<p style="color: #64748b; margin: 0 0 4px 0;">🛏 ${habitaciones} habitación${habitaciones > 1 ? 'es' : ''}</p>` : ''}
            <p style="color: #7c3aed; font-weight: bold; font-size: 20px; margin: 8px 0 0 0;">💰 ${precioFormateado}/mes</p>
          </div>
          <a href="https://alquipy-pwa-developm-r2cs.bolt.host/#propiedad/${id}" 
             style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
            Ver propiedad →
          </a>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">
            Recibiste este email porque tenés alertas premium activas en Alquilá.PY.<br>
            <a href="https://alquipy-pwa-developm-r2cs.bolt.host" style="color: #94a3b8;">Alquilá.PY</a>
          </p>
        </div>
      </div>
    `;

    // Enviar a cada coincidente individualmente (para personalizar en el futuro)
    const emails = coincidentes.map(a => a.email).filter(Boolean);

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Alquilá.PY <onboarding@resend.dev>',
        to: emails,
        subject: `🔔 Nueva propiedad en ${ciudad} que te puede interesar`,
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
    });

  } catch (error) {
    console.error('Error en notify-nueva-propiedad:', error);
    return res.status(500).json({ error: error.message });
  }
}
