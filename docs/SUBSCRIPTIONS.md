# Subscriptions, Trials & Billing

Este documento detalla el sistema de suscripciones, trials y control de pagos.

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ENTITLEMENTS FLOW                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Extension/Web                                                       │
│       │                                                              │
│       ▼                                                              │
│  GET /api/entitlements ─────────────────────────────────────────┐   │
│       │                                                          │   │
│       ├─> Check PRO subscription (Stripe) ────> plan=pro        │   │
│       ├─> Check Trial by userId ──────────────> plan=trial      │   │
│       ├─> Check Trial by installationId ──────> plan=trial      │   │
│       └─> Default ────────────────────────────> plan=free       │   │
│                                                                  │   │
│  Stripe Webhooks ───────────────────────────────────────────────┘   │
│       │                                                              │
│       ▼                                                              │
│  Firestore                                                           │
│  ├── users/{uid}/subscription                                       │
│  └── trials/{trialId}                                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Sistema de Trials

### Tipos de Trial

| Tipo | Duración | Condición | Límites |
|------|----------|-----------|---------|
| Trial base | 3 días | Auto al instalar | 500 logs, 20 recs, MCP |
| Trial extendido | 6 días | Vincular email/Google | Mismos límites |
| Trial web | 6 días | Signup en web | Mismos límites |

### Flujo de Trial

```
┌─────────────────────────────────────────────────────────────────┐
│                     TRIAL LIFECYCLE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. INICIO (automático)                                          │
│     └─> Extension install → signInAnonymously                   │
│     └─> Crear trial en Firestore                                │
│     └─> installationId + userId + 3 días                        │
│                                                                  │
│  2. EXTENSIÓN (opcional)                                         │
│     └─> Usuario vincula cuenta (Google/Email)                   │
│     └─> linkWithCredential preserva uid                         │
│     └─> Trial extendido +3 días                                 │
│     └─> trial.extended = true                                   │
│                                                                  │
│  3. EXPIRACIÓN                                                   │
│     └─> planEndsAt < now                                        │
│     └─> Entitlements devuelve plan=free                         │
│     └─> UI muestra upsell modal                                 │
│                                                                  │
│  4. CONVERSIÓN                                                   │
│     └─> Usuario hace checkout                                   │
│     └─> Stripe webhook actualiza subscription                   │
│     └─> Trial.status = 'converted'                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Endpoints de Trial

**POST /api/license/extend-trial-request**

```typescript
// Input
{
  installationId: string;
  email: string;
}

// Output
{
  success: true;
  message: 'Email sent';
}

// Errores
{ error: 'disposable_email' }      // Email desechable bloqueado
{ error: 'already_extended' }      // Trial ya extendido
{ error: 'rate_limited' }          // Muchos intentos
```

**POST /api/license/extend-trial** (Google OAuth)

```typescript
// Input (Bearer token requerido)
{
  installationId: string;
}

// Output
{
  success: true;
  newExpiresAt: number;
  daysRemaining: number;
}
```

## Stripe Billing

### Flujo de Suscripción

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Stripe API    │────▶│   Webhook       │
│   (Checkout)    │     │   (Checkout)    │     │   (Sync DB)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                                              │
         ▼                                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Firestore                                 │
│   users/{uid}/subscription: { status, stripeCustomerId, ... }   │
└─────────────────────────────────────────────────────────────────┘
```

### Checkout

**Endpoint:** `POST /api/stripe/checkout`

**Validaciones:**
- Usuario autenticado (Bearer token)
- No tiene suscripción PRO activa

```typescript
// Request
{
  priceId?: string;  // Opcional, default: PRO_EARLY
}

// Response
{
  url: string;  // Stripe Checkout URL
}

// Errores
{ error: 'You already have an active subscription.' }  // 400
{ error: 'Unauthorized' }                               // 401
```

### Webhooks

**Endpoint:** `POST /api/stripe/webhook`

| Evento | Acción |
|--------|--------|
| `checkout.session.completed` | Activa suscripción PRO |
| `customer.subscription.updated` | Actualiza plan/estado |
| `customer.subscription.deleted` | Downgrade a FREE |
| `invoice.payment_failed` | Log para retry |

**Procesamiento de checkout.session.completed:**

