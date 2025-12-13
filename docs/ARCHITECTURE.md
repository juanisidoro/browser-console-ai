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
│ - chrome.storage│  │ - LogsStore     │  │ - Firebase      │
│ - fetch API     │  │ - Express       │  │ - Stripe        │
│                 │  │ - JWT verify    │  │ - Firestore     │
│ UI:             │  │                 │  │                 │
│ - Side Panel    │  │ API:            │  │ API:            │
│ - Upsell Modals │  │ - MCP Tools     │  │ - Route Handlers│
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

## Estructura de Capas

| Capa | Ubicación | Responsabilidad | Puede importar |
|------|-----------|-----------------|----------------|
| CORE | `/shared/core` | Lógica de negocio pura | Nada externo |
| INFRA | `*/infra/` | Implementaciones técnicas | CORE |
| API | `*/api/` o `/app/api` | Entrada HTTP/MCP | CORE + INFRA |
| UI | `/features/*/components` | Presentación | Hooks + API client |

## Estructura de Carpetas

```
/shared                          # CORE compartido entre runtimes
  /core
    /auth                        # SOLO identidad (Firebase login)
      entities.ts                # User, Session
    /licensing                   # Token JWT + entitlements + gating
      entities.ts                # LicensePayload, Plan, VerifyResult
      errors.ts                  # LicenseExpiredError, InvalidTokenError
      /use-cases
        generate-payload.ts      # generateLicensePayload(userId, plan)
        verify-payload.ts        # verifyLicensePayload(payload)
    /billing
      entities.ts                # Subscription, Price
      constants.ts               # FREE_LIMITS, PRO_LIMITS
    /logs
      entities.ts                # ConsoleLog, Recording, LogType
      /use-cases
        check-limits.ts          # checkLimits(plan, count)
        format-logs.ts           # formatLogs(logs, format)
    /index.ts                    # Re-exports públicos
    tsconfig.json                # Config para compilar a /dist
  /dist                          # Output JS + .d.ts

/frontend                        # Next.js (Edge/Node runtime)
  /src
    /infra
      /firebase/                 # Firebase SDK
      /stripe/                   # Stripe SDK
      /auth/                     # Auth adapters
      /licensing/                # JWT service (jose)
    /features
      /auth/components/hooks/api/
      /dashboard/components/hooks/
      /billing/hooks/api/
    /app
      /api/                      # Route Handlers

/extension
  /chrome-extension
    /infra/storage/              # chrome.storage adapter
    /infra/api/                  # API clients
    /ui/sidepanel/               # UI components

  /mcp-server
    /src
      /infra/                    # LogsStore, JWT validator
      /api/                      # HTTP bridge, MCP tools
```

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
// app/api/license/route.ts
import { generateLicensePayload } from '@shared/core/licensing/use-cases/generate-payload';
import { signToken } from '@/infra/licensing/jwt-service';
import { getSubscription } from '@/infra/firebase/firestore';

export async function POST(req: Request) {
  const { userId } = await req.json();

  // INFRA: obtener datos
  const subscription = await getSubscription(userId);

  // CORE: lógica de negocio
  const payload = generateLicensePayload(userId, subscription.plan);

  // INFRA: firmar token
  const token = await signToken(payload);

  // API: responder
  return Response.json({ token });
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

## Flujo de Dependencias

```
UI (components)
  → hooks (useAuth, useLicense)
    → API client (authClient.login())
      → Route Handler (/api/auth)
        → CORE use-case (generateLicensePayload)
        → INFRA adapter (JwtService, Firebase)
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
