# MCP Tools

El servidor expone herramientas MCP (Model Context Protocol) que permiten a agentes de IA como Claude Code acceder a los logs de la consola del navegador.

## Configuración

El archivo `.mcp.json` en la raíz del proyecto configura Claude Code:

```json
{
  "mcpServers": {
    "browser-console": {
      "command": "node",
      "args": ["extension/mcp-server/src/index.js"],
      "env": {}
    }
  }
}
```

---

## Herramientas Disponibles

### get_console_logs

Obtiene logs de la consola con filtros opcionales.

**Parámetros:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `type` | string | No | Tipo de log: `log`, `warn`, `error`, `info`, `debug` |
| `sessionId` | string | No | ID de sesión (ej: `tab-123456`) |
| `recordingId` | string | No | ID de grabación (ej: `REC-abc123`) |
| `urlContains` | string | No | Filtrar por URL que contenga texto |
| `textContains` | string | No | Filtrar por contenido que contenga texto |
| `sinceTimestamp` | number | No | Logs desde timestamp (Unix ms) |
| `limit` | number | No | Máximo de logs a retornar (default: 100) |

**Ejemplo de uso en Claude Code:**

```
"Dame los logs de la grabación REC-abc123"
"Muéstrame solo los errores de la última sesión"
"Busca logs que contengan 'API' en la URL localhost:3000"
```

**Formato de respuesta (TOON):**

```
logs[3]{id,sessionId,recordingId,type,args,timestamp,url,source}:
  abc123,tab-1,REC-xyz,log,["mensaje"],1699900000000,http://localhost:3000,app.tsx:42
  def456,tab-1,REC-xyz,error,["Error:","failed"],1699900001000,http://localhost:3000,api.ts:156
  ghi789,tab-1,REC-xyz,warn,["Warning"],1699900002000,http://localhost:3000,utils.ts:23
total:3
```

> **Nota:** El formato TOON reduce el consumo de tokens en ~56% comparado con JSON tradicional.

---

### get_console_stats

Obtiene estadísticas de los logs almacenados.

**Parámetros:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `recordingId` | string | No | Filtrar estadísticas por grabación |

**Ejemplo de uso:**

```
"¿Cuántos logs hay en total?"
"Dame las estadísticas de REC-abc123"
```

**Respuesta:**

```json
{
  "total": 150,
  "byType": {
    "log": 100,
    "warn": 20,
    "error": 15,
    "info": 10,
    "debug": 5
  },
  "sessions": ["tab-123456", "tab-789012"]
}
```

---

### clear_console_logs

Limpia logs del almacén.

**Parámetros:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `all` | boolean | No | Limpiar todos los logs |
| `sessionId` | string | No | Limpiar logs de una sesión específica |
| `beforeTimestamp` | number | No | Limpiar logs anteriores a timestamp |

**Ejemplo de uso:**

```
"Limpia todos los logs"
"Borra los logs de la sesión tab-123456"
```

**Respuesta:**

```json
{
  "deleted": 150
}
```

---

## Formato TOON

El servidor usa el formato TOON (Token-Optimized Object Notation) para reducir el consumo de tokens:

### Comparación

**JSON tradicional (un log):**
```json
{
  "logs": [
    {
      "id": "abc123",
      "sessionId": "tab-1",
      "recordingId": "REC-xyz",
      "type": "log",
      "args": ["mensaje"],
      "timestamp": 1699900000000,
      "url": "http://localhost:3000",
      "source": "app.tsx:42"
    }
  ]
}
```

**TOON (mismo log):**
```
logs[1]{id,sessionId,recordingId,type,args,timestamp,url,source}:
  abc123,tab-1,REC-xyz,log,["mensaje"],1699900000000,http://localhost:3000,app.tsx:42
total:1
```

### Beneficios

| Métrica | JSON | TOON | Ahorro |
|---------|------|------|--------|
| Caracteres por log | ~200 | ~100 | 50% |
| Tokens estimados | ~60 | ~25 | 58% |
| Overhead por registro | ~120 chars | ~15 chars | 87% |

---

## Flujo de Trabajo Típico

1. **Usuario graba sesión** en la extensión Chrome
2. **Extensión envía logs** al servidor MCP vía HTTP
3. **Usuario comparte Recording ID** con Claude Code
4. **Claude Code consulta logs** usando `get_console_logs`
5. **Claude analiza** los logs y sugiere soluciones

**Ejemplo de conversación:**

```
Usuario: Tengo un bug en mi app. Grabé los logs: REC-7zcr65

Claude: [Usa get_console_logs con recordingId=REC-7zcr65]

Claude: He analizado los 45 logs de tu sesión. Veo que:
1. En app.tsx:42 hay un error de tipo...
2. La secuencia de eventos muestra...
3. El problema parece estar en...
```

---

## Casos de Uso

### Debugging de errores

```
"Muéstrame los errores de REC-abc123"
→ get_console_logs({ recordingId: "REC-abc123", type: "error" })
```

### Análisis de flujo

```
"Dame todos los logs que contengan 'API' de la última grabación"
→ get_console_logs({ recordingId: "REC-abc123", textContains: "API" })
```

### Monitoreo de performance

```
"¿Cuántos warnings hay en la sesión actual?"
→ get_console_stats({ recordingId: "REC-abc123" })
```

### Limpieza

```
"Limpia los logs para empezar de nuevo"
→ clear_console_logs({ all: true })
```