```typescript
async function handleCheckoutCompleted(session) {
  const { firebaseUid } = session.metadata;
  const subscriptionId = session.subscription;

  // Obtener detalles de suscripción
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Determinar plan
  const plan = determinePlan(subscription.items.data[0].price.id);

  // Actualizar Firestore
  await db.doc(`users/${firebaseUid}`).update({
    'subscription.status': plan,
    'subscription.stripeCustomerId': session.customer,
    'subscription.stripeSubscriptionId': subscriptionId,
    'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
    'subscription.cancelAtPeriodEnd': subscription.cancel_at_period_end,
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Marcar trial como convertido
  await markTrialConverted(firebaseUid);
}
```

### Customer Portal

**Endpoint:** `POST /api/stripe/portal`

Permite al usuario:
- Ver historial de facturas
- Actualizar método de pago
- Cancelar suscripción
- Ver próxima fecha de cobro

```typescript
// Request (Bearer token requerido)
{}

// Response
{
  url: string;  // Stripe Portal URL
}
```

## Modelo de Datos (Firestore)

### users/{uid}

```typescript
{
  subscription: {
    status: 'free' | 'trial' | 'pro' | 'pro_early' | 'canceled' | 'past_due',
    plan?: 'monthly' | 'yearly',
    stripeCustomerId?: string,
    stripeSubscriptionId?: string,
    currentPeriodStart?: Timestamp,
    currentPeriodEnd?: Timestamp,
    cancelAtPeriodEnd?: boolean
  },
  trial?: {
    startedAt: Timestamp,
    expiresAt: Timestamp,
    source: 'extension' | 'web',
    extended: boolean,
    extendedAt?: Timestamp
  }
}
```

### trials/{trialId}

```typescript
{
  installationId?: string,
  browserId?: string,
  userId?: string,
  status: 'active' | 'expired' | 'converted',
  startedAt: Timestamp,
  expiresAt: Timestamp,
  extended: boolean,
  extendedAt?: Timestamp,
  extendedVia?: 'email' | 'google'
}
```

## Subscription Status Flow

```
                                 TRIAL
                              (3-6 días)
                                  │
                                  │ checkout
                                  ▼
┌─────────┐                ┌─────────────┐
│  FREE   │ ◄──────────────│  PRO_EARLY  │
└─────────┘   expired/     └─────────────┘
     ▲        canceled            │
     │                            │ price change
     │                            ▼
     │                     ┌─────────────┐
     │                     │     PRO     │
     │                     └─────────────┘
     │                            │
     │                            │ payment fails
     │                            ▼
     │                     ┌─────────────┐
     └─────────────────────│  PAST_DUE   │
           grace period    └─────────────┘
           ends                   │
                                  │ subscription deleted
                                  ▼
                           ┌─────────────┐
                           │  CANCELED   │
                           └─────────────┘
```

## Control de Errores

### Prevención de Duplicados

| Capa | Validación |
|------|------------|
| **Checkout** | Bloquea si ya tiene PRO |
| **Webhook** | Usa stripeSubscriptionId único |
| **Trial extend** | Bloquea si trial.extended = true |

### Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `No such price` | Price ID incorrecto | Verificar env vars |
| `Invalid signature` | WEBHOOK_SECRET incorrecto | Regenerar con stripe listen |
| `already_extended` | Usuario ya extendió trial | Mostrar mensaje apropiado |
| `disposable_email` | Email temporal | Pedir email real |

## Variables de Entorno

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO_EARLY=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...

# Trial
TRIAL_BASE_DAYS=3
TRIAL_EXTENDED_DAYS=6
```

## Testing Local

```bash
# Terminal 1: Stripe CLI
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Terminal 2: Next.js
npm run dev
```

**Tarjeta de prueba:** `4242 4242 4242 4242`

## Checklist Pre-Producción

- [ ] Cambiar a Stripe API keys LIVE
- [ ] Crear productos/precios en modo LIVE
- [ ] Configurar webhook en Stripe Dashboard
- [ ] Verificar STRIPE_WEBHOOK_SECRET de producción
- [ ] Probar flujo completo con tarjeta real
- [ ] Configurar emails de Stripe (facturas, renovaciones)
- [ ] Verificar trial auto-start funciona
- [ ] Verificar trial extend funciona
- [ ] Verificar checkout → PRO funciona
- [ ] Verificar cancelación funciona

## Logs de Debug

```
[Trial] Started for installation: xxx, expires: 2024-01-18
[Trial] Extended for user: yyy, new expiry: 2024-01-21
[Trial] Expired for installation: xxx
[Webhook] checkout.session.completed for user: yyy
[Webhook] User yyy upgraded to pro_early
[Webhook] subscription.deleted for user: yyy
[Entitlements] User yyy: plan=pro, expires=2024-02-15
```
