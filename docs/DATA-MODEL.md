# Modelo de Datos

> Estructura Firestore y chrome.storage para Browser Console AI.

## Colecciones Firestore

### users/{uid}

Documento principal del usuario, creado automáticamente al primer login.

```typescript
interface User {
  // Identidad
  email: string;
  displayName?: string;
  photoURL?: string;
  isAnonymous: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Subscription (Stripe)
  subscription: {
    status: 'free' | 'trial' | 'pro' | 'pro_early' | 'canceled' | 'past_due';
    plan?: 'monthly' | 'yearly';
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    currentPeriodStart?: Timestamp;
    currentPeriodEnd?: Timestamp;
    cancelAtPeriodEnd?: boolean;
  };

  // Trial info (si aplica)
  trial?: {
    startedAt: Timestamp;
    expiresAt: Timestamp;
    source: 'extension' | 'web';      // Dónde inició el trial
    extended: boolean;                 // Si usó extensión de +3 días
    extendedAt?: Timestamp;
  };

  // License (para tokens JWT)
  license?: {
    currentTokenId: string;           // UUID del token activo
    issuedAt: Timestamp;
    rotatedAt?: Timestamp;
  };

  // Privacy & Consent (GDPR/CCPA)
  privacy?: {
    analyticsConsent: boolean;
    marketingConsent: boolean;
    consentedAt: Timestamp;
    consentVersion: string;           // e.g., "1.0"
    ipCountry?: string;               // Para determinar jurisdicción
  };

  // Onboarding
  onboarding?: {
    completedSteps: string[];
    completedAt?: Timestamp;
  };
}
```

### trials/{trialId}

Documento que rastrea trials por installationId (extension) o browserId (web).

```typescript
interface Trial {
  id: string;                          // UUID

  // Identidad
  installationId?: string;             // Para extension
  browserId?: string;                  // Para web anónimo
  userId?: string;                     // Firebase UID (si se vinculó)

  // Estado
  status: 'active' | 'expired' | 'converted';
  startedAt: Timestamp;
  expiresAt: Timestamp;

  // Extensión
  extended: boolean;
  extendedAt?: Timestamp;
  extendedVia?: 'email' | 'google';

  // Tracking
  source: 'extension_install' | 'web_signup';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### analytics_events/{eventId}

Eventos de analytics para tracking de uso y conversión.

```typescript
interface AnalyticsEvent {
  // Identidad
  userId?: string;                     // Firebase UID
  installationId?: string;             // Extension UUID
  browserId?: string;                  // Web anon UUID
  sessionId: string;

  // Evento
  eventName: string;
  eventData: Record<string, any>;

  // Contexto
  source: 'extension' | 'web' | 'mcp';
  userAgent?: string;
  url?: string;

  // Timing
  timestamp: Timestamp;
  clientTimestamp?: number;
}
```

### link_codes/{code}

Códigos de un solo uso para vincular cuentas (magic link flow).

```typescript
interface LinkCode {
  code: string;                        // 6 caracteres alfanuméricos

  // Vinculación
  userId: string;                      // UID de la cuenta a vincular
  email: string;
  installationId: string;              // InstallationId de destino

  // Estado
  used: boolean;
  usedAt?: Timestamp;

  // Seguridad
  expiresAt: Timestamp;                // +15 minutos desde creación
  createdAt: Timestamp;
}
```

## Chrome Storage (Extension)

### chrome.storage.local

```typescript
interface ExtensionStorage {
  // Identidad
  bcai_installation_id: string;        // UUID generado al instalar
  bcai_firebase_user: {                // Cache del usuario Firebase
    uid: string;
    email?: string;
    isAnonymous: boolean;
    displayName?: string;
    photoURL?: string;
  };

  // Entitlements (cache)
  bcai_entitlements: {
    plan: 'free' | 'trial' | 'pro';
    planEndsAt: number | null;
    daysRemaining: number | null;
    limits: {
      maxLogs: number;
      maxRecordings: number;
      formats: string[];
      mcpEnabled: boolean;
      exportEnabled: boolean;
    };
    canExtendTrial: boolean;
    fetchedAt: number;                 // Para invalidación
  };

  // Settings
  bcai_settings: {
    serverUrl: string;                 // MCP server URL
    filterTypes: string[];             // Tipos de log a capturar
    includePatterns: string[];
    excludePatterns: string[];
    maxLogsPerRecording: number;
  };

  // Recordings (local)
  bcai_recordings: Recording[];
  bcai_active_recording: Recording | null;

  // Email link flow
  bcai_email_for_signin?: string;      // Email guardado para verificar
}
```

## Entidades de Dominio

### LicensePayload (JWT)

Token JWT para autenticar extensión con backend.

```typescript
interface LicensePayload {
  // Standard claims
  sub: string;                         // userId (Firebase UID)
  iat: number;                         // Issued at (Unix timestamp)
  exp: number;                         // Expiry (Unix timestamp, +7 días)

  // Custom claims
  plan: 'free' | 'trial' | 'pro' | 'pro_early';
  tokenId: string;                     // UUID para invalidación
  email?: string;                      // Para display
  installationId?: string;             // Si se emitió para una instalación
}
```

### Entitlements (API Response)

Respuesta del endpoint `/api/entitlements`.

```typescript
interface EntitlementsResponse {
  // Plan actual
  plan: 'free' | 'trial' | 'pro';
  planEndsAt: number | null;           // Unix timestamp
  daysRemaining: number | null;

