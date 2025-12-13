# Chrome Extension

La extensión de Chrome captura logs de `console.*` y los envía al servidor MCP para su análisis por agentes de IA.

## Instalación

1. Abrir `chrome://extensions` en Chrome
2. Activar **"Modo desarrollador"** (esquina superior derecha)
3. Click en **"Cargar extensión sin empaquetar"**
4. Seleccionar la carpeta `extension/chrome-extension`

---

## Interfaz (Side Panel)

La extensión usa un Side Panel que se abre al hacer click en el icono de la extensión.

### Header

```
┌────────────────────────────────────────┐
│  Console AI          [ON/OFF] [Status] │
└────────────────────────────────────────┘
```

| Elemento | Descripción |
|----------|-------------|
| **Toggle ON/OFF** | Activa/desactiva la captura de logs |
| **Status** | Verde = conectado al servidor, Rojo = desconectado |

### Toggle de Captura

| Estado | Color | Comportamiento |
|--------|-------|----------------|
| **ON** | Verde | Inyecta scripts, captura logs |
| **OFF** | Rojo | No inyecta, DevTools funciona normal |

> **Nota:** Cuando está OFF, no verás `injected.js:76` en DevTools.

### Estados de Grabación

#### 1. Idle (Esperando)
- Muestra botón "Start Recording"
- No captura logs

#### 2. Recording (Grabando)
- Indicador pulsante rojo
- Contador de logs capturados
- Vista previa de últimos logs
- Botones: "Stop Only" (descartar) y "Stop & Send" (enviar)

#### 3. Sent (Enviado)
- Muestra Recording ID (ej: `REC-abc123`)
- Botón para copiar ID
- Botón "New Recording"

---

## Secciones

### Stats

Muestra contadores en tiempo real:
- **Total**: Logs capturados
- **Log**: Tipo `console.log`
- **Info**: Tipo `console.info`
- **Warn**: Tipo `console.warn`
- **Error**: Tipo `console.error`
- **Debug**: Tipo `console.debug`

### Settings

| Configuración | Descripción | Persistente |
|---------------|-------------|-------------|
| **Log types** | Toggles para filtrar por tipo | Sí |
| **Compact mode** | Minifica JSON en payload | Sí |
| **Include patterns** | Solo captura si contiene (comma separated) | Sí |
| **Exclude patterns** | Excluye si contiene (comma separated) | Sí |

### Recordings

Lista las últimas 10 grabaciones de la sesión:
- Nombre editable (click para renombrar)
- Recording ID
- Cantidad de logs
- Tiempo transcurrido
- Acciones: Ver, Copiar ID, Eliminar

---

## Mensajes Internos

La extensión usa mensajes internos para comunicación:

| Mensaje | Dirección | Descripción |
|---------|-----------|-------------|
| `CONTENT_READY` | content → background | Script de contenido listo |
| `LOG_CAPTURED` | content → background | Log capturado |
| `SET_CAPTURE_ENABLED` | sidepanel → background | Cambiar estado ON/OFF |
| `START_RECORDING` | sidepanel → background | Iniciar grabación |
| `STOP_RECORDING` | sidepanel → background | Parar y enviar |
| `STOP_ONLY` | sidepanel → background | Parar sin enviar |
| `GET_STATUS` | sidepanel → background | Obtener estado actual |
| `SETTINGS_UPDATED` | sidepanel → background | Guardar configuración |
| `GET_RECORDINGS_HISTORY` | sidepanel → background | Obtener historial |
| `DELETE_RECORDING` | sidepanel → background | Eliminar grabación |
| `RECORDING_UPDATE` | background → sidepanel | Actualizar UI con nuevos logs |

---

## Arquitectura de Captura

```
┌─────────────────┐    CustomEvent    ┌─────────────────┐   chrome.runtime   ┌─────────────────┐
│   injected.js   │ ────────────────▶ │ console-capture │ ─────────────────▶ │ service-worker  │
│   (main world)  │                   │   (content)     │                    │   (background)  │
│                 │                   │                 │                    │                 │
│ hooks console.* │                   │ bridge events   │                    │ filters, sends  │
└─────────────────┘                   └─────────────────┘                    └─────────────────┘
```

### injected.js (Main World)

- Se inyecta en el contexto de la página
- Sobrescribe `console.log`, `console.warn`, etc.
- Captura argumentos y stack trace
- Emite `CustomEvent` con los datos

### console-capture.js (Content Script)

- Escucha eventos de `injected.js`
- Reenvía al Service Worker via `chrome.runtime`

### service-worker.js (Background)

- Recibe logs de todas las pestañas
- Aplica filtros (tipo, include/exclude patterns)
- Envía al servidor MCP via HTTP POST
- Gestiona el historial de grabaciones

---

## Storage

### chrome.storage.local (Persistente)

| Key | Tipo | Descripción |
|-----|------|-------------|
| `captureEnabled` | boolean | Estado del toggle ON/OFF |
| `settings` | object | Configuración de filtros |

### chrome.storage.session (Se borra al cerrar navegador)

| Key | Tipo | Descripción |
|-----|------|-------------|
| `recordingsHistory` | array | Historial de grabaciones (máx 10) |
| `recordingNames` | object | Nombres personalizados |
| `sessionInitialized` | boolean | Flag de nueva sesión |

---

## Limpieza Automática

Al cerrar el navegador:

1. `chrome.storage.session` se borra automáticamente
2. Al abrir de nuevo, `sessionInitialized` no existe
3. La extensión detecta nueva sesión
4. Llama `POST /logs/clear` al servidor
5. Marca `sessionInitialized = true`

**Resultado:** No queda rastro de sesiones anteriores.

---

## Permisos (manifest.json)

```json
{
  "permissions": [
    "storage",
    "scripting",
    "sidePanel",
    "activeTab"
  ],
  "host_permissions": [
    "http://localhost:9876/*",
    "<all_urls>"
  ]
}
```

| Permiso | Uso |
|---------|-----|
| `storage` | Guardar configuración y historial |
| `scripting` | Inyectar scripts en páginas |
| `sidePanel` | Mostrar interfaz en panel lateral |
| `activeTab` | Acceder a la pestaña activa |
| `host_permissions` | Enviar logs al servidor local |

---

## Troubleshooting

### "Status: Offline"

1. Verificar que el servidor MCP está corriendo: `npm start`
2. Verificar puerto: `curl http://localhost:9876/health`

### No se capturan logs

1. Verificar toggle está en **ON** (verde)
2. Verificar que hay una grabación activa
3. Recargar la página web
4. Verificar filtros en Settings

### `injected.js:76` en DevTools

Esto es normal cuando la captura está activa. Para evitarlo:
1. Poner toggle en **OFF**
2. Recargar la página
3. DevTools mostrará las líneas reales

### Logs no aparecen en Claude Code

1. Verificar que se completó "Stop & Send"
2. Copiar el Recording ID correcto
3. Verificar conexión: `curl http://localhost:9876/recordings`
