# Decisiones Técnicas y de Producto

> Registro de decisiones tomadas para Browser Console AI.

## Producto

| Decisión | Valor | Razón |
|----------|-------|-------|
| Modelo de negocio | Freemium + Trial | Valor primero, fricción después |
| Killer feature PRO | MCP directo | Diferenciador claro vs copy/paste |
| Early access price | $9/mes | Validar willingness to pay |
| Regular price | $12/mes | Balance accesibilidad/valor |
| Trial duration | 3 días base + 3 extend | Suficiente para evaluar |
| Cloud history | Post-MVP | Simplificar lanzamiento |

## Límites FREE/TRIAL/PRO

| Aspecto | FREE | TRIAL | PRO |
|---------|------|-------|-----|
| Logs por grabación | 100 | 500 | Ilimitado |
| Grabaciones | 5 (session only) | 20 | Ilimitado |
| Formatos | Plain text | Plain + TOON + JSON | Todos |
| MCP directo | No | Sí | Sí |
| Export archivo | No | Sí | Sí |
| Duración | Permanente | 3-6 días | Suscripción |

### Upsell Triggers

| Trigger | Momento exacto |
|---------|----------------|
| Logs | Log #101 (FREE), #501 (TRIAL) |
| Grabaciones | Grabación #6 (FREE), #21 (TRIAL) |
| MCP | Al intentar activar (FREE) |
| Export | Al pulsar botón (FREE) |
| Formatos | Al seleccionar TOON/JSON (FREE) |

## Arquitectura

| Decisión | Valor | Razón |
|----------|-------|-------|
| Arquitectura | InnerTech (Clean + Hexagonal) | Consistencia 3 runtimes |
| Shared core | `/shared/core` compilado a `/dist` | Portabilidad entre runtimes |
| Separar auth/licensing | Sí | Auth = identidad, licensing = permisos |
| Crypto en CORE | No | CORE puro, jose en INFRA |
| Users desde cliente | No | Server-side via `/api/users/ensure` |

## Autenticación

| Decisión | Valor | Razón |
|----------|-------|-------|
| Auth provider | Firebase Auth | Simple, escalable, SDKs disponibles |
| Extension auth | Anonymous-first | Tracking desde día 0, conversión sin fricción |
| OAuth en MV3 | chrome.identity.launchWebAuthFlow | signInWithPopup bloqueado por CSP |
| OAuth response | id_token (no access_token) | Suficiente para Firebase credential |
| Account linking | linkWithCredential | Preserva mismo uid |
| Firebase SDK en extension | Local (compat) | CSP de MV3 bloquea CDN |

### OAuth Configuration

| Aspecto | Valor |
|---------|-------|
| OAuth Client Type | Web application (NO Chrome Extension) |
| Redirect URI | `https://<extension-id>.chromiumapp.org/` |
| Response type | id_token |
| Scopes | openid, email, profile |

## Entitlements

| Decisión | Valor | Razón |
|----------|-------|-------|
| Entitlements separado de auth | Sí | Desacoplar identidad de permisos |
| Endpoint dedicado | GET /api/entitlements | Claridad, cacheabilidad |
| Prioridad de plan | PRO > TRIAL(user) > TRIAL(install) > FREE | Siempre el mejor plan disponible |
| Cache duration | 1 hora | Balance entre frescura y performance |
| Invalidación | Al cambiar auth, confirmar trial, upgrade | Entitlements siempre actualizados |

### Identidades por Runtime

| Runtime | Identidad Primaria | Identidad Secundaria |
|---------|-------------------|---------------------|
| Extension | installationId (UUID) | userId (uid Firebase, siempre presente) |
| Web logged-in | userId (uid) | - |
| Web anonymous | browserId (UUID) | - |

## Trial System

| Decisión | Valor | Razón |
|----------|-------|-------|
| Trial base | 3 días por installationId | Incentivar vincular cuenta |
| Trial extendido | +3 días por vincular email/Google | Reducir fricción, aumentar conversión |
| Fuente de trial | Extension install o web signup | Flexibilidad |
| Trial por userId | Sí, si vincula cuenta | Hereda trial en otras instalaciones |

## Seguridad MVP

| Decisión | Valor | Razón |
|----------|-------|-------|
| Token JWT expiry | 7 días | Balance seguridad/UX |
| Token refresh | Automático si 401 → getIdToken(true) | Sin fricción |
| Token storage | `chrome.storage.local` | Más robusto que sync |
| Device fingerprint | Post-MVP | Simplificar lanzamiento |
| Límite dispositivos | Post-MVP | Complejidad alta, valor bajo |

