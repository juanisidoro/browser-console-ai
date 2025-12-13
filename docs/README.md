# Browser Console AI - Documentación v2

> Documentación oficial del proyecto de monetización y lanzamiento.

## Índice

| Documento | Descripción |
|-----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Arquitectura InnerTech, capas, reglas de código |
| [MONETIZATION.md](./MONETIZATION.md) | Modelo FREE vs PRO, pricing, upsells |
| [ROADMAP.md](./ROADMAP.md) | Fases de implementación con checklists y DoD |
| [DECISIONS.md](./DECISIONS.md) | Decisiones técnicas y de producto tomadas |
| [DATA-MODEL.md](./DATA-MODEL.md) | Modelo de datos Firestore |

## Documentación Técnica v1

La documentación técnica original de la extensión y MCP server está en [v1/](./v1/):

- [v1/README.md](./v1/README.md) - Introducción original
- [v1/API.md](./v1/API.md) - Endpoints HTTP del MCP server
- [v1/MCP.md](./v1/MCP.md) - Herramientas MCP para Claude
- [v1/EXTENSION.md](./v1/EXTENSION.md) - Guía de la extensión Chrome
- [v1/CONFIGURATION.md](./v1/CONFIGURATION.md) - Configuración y límites

## Resumen del Proyecto

**Producto**: Extensión Chrome que captura logs del navegador para debugging con IA.

**Modelo**: Freemium
- **FREE**: 100 logs, 5 grabaciones, Plain text, copy/paste manual
- **PRO**: Ilimitado + MCP directo + TOON/JSON + Export ($9 early → $12/mes)

**Stack**: Next.js 16 + Firebase Auth + Firestore + Stripe

## Quick Links

- Empezar implementación: [ROADMAP.md#fase-0](./ROADMAP.md#fase-0-fundación-arquitectura)
- Reglas de código: [ARCHITECTURE.md#reglas-obligatorias](./ARCHITECTURE.md#reglas-obligatorias)
- Límites FREE/PRO: [DECISIONS.md#límites](./DECISIONS.md#límites-freepro)
