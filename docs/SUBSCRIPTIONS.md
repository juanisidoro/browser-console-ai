# Subscriptions & Billing

Este documento detalla el sistema de suscripciones, control de errores y mejores prácticas.

## Arquitectura

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

## Flujo de Suscripción

### 1. Checkout (Usuario inicia compra)

**Endpoint:** `POST /api/stripe/checkout`

**Validaciones:**
- Usuario autenticado (Bearer token)
- Email verificado
- **No tiene suscripción activa** (previene duplicados)

```typescript
// Verificación anti-duplicados en checkout
const currentPlan = userData?.subscription?.status;
if (currentPlan && currentPlan !== 'free') {
  return NextResponse.json(
    { error: 'You already have an active subscription.' },
    { status: 400 }
  );
}
```

### 2. Webhook (Stripe notifica eventos)

**Endpoint:** `POST /api/stripe/webhook`

**Eventos manejados:**
| Evento | Acción |
|--------|--------|
| `checkout.session.completed` | Activa suscripción, cancela anteriores |
| `customer.subscription.updated` | Actualiza plan/estado |
| `customer.subscription.deleted` | Downgrade a FREE |
| `invoice.payment_failed` | Log (futuro: notificar usuario) |

**Cancelación automática de suscripciones previas:**

```typescript
// En handleCheckoutCompleted
const previousSubId = userData?.subscription?.stripeSubscriptionId;
if (previousSubId && previousSubId !== subscriptionId) {
  await stripe.subscriptions.cancel(previousSubId);
}
```

### 3. Modelo de Datos (Firestore)

```typescript
// users/{uid}
{
  email: string,
  displayName: string,
  subscription: {
    status: 'free' | 'pro' | 'pro_early',
    stripeCustomerId: string,
    stripeSubscriptionId: string,
    currentPeriodEnd: Timestamp,
    cancelAtPeriodEnd: boolean
  }
}
```

## Control de Errores

### Prevención de Duplicados

| Capa | Validación |
|------|------------|
| **Checkout** | Bloquea si `status !== 'free'` |
| **Webhook** | Cancela suscripción anterior automáticamente |
| **Stripe** | Customer Portal permite gestionar suscripciones |

### Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `No such price` | Price ID de modo incorrecto (live vs test) | Usar Price ID del mismo modo que API key |
| `Invalid signature` | STRIPE_WEBHOOK_SECRET incorrecto | Regenerar con `stripe listen` |
| `Value for "seconds" not valid` | Timestamp mal formateado | Usar `Timestamp.fromMillis()` |
| `User already has subscription` | Intento de duplicar | Redirigir a Customer Portal |

### Manejo de Webhooks Fallidos

Si un webhook falla (500), Stripe lo reintentará automáticamente:
- 1er reintento: inmediato
- 2do reintento: 1 hora
- 3er reintento: 24 horas

**Logs importantes:**
```
[Webhook] handleCheckoutCompleted started
[Webhook] Session metadata: { firebaseUid: '...' }
[Webhook] Plan determined: pro_early
[Webhook] User X upgraded to pro_early
```

## Customer Portal

**Endpoint:** `POST /api/stripe/portal`

Permite al usuario:
- Ver historial de facturas
- Actualizar método de pago
- Cancelar suscripción
- Cambiar plan (si está configurado)

## Variables de Entorno

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...          # API key (test o live)
STRIPE_WEBHOOK_SECRET=whsec_...        # Secreto del webhook
STRIPE_PRICE_PRO_EARLY=price_...       # Price ID (mismo modo que API key)
STRIPE_PRICE_PRO_MONTHLY=price_...     # Price ID regular
```

## Testing Local

```bash
# Terminal 1: Stripe CLI para webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Terminal 2: Next.js
npm run dev
```

**Tarjeta de prueba:** `4242 4242 4242 4242`

## Limpieza de Suscripciones Duplicadas

Si hay suscripciones duplicadas de pruebas:

1. **Stripe Dashboard** → Customers → [email] → Cancelar duplicadas
2. **Customer Portal** → El usuario puede cancelar desde ahí
3. **Automático** → El webhook cancela la anterior al crear una nueva

## Checklist Pre-Producción

- [ ] Cambiar a API keys de modo LIVE
- [ ] Crear productos/precios en modo LIVE
- [ ] Configurar webhook en Stripe Dashboard (no CLI)
- [ ] Verificar STRIPE_WEBHOOK_SECRET de producción
- [ ] Probar flujo completo con tarjeta real (pequeño monto)
- [ ] Configurar emails de Stripe (facturas, renovaciones)
