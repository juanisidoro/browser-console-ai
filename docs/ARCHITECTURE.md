# Arquitectura InnerTech

> Clean Architecture + Hexagonal pragmático para 3 runtimes.

## Contexto: 3 Runtimes, 1 Lógica de Negocio

```
┌─────────────────────────────────────────────────────────────────┐
│                        SHARED CORE                               │
│  (Lógica de negocio pura, sin dependencias de runtime)          │
│  - Entidades: User, Subscription, License, ConsoleLog           │
│  - Casos de uso: ValidateLicense, CheckLimits, GeneratePayload  │
│  - Interfaces (Ports): ILicenseValidator, ILogsStore            │
└─────────────────────────────────────────────────────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   BROWSER       │  │     NODE        │  │   EDGE/NODE     │
│   (Extension)   │  │   (MCP Server)  │  │   (Next.js)     │
│                 │  │                 │  │                 │
│ INFRA:          │  │ INFRA:          │  │ INFRA:          │
│ - Firebase SDK  │  │ - LogsStore     │  │ - Firebase Admin│
│ - chrome.identity│ │ - Express       │  │ - Stripe        │
│ - chrome.storage│  │ - TOON encoder  │  │ - Firestore     │
│                 │  │                 │  │ - jose (JWT)    │
│ UI:             │  │                 │  │                 │
│ - Side Panel    │  │ API:            │  │ API:            │
│ - Auth Forms    │  │ - MCP Tools     │  │ - Route Handlers│
│ - Upsell Modals │  │ - HTTP Bridge   │  │ - Webhooks      │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

## Estructura de Capas

| Capa | Ubicación | Responsabilidad | Puede importar |
|------|-----------|-----------------|----------------|
| CORE | `/shared/core` | Lógica de negocio pura | Nada externo |
| INFRA | `*/infra/` | Implementaciones técnicas | CORE |
| API | `*/api/` o `/app/api` | Entrada HTTP/MCP | CORE + INFRA |
| UI | `/features/*/components` | Presentación | Hooks + API client |

## Estructura de Carpetas Actual

```
/shared                          # CORE compartido entre runtimes
  /core
    /auth                        # Identidad (Firebase Auth)
      entities.ts                # User, Session
      disposable-emails.ts       # Lista de emails desechables
    /licensing                   # Token JWT + entitlements + gating
      entities.ts                # LicensePayload, Plan, Entitlements
      errors.ts                  # LicenseExpiredError, InvalidTokenError
      /use-cases
        verify-payload.ts        # verifyLicensePayload(payload)
    /billing
      entities.ts                # Subscription, Price
      constants.ts               # FREE_LIMITS, PRO_LIMITS, TRIAL_LIMITS
    /logs
      entities.ts                # ConsoleLog, Recording, LogType
  /dist                          # Output JS + .d.ts

/frontend                        # Next.js (Edge/Node runtime)
  /src
    /infra
      /firebase                  # Firebase SDK (client + admin)
      /stripe                    # Stripe SDK
      /auth                      # Auth adapters
      /licensing                 # JWT service (jose)
    /features
      /auth                      # Login, register, session
      /dashboard                 # User dashboard, settings
      /billing                   # Checkout, portal
      /admin                     # Admin panel (analytics, users)
  /app
    /api                         # Route Handlers
      /auth                      # Session management
      /entitlements              # GET entitlements
      /license                   # Token generation, extend-trial
      /stripe                    # Checkout, webhooks, portal
      /analytics                 # Event tracking
      /admin                     # Admin endpoints

/extension
  /chrome-extension
    /manifest.json               # MV3 manifest
    /lib                         # Local Firebase SDK (CSP compliance)
      firebase-app-compat.js
      firebase-auth-compat.js
    /utils
      firebase-config.js         # Firebase + OAuth config
      auth.js                    # Firebase Auth + chrome.identity
      license.js                 # License validation + entitlements
      analytics.js               # Event tracking
      storage-utils.js           # chrome.storage helpers
    /content
      console-capture.js         # Content script
      injected.js                # Injected into page context
    /background
      service-worker.js          # MV3 service worker
    /sidepanel
      sidepanel.html             # UI entry point
      sidepanel.js               # UI logic
      sidepanel.css              # Styles

  /mcp-server
    /src
      index.js                   # MCP + HTTP startup
      http-bridge.js             # Express endpoints
      logs-store.js              # In-memory log storage
      config.js                  # Configuration
      toon-encoder.js            # TOON format encoder
```

## Sistema de Autenticación

### Anonymous-First en Extension

La extensión usa un patrón "anonymous-first" con Firebase Auth:

```
┌──────────────────────────────────────────────────────────────┐
│                    Extension Auth Flow                        │
├──────────────────────────────────────────────────────────────┤
│  1. Install/First Open                                        │
│     └─> ensureInstallationId() → UUID en chrome.storage       │
│     └─> signInAnonymously() → uid Firebase anónimo            │
│                                                               │
│  2. User Links Account (optional)                             │
│     └─> Google: chrome.identity.launchWebAuthFlow             │
│         └─> id_token → GoogleAuthProvider.credential          │
│         └─> linkWithCredential (o signInWithCredential)       │
│     └─> Email: sendSignInLinkToEmail (magic link)             │
│                                                               │
│  3. Result                                                    │
│     └─> Same uid preserved (if linked)                        │
│     └─> Entitlements updated based on userId                  │
└──────────────────────────────────────────────────────────────┘
```

### Chrome Extension OAuth (MV3)

MV3 no permite `signInWithPopup`. Usamos `chrome.identity.launchWebAuthFlow`:

```javascript
// En auth.js
async function getGoogleIdToken() {
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', FIREBASE_CONFIG.clientId);
  authUrl.searchParams.set('redirect_uri', chrome.identity.getRedirectURL());
  authUrl.searchParams.set('response_type', 'id_token');
  authUrl.searchParams.set('scope', 'openid email profile');

  return new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      { url: authUrl.toString(), interactive: true },
      (responseUrl) => {
        const url = new URL(responseUrl);
        const params = new URLSearchParams(url.hash.substring(1));
        resolve(params.get('id_token'));
      }
    );
  });
}
```

Requisitos OAuth:
- OAuth Client ID tipo "Web application" en Google Cloud Console
- Redirect URI: `https://<extension-id>.chromiumapp.org/`
- Permiso `identity` en manifest.json

## Sistema de Entitlements

### Flujo de Entitlements

```
┌─────────────────────────────────────────────────────────────────┐
│                     Entitlements API                             │
├─────────────────────────────────────────────────────────────────┤
│  GET /api/entitlements                                          │
│                                                                  │
│  Input:                                                          │
│    - Bearer token (Firebase ID token)                           │
│    - ?installationId=xxx (extension)                            │
│    - ?browserId=xxx (web anonymous)                             │
│                                                                  │
│  Output:                                                         │
│    {                                                             │
│      plan: 'free' | 'trial' | 'pro',                            │
│      planEndsAt: number | null,                                 │
│      daysRemaining: number | null,                              │
│      limits: { maxLogs, maxRecordings, ... },                   │
│      canExtendTrial: boolean,                                   │
│      requiresAuth: boolean                                      │
│    }                                                             │
│                                                                  │
│  Priority:                                                       │
│    1. PRO by userId (Stripe subscription) → plan=pro            │
│    2. TRIAL by userId (extended) → plan=trial, +3/+6 days       │
│    3. TRIAL by installationId (base) → plan=trial, 3 days       │
│    4. Default → plan=free                                       │
└─────────────────────────────────────────────────────────────────┘
```

### Identidades

| Runtime | Identidad Primaria | Identidad Secundaria |
|---------|-------------------|---------------------|
| Extension | installationId (UUID) | userId (uid Firebase) |
| Web logged-in | userId (uid) | - |
| Web anonymous | browserId (UUID) | - |

## Reglas Obligatorias

### 1. CORE es sagrado

```typescript
// ✅ CORRECTO - Lógica pura, sin deps externas
export function checkLimits(plan: Plan, logCount: number): LimitResult {
  const limits = plan === 'free' ? FREE_LIMITS : PRO_LIMITS;
  return {
    allowed: logCount < limits.maxLogs,
    remaining: limits.maxLogs - logCount
  };
}

// ❌ INCORRECTO - No importar Firebase/Chrome/Express/Jose en CORE
import { auth } from 'firebase/auth';     // PROHIBIDO
import { SignJWT } from 'jose';           // PROHIBIDO (crypto va en INFRA)
```

### 2. Separación auth vs licensing

- **auth/** = identidad pura (quién eres): User, Session
- **licensing/** = permisos (qué puedes hacer): tokens, entitlements, gating
- CORE solo maneja payload y reglas. **Crypto (jose) va en INFRA**.

### 3. INFRA implementa interfaces

```typescript
// frontend/src/infra/auth/firebase-auth-adapter.ts
import { IAuthService, User } from '@shared/core/auth/interfaces';
import { auth } from '../firebase/client';

export class FirebaseAuthAdapter implements IAuthService {
  async getCurrentUser(): Promise<User | null> {
    const fbUser = auth.currentUser;
    if (!fbUser) return null;
    return { id: fbUser.uid, email: fbUser.email! };
  }
}
```

### 4. API sin lógica de negocio

```typescript
// app/api/entitlements/route.ts
export async function GET(req: Request) {
  // AUTH: verificar token
  const user = await verifyAuth(req);

  // INFRA: obtener datos
  const subscription = await getSubscription(user.uid);
  const trials = await getTrials(user.uid, installationId);

  // CORE: calcular entitlements
  const entitlements = calculateEntitlements(subscription, trials);

  // API: responder
  return Response.json(entitlements);
}
```

### 5. UI sin reglas de negocio

```typescript
// features/auth/components/login-form.tsx
'use client';
import { useAuth } from '../hooks/use-auth';

export function LoginForm() {
  const { login, isLoading, error } = useAuth();

  // Solo presentación, lógica en hook
  return (
    <form onSubmit={(e) => { e.preventDefault(); login(); }}>
      {error && <p className="text-red-500">{error}</p>}
      <Button disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Login with Google'}
      </Button>
    </form>
  );
}
```

## Firebase SDK en Extension (MV3)

Manifest V3 tiene CSP restrictivo que bloquea scripts externos. Solución:

1. **SDK Local**: Firebase SDK descargado en `/lib/`
2. **Compat Version**: Usar `firebase-*-compat.js` (no modular)
3. **Script Loading**: Cargar en sidepanel.html antes de otros scripts

```html
<!-- sidepanel.html -->
<script src="../lib/firebase-app-compat.js"></script>
<script src="../lib/firebase-auth-compat.js"></script>
<script src="../utils/firebase-config.js"></script>
<script src="../utils/auth.js"></script>
```

## Flujo de Dependencias

```
UI (components)
  → hooks (useAuth, useLicense)
    → API client (authClient.login())
      → Route Handler (/api/auth)
        → CORE use-case (calculateEntitlements)
        → INFRA adapter (Firebase, Stripe)
```

## Flujo de una Feature Nueva

```
1. Definir entidad en CORE         → shared/core/{domain}/entities.ts
2. Definir errores en CORE         → shared/core/{domain}/errors.ts
3. Crear caso de uso en CORE       → shared/core/{domain}/use-cases/{action}.ts
4. Implementar adapter en INFRA    → src/infra/{service}/{domain}-adapter.ts
5. Crear route handler en API      → app/api/{domain}/route.ts
6. Crear hook en feature           → src/features/{domain}/hooks/use-{action}.ts
7. Crear componente UI             → src/features/{domain}/components/{Name}.tsx
```

## Convenciones de Nombrado

| Tipo | Patrón | Ejemplo |
|------|--------|---------|
| Entidad | PascalCase | `User`, `Subscription` |
| Caso de uso | kebab-case archivo | `verify-payload.ts` → `verifyLicensePayload()` |
| Interface | I + PascalCase | `IAuthService`, `ILogsStore` |
| Adapter | Servicio + Dominio + Adapter | `FirebaseAuthAdapter` |
| Hook | use + acción | `useAuth`, `useLicense` |
| API client | dominio + Client | `authClient`, `licenseClient` |

## Errores por Capa

```typescript
// CORE - Errores de dominio
export class LicenseExpiredError extends Error {
  constructor() { super('License has expired'); }
}

// INFRA - Errores técnicos envueltos
try { await firebase.auth() }
catch (e) { throw new AuthServiceError('Firebase auth failed', e); }

// API - Mapeo a HTTP
if (error instanceof LicenseExpiredError) {
  return Response.json({ error: 'license_expired' }, { status: 401 });
}
```

## Lo que NO hacemos en MVP

- Event sourcing / CQRS
- Dependency injection containers
- Domain events
- Factories complejas
- Repositorios abstractos (usamos adapters directos)
- Límite de dispositivos (post-tracción)