  // Límites aplicables
  limits: {
    maxLogs: number;                   // FREE: 100, TRIAL: 500, PRO: Infinity
    maxRecordings: number;             // FREE: 5, TRIAL: 20, PRO: Infinity
    formats: ('plain' | 'toon' | 'json')[];
    mcpEnabled: boolean;
    exportEnabled: boolean;
  };

  // Acciones disponibles
  canExtendTrial: boolean;
  requiresAuth: boolean;

  // Metadata
  isAnonymous: boolean;
  source: 'subscription' | 'trial_user' | 'trial_installation' | 'free';
}
```

### Recording

Una grabación de logs.

```typescript
interface Recording {
  id: string;                          // UUID
  name: string;                        // User-defined o auto-generated

  // Logs
  logs: ConsoleLog[];
  logCount: number;

  // Timing
  startedAt: number;
  endedAt?: number;
  duration?: number;

  // Context
  url: string;
  tabId: number;

  // Status
  status: 'recording' | 'stopped' | 'sent';
  sentToMcp: boolean;
  sentAt?: number;
}

interface ConsoleLog {
  id: string;
  type: 'log' | 'warn' | 'error' | 'info' | 'debug';
  args: string[];
  timestamp: number;
  url: string;
  source?: string;
  lineNumber?: number;
  columnNumber?: number;
}
```

## Ejemplos de Documentos

### Usuario FREE (anónimo)

```json
{
  "email": null,
  "isAnonymous": true,
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z",
  "subscription": {
    "status": "free"
  }
}
```

### Usuario TRIAL (extensión)

```json
{
  "email": "user@example.com",
  "isAnonymous": false,
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-18T12:00:00Z",
  "subscription": {
    "status": "trial"
  },
  "trial": {
    "startedAt": "2024-01-15T10:00:00Z",
    "expiresAt": "2024-01-21T10:00:00Z",
    "source": "extension",
    "extended": true,
    "extendedAt": "2024-01-18T12:00:00Z"
  }
}
```

### Usuario PRO

```json
{
  "email": "pro@example.com",
  "displayName": "Pro User",
  "isAnonymous": false,
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
  },
  "privacy": {
    "analyticsConsent": true,
    "marketingConsent": false,
    "consentedAt": "2024-01-15T12:00:00Z",
    "consentVersion": "1.0"
  }
}
```

## Subscription Status Flow

```
                        ┌─────────────────────────────────────────────────┐
                        │                   ANONYMOUS                      │
                        │  (signInAnonymously en extension)               │
                        └─────────────────────────────────────────────────┘
                                           │
                                           │ auto-start
                                           ▼
┌─────────┐     install      ┌─────────────────────────────────────────────┐
│  FREE   │ ───────────────→ │                   TRIAL                      │
└─────────┘                  │  (3 días base + 3 días si vincula email)    │
     ▲                       └─────────────────────────────────────────────┘
     │                                         │
     │ expires                                 │ checkout
     │                                         ▼
     │                       ┌─────────────────────────────────────────────┐
     │                       │              PRO_EARLY                       │
     │                       │  ($9/mes early access)                       │
     │                       └─────────────────────────────────────────────┘
     │                                         │
     │ canceled                                │ early access ends
     │                                         ▼
     │                       ┌─────────────────────────────────────────────┐
     │                       │                  PRO                         │
     │                       │  ($12/mes regular price)                    │
     │                       └─────────────────────────────────────────────┘
     │                                         │
     │                       payment fails     │
     │                                         ▼
     │                       ┌─────────────────────────────────────────────┐
     │                       │               PAST_DUE                       │
     └───────────────────────│  (intentos de cobro fallidos)               │
                             └─────────────────────────────────────────────┘
```

## Índices Firestore

### Requeridos

```
# Buscar trials por installationId
Collection: trials
Fields: installationId (Ascending), status (Ascending)

# Buscar trials por userId
Collection: trials
Fields: userId (Ascending), status (Ascending)

# Analytics por usuario
Collection: analytics_events
Fields: userId (Ascending), timestamp (Descending)

# Analytics por evento
Collection: analytics_events
Fields: eventName (Ascending), timestamp (Descending)
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

    // Trials: solo lectura para el propio usuario
    match /trials/{trialId} {
      allow read: if request.auth != null &&
                    (resource.data.userId == request.auth.uid ||
                     resource.data.installationId != null);
      allow write: if false; // Solo desde server
    }

    // Analytics: solo escritura autenticada
    match /analytics_events/{eventId} {
      allow read: if false;
      allow write: if request.auth != null;
    }

    // Link codes: solo servidor
    match /link_codes/{code} {
      allow read, write: if false;
    }
  }
}
```

## Límites por Plan

```typescript
const PLAN_LIMITS = {
  free: {
    maxLogs: 100,
    maxRecordings: 5,
    formats: ['plain'],
    mcpEnabled: false,
    exportEnabled: false,
  },
  trial: {
    maxLogs: 500,
    maxRecordings: 20,
    formats: ['plain', 'toon', 'json'],
    mcpEnabled: true,
    exportEnabled: true,
  },
  pro: {
    maxLogs: Infinity,
    maxRecordings: Infinity,
    formats: ['plain', 'toon', 'json'],
    mcpEnabled: true,
    exportEnabled: true,
  },
};

const TRIAL_DURATION = {
  base: 3,           // días
  extended: 6,       // días (base + 3 por vincular)
};
```
