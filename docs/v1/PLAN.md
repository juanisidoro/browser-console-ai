# Browser Console AI - Plan de Implementación

## Objetivo

Capturar logs de consola del navegador, enviarlos a un servidor local y exponerlos vía MCP para Claude Code y otros agentes de IA.

**Principios:**
- Core genérico (sin acoplar a Claude ni a la extensión)
- Extensible para otros LLMs, IDEs, scripts
- Sin rastro al cerrar el navegador (privacidad)
- Eficiente en tokens (formato TOON)

---

## Arquitectura

```
┌─────────────────────┐                    ┌─────────────────────────────────────┐
│  Extensión Chrome   │   POST /logs       │         MCP Server (Node.js)        │
│  (Manifest V3)      │ ──────────────────>│                                     │
│                     │  localhost:9876    │  HTTP Bridge ─> LogsStore ─> MCP    │
└─────────────────────┘                    └───────────────────┬─────────────────┘
                                                               │ stdio
                                                               v
                                           ┌─────────────────────────────────────┐
                                           │  Claude Code / Otros Agentes MCP    │
                                           └─────────────────────────────────────┘
```

**Capas:**

| Capa | Responsabilidad |
|------|-----------------|
| **LogsStore** | Almacena logs en memoria. NO conoce MCP ni Chrome. |
| **HTTP Bridge** | `POST /logs`, `GET /logs`, `GET /recordings`, `POST /logs/clear` |
| **Adaptador MCP** | Tools: `get_console_logs`, `get_console_stats`, `clear_console_logs` |
| **Extensión** | Captura `console.*`, filtros locales, envío al servidor, UI |

---

## Fases de Implementación

### FASE 1 – Core + HTTP ✅

**Objetivo:** Servidor local que recibe y almacena logs.

**Archivos:**
- `logs-store.js` - Store FIFO en memoria (5000 logs)
- `http-bridge.js` - Express en puerto 9876
- `config.js` - Puerto, límites

**Endpoints:**
- `POST /logs` → recibe logs
- `GET /health` → estado del servidor
- `GET /logs` → consulta con filtros
- `GET /recordings` → lista grabaciones
- `POST /logs/clear` → limpia logs

**Estado:** ✅ Completado

---

### FASE 2 – Adaptador MCP ✅

**Objetivo:** Claude Code puede leer logs vía MCP.

**Tools MCP:**
- `get_console_logs(query)` → logs filtrados (formato TOON)
- `get_console_stats(query)` → conteos por tipo
- `clear_console_logs(query)` → limpiar logs

**Estado:** ✅ Completado

---

### FASE 3 – Extensión Básica ✅

**Objetivo:** Capturar logs reales del navegador.

**Archivos:**
- `injected.js` - Hook `console.*` en main world
- `console-capture.js` - Bridge content → background
- `service-worker.js` - Procesa y envía logs

**Flujo:**
```
console.log() → injected.js → content script → service worker → POST /logs → MCP
```

**Estado:** ✅ Completado

---

### FASE 4 – UI + Filtros ✅

**Objetivo:** Control desde el Side Panel.

**Features:**
- Estado servidor (verde/rojo)
- Toggle ON/OFF de captura
- Botones Start/Stop Recording
- Recording ID con copy
- Filtros por tipo de log
- Include/Exclude patterns
- Historial de grabaciones (máx 10)
- Nombres editables para grabaciones

**Estado:** ✅ Completado

---

### FASE 5 – Privacidad + Limpieza ✅

**Objetivo:** No dejar rastro al cerrar navegador.

**Implementación:**
- Historial en `chrome.storage.session` (se borra automáticamente)
- Detección de nueva sesión via `sessionInitialized` flag
- Limpieza automática del servidor al iniciar sesión
- Endpoint `POST /logs/clear` para limpieza

**Estado:** ✅ Completado

---

### FASE 6 – Documentación ✅

**Objetivo:** Proyecto documentado y listo para uso.

**Archivos:**
- `docs/README.md` - Documentación principal
- `docs/API.md` - Endpoints HTTP
- `docs/MCP.md` - Herramientas MCP
- `docs/EXTENSION.md` - Guía de la extensión
- `docs/CONFIGURATION.md` - Configuración y límites
- `docs/PLAN.md` - Este archivo

**Estado:** ✅ Completado

---

## Filtros Disponibles

| Filtro | Descripción |
|--------|-------------|
| `type` | 'log', 'warn', 'error', 'info', 'debug' |
| `sessionId` | Filtrar por sesión (tab) |
| `recordingId` | Filtrar por grabación |
| `urlContains` | URL contiene texto |
| `textContains` | Args contienen texto |
| `sinceTimestamp` | Logs desde timestamp |
| `limit` | Máximo resultados (default: 100) |

---

## Límites del Sistema

| Elemento | Límite |
|----------|--------|
| Logs en memoria | 5000 (FIFO) |
| Grabaciones en historial | 10 |
| Payload HTTP | 1MB |
| Logs estimados por grabación | ~500 |

---

## Formato de Datos

### ConsoleLog

```typescript
interface ConsoleLog {
  id: string;              // timestamp-random
  sessionId: string;       // "tab-{tabId}"
  recordingId: string;     // "REC-xxxxxx"
  type: 'log' | 'warn' | 'error' | 'info' | 'debug';
  args: string[];          // Argumentos serializados
  timestamp: number;       // Unix ms
  url: string;             // URL de la página
  source: string | null;   // "archivo:línea"
}
```

### Formato TOON (respuesta MCP)

```
logs[N]{id,sessionId,recordingId,type,args,timestamp,url,source}:
  id1,tab-123,REC-xxx,log,["msg"],1234567890,http://...,file.ts:10
total:N
```

**Ahorro:** ~56% menos tokens vs JSON

---

## Notas de Diseño

1. **Core desacoplado** - LogsStore es independiente de MCP y Chrome
2. **Privacidad primero** - Todo se limpia al cerrar navegador
3. **Toggle ON/OFF** - Usuario controla cuándo capturar (evita ruido en DevTools)
4. **Formato eficiente** - TOON reduce costos de API
5. **Límites razonables** - 5000 logs ≈ 10MB, suficiente para debugging

---

## Posibles Mejoras Futuras

- [ ] Exportar logs a archivo (JSON/CSV)
- [ ] Filtros más avanzados (regex)
- [ ] Múltiples perfiles de filtros
- [ ] Integración con otros navegadores (Firefox)
- [ ] Dashboard web para visualización
- [ ] Modo "Pro" con más almacenamiento
