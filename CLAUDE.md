# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Browser Console AI captures browser console logs via a Chrome extension and exposes them to AI agents through MCP (Model Context Protocol). The system has three main components:

1. **Chrome Extension** (Manifest V3) - Captures `console.*` calls, applies filters, sends to local server
2. **MCP Server** (Node.js) - Core log storage + HTTP bridge + MCP adapter for Claude Code
3. **Frontend** (Next.js) - Landing, auth, payments, dashboard
4. **Shared Core** - Business logic shared across all runtimes

## Architecture InnerTech

Este proyecto sigue el modelo InnerTech: Clean Architecture + Hexagonal pragmático.

### 3 Runtimes, 1 Lógica de Negocio

```
┌─────────────────────────────────────────────────────────────────┐
│                        SHARED CORE                               │
│  (Lógica de negocio pura, sin dependencias de runtime)          │
│  - Entidades: User, Subscription, License, ConsoleLog           │
│  - Casos de uso: ValidateLicense, CheckLimits, GeneratePayload  │
└─────────────────────────────────────────────────────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   BROWSER       │  │     NODE        │  │   EDGE/NODE     │
│   (Extension)   │  │   (MCP Server)  │  │   (Next.js)     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Estructura de Capas

| Capa | Ubicación | Responsabilidad | Puede importar |
|------|-----------|-----------------|----------------|
| CORE | `/shared/core` | Lógica de negocio pura | Nada externo |
| INFRA | `*/infra/` | Implementaciones técnicas | CORE |
| API | `*/api/` o `/app/api` | Entrada HTTP/MCP | CORE + INFRA |
| UI | `/features/*/components` | Presentación | Hooks + API client |

### Reglas Obligatorias

1. **CORE es sagrado**
   - Sin imports de firebase, stripe, chrome, express, jose
   - Solo tipos primitivos, interfaces propias, y lógica pura
   - Los casos de uso son funciones puras cuando es posible

2. **Separar auth vs licensing**
   - `auth/` = identidad pura (quién eres): User, Session
   - `licensing/` = permisos (qué puedes hacer): tokens, entitlements, gating
   - Crypto (jose) va en INFRA, no en CORE

3. **INFRA implementa interfaces**
   - Cada servicio externo tiene su adapter
   - Nombrado: `{Servicio}{Dominio}Adapter.ts`

4. **API sin lógica de negocio**
   - Route handlers solo orquestan: parsear → llamar CORE → responder
   - Validación de input con Zod en capa API

5. **UI sin reglas de negocio**
   - Componentes solo presentación
   - Lógica en hooks personalizados
   - Llamadas API via clients tipados

### Flujo de una Feature Nueva

```
1. Definir entidad en CORE         → shared/core/{domain}/entities.ts
2. Definir errores en CORE         → shared/core/{domain}/errors.ts
3. Crear caso de uso en CORE       → shared/core/{domain}/use-cases/{action}.ts
4. Implementar adapter en INFRA    → src/infra/{service}/{domain}-adapter.ts
5. Crear route handler en API      → app/api/{domain}/route.ts
6. Crear hook en feature           → src/features/{domain}/hooks/use-{action}.ts
7. Crear componente UI             → src/features/{domain}/components/{Name}.tsx
```

### Convenciones de Nombrado

| Tipo | Patrón | Ejemplo |
|------|--------|---------|
| Entidad | PascalCase | `User`, `Subscription` |
| Caso de uso | kebab-case archivo | `verify-payload.ts` → `verifyLicensePayload()` |
| Interface | I + PascalCase | `IAuthService`, `ILogsStore` |
| Adapter | Servicio + Dominio + Adapter | `FirebaseAuthAdapter` |
| Hook | use + acción | `useAuth`, `useLicense` |
| API client | dominio + Client | `authClient`, `licenseClient` |

## Project Structure

```
├── .mcp.json                        # MCP config for Claude Code
├── shared/                          # CORE compartido
│   ├── core/
│   │   ├── auth/                    # Identidad (User, Session)
│   │   ├── licensing/               # Tokens, entitlements
│   │   ├── billing/                 # Plans, limits
│   │   └── logs/                    # ConsoleLog, Recording
│   └── dist/                        # Compiled JS + .d.ts
├── frontend/                        # Next.js web
│   ├── src/
│   │   ├── infra/                   # Firebase, Stripe, JWT
│   │   └── features/                # auth, dashboard, billing
│   └── app/
│       └── api/                     # Route handlers
├── extension/
│   ├── mcp-server/src/
│   │   ├── index.js                 # MCP + HTTP startup
│   │   ├── http-bridge.js           # Express endpoints
│   │   ├── logs-store.js            # Core storage (generic)
│   │   └── config.js                # Configuration
│   └── chrome-extension/
│       ├── manifest.json
│       ├── content/                 # Console capture
│       ├── background/              # Service worker
│       └── sidepanel/               # UI
└── docs/                            # Documentation v2
    ├── ARCHITECTURE.md
    ├── MONETIZATION.md
    ├── ROADMAP.md
    ├── DECISIONS.md
    └── v1/                          # Technical docs v1
```

## Límites FREE vs PRO

| Aspecto | FREE | PRO |
|---------|------|-----|
| Logs por grabación | 100 | Ilimitado |
| Grabaciones | 5 (session only) | Ilimitado |
| Formatos | Plain text | Plain + TOON + JSON |
| MCP directo | No | Sí |
| Export | No | Sí |

**Upsell triggers**: Log #101, Grabación #6, Enable MCP, Export

## Commands

```bash
# From root directory (monorepo)
npm install             # Install all workspaces
npm run dev             # Run frontend dev server
npm run mcp             # Run MCP server
npm run build:shared    # Compile shared/core to shared/dist

# Individual workspaces
cd frontend && npm run dev          # Frontend dev server (localhost:3000)
cd extension/mcp-server && npm start # MCP server (localhost:9876)

# Chrome Extension
# Load unpacked from extension/chrome-extension/ in chrome://extensions
# After changes, click reload button in chrome://extensions
```

## Key Data Model

```typescript
// shared/core/logs/entities.ts
interface ConsoleLog {
  id: string;
  sessionId: string;
  recordingId?: string;
  type: 'log' | 'warn' | 'error' | 'info' | 'debug';
  args: string[];
  timestamp: number;
  url: string;
  source?: string;
}

// shared/core/licensing/entities.ts
interface LicensePayload {
  sub: string;           // userId
  plan: 'free' | 'pro' | 'pro_early';
  exp: number;           // Expiry timestamp
  iat: number;           // Issued at
  tokenId: string;       // For invalidation
}

// shared/core/billing/constants.ts
const FREE_LIMITS = { maxLogs: 100, maxRecordings: 5 };
const PRO_LIMITS = { maxLogs: Infinity, maxRecordings: Infinity };
```

## MCP Tools Available to Claude

- `get_console_logs` - Query logs with filters
- `get_console_stats` - Get log counts by type
- `clear_console_logs` - Clear logs

## Authentication & Entitlements

### Extension Auth (Firebase + chrome.identity)
- Anonymous-first: User gets Firebase anonymous UID on first open
- Google Sign-in via `chrome.identity.launchWebAuthFlow` (MV3 compatible)
- Files: `extension/chrome-extension/utils/auth.js`, `firebase-config.js`

### Entitlements API
```
GET /api/entitlements?installationId=xxx
Authorization: Bearer <firebase-id-token>  (optional)

Response: { plan, planEndsAt, daysRemaining, limits, canExtendTrial }
```

Priority: PRO (by userId) > TRIAL (by userId) > TRIAL (by installationId) > FREE

### Trial Extension Flow
1. User enters email → `POST /api/license/extend-trial-request` → Magic link sent
2. User clicks link → Web page shows 6-char one-time code
3. User enters code in extension → `POST /api/license/confirm-link-code` → Trial extended

### Anti-Abuse
- Disposable email blocking: `shared/core/auth/disposable-emails.ts`
- Rate limiting on extend-trial endpoints
- One-time codes expire in 15 minutes, single-use

## Key API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/entitlements` | Get user plan and limits |
| `POST /api/license/activate-trial` | Start trial |
| `POST /api/license/extend-trial-request` | Send magic link |
| `POST /api/license/confirm-link-code` | Validate one-time code |
| `POST /api/stripe/webhook` | Handle Stripe events |
| `POST /api/analytics` | Track events |

## Firestore Collections

| Collection | Purpose |
|------------|---------|
| `users` | User profiles + subscription status |
| `trials` | Trial licenses by installationId |
| `magic_links` | Email verification tokens |
| `confirm_codes` | One-time codes for trial extension |
| `analytics_events` | Tracked events |
| `pending_tokens` | License tokens awaiting pickup |

## Environment Variables

### Frontend Required
```
NEXT_PUBLIC_FIREBASE_*    # Firebase client config
FIREBASE_SERVICE_ACCOUNT_KEY  # Firebase Admin SDK (JSON)
STRIPE_SECRET_KEY         # Stripe API key
STRIPE_WEBHOOK_SECRET     # Stripe webhook signing
JWT_SECRET                # License token signing
RESEND_API_KEY           # Email sending
```

### Extension Required
Update `extension/chrome-extension/utils/firebase-config.js` with:
- Firebase config (matches NEXT_PUBLIC_FIREBASE_*)
- OAuth clientId (from Google Cloud Console, type "Web application")

## Documentation

Full documentation in `/docs/`:
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - InnerTech details
- [MONETIZATION.md](docs/MONETIZATION.md) - FREE vs PRO
- [ROADMAP.md](docs/ROADMAP.md) - Implementation phases
- [DECISIONS.md](docs/DECISIONS.md) - Technical decisions
