# Configuration

Configuración y límites del sistema Browser Console AI.

---

## Servidor MCP

### config.js

```javascript
// extension/mcp-server/src/config.js
const config = {
  port: process.env.PORT || 9876,
  maxLogs: process.env.MAX_LOGS || 5000,
  maxPayloadSize: '1mb',
};
```

| Variable | Default | Descripción |
|----------|---------|-------------|
| `PORT` | 9876 | Puerto HTTP del servidor |
| `MAX_LOGS` | 5000 | Máximo de logs en memoria (FIFO) |
| `maxPayloadSize` | 1mb | Tamaño máximo de request body |

### Variables de Entorno

```bash
# Cambiar puerto
PORT=8080 npm start

# Cambiar límite de logs
MAX_LOGS=10000 npm start

# Ambos
PORT=8080 MAX_LOGS=10000 npm start
```

---

## Límites del Sistema

| Elemento | Límite | Ubicación | Descripción |
|----------|--------|-----------|-------------|
| Logs en memoria | 5000 | `config.js` | FIFO, los más antiguos se eliminan |
| Recordings en historial | 10 | `service-worker.js` | Máximo grabaciones visibles |
| Recordings en endpoint | 10 | `http-bridge.js` | `/recordings` retorna máx 10 |
| Payload HTTP | 1MB | `config.js` | Tamaño máximo por request |
| Logs por grabación | ~500 | Calculado | 5000 ÷ 10 recordings |

### Cálculo de Memoria

```
5000 logs × ~2KB/log = ~10MB de memoria
```

Esto es conservador y permite sesiones de debugging extensas.

---

## Extensión Chrome

### Storage Persistente (chrome.storage.local)

Se mantiene entre sesiones del navegador:

```javascript
{
  captureEnabled: true,           // Toggle ON/OFF
  settings: {
    compactMode: false,           // Minificar JSON
    includePatterns: '',          // Filtros de inclusión
    excludePatterns: '',          // Filtros de exclusión
    filterLog: true,              // Capturar console.log
    filterInfo: true,             // Capturar console.info
    filterWarn: true,             // Capturar console.warn
    filterError: true,            // Capturar console.error
    filterDebug: true             // Capturar console.debug
  }
}
```

### Storage de Sesión (chrome.storage.session)

Se borra al cerrar el navegador:

```javascript
{
  recordingsHistory: [            // Máximo 10 grabaciones
    { id: 'REC-abc123', count: 45, timestamp: 1699900000000 }
  ],
  recordingNames: {               // Nombres personalizados
    'REC-abc123': 'Bug en checkout'
  },
  sessionInitialized: true        // Flag de sesión iniciada
}
```

---

## Configuración MCP (.mcp.json)

```json
{
  "mcpServers": {
    "browser-console": {
      "command": "node",
      "args": ["extension/mcp-server/src/index.js"]
    }
  }
}
```

Este archivo debe estar en la raíz del proyecto para que Claude Code lo detecte.

---

## Filtros de la Extensión

### Por Tipo de Log

Cada tipo puede activarse/desactivarse individualmente:

| Tipo | Método | Color en UI |
|------|--------|-------------|
| `log` | `console.log()` | Gris |
| `info` | `console.info()` | Azul |
| `warn` | `console.warn()` | Amarillo |
| `error` | `console.error()` | Rojo |
| `debug` | `console.debug()` | Púrpura |

### Patrones de Inclusión

Solo captura logs que contengan alguno de los patrones:

```
API, error, critical
```

**Ejemplo:**
- `console.log("API response")` → Capturado
- `console.log("User clicked")` → Ignorado

### Patrones de Exclusión

Ignora logs que contengan alguno de los patrones:

```
[HMR], webpack, __vite
```

**Ejemplo:**
- `console.log("[HMR] Updated")` → Ignorado
- `console.log("App started")` → Capturado

---

## Comportamiento del Toggle ON/OFF

### Estado ON (Captura Activa)

- `injected.js` se inyecta en todas las páginas
- Los logs se capturan y envían al servidor
- DevTools muestra `injected.js:76` como origen
- El campo `source` del log contiene el archivo real

### Estado OFF (Captura Desactivada)

- No se inyecta ningún script
- Los logs no se capturan
- DevTools funciona normalmente
- No hay overhead en las páginas

---

## Limpieza Automática

### Al Cerrar Navegador

```
┌─────────────────────────────────────────────────────────────┐
│  Navegador cierra                                           │
│       ↓                                                     │
│  chrome.storage.session se borra automáticamente            │
│  (recordingsHistory, recordingNames, sessionInitialized)    │
│       ↓                                                     │
│  Navegador abre                                             │
│       ↓                                                     │
│  Extension inicializa → sessionInitialized = undefined      │
│       ↓                                                     │
│  POST /logs/clear → Servidor MCP limpio                     │
│       ↓                                                     │
│  sessionInitialized = true                                  │
│       ↓                                                     │
│  ✅ Nueva sesión limpia                                     │
└─────────────────────────────────────────────────────────────┘
```

### Datos que Persisten

| Dato | Persiste | Razón |
|------|----------|-------|
| `captureEnabled` | Sí | Preferencia del usuario |
| `settings` | Sí | Configuración de filtros |
| `recordingsHistory` | No | Privacidad |
| `recordingNames` | No | Asociados a recordings |
| Logs en servidor | No | Privacidad |

---

## Rendimiento

### Impacto en Páginas Web

- **Con captura ON:** Mínimo overhead (~1ms por log)
- **Con captura OFF:** Zero overhead (no hay scripts inyectados)

### Uso de Memoria del Servidor

```
Base: ~50MB (Node.js + Express + MCP SDK)
Logs: ~2KB × número de logs
Total con 5000 logs: ~60MB
```

### Tokens de IA (Formato TOON)

| Logs | JSON tokens | TOON tokens | Ahorro |
|------|-------------|-------------|--------|
| 10 | ~600 | ~250 | 58% |
| 50 | ~3000 | ~1250 | 58% |
| 100 | ~6000 | ~2500 | 58% |

---

## Troubleshooting

### Puerto en Uso

```bash
# Ver qué usa el puerto
netstat -ano | findstr :9876

# Usar otro puerto
PORT=9877 npm start
```

### Logs No Se Limpian

1. Verificar que el servidor responde a `/logs/clear`
2. Reiniciar el servidor MCP
3. Recargar la extensión en chrome://extensions

### Memoria Alta en el Servidor

Reducir `MAX_LOGS`:

```bash
MAX_LOGS=1000 npm start
```
