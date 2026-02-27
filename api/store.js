// api/store.js
// Almacenamiento temporal en memoria (se resetea con cada deploy, suficiente para uso personal)
const store = {};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POST: guardar datos y devolver un ID
  if (req.method === 'POST') {
    const id = Math.random().toString(36).substring(2, 10);
    store[id] = { data: req.body, timestamp: Date.now() };
    // Limpiar entradas viejas (más de 1 hora)
    for (const key in store) {
      if (Date.now() - store[key].timestamp > 3600000) delete store[key];
    }
    return res.status(200).json({ id });
  }

  // GET: recuperar datos por ID
  if (req.method === 'GET') {
    const { id } = req.query;
    if (!id || !store[id]) {
      return res.status(404).json({ error: 'No data found' });
    }
    const data = store[id].data;
    delete store[id]; // borrar después de leer
    return res.status(200).json({ data });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
