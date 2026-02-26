export default async function handler(req, res) {
  // Solo aceptar POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Analizá esta publicación de alquiler de Facebook y extraé la información estructurada.

Texto: ${text}

Respondé SOLO con un JSON válido (sin markdown, sin backticks) con estos campos:
{
  "titulo": "título descriptivo",
  "precio": número sin puntos ni comas,
  "moneda": "Gs" o "USD",
  "ciudad": "nombre de la ciudad",
  "barrio": "nombre del barrio si está",
  "tipo": "casa" | "departamento" | "duplex" | "local_comercial" | "pieza",
  "dormitorios": número o null,
  "banos": número o null,
  "descripcion": "resumen breve",
  "telefono": "número de teléfono si está, sin espacios ni guiones"
}`
        }]
      })
    });

    const data = await response.json();
    const content = data.content[0].text.trim();
    
    // Limpiar posibles backticks
    const cleanJson = content.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    
    return res.status(200).json({ success: true, data: parsed });
    
  } catch (error) {
    console.error('Error parsing:', error);
    return res.status(500).json({ error: 'Failed to parse post', details: error.message });
  }
}
