# Configuración de Panta Rei Project con Google Apps Script

## Paso 1: Crear Google Spreadsheet

1. Ve a [Google Sheets](https://sheets.google.com)
2. Crea una nueva hoja de cálculo
3. Nómbrala "Panta Rei Project - Database"
4. Copia el ID de la hoja (está en la URL): `https://docs.google.com/spreadsheets/d/ESTE_ES_EL_ID/edit`

## Paso 2: Configurar Google Apps Script

1. Ve a [Google Apps Script](https://script.google.com)
2. Crea un nuevo proyecto
3. Nómbralo "Panta Rei Project API"
4. Reemplaza el código por defecto con el contenido de `google-apps-script.js`
5. En la línea 4, reemplaza `TU_SPREADSHEET_ID_AQUI` con el ID de tu hoja de cálculo
6. Guarda el proyecto (Ctrl+S)

## Paso 3: Desplegar como Web App

1. En Google Apps Script, haz clic en "Desplegar" → "Nueva implementación"
2. Selecciona tipo: "Aplicación web"
3. Descripción: "Panta Rei Project API v1"
4. Ejecutar como: "Yo"
5. Acceso: "Cualquier persona"
6. Haz clic en "Desplegar"
7. Copia la URL de la aplicación web

## Paso 4: Configurar el HTML

1. En el archivo `index.html`, línea 200, reemplaza `TU_SCRIPT_ID` con la URL completa de tu Web App
2. La línea debería verse así:
   \`\`\`javascript
   const SCRIPT_URL = 'https://script.google.com/macros/s/TU_ID_REAL/exec';
   \`\`\`

## Paso 5: Subir a Netlify

1. Sube el archivo `index.html` a Netlify
2. O usa cualquier hosting web que soporte HTML estático

## Paso 6: Probar la aplicación

1. Abre tu sitio web
2. Regístrate con un usuario de prueba
3. Inicia sesión
4. ¡Listo!

## Estructura de datos

La aplicación creará automáticamente las siguientes hojas en tu Google Spreadsheet:

- **Users**: Información de usuarios registrados
- **Songs**: Canciones y repertorio
- **Events**: Eventos y calendario
- **Tasks**: Tareas y pendientes
- **Messages**: Mensajes del chat
- **Photos**: Información de fotos
- **Ideas**: Ideas musicales

## Ventajas de esta solución

✅ **Completamente gratuito** - Solo usa servicios gratuitos de Google
✅ **Sin límites de almacenamiento** - Google Drive gratuito
✅ **Acceso desde cualquier dispositivo** - Funciona en móviles y desktop
✅ **Backup automático** - Google se encarga de los respaldos
✅ **Colaborativo** - Múltiples usuarios pueden acceder simultáneamente
✅ **Sin configuración compleja** - Solo HTML + Google Apps Script
✅ **Escalable** - Puede manejar miles de registros sin problemas

## Próximos pasos

Una vez que tengas la autenticación funcionando, podemos implementar:

1. **Gestión de canciones** con letras, acordes y grabaciones
2. **Calendario de eventos** con recordatorios
3. **Chat en tiempo real** entre miembros
4. **Galería de fotos** con subida de imágenes
5. **Sistema de tareas** con asignaciones
6. **Banco de ideas** musicales colaborativo

¡Esta solución será mucho más estable y confiable que las versiones anteriores!
