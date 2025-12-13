# Browser Console AI

Captura logs de consola del navegador y los expone a agentes de IA mediante MCP (Model Context Protocol).

## Arquitectura

```
┌─────────────────┐      POST /logs       ┌─────────────────┐      stdio       ┌─────────────────┐
│ Chrome Extension│ ──────────────────────▶│   MCP Server    │◀────────────────▶│   Claude Code   │
│   (Manifest V3) │                        │   (Node.js)     │                  │                 │
└─────────────────┘                        └─────────────────┘                  └─────────────────┘
        │                                          │
        │ injected.js                              │ Puerto 9876
        ▼                                          │
   Captura console.*                               ▼
   en páginas web                            logs en memoria
```

## Componentes

| Componente | Descripción |
|------------|-------------|
| **Chrome Extension** | Captura `console.*` mediante inyección en main world |
| **MCP Server** | Almacena logs en memoria y los expone vía MCP |
| **HTTP Bridge** | API REST para recibir logs de la extensión |

## Quick Start

### 1. Iniciar el servidor MCP

```bash
cd extension/mcp-server
npm install
npm start
```

### 2. Configurar Claude Code

El archivo `.mcp.json` ya está configurado en la raíz del proyecto:

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

### 3. Instalar la extensión Chrome

1. Abrir `chrome://extensions`
2. Activar "Modo desarrollador"
3. Click en "Cargar extensión sin empaquetar"
4. Seleccionar la carpeta `extension/chrome-extension`

### 4. Usar

1. Abrir el sidepanel de la extensión (click en el icono)
2. Verificar que el estado sea "Connected" (verde)
3. Click en "Start Recording"
4. Navegar/interactuar con tu aplicación web
5. Click en "Stop & Send"
6. Copiar el Recording ID (ej: `REC-abc123`)
7. En Claude Code: "Lee los logs de REC-abc123"

## Documentación

- [API HTTP](./API.md) - Endpoints del servidor
- [MCP Tools](./MCP.md) - Herramientas disponibles para agentes
- [Extension](./EXTENSION.md) - Guía de la extensión Chrome
- [Configuration](./CONFIGURATION.md) - Límites y configuración
- [Plan](./PLAN.md) - Plan de implementación y estado

## Estructura del Proyecto

```
Browser Console AI/
├── .mcp.json                          # Configuración MCP para Claude Code
├── CLAUDE.md                          # Instrucciones para Claude Code
├── docs/                              # Documentación
│   ├── README.md                      # Este archivo
│   ├── API.md                         # Documentación API HTTP
│   ├── MCP.md                         # Documentación MCP
│   ├── EXTENSION.md                   # Documentación extensión
│   ├── CONFIGURATION.md               # Configuración
│   └── PLAN.md                        # Plan de implementación
└── extension/
    ├── mcp-server/                    # Servidor MCP + HTTP
    │   ├── src/
    │   │   ├── index.js               # Entry point
    │   │   ├── http-bridge.js         # Endpoints HTTP
    │   │   ├── logs-store.js          # Almacén en memoria
    │   │   └── config.js              # Configuración
    │   └── package.json
    └── chrome-extension/              # Extensión Chrome
        ├── manifest.json
        ├── content/
        │   ├── console-capture.js     # Bridge content → background
        │   └── injected.js            # Hook console.* (main world)
        ├── background/
        │   └── service-worker.js      # Lógica principal
        └── sidepanel/
            ├── sidepanel.html
            ├── sidepanel.css
            └── sidepanel.js
```

## Principios de Diseño

1. **Core desacoplado** - LogsStore no conoce MCP ni Chrome
2. **Extensible** - Preparado para otros LLMs, IDEs, scripts
3. **Sin rastro** - Los logs se limpian al cerrar el navegador
4. **Eficiente** - Formato TOON reduce ~56% de tokens vs JSON

## Licencia

MIT
