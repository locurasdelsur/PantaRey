# 🛡️ Guía Completa de CSP para Google Sign-In

## 🔍 Problema Identificado

### 1. Quirks Mode (⚠️ Ignorar - No es tu problema)
- **Qué es**: Google carga su iframe sin `<!DOCTYPE html>`
- **Efecto**: El navegador muestra una advertencia sobre "Quirks Mode"
- **Solución**: ❌ No hay nada que hacer - es responsabilidad de Google
- **Impacto**: 🟢 No afecta la funcionalidad de tu app

### 2. CSP bloquea `eval()` (🚨 Problema Real)
- **Qué es**: Google Sign-In usa `eval()` internamente
- **Efecto**: CSP bloquea la ejecución y falla la autenticación
- **Solución**: ✅ Agregar `'unsafe-eval'` al CSP
- **Impacto**: 🔴 Sin esto, Google Sign-In no funciona

## 🔧 Solución Implementada

### Archivo: `/public/_headers`
\`\`\`
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://accounts.google.com https://www.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://www.googleapis.com https://accounts.google.com https://oauth2.googleapis.com https://www.google.com https://securetoken.googleapis.com https://www.gstatic.com; frame-src 'self' https://accounts.google.com https://content.googleapis.com; object-src 'none'; base-uri 'self'; form-action 'self'
\`\`\`

### Directivas CSP Explicadas:

| Directiva | Propósito | Dominios Permitidos |
|-----------|-----------|-------------------|
| `script-src` | Scripts JS | Google APIs + `unsafe-eval` |
| `frame-src` | Iframes | Google Sign-In popup |
| `connect-src` | Requests AJAX | Google APIs |
| `style-src` | CSS | Google Fonts + inline |
| `img-src` | Imágenes | Cualquier HTTPS |

## 🚀 Pasos de Deployment

### 1. Verificar el archivo `_headers`
```bash
# Debe estar en /public/_headers
# Netlify lo detecta automáticamente
