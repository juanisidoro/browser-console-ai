# Future Features - Browser Console AI

## Recording Display Options

### 1. Truncar logs largos
Limitar la longitud máxima de cada log para mejorar rendimiento y legibilidad.

```
Setting: Max log length: [200] chars

Before: [API] Response received {"data":{"users":[{"id":1,"name":"John","email":"john@example.com","address":{"street":"123 Main St","city":"New York"}}]}}
After:  [API] Response received {"data":{"users":[{"id":1,"name":"John","email":"john@example.com","address":{"street":"123 Mai...
```

### 2. Mostrar/ocultar stack traces
Opción para colapsar o expandir stack traces de errores.

```
Setting: [x] Collapse stack traces

Before:
[error] TypeError: Cannot read property 'map' of undefined
    at UserList.render (UserList.tsx:45)
    at processChild (react-dom.js:1234)
    at renderNode (react-dom.js:5678)
    ...20 more lines

After:
[error] TypeError: Cannot read property 'map' of undefined
    at UserList.render (UserList.tsx:45) [+22 lines]
```

### 3. Formato de timestamp
Elegir entre tiempo relativo o absoluto.

```
Setting: Timestamp format: ( ) Relative (x) Absolute

Relative: [2s ago] [API] Fetch complete
          [5s ago] [Store] Cache updated
          [1m ago] [Auth] Session started

Absolute: [14:32:05.123] [API] Fetch complete
          [14:32:02.456] [Store] Cache updated
          [14:31:00.789] [Auth] Session started
```

### 4. Colorear por tipo de log
Aplicar colores visuales según el tipo de log.

```
Setting: [x] Color-code log types

Preview:
  [log]   Normal message          (gray)
  [info]  Information message     (blue)
  [warn]  Warning message         (yellow)
  [error] Error message           (red)
  [debug] Debug message           (purple)
```

---

## MCP Server Output Options

### 5. Filtrar tipos de log a enviar
Seleccionar qué tipos de log enviar al MCP server.

```
Setting: Send to MCP:
  [x] log  [x] info  [ ] warn  [x] error  [ ] debug

Result: Solo logs, info y errors se envían al servidor MCP
```

### 6. Agrupar logs similares
Combinar logs repetitivos en uno solo con contador.

```
Setting: [x] Group similar logs (within 1s)

Before:
[log] Rendering component
[log] Rendering component
[log] Rendering component
[log] Rendering component

After:
[log] Rendering component (x4)
```

### 7. Rate limiting
Limitar la cantidad de logs enviados por segundo.

```
Setting: Max logs per second: [50]

Behavior: Si se superan 50 logs/s, los extras se descartan
          con un mensaje de warning al final del recording.

Warning: "⚠️ 127 logs were dropped due to rate limiting"
```

### 8. Modo batch vs realtime
Elegir entre envío en tiempo real o por lotes.

```
Setting: Send mode: (x) Realtime ( ) Batch

Realtime: Cada log se envía inmediatamente al MCP server
Batch:    Los logs se acumulan y envían cada 5 segundos
          (reduce conexiones, mejor para alto volumen)
```

### 9. Excluir URLs específicas
Filtrar logs de URLs específicas (ej: analytics, ads).

```
Setting: Exclude URLs containing:
  google-analytics.com
  facebook.com/tr
  hotjar.com

Result: Logs originados de estas URLs no se capturan
```

### 10. Sanitizar datos sensibles
Detectar y ocultar automáticamente datos sensibles.

```
Setting: [x] Sanitize sensitive data

Patterns detected:
  - Passwords
  - API keys
  - Tokens (JWT, Bearer)
  - Credit card numbers
  - Email addresses (optional)

Before: [API] Login {"email":"user@test.com","password":"secret123"}
After:  [API] Login {"email":"user@test.com","password":"[REDACTED]"}

Before: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6...
After:  Authorization: Bearer [REDACTED]
```

---

## Advanced Features

### 11. Export a JSON/CSV
Exportar recordings a diferentes formatos.

```
Buttons: [Export JSON] [Export CSV] [Copy as Markdown]

JSON output:
{
  "recordingId": "REC-abc123",
  "timestamp": "2024-01-15T10:30:00Z",
  "logs": [
    {"type": "log", "message": "App started", "source": "app.ts:1"},
    {"type": "error", "message": "Failed to fetch", "source": "api.ts:45"}
  ]
}

CSV output:
timestamp,type,message,source
1705315800000,log,App started,app.ts:1
1705315805000,error,Failed to fetch,api.ts:45
```

### 12. Compartir recording por link
Generar un link único para compartir un recording.

```
Button: [Share Recording]

Result: https://browserconsoleai.com/shared/REC-abc123

Features:
  - Link expira en 24h (configurable)
  - Opción de proteger con password
  - Vista de solo lectura
  - Contador de vistas
```

### 13. Webhooks personalizados
Enviar logs a endpoints externos.

```
Setting: Webhook URL: [https://my-server.com/logs]

Payload enviado:
POST https://my-server.com/logs
{
  "recordingId": "REC-abc123",
  "logs": [...],
  "metadata": {
    "userAgent": "Chrome/120",
    "url": "https://myapp.com/dashboard"
  }
}
```

### 14. Integración con Sentry/LogRocket
Conectar con servicios de monitoreo existentes.

```
Settings:
  Sentry DSN: [https://xxx@sentry.io/123]
  LogRocket App ID: [abc123/my-app]

Behavior:
  - Errores automáticamente reportados a Sentry
  - Session replay conectado con LogRocket
  - Tags personalizados por recording
```

---

## Priority Matrix

| Feature | Effort | Value | Priority |
|---------|--------|-------|----------|
| Truncar logs largos | Low | Medium | P1 |
| Sanitizar datos sensibles | Medium | High | P1 |
| Export JSON/CSV | Low | High | P1 |
| Rate limiting | Low | Medium | P2 |
| Agrupar logs similares | Medium | Medium | P2 |
| Formato timestamp | Low | Low | P3 |
| Compartir por link | High | High | P2 |
| Webhooks | High | Medium | P3 |
| Integración Sentry | High | Medium | P3 |

---

## Implementation Notes

### Storage Considerations
- Settings se guardan en `chrome.storage.local`
- Recordings grandes pueden requerir IndexedDB
- Límite de storage: 5MB local, 100KB sync

### Performance
- Usar Web Workers para procesamiento pesado
- Debounce en filtros de texto
- Virtualización para listas largas de logs

### Security
- Sanitización debe ser opt-out para usuarios PRO
- No almacenar datos sensibles en plain text
- Tokens de sharing deben ser criptográficamente seguros
