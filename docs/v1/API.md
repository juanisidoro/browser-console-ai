# API HTTP

El servidor MCP expone una API HTTP en el puerto `9876` para recibir logs de la extensión y permitir consultas.

## Base URL

```
http://localhost:9876
```

---

## Endpoints

### GET /health

Verifica el estado del servidor.

**Response:**
```json
{
  "status": "ok",
  "logsCount": 150,
  "uptime": 3600000
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `status` | string | Siempre "ok" si el servidor responde |
| `logsCount` | number | Cantidad de logs en memoria |
| `uptime` | number | Tiempo activo en milisegundos |

---

### POST /logs

Recibe logs desde la extensión.

**Request Body:**
```json
{
  "logs": [
    {
      "type": "log",
      "args": ["mensaje", "{\"data\": 123}"],
      "timestamp": 1699900000000,
      "url": "http://localhost:3000/app",
      "source": "app.tsx:42"
    }
  ],
  "sessionId": "tab-123456",
  "recordingId": "REC-abc123"
}
```

**Response:**
```json
{
  "received": 1,
  "recordingId": "REC-abc123"
}
```

---

### GET /logs

Consulta logs con filtros opcionales.

**Query Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `type` | string | Filtrar por tipo: `log`, `warn`, `error`, `info`, `debug` |
| `sessionId` | string | Filtrar por sesión (ej: `tab-123456`) |
| `recordingId` | string | Filtrar por grabación (ej: `REC-abc123`) |
| `urlContains` | string | URL contiene texto |
| `textContains` | string | Args contienen texto |
| `sinceTimestamp` | number | Logs desde timestamp (Unix ms) |
| `limit` | number | Máximo resultados (default: 100) |

**Ejemplos:**

```bash
# Todos los logs de una grabación
GET /logs?recordingId=REC-abc123

# Solo errores
GET /logs?type=error

# Logs que contienen "API"
GET /logs?textContains=API&limit=50

# Logs de una URL específica
GET /logs?urlContains=localhost:3000/products
```

**Response:**
```json
{
  "logs": [
    {
      "id": "1699900000000-abc123",
      "sessionId": "tab-123456",
      "recordingId": "REC-abc123",
      "type": "error",
      "args": ["Error:", "Something failed"],
      "timestamp": 1699900000000,
      "url": "http://localhost:3000/app",
      "source": "api.ts:156"
    }
  ],
  "total": 1,
  "recordingId": "REC-abc123"
}
```

---

### GET /recordings

Lista las grabaciones disponibles (máximo 10).

**Response:**
```json
{
  "recordings": [
    {
      "id": "REC-abc123",
      "count": 45,
      "firstTimestamp": 1699900000000,
      "lastTimestamp": 1699900060000
    },
    {
      "id": "REC-def456",
      "count": 120,
      "firstTimestamp": 1699899000000,
      "lastTimestamp": 1699899300000
    }
  ]
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | ID de la grabación |
| `count` | number | Cantidad de logs |
| `firstTimestamp` | number | Timestamp del primer log |
| `lastTimestamp` | number | Timestamp del último log |

---

### POST /logs/clear

Limpia logs del servidor.

**Request Body:**
```json
{
  "all": true
}
```

O con filtros:
```json
{
  "sessionId": "tab-123456"
}
```

```json
{
  "beforeTimestamp": 1699900000000
}
```

**Response:**
```json
{
  "deleted": 150
}
```

---

## Modelo de Datos

### ConsoleLog

```typescript
interface ConsoleLog {
  id: string;              // ID único generado (timestamp-random)
  sessionId: string;       // ID de sesión ("tab-{tabId}")
  recordingId: string;     // ID de grabación ("REC-xxxxxx")
  type: 'log' | 'warn' | 'error' | 'info' | 'debug';
  args: string[];          // Argumentos serializados como strings
  timestamp: number;       // Unix timestamp en milisegundos
  url: string;             // URL de la página donde se generó
  source: string | null;   // Archivo y línea (ej: "app.tsx:42")
}
```

---

## Ejemplos con cURL

```bash
# Verificar estado
curl http://localhost:9876/health

# Obtener logs de una grabación
curl "http://localhost:9876/logs?recordingId=REC-abc123"

# Obtener solo errores
curl "http://localhost:9876/logs?type=error&limit=20"

# Listar grabaciones
curl http://localhost:9876/recordings

# Limpiar todos los logs
curl -X POST http://localhost:9876/logs/clear \
  -H "Content-Type: application/json" \
  -d '{"all": true}'

# Enviar logs manualmente (testing)
curl -X POST http://localhost:9876/logs \
  -H "Content-Type: application/json" \
  -d '{
    "logs": [{"type": "log", "args": ["test"], "timestamp": 1699900000000}],
    "recordingId": "REC-test"
  }'
```

---

## Códigos de Estado

| Código | Descripción |
|--------|-------------|
| `200` | OK |
| `400` | Bad Request (logs no es un array) |
| `500` | Error interno del servidor |
