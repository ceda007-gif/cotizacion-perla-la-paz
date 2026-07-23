# Hotel Perla La Paz — Cotización Grupal

Página de cotización grupal (ES/EN) para Hotel Perla La Paz, Tapestry
Collection by Hilton, con panel de administración en `/admin`. Hosting
estático en GitHub Pages; contenido, login e imágenes en Firebase
(Firestore + Authentication + Storage) — mismo patrón que
[Amore.Atelier](https://github.com/ceda007-gif/Amore.Atelier).

## Configuración inicial (una sola vez)

1. **Crear el proyecto de Firebase**
   - Ve a [console.firebase.google.com](https://console.firebase.google.com) → "Agregar proyecto".
   - Actívalo en el plan **Spark (gratis)**.

2. **Activar los 3 servicios que usa el sitio**
   - **Authentication** → pestaña "Sign-in method" → activa **Correo electrónico/contraseña**.
   - **Authentication** → pestaña "Users" → "Agregar usuario": correo `ceda007@gmail.com` y la contraseña que quieras usar para entrar al admin.
   - **Firestore Database** → "Crear base de datos" → cualquier región cercana → modo producción.
   - **Storage** → "Comenzar" → misma región.

3. **Pegar las reglas de seguridad** (ya vienen escritas en este repo)
   - Firestore → pestaña "Reglas" → pega el contenido de [`firestore.rules`](./firestore.rules) → Publicar.
   - Storage → pestaña "Reglas" → pega el contenido de [`storage.rules`](./storage.rules) → Publicar.
   - Sin este paso, Firestore/Storage quedan en modo de prueba (cualquiera podría editar el sitio) o completamente cerrados (nada funciona) — con las reglas de este repo, la lectura es pública y solo `ceda007@gmail.com` puede escribir.

4. **Obtener la configuración pública del proyecto**
   - En la consola de Firebase → ⚙️ (engranaje) → "Configuración del proyecto" → baja hasta "Tus apps" → "Agregar app" → ícono `</>` (Web).
   - Regístrala con cualquier nombre (ej. "Hotel Perla web").
   - Copia el objeto `firebaseConfig` que te muestra (son identificadores públicos, no son secretos).
   - Pégalo en [`js/firebase-init.js`](./js/firebase-init.js) reemplazando los valores `TODO_...`.
   - Súbelo con `git commit` + `git push` (o pídeme a mí que lo haga si me pasas los valores).

5. **Activar GitHub Pages**
   - En este repo → Settings → Pages → "Deploy from a branch" → branch `main`, carpeta `/ (root)` → Save.
   - El sitio queda en: `https://ceda007-gif.github.io/cotizacion-perla-la-paz/`

Con eso el sitio público (`/`) y el admin (`/admin.html`) ya funcionan en vivo.

## Cómo se usa el admin

- Entra a `/admin.html`, inicia sesión con `ceda007@gmail.com` y la contraseña que le pusiste en el paso 2.
- Editas texto, precios, tablas (puedes pegar rangos copiados de Excel/Sheets), y subes fotos.
- **"Guardar cambios"** publica esos cambios en el sitio público de inmediato.
- **"Descargar HTML"** genera un archivo `.html` independiente con el estado ACTUAL del formulario — se use o no se haya guardado. Así puedes armar la cotización de un cliente específico (precios/fechas distintos), descargarla y enviarla por correo, sin necesidad de publicarla en el sitio público.
- Para cambiar la contraseña del admin: consola de Firebase → Authentication → Users.

## Estructura

- `index.html` / `admin.html` — páginas.
- `css/`, `js/` — estilos y lógica (vanilla JS, sin build step).
- `assets/` — fotos por defecto (las que subas desde el admin se guardan en Firebase Storage y las reemplazan).
- `firestore.rules` / `storage.rules` — reglas de seguridad para pegar en la consola de Firebase.
