// Google Apps Script - Código del servidor
// Este código debe copiarse en Google Apps Script (script.google.com)

// Importaciones necesarias
const ContentService = ContentService
const Logger = Logger
const SpreadsheetApp = SpreadsheetApp
const Utilities = Utilities

// ID de la hoja de cálculo donde se guardarán los datos
const SPREADSHEET_ID = "TU_SPREADSHEET_ID_AQUI" // Reemplazar con tu ID

function doPost(e) {
  try {
    const action = e.parameter.action

    switch (action) {
      case "register":
        return handleRegister(e.parameter)
      case "login":
        return handleLogin(e.parameter)
      case "saveData":
        return handleSaveData(e.parameter)
      case "loadData":
        return handleLoadData(e.parameter)
      default:
        return ContentService.createTextOutput(
          JSON.stringify({ success: false, message: "Acción no válida" }),
        ).setMimeType(ContentService.MimeType.JSON)
    }
  } catch (error) {
    Logger.log("Error en doPost: " + error.toString())
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, message: "Error del servidor" }),
    ).setMimeType(ContentService.MimeType.JSON)
  }
}

function doGet(e) {
  // Permitir CORS
  return ContentService.createTextOutput(JSON.stringify({ message: "Panta Rei Project API" })).setMimeType(
    ContentService.MimeType.JSON,
  )
}

function handleRegister(params) {
  try {
    const { name, email, password, instrument } = params

    // Validar datos
    if (!name || !email || !password || !instrument) {
      return createResponse(false, "Todos los campos son obligatorios")
    }

    // Abrir hoja de cálculo
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID)
    let usersSheet = ss.getSheetByName("Users")

    // Crear hoja si no existe
    if (!usersSheet) {
      usersSheet = ss.insertSheet("Users")
      usersSheet.getRange(1, 1, 1, 6).setValues([["ID", "Name", "Email", "Password", "Instrument", "JoinDate"]])
    }

    // Verificar si el email ya existe
    const data = usersSheet.getDataRange().getValues()
    for (let i = 1; i < data.length; i++) {
      if (data[i][2] === email) {
        return createResponse(false, "Este email ya está registrado")
      }
    }

    // Generar ID único
    const userId = Utilities.getUuid()
    const joinDate = new Date().toISOString()

    // Agregar usuario
    usersSheet.appendRow([userId, name, email, password, instrument, joinDate])

    return createResponse(true, "Usuario registrado exitosamente")
  } catch (error) {
    Logger.log("Error en handleRegister: " + error.toString())
    return createResponse(false, "Error al registrar usuario")
  }
}

function handleLogin(params) {
  try {
    const { email, password } = params

    if (!email || !password) {
      return createResponse(false, "Email y contraseña son obligatorios")
    }

    // Abrir hoja de cálculo
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID)
    const usersSheet = ss.getSheetByName("Users")

    if (!usersSheet) {
      return createResponse(false, "No hay usuarios registrados")
    }

    // Buscar usuario
    const data = usersSheet.getDataRange().getValues()
    for (let i = 1; i < data.length; i++) {
      if (data[i][2] === email && data[i][3] === password) {
        const user = {
          id: data[i][0],
          name: data[i][1],
          email: data[i][2],
          instrument: data[i][4],
          joinDate: data[i][5],
        }

        return ContentService.createTextOutput(JSON.stringify({ success: true, user: user })).setMimeType(
          ContentService.MimeType.JSON,
        )
      }
    }

    return createResponse(false, "Email o contraseña incorrectos")
  } catch (error) {
    Logger.log("Error en handleLogin: " + error.toString())
    return createResponse(false, "Error al iniciar sesión")
  }
}

function handleSaveData(params) {
  try {
    const { dataType, data, userId } = params

    if (!dataType || !data || !userId) {
      return createResponse(false, "Datos incompletos")
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID)
    let dataSheet = ss.getSheetByName(dataType)

    // Crear hoja si no existe
    if (!dataSheet) {
      dataSheet = ss.insertSheet(dataType)
      // Agregar headers según el tipo de datos
      const headers = getHeadersForDataType(dataType)
      if (headers.length > 0) {
        dataSheet.getRange(1, 1, 1, headers.length).setValues([headers])
      }
    }

    // Parsear datos JSON
    const parsedData = JSON.parse(data)

    // Guardar datos (implementar según estructura específica)
    // Por ahora guardamos como JSON en una celda
    const timestamp = new Date().toISOString()
    dataSheet.appendRow([userId, timestamp, data])

    return createResponse(true, "Datos guardados exitosamente")
  } catch (error) {
    Logger.log("Error en handleSaveData: " + error.toString())
    return createResponse(false, "Error al guardar datos")
  }
}

function handleLoadData(params) {
  try {
    const { dataType, userId } = params

    if (!dataType || !userId) {
      return createResponse(false, "Parámetros incompletos")
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID)
    const dataSheet = ss.getSheetByName(dataType)

    if (!dataSheet) {
      return ContentService.createTextOutput(JSON.stringify({ success: true, data: [] })).setMimeType(
        ContentService.MimeType.JSON,
      )
    }

    // Cargar datos del usuario
    const data = dataSheet.getDataRange().getValues()
    const userData = []

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === userId) {
        try {
          const parsedData = JSON.parse(data[i][2])
          userData.push(parsedData)
        } catch (e) {
          // Ignorar datos corruptos
        }
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true, data: userData })).setMimeType(
      ContentService.MimeType.JSON,
    )
  } catch (error) {
    Logger.log("Error en handleLoadData: " + error.toString())
    return createResponse(false, "Error al cargar datos")
  }
}

function getHeadersForDataType(dataType) {
  const headers = {
    Songs: ["UserID", "Timestamp", "Data"],
    Events: ["UserID", "Timestamp", "Data"],
    Tasks: ["UserID", "Timestamp", "Data"],
    Messages: ["UserID", "Timestamp", "Data"],
    Photos: ["UserID", "Timestamp", "Data"],
    Ideas: ["UserID", "Timestamp", "Data"],
  }

  return headers[dataType] || ["UserID", "Timestamp", "Data"]
}

function createResponse(success, message, data = null) {
  const response = { success, message }
  if (data) response.data = data

  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON)
}

// Función para configurar CORS
function doOptions(request) {
  return ContentService.createTextOutput("").setMimeType(ContentService.MimeType.TEXT).setHeaders({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  })
}
