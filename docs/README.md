# Browser Console AI - Documentation

> Documentación oficial del proyecto Browser Console AI.

## Estado del Proyecto

**MVP Completado** - El sistema core está funcional con todas las características principales implementadas.

## Resumen del Proyecto

**Producto**: Extensión Chrome (MV3) que captura logs del navegador y los expone a AI agents via MCP (Model Context Protocol).

**Modelo de Negocio**: Freemium + Trial

| Plan | Precio | Características |
|------|--------|-----------------|
| FREE | $0 | 100 logs, 5 recordings, Plain text |
| TRIAL | $0 (3-6 días) | 500 logs, 20 recordings, MCP, TOON/JSON |
| PRO | $9-12/mes | Ilimitado + todas las features |

**Stack**:
- Frontend: Next.js 15 + React 19 + Tailwind + shadcn/ui
- Auth: Firebase Auth (Anonymous-first + Google + Email)
- Database: Firestore
- Payments: Stripe
- Extension: Chrome Manifest V3
- MCP Server: Node.js + Express

## Índice de Documentación

| Documento | Descripción |
|-----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Arquitectura InnerTech, capas, auth system, MV3 OAuth |
| [DATA-MODEL.md](./DATA-MODEL.md) | Modelo de datos Firestore + chrome.storage |
| [ROADMAP.md](./ROADMAP.md) | Estado de fases y próximos pasos |
| [DECISIONS.md](./DECISIONS.md) | Decisiones técnicas y de producto |
| [MONETIZATION.md](./MONETIZATION.md) | Modelo FREE → TRIAL → PRO, upsells |
| [SUBSCRIPTIONS.md](./SUBSCRIPTIONS.md) | Sistema de trials, Stripe billing |
| [FUTURE-FEATURES.md](./FUTURE-FEATURES.md) | Features planificadas post-MVP |

## Documentación Técnica v1

La documentación técnica original de la extensión y MCP server está en [v1/](./v1/):

- [v1/README.md](./v1/README.md) - Introducción original
- [v1/API.md](./v1/API.md) - Endpoints HTTP del MCP server
- [v1/MCP.md](./v1/MCP.md) - Herramientas MCP para Claude
- [v1/EXTENSION.md](./v1/EXTENSION.md) - Guía de la extensión Chrome
- [v1/CONFIGURATION.md](./v1/CONFIGURATION.md) - Configuración y límites

## Quick Start

### Extension

```bash
# Cargar extensión en Chrome
1. Ir a chrome://extensions
2. Activar "Developer mode"
3. Click "Load unpacked"
4. Seleccionar extension/chrome-extension/
```

### MCP Server

```bash
cd extension/mcp-server
npm install
npm start
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Arquitectura High-Level

```
┌─────────────────────────────────────────────────────────────────┐
│                        SHARED CORE                               │
│  (Lógica de negocio pura, sin dependencias de runtime)          │
└─────────────────────────────────────────────────────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Extension     │  │   MCP Server    │  │   Frontend      │
│   (Chrome MV3)  │  │   (Node.js)     │  │   (Next.js)     │
│                 │  │                 │  │                 │
│ - Firebase Auth │  │ - HTTP Bridge   │  │ - Firebase      │
│ - chrome.identity│ │ - MCP Tools     │  │ - Stripe        │
│ - Sidepanel UI  │  │ - Log Storage   │  │ - Dashboard     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

## Sistema de Autenticación

La extensión usa **Anonymous-first** con Firebase Auth:

1. **Install**: `signInAnonymously()` automático
2. **Link account** (opcional): Google via `chrome.identity` o Email magic link
3. **Benefit**: userId siempre disponible, tracking desde día 0

## Sistema de Entitlements

```
GET /api/entitlements
    │
    ├─> PRO subscription (Stripe) → plan=pro
    ├─> Trial por userId → plan=trial
    ├─> Trial por installationId → plan=trial
    └─> Default → plan=free
```

## Límites por Plan

| Aspecto | FREE | TRIAL | PRO |
|---------|------|-------|-----|
| Logs/recording | 100 | 500 | ∞ |
| Recordings | 5 | 20 | ∞ |
| Formatos | Plain | Plain+TOON+JSON | Todos |
| MCP | No | Sí | Sí |
| Export | No | Sí | Sí |

## MCP Tools

El MCP server expone estas herramientas a Claude Code:

- `get_console_logs` - Query logs con filtros
- `get_console_stats` - Estadísticas por tipo
- `clear_console_logs` - Limpiar logs

## Links Útiles

- **Firebase Console**: [console.firebase.google.com](https://console.firebase.google.com)
- **Stripe Dashboard**: [dashboard.stripe.com](https://dashboard.stripe.com)
- **Google Cloud Console**: [console.cloud.google.com](https://console.cloud.google.com)
- **Chrome Web Store**: [chrome.google.com/webstore](https://chrome.google.com/webstore)

## Contribuir

Ver [CLAUDE.md](../CLAUDE.md) en la raíz del proyecto para las reglas de código y arquitectura.
