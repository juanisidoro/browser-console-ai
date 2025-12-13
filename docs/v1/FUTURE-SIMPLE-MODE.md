# Propuesta: Modo Simple (Sin Servidor)

## Problema Actual

El flujo actual requiere que el usuario:

1. Instale la extensión Chrome
2. Clone/descargue el repositorio
3. Ejecute `npm install` en terminal
4. Ejecute `npm start` para iniciar el servidor MCP
5. Configure `.mcp.json` en Claude Code

**Fricción:** Usuarios no técnicos o que quieren probar rápidamente abandonan en el paso 2-4.

---

## Limitaciones Técnicas

Las extensiones Chrome **NO pueden**:
- Ejecutar procesos Node.js
- Exponer servidores HTTP
- Comunicarse directamente con Claude Code via MCP (stdio)

```
Claude Code ←── MCP (stdio) ←── Proceso Node.js ←── HTTP ←── Extension
                    ↑
            Requiere proceso externo (inevitable)
```

---

## Propuesta: Modo Híbrido

Dos modos de operación en la misma extensión:

| Modo | Descripción | Requisitos | Fricción |
|------|-------------|------------|----------|
| **Simple** | Copy/paste logs | Solo extensión | Zero |
| **MCP** | Integración completa | Extensión + servidor | Media |

---

## Modo Simple (Default)

### Flujo de Usuario

```
1. Instala extensión desde Chrome Web Store
2. Abre sidepanel (click en icono)
3. Click "Start Recording"
4. Interactúa con su aplicación web
5. Click "Stop & Copy for AI"
6. Pega en Claude Code / ChatGPT / cualquier LLM
7. El LLM analiza los logs ✅
```

**Tiempo total: ~2 minutos**

### Cambios Necesarios en UI

```
┌────────────────────────────────────────────────┐
│  Console AI              [Mode ▼] [ON]  [●]   │
│                          ├───────┤             │
│                          │Simple │ ← Default   │
│                          │MCP    │             │
│                          └───────┘             │
├────────────────────────────────────────────────┤
│                                                │
│  [Stats: 45 logs captured]                     │
│                                                │
│  ┌──────────────────────────────────────────┐  │
│  │         ○ Recording...                   │  │
│  │         45 logs captured                 │  │
│  │                                          │  │
│  │  [Stop Only]  [Stop & Copy for AI]       │  │
│  └──────────────────────────────────────────┘  │
│                                                │
└────────────────────────────────────────────────┘
```

### Botón "Copy for AI"

Al presionar, copia al clipboard en formato TOON:

```
Browser Console Logs (45 logs from http://localhost:3000)
Recording: REC-abc123 | Duration: 2m 34s

logs[45]{type,args,timestamp,source}:
  log,["[App] Started"],1699900000000,app.tsx:10
  log,["[API] Fetching users"],1699900001000,api.ts:45
  error,["[API] Failed:","{\"status\":401}"],1699900002000,api.ts:52
  warn,["[Auth] Token expired"],1699900003000,auth.ts:78
  ...
total:45

---
Captured by Browser Console AI
```

### Almacenamiento Local

Los logs se guardan en `chrome.storage.local` (temporal):

```javascript
{
  currentRecording: {
    id: 'REC-abc123',
    logs: [...],
    startTime: 1699900000000,
    url: 'http://localhost:3000'
  }
}
```

**Límite sugerido:** 1000 logs por grabación (suficiente, evita problemas de memoria)

---

## Modo MCP (Avanzado)

### Cuándo Activarlo

- Usuario quiere integración nativa con Claude Code
- Usuario quiere usar herramientas MCP (`get_console_logs`, etc.)
- Usuario trabaja frecuentemente con logs y quiere automatización

### Flujo de Activación

```
1. Usuario selecciona "MCP" en el dropdown
2. Extensión muestra mensaje:

   ┌─────────────────────────────────────────────┐
   │  MCP Mode requires a local server          │
   │                                             │
   │  Quick setup:                               │
   │  1. Download server: [Download .exe]        │
   │  2. Run browser-console-ai.exe              │
   │  3. Status will turn green when ready       │
   │                                             │
   │  [Learn more]  [Stay in Simple mode]        │
   └─────────────────────────────────────────────┘

3. Usuario descarga y ejecuta el servidor
4. Extensión detecta conexión (status verde)
5. Modo MCP activo ✅
```

### Servidor como Ejecutable

Usar `pkg` para crear ejecutables standalone:

```bash
# Genera ejecutables para cada plataforma
npx pkg src/index.js --targets node18-win-x64,node18-macos-x64,node18-linux-x64
```

**Resultado:**
- `browser-console-ai-win.exe` (Windows)
- `browser-console-ai-macos` (macOS)
- `browser-console-ai-linux` (Linux)

**Ventaja:** Usuario solo hace doble-click, sin terminal ni npm.

---

## Comparación de Modos

| Aspecto | Modo Simple | Modo MCP |
|---------|-------------|----------|
| **Setup** | 0 pasos extra | Descargar + ejecutar servidor |
| **Fricción** | Ninguna | Baja (1 archivo) |
| **Copy/Paste** | Manual | No necesario |
| **Herramientas MCP** | No | Sí |
| **Automatización** | No | Sí |
| **Offline** | Sí | No (requiere servidor) |
| **Múltiples grabaciones** | Limitado | Sí (5000 logs) |

---

## Implementación Propuesta

### Fase 1: Modo Simple

1. **Añadir selector de modo** en header (Simple/MCP)
2. **Almacenamiento local** de logs en la extensión
3. **Botón "Copy for AI"** que genera formato TOON
4. **Modo Simple como default**

**Archivos a modificar:**
- `sidepanel.html` - Añadir selector y botón
- `sidepanel.js` - Lógica de modos y copy
- `sidepanel.css` - Estilos del selector
- `service-worker.js` - Almacenamiento local cuando no hay servidor

### Fase 2: Mejoras MCP

1. **Empaquetar servidor** como ejecutable
2. **Página de descarga** con instrucciones
3. **Detección automática** de servidor en modo MCP
4. **Mensaje claro** cuando servidor no está corriendo

### Fase 3: Distribución

1. **Chrome Web Store** - Publicar extensión
2. **GitHub Releases** - Ejecutables del servidor
3. **Landing page** - Instrucciones visuales

---

## Prioridad

```
┌─────────────────────────────────────────────────────────────┐
│  ALTA    │ Modo Simple (zero friction para nuevos usuarios) │
├──────────┼──────────────────────────────────────────────────┤
│  MEDIA   │ Ejecutable del servidor (simplifica MCP)         │
├──────────┼──────────────────────────────────────────────────┤
│  BAJA    │ Chrome Web Store (requiere cuenta de developer)  │
└──────────┴──────────────────────────────────────────────────┘
```

---

## Métricas de Éxito

| Métrica | Actual | Objetivo |
|---------|--------|----------|
| Tiempo hasta primer uso | ~10 min | < 2 min |
| Pasos de setup | 5 | 1 (instalar extensión) |
| Requiere terminal | Sí | No |
| Funciona sin descargas extra | No | Sí (modo Simple) |

---

## Notas

- El formato TOON funciona igual copiado o via MCP (Claude lo entiende)
- El modo Simple es suficiente para el 80% de los casos de uso
- El modo MCP es para usuarios avanzados que quieren automatización
- Mantener compatibilidad hacia atrás con el flujo actual
