# 🚀 DEPLOY DEL BACKEND EN VERCEL

## Estructura de archivos que necesitás crear:

Creá una nueva carpeta en tu computadora llamada `alquila-py-backend` con estos archivos:

```
alquila-py-backend/
├── api/
│   └── parse-post.js
├── package.json
└── vercel.json
```

## Archivos:

### 1. `api/parse-post.js`
(Descargá: api-parse-post.js y renombralo)

### 2. `package.json`
(Descargá: package-backend.json y renombralo a package.json)

### 3. `vercel.json`
(Descargá: vercel.json)

---

## DEPLOY:

### Opción A: Desde el navegador (más fácil)

1. Comprimí la carpeta `alquila-py-backend` en un ZIP
2. Andá a: https://vercel.com/new
3. Tocá "Browse" y subí el ZIP
4. Vercel lo va a importar automáticamente
5. Antes de deployar, tocá **"Environment Variables"**
6. Agregá:
   - Name: `ANTHROPIC_API_KEY`
   - Value: [tu API key que guardaste]
7. Tocá **"Deploy"**

### Opción B: Con Git (si sabés usar GitHub)

1. Subí la carpeta a un repo nuevo en GitHub
2. En Vercel: "Import Project" → seleccioná tu repo
3. Agregá la variable de entorno `ANTHROPIC_API_KEY`
4. Deploy

---

## Después del deploy:

Vercel te va a dar una URL tipo: `https://alquila-py-backend.vercel.app`

**Guardá esa URL**, la vas a necesitar para actualizar la extensión.

Avisame cuando tengas la URL del deploy!
