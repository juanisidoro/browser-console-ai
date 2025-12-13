# Roadmap de Implementación

> Checklist por fases con Definition of Done.

## Configuración Confirmada

| Aspecto | Valor |
|---------|-------|
| Límites FREE | 100 logs + 5 grabaciones |
| Upsell triggers | Log #101, grabación #6 |
| Formatos FREE | Solo Plain |
| Formatos PRO | Plain + TOON + JSON + Export |
| Grace period offline | 3 días |
| Token storage | `chrome.storage.local` |

---

## FASE 0: Fundación Arquitectura

**Objetivo**: Crear shared/core compilable y reglas en CLAUDE.md

### Estructura a crear

```
/shared
  /core
    /auth                    # SOLO identidad (Firebase login)
      entities.ts            # User, Session
    /licensing               # Token JWT + entitlements + gating
      entities.ts            # LicensePayload, Plan, VerifyResult, Entitlements
      errors.ts              # LicenseExpiredError, InvalidTokenError
      /use-cases
        generate-payload.ts  # generateLicensePayload(userId, plan)
        verify-payload.ts    # verifyLicensePayload(payload) - NO crypto
    /billing
      entities.ts            # Subscription, Price
      constants.ts           # FREE_LIMITS, PRO_LIMITS
    /logs
      entities.ts            # ConsoleLog, Recording, LogType
      /use-cases
        check-limits.ts      # checkLimits(plan, logCount, recordingCount)
        format-logs.ts       # formatLogs(logs, format)
    /index.ts                # Re-exports públicos
    tsconfig.json            # Config para compilar a /dist
  /dist                      # Output JS + .d.ts
  package.json               # name: "@browser-console-ai/shared"
```

### Tareas

- [ ] Crear estructura `/shared/core` con dominios separados
- [ ] Implementar entidades: User, Session, LicensePayload, Plan, Entitlements
- [ ] Implementar constantes: FREE_LIMITS (100 logs, 5 recs), PRO_LIMITS
- [ ] Implementar use-cases CORE (sin crypto):
  - `generateLicensePayload(userId, plan)` → payload object
  - `verifyLicensePayload(payload)` → VerifyResult (solo campos/expiry)
  - `checkLimits(plan, logCount, recordingCount)` → LimitResult
- [ ] Crear tsconfig.json para compilar a `/shared/dist`
- [ ] Crear script `build:shared` en package.json raíz
- [ ] Configurar alias `@shared/*` en frontend/tsconfig.json
- [ ] Configurar imports en extension
- [ ] Configurar imports en mcp-server
- [ ] Actualizar CLAUDE.md con reglas InnerTech
- [ ] Verificar: `npm run build:shared` genera /dist sin errores

### Definition of Done

- [ ] `/shared/dist` existe con JS + .d.ts
- [ ] `checkLimits('free', 100, 5)` → `{ allowed: true }`
- [ ] `checkLimits('free', 101, 5)` → `{ allowed: false, reason: 'log_limit' }`
- [ ] `checkLimits('free', 50, 6)` → `{ allowed: false, reason: 'recording_limit' }`
- [ ] `verifyLicensePayload({ exp: pastDate })` → `{ valid: false, reason: 'expired' }`
- [ ] CLAUDE.md tiene reglas de arquitectura
- [ ] Ningún archivo en /shared/core importa firebase/stripe/chrome/express/jose

---

## FASE 1: Firebase Auth (Web)

**Objetivo**: Login funcional con Google + email en Next.js

### Estructura a crear

```
/frontend/src
  /infra
    /firebase
      client.ts              # initializeApp, getAuth
      admin.ts               # Firebase Admin SDK (server)
    /auth
      firebase-adapter.ts    # Implementa lógica de auth
  /features
    /auth
      /components
        auth-provider.tsx    # Context + onAuthStateChanged
        login-form.tsx       # UI login
        user-menu.tsx        # Avatar + dropdown
      /hooks
        use-auth.ts          # useAuth() → { user, login, logout }
      /api
        auth-client.ts       # Calls a /api/auth/*

/frontend/app
  /[locale]/auth
    /login/page.tsx          # Página de login
    /callback/page.tsx       # Callback para extension
  /api
    /auth/session/route.ts   # GET: verificar sesión
    /users/ensure/route.ts   # POST: upsert user en Firestore
```

### Tareas

- [ ] Crear proyecto en Firebase Console
- [ ] Habilitar Auth: Email/Password + Google
- [ ] Crear Firestore database (production mode)
- [ ] Instalar deps: `firebase`, `firebase-admin`
- [ ] Crear `.env.local` con FIREBASE_* variables
- [ ] Crear INFRA: `firebase/client.ts`
- [ ] Crear INFRA: `firebase/admin.ts`
- [ ] Crear API: `/api/users/ensure/route.ts`
- [ ] Crear Feature: `auth/hooks/use-auth.ts`
- [ ] Crear Feature: `auth/components/auth-provider.tsx`
- [ ] Crear Feature: `auth/components/login-form.tsx`
- [ ] Crear Page: `/auth/login/page.tsx`
- [ ] Modificar Header: añadir UserMenu o Login button
- [ ] Crear Page: `/auth/callback/page.tsx`
- [ ] Añadir strings i18n: `messages/*.json`

### Definition of Done

- [ ] Usuario puede hacer login con Google
- [ ] Usuario puede hacer login con email/password
- [ ] Header muestra avatar cuando logueado
- [ ] Header muestra "Login" cuando no logueado
- [ ] `/auth/callback?token=xxx` funciona
- [ ] POST `/api/users/ensure` crea `users/{uid}` en Firestore
- [ ] Documento incluye: email, createdAt, subscription: { status: 'free' }

---

