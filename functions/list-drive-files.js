import { google } from 'googleapis';

exports.handler = async function(event, context) {
  try {
    // Autenticación con la cuenta de servicio
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Reemplazar \\n por \n
      scopes: ['https://www.googleapis.com/auth/drive.readonly'], // O 'drive' para escritura
    });

    const drive = google.drive({ version: 'v3', auth });

    // ID de la carpeta de Google Drive (ej. la de "Canciones")
    // Puedes pasarla como parámetro en la URL de la función si necesitas que sea dinámica
    const folderId = event.queryStringParameters.folderId || 'YOUR_DEFAULT_FOLDER_ID';

    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, webViewLink, thumbnailLink)',
      pageSize: 100,
    });

    const files = response.data.files;

    return {
      statusCode: 200,
      body: JSON.stringify(files),
    };
  } catch (error) {
    console.error('Error accessing Google Drive API:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch files from Google Drive', details: error.message }),
    };
  }
};