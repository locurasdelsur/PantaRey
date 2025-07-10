# 🔧 Guía de Debug para Netlify

## Paso 1: Verificar Variables de Entorno en Netlify

1. Ve a https://app.netlify.com
2. Selecciona tu sitio "pantarey"
3. Ve a Site settings > Environment variables
4. Verifica que tengas EXACTAMENTE estas variables:

   Variable name: NEXT_PUBLIC_GOOGLE_API_KEY
   Value: AIzaSyCN7raK6IalaNq6uk4cYrX2C6PtgV8QLeM

   Variable name: NEXT_PUBLIC_GOOGLE_CLIENT_ID
   Value: 313408819854-5b9pmj1i4nk2dhoauh3ah8kkq48d2s7b.apps.googleusercontent.com

## Paso 2: Verificar en la Consola del Navegador

1. Abre tu sitio https://pantarey.netlify.app/
2. Abre las herramientas de desarrollador (F12)
3. Ve a la pestaña "Console"
4. Busca los logs que empiezan con "🔧 Google Drive Config Debug:"
5. Verifica que aparezcan las credenciales

## Paso 3: Si las variables no aparecen

1. Asegúrate de que los nombres sean EXACTOS (incluyendo NEXT_PUBLIC_)
2. Después de agregar las variables, haz un nuevo deploy:
   - Ve a Deploys
   - Haz clic en "Trigger deploy" > "Deploy site"

## Paso 4: Verificar Google Cloud Console

1. Ve a https://console.cloud.google.com
2. Selecciona tu proyecto
3. Ve a APIs & Services > Credentials
4. Edita tu OAuth 2.0 Client ID
5. En "Authorized JavaScript origins" debe estar:
   - https://pantarey.netlify.app
6. Guarda los cambios

## Paso 5: Test de Variables

Puedes probar si las variables están llegando agregando esto temporalmente en tu página:

console.log("API Key:", process.env.NEXT_PUBLIC_GOOGLE_API_KEY)
console.log("Client ID:", process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)
