# Future Features - Browser Console AI

> Features planned for post-MVP implementation.

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

## Anti-Abuse Features

### 15. Disposable Email Blocking
Bloquear emails temporales en trial extend.

```
Implementation:
  - Lista de dominios conocidos (mailinator, tempmail, etc.)
  - API externa para verificación (opcional)
  - Rate limiting por IP

Response: { error: 'disposable_email' }
```

### 16. Device Fingerprinting
Detectar reinstalaciones de extensión.

```
Implementation:
  - Hash de características del dispositivo
  - Canvas fingerprint
  - WebGL fingerprint
  - Audio fingerprint

Use case: Detectar trial abuse por reinstalación
```

### 17. One-Time Codes
Códigos para vincular extension ↔ web de forma segura.

```
Flow:
  1. Usuario verifica email en web
  2. Web genera código de 6 caracteres
  3. Usuario pega código en extensión
  4. Backend valida y vincula installationId ↔ userId

Security:
  - Expira en 15 minutos
  - Single use
  - Rate limited
```

---

## Team Features

### 18. Team Workspaces
Múltiples usuarios compartiendo recordings.

```
Features:
  - Crear workspace
  - Invitar miembros por email
  - Roles: Admin, Member, Viewer
  - Shared recordings history
```

### 19. Cloud History
Persistir recordings en cloud.

```
Features:
  - Recordings guardados en Firestore
  - Búsqueda por contenido
  - Filtros por fecha, tipo, URL
  - Retention policy (7 días default)
```

### 20. Real-time Alerts
Notificaciones cuando ocurren errores.

```
Channels:
  - Slack integration
  - Discord integration
  - Email digest

Filters:
  - Solo errores
  - Por URL pattern
  - Por frecuencia
```

---

## Priority Matrix

| Feature | Effort | Value | Priority | Status |
|---------|--------|-------|----------|--------|
| Export JSON/CSV | Low | High | P1 | Parcial |
| Sanitizar datos sensibles | Medium | High | P1 | Pendiente |
| Disposable email block | Low | High | P1 | Pendiente |
| Rate limiting API | Low | Medium | P1 | Pendiente |
| Truncar logs largos | Low | Medium | P2 | Pendiente |
| Agrupar logs similares | Medium | Medium | P2 | Pendiente |
| One-time codes | Medium | High | P2 | Pendiente |
| Compartir por link | High | High | P2 | Pendiente |
| Device fingerprinting | High | Medium | P3 | Pendiente |
| Formato timestamp | Low | Low | P3 | Pendiente |
| Webhooks | High | Medium | P3 | Pendiente |
| Integración Sentry | High | Medium | P3 | Pendiente |
| Team workspaces | Very High | High | P4 | Pendiente |
| Cloud history | Very High | High | P4 | Pendiente |
| Real-time alerts | High | Medium | P4 | Pendiente |

---

## Implementation Notes

### Storage Considerations
- Settings se guardan en `chrome.storage.local`
- Recordings grandes pueden requerir IndexedDB
- Límite de storage: 5MB local, 100KB sync
- Cloud history requiere Firestore con TTL

### Performance
- Usar Web Workers para procesamiento pesado
- Debounce en filtros de texto
- Virtualización para listas largas de logs
- Lazy loading para recordings history

### Security
- Sanitización debe ser opt-out para usuarios PRO
- No almacenar datos sensibles en plain text
- Tokens de sharing deben ser criptográficamente seguros
- Device fingerprinting solo para anti-abuse, no tracking