## FASE 2: Stripe + Pagos

**Objetivo**: Checkout funcional y webhooks sincronizando Firestore

### Estructura a crear

```
/frontend/src
  /infra
    /stripe
      client.ts              # Stripe SDK client-side
      server.ts              # Stripe SDK server-side
      webhooks.ts            # Handlers para eventos
  /features
    /billing
      /hooks
        use-subscription.ts
      /api
        billing-client.ts

/frontend/app/api
  /stripe
    /checkout/route.ts       # POST: crear checkout session
    /webhook/route.ts        # POST: recibir eventos Stripe
    /portal/route.ts         # POST: crear portal session
```

### Tareas

- [ ] Crear cuenta Stripe (test mode)
- [ ] Crear productos: "Pro Monthly" ($12), "Pro Yearly" ($99)
- [ ] Crear precio "Early Access" ($9/mes)
- [ ] Instalar dep: `stripe`
- [ ] Crear `.env.local`: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
- [ ] Crear INFRA: `stripe/server.ts`
- [ ] Crear API: `/api/stripe/checkout/route.ts`
- [ ] Crear API: `/api/stripe/webhook/route.ts`
- [ ] Crear API: `/api/stripe/portal/route.ts`
- [ ] Webhook: `checkout.session.completed` → crear subscription
- [ ] Webhook: `customer.subscription.updated` → actualizar status
- [ ] Webhook: `customer.subscription.deleted` → marcar cancelado
- [ ] Modificar Pricing page: botón Pro → checkout
- [ ] Test con Stripe CLI

### Definition of Done

- [ ] Usuario puede iniciar checkout desde pricing
- [ ] Pago test crea subscription en Firestore
- [ ] Webhook actualiza `users/{uid}.subscription.status = 'pro'`
- [ ] Cancelación actualiza status a 'canceled'

---

## FASE 3: Dashboard + Licencias

**Objetivo**: Dashboard PRO mínimo con token para extension

> **Nota**: PRO MVP = ilimitado local + MCP + formatos. Cloud history = post-tracción.

### Estructura a crear

```
/frontend/src
  /infra
    /licensing
      jwt-service.ts         # sign/verify con jose
  /features
    /dashboard
      /components
        subscription-card.tsx
        extension-token.tsx
        billing-button.tsx
      /hooks
        use-license.ts

/frontend/app
  /[locale]/dashboard/page.tsx
  /api/license
    /route.ts                # POST: genera JWT, GET: verifica
    /rotate/route.ts         # POST: invalida + genera nuevo
```

### Tareas

- [ ] Instalar dep: `jose`
- [ ] Crear INFRA: `licensing/jwt-service.ts`
- [ ] Crear API: `/api/license/route.ts`
- [ ] Crear API: `/api/license/rotate/route.ts`
- [ ] Crear Feature: `dashboard/components/subscription-card.tsx`
- [ ] Crear Feature: `dashboard/components/extension-token.tsx`
- [ ] Crear Feature: `dashboard/hooks/use-license.ts`
- [ ] Crear Page: `/dashboard/page.tsx` (protected)
- [ ] UI: mostrar plan (FREE/PRO/EARLY ACCESS)
- [ ] UI: token (oculto, botón copiar)
- [ ] UI: botón "Rotate token"
- [ ] UI: botón "Manage billing"
- [ ] Añadir strings i18n

### Definition of Done

- [ ] Usuario PRO ve plan y token en dashboard
- [ ] Token JWT tiene: userId, plan, exp (7 días), iat
- [ ] "Copy token" funciona
- [ ] "Rotate token" invalida + genera nuevo
- [ ] "Manage billing" abre Stripe Portal
- [ ] Usuario FREE ve "Upgrade to PRO"

---

## FASE 4: Extension FREE vs PRO

**Objetivo**: Límites FREE + upsell modals + validación token

### Tareas

- [ ] Modificar `service-worker.js`: contador logs, límite 100
- [ ] Modificar historial: límite 5 grabaciones
- [ ] Añadir sección "Account" en sidepanel
- [ ] Crear upsell modal: "Log limit reached" (log #101)
- [ ] Crear upsell modal: "Recording limit reached" (grabación #6)
- [ ] Crear upsell modal: "MCP requires PRO"
- [ ] Guardar token en `chrome.storage.local`
- [ ] Validar token al iniciar (grace 3 días offline)
- [ ] UI: mostrar plan actual (FREE/PRO badge)

### Definition of Done

- [ ] Log #101 muestra upsell modal
- [ ] Grabación #6 muestra upsell modal
- [ ] Usuario FREE no puede usar MCP
- [ ] Token PRO válido habilita todas las features
- [ ] Token expirado + 3 días offline → downgrade FREE

---

## FASE 5: MCP Server Auth

**Objetivo**: Middleware que valida JWT en requests

### Tareas

- [ ] Crear `auth-middleware.js` (verifica JWT)
- [ ] Aplicar middleware a endpoints PRO
- [ ] FREE: bloquear MCP tools
- [ ] PRO: acceso completo
- [ ] Logging para debugging

### Definition of Done

- [ ] Request sin token → 401
- [ ] Request con token inválido → 401
- [ ] Request con token PRO válido → 200 + datos

---

## FASE 6: Testing + Launch

### Tareas

- [ ] Test E2E: registro → pago → dashboard → extension → MCP
- [ ] Verificar números coherentes en toda la UI
- [ ] Publicar extensión en Chrome Web Store
- [ ] Deploy Vercel producción
- [ ] Configurar dominio
- [ ] Soft launch con early access price

### Definition of Done

- [ ] Flujo completo funciona sin errores
- [ ] Extensión publicada
- [ ] Web en producción
- [ ] Al menos 1 pago real procesado