### Anti-Abuso

| Medida | Estado | Descripción |
|--------|--------|-------------|
| Disposable email block | Pendiente | Lista de dominios temporales |
| Rate limiting | Pendiente | Límite por IP/user en endpoints |
| One-time codes | Pendiente | Para vincular extension ↔ web |
| Device signals | Post-MVP | Hash de características del dispositivo |

## Stack Tecnológico

| Componente | Decisión | Razón |
|------------|----------|-------|
| Frontend | Next.js 15 + React 19 | Ya existente, App Router |
| Auth | Firebase Auth | Simple, escalable |
| Database | Firestore | Sin backend separado |
| Pagos | Stripe | Estándar industria |
| JWT | jose | Ligero, bien mantenido |
| Styling | Tailwind + shadcn/ui | Ya existente |
| MCP Server | Node.js + Express | Compatible con stdio MCP |
| Extension | Manifest V3 | Requerido por Chrome Web Store |

## MCP Server

| Decisión | Valor | Razón |
|----------|-------|-------|
| Puerto HTTP | 9876 (configurable) | Puerto poco común, evita conflictos |
| Storage | In-memory | Simplicidad, logs son efímeros |
| Formato output | TOON + Plain + JSON | Balance concisión/legibilidad |
| Session isolation | Sí | Cada tab/recording separado |

### TOON Format

Formato compacto inspirado en logs de servidor:

```
[14:32:05] LOG  App started
[14:32:06] ERR  Failed to fetch: 404
[14:32:07] WARN Memory usage high
```

## Lo que NO hacemos en MVP

| Característica | Razón |
|----------------|-------|
| CQRS | Overkill para 4 casos de uso |
| Domain Events | Sin flujos async complejos |
| DI Containers | Adapters directos suficientes |
| Límite dispositivos | Complejidad alta |
| Cloud history | Team plan post-tracción |
| Analytics dashboard externo | El producto es la extensión |
| Tests E2E extensión | Manual en MVP |
| Email verification | Trial sin email, vincular después |

## Privacy & Compliance

| Decisión | Valor | Razón |
|----------|-------|-------|
| GDPR consent | Opt-in analytics | Requerido en EU |
| CCPA consent | Opt-out marketing | Requerido en CA |
| Consent storage | Firestore | Auditable |
| Consent version | Versionado (e.g., "1.0") | Rastrear cambios |

## Foco MVP

El objetivo del MVP es responder:

1. **¿Entienden el valor?** → Medir uso de captura
2. **¿MCP cambia su workflow?** → Medir conversión MCP
3. **¿Pagan?** → Medir checkout completados
4. **¿Vuelven?** → Medir retention 7/30 días

Todo lo demás es secundario hasta validar estas preguntas.

## Decisiones Recientes

### 2024-01 - Anonymous-First Auth

**Contexto**: Necesitábamos tracking fiable desde el día 0, sin requerir registro.

**Decisión**: Usar `signInAnonymously()` de Firebase al abrir la extensión por primera vez.

**Beneficios**:
- userId siempre disponible (nunca null)
- Tracking perfecto pre/post registro
- Account linking preserva historial
- Trial automático por installationId

### 2024-01 - chrome.identity para OAuth

**Contexto**: MV3 bloquea `signInWithPopup` por CSP.

**Decisión**: Usar `chrome.identity.launchWebAuthFlow` con id_token.

**Detalles**:
- OAuth Client ID tipo "Web application"
- Redirect URI: `https://<extension-id>.chromiumapp.org/`
- Response type: id_token (no access_token)
- Credential: `GoogleAuthProvider.credential(idToken)`

### 2024-01 - Firebase SDK Local

**Contexto**: CSP de MV3 bloquea scripts de CDN.

**Decisión**: Descargar Firebase SDK (compat version) a `/lib/`.

**Archivos**:
- `lib/firebase-app-compat.js`
- `lib/firebase-auth-compat.js`

### 2024-01 - Entitlements API

**Contexto**: Confusión entre token auth y permisos (plan, límites).

**Decisión**: Endpoint dedicado `GET /api/entitlements`.

**Output**:
```typescript
{
  plan: 'free' | 'trial' | 'pro',
  planEndsAt: number | null,
  daysRemaining: number | null,
  limits: { maxLogs, maxRecordings, formats, mcpEnabled, exportEnabled },
  canExtendTrial: boolean,
  requiresAuth: boolean
}
```
