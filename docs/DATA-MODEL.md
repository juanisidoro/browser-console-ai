# Modelo de Datos

> Estructura Firestore para el MVP.

## Colecciones

### users/{uid}

Documento principal del usuario, creado via `/api/users/ensure` al primer login.

```typescript
interface User {
  // Identidad
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Subscription
  subscription: {
    status: 'free' | 'pro' | 'pro_early' | 'canceled' | 'past_due';
    plan?: 'monthly' | 'yearly';
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    currentPeriodStart?: Timestamp;
    currentPeriodEnd?: Timestamp;
    cancelAtPeriodEnd?: boolean;
  };

  // License (para invalidar tokens)
  license?: {
    currentTokenId: string;        // UUID del token activo
    issuedAt: Timestamp;
    rotatedAt?: Timestamp;
  };
}
```

### Ejemplo documento FREE

```json
{
  "email": "user@example.com",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z",
  "subscription": {
    "status": "free"
  }
}
```

### Ejemplo documento PRO

```json
{
  "email": "pro@example.com",
  "displayName": "Pro User",
  "createdAt": "2024-01-10T10:00:00Z",
  "updatedAt": "2024-01-15T12:00:00Z",
  "subscription": {
    "status": "pro_early",
    "plan": "monthly",
    "stripeCustomerId": "cus_xxx",
    "stripeSubscriptionId": "sub_xxx",
    "currentPeriodStart": "2024-01-15T00:00:00Z",
    "currentPeriodEnd": "2024-02-15T00:00:00Z",
    "cancelAtPeriodEnd": false
  },
  "license": {
    "currentTokenId": "550e8400-e29b-41d4-a716-446655440000",
    "issuedAt": "2024-01-15T12:00:00Z"
  }
}
```

## JWT Token Payload

El token JWT generado para la extensión:

```typescript
interface LicensePayload {
  // Standard claims
  sub: string;           // userId (Firebase UID)
  iat: number;           // Issued at (Unix timestamp)
  exp: number;           // Expiry (Unix timestamp, +7 días)

  // Custom claims
  plan: 'free' | 'pro' | 'pro_early';
  tokenId: string;       // UUID para invalidación
  email: string;         // Para display en extensión
}
```

### Ejemplo token decodificado

```json
{
  "sub": "abc123xyz",
  "iat": 1705312800,
  "exp": 1705917600,
  "plan": "pro_early",
  "tokenId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "pro@example.com"
}
```

## Subscription Status Flow

```
┌─────────┐     checkout      ┌─────────────┐
│  free   │ ───────────────→  │  pro_early  │
└─────────┘                   └─────────────┘
                                    │
                     early access   │  expires
                     ends           ▼
                              ┌─────────┐
                              │   pro   │
                              └─────────┘
                                    │
                     payment        │
                     fails          ▼
                              ┌──────────┐
                              │ past_due │
                              └──────────┘
                                    │
                     subscription   │
                     deleted        ▼
                              ┌──────────┐
                              │ canceled │
                              └──────────┘
                                    │
                     grace period   │
                     ends           ▼
                              ┌─────────┐
                              │  free   │
                              └─────────┘
```

## Índices Firestore

Para el MVP no necesitamos índices compuestos. Las queries son simples:

- `users/{uid}` - Acceso directo por UID
- Stripe webhooks usan `stripeCustomerId` o `stripeSubscriptionId`

Si necesitamos buscar por Stripe IDs, crear índice:

```
Collection: users
Fields: subscription.stripeCustomerId (Ascending)
```

## Seguridad Rules (Firestore)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users: solo el propio usuario puede leer
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false; // Solo desde server (Admin SDK)
    }
  }
}
```

## Post-MVP: Audit Log

Para debugging y compliance futuro:

```typescript
// audit_log/{id}
interface AuditLog {
  userId: string;
  action: 'login' | 'logout' | 'upgrade' | 'downgrade' | 'token_issued' | 'token_rotated';
  timestamp: Timestamp;
  metadata: {
    ip?: string;
    userAgent?: string;
    oldPlan?: string;
    newPlan?: string;
    [key: string]: any;
  };
}
```

> **Nota**: No implementar en MVP. Añadir cuando tengamos tracción y necesitemos debugging de issues de usuarios.
