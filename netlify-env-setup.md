# Configuración de Variables de Entorno en Netlify

## 1. Acceder a la configuración de Netlify
1. Ve a https://app.netlify.com
2. Selecciona tu sitio "pantarey"
3. Ve a Site settings > Environment variables

## 2. Agregar las variables de entorno
Agrega estas variables exactamente como están en tu .env.local:

Variable Name: NEXT_PUBLIC_GOOGLE_API_KEY
Value: AIzaSyCN7raK6IalaNq6uk4cYrX2C6PtgV8QLeM

Variable Name: NEXT_PUBLIC_GOOGLE_CLIENT_ID  
Value: 313408819854-5b9pmj1i4nk2dhoauh3ah8kkq48d2s7b.apps.googleusercontent.com

## 3. Configurar dominio autorizado en Google Cloud Console
1. Ve a https://console.cloud.google.com
2. Selecciona tu proyecto
3. Ve a APIs & Services > Credentials
4. Edita tu OAuth 2.0 Client ID
5. En "Authorized JavaScript origins" agrega:
   - https://pantarey.netlify.app
6. En "Authorized redirect URIs" agrega:
   - https://pantarey.netlify.app/auth/login
   - https://pantarey.netlify.app/auth/register

## 4. Redesplegar el sitio
Después de configurar las variables, haz un nuevo deploy.
