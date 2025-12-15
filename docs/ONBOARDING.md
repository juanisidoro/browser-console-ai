# Onboarding System

Este documento describe el sistema de onboarding de Browser Console AI, incluyendo los 4 pasos del Getting Started y cómo se rastrean los eventos.

## Resumen

El onboarding consta de 4 pasos que el usuario debe completar:

1. **Install Extension** - Instalar la extensión de Chrome
2. **Activate Trial** - Activar el período de prueba de 6 días
3. **First Recording** - Hacer la primera grabación de logs
4. **Connect MCP** - Conectar el servidor MCP a Claude

## Arquitectura de Eventos

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TRIGGERS Y RE-TRIGGERS                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  EXTENSION_INSTALLED                                                        │
│  ├── Trigger:    Primera apertura de extensión (analytics.js:trackInstall)  │
│  └── Re-trigger: Al hacer login (syncOnboardingProgress)                    │
│                                                                              │
│  TRIAL_ACTIVATED                                                            │
│  ├── Trigger:    Click "Activate Trial" (service-worker.js:ACTIVATE_TRIAL)  │
│  └── Re-trigger: Al hacer login si tiene trial/pro (syncOnboardingProgress) │
│                                                                              │
│  FIRST_RECORDING                                                            │
│  ├── Trigger:    Primera grabación (service-worker.js:START_RECORDING)      │
│  └── Re-trigger: Al hacer login si tiene historial (syncOnboardingProgress) │
│                                                                              │
│  MCP_CONNECTED                                                              │
│  ├── Trigger:    MCP responde OK (service-worker.js:checkServerHealth)      │
│  └── Re-trigger: Al hacer login si MCP conectado (syncOnboardingProgress)   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Flujo de Sincronización

El sistema maneja dos identificadores:
- **installationId**: ID único de la instalación de la extensión (persiste aunque el usuario no esté logueado)
- **userId**: ID de Firebase del usuario (disponible después de login)

```
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│    EXTENSIÓN     │      │     BACKEND      │      │    FIRESTORE     │
└────────┬─────────┘      └────────┬─────────┘      └────────┬─────────┘
         │                         │                         │
         │  trackEvent(sin userId) │                         │
         │────────────────────────>│                         │
         │                         │  onboarding_progress/   │
         │                         │  {installationId}       │
         │                         │────────────────────────>│
         │                         │                         │
   Usuario hace login              │                         │
         │                         │                         │
         │  syncOnboardingProgress │                         │
         │  (con userId)           │                         │
         │────────────────────────>│  users/{userId}/        │
         │                         │  onboarding             │
         │                         │────────────────────────>│
         │                         │                         │
         │  GET /api/entitlements  │                         │
         │  + X-Installation-Id    │                         │
         │────────────────────────>│                         │
         │                         │  mergeOnboarding()      │
         │                         │  OR lógico:             │
         │                         │  user ∪ installation    │
         │                         │────────────────────────>│
         │                         │                         │
```

## Almacenamiento en Firestore

### Colección `users/{userId}`

```typescript
{
  // ... otros campos del usuario
  onboarding: {
    extensionInstalled: boolean,
    extensionInstalledAt?: number,
    trialActivated: boolean,
    trialActivatedAt?: number,
    firstRecording: boolean,
    firstRecordingAt?: number,
    mcpConnected: boolean,
    mcpConnectedAt?: number
  }
}
```

### Colección `onboarding_progress/{installationId}`

Almacena progreso de usuarios anónimos (antes de hacer login):

```typescript
{
  extensionInstalled?: boolean,
  extensionInstalledAt?: number,
  trialActivated?: boolean,
  trialActivatedAt?: number,
  firstRecording?: boolean,
  firstRecordingAt?: number,
  mcpConnected?: boolean,
  mcpConnectedAt?: number,
  linkedUserId?: string,  // Se añade cuando el usuario hace login
  linkedAt?: number
}
```

## Detalle de Cada Evento

### 1. extension_installed

**Cuándo se dispara:**
- Primera vez que se abre el sidepanel de la extensión
- Se guarda flag `bcai_install_tracked` en storage para no repetir

**Código:**
```javascript
// analytics.js
async function trackInstall() {
  const result = await chrome.storage.local.get('bcai_install_tracked');
  if (!result.bcai_install_tracked) {
    await trackEvent('extension_installed');
    await chrome.storage.local.set({ bcai_install_tracked: true });
  }
}
```

**Re-trigger en login:**
```javascript
// syncOnboardingProgress()
await trackEvent('extension_installed');  // Siempre, porque si está aquí, está instalada
```

### 2. trial_activated

**Cuándo se dispara:**
- Usuario hace click en "Activate Trial" en el sidepanel
- Backend crea el trial y devuelve token

**Código:**
```javascript
// service-worker.js
if (message.action === 'ACTIVATE_TRIAL') {
  self.LicenseManager.activateTrial().then(result => {
    if (result.success) {
      self.Analytics.trackEvent('trial_activated', {
        daysRemaining: result.daysRemaining
      });
    }
  });
}
```

**Re-trigger en login:**
```javascript
// syncOnboardingProgress()
if (payload.plan && ['trial', 'pro', 'pro_early'].includes(payload.plan)) {
  await trackEvent('trial_activated', { plan: payload.plan, synced: true });
}
```

### 3. first_recording

**Cuándo se dispara:**
- Primera vez que el usuario inicia una grabación
- Se verifica con `recordingsHistory.length === 0`

**Código:**
```javascript
// service-worker.js
if (message.action === 'START_RECORDING') {
  // ... validaciones
  if (recordingsHistory.length === 0) {
    self.Analytics.trackEvent('first_recording');
  }
}
```

**Re-trigger en login:**
```javascript
// syncOnboardingProgress()
const recordingsHistory = recordingsResult.bcai_recordings_history || [];
if (recordingsHistory.length > 0) {
  await trackEvent('first_recording', { synced: true, totalRecordings: recordingsHistory.length });
}
```

### 4. mcp_connected

**Cuándo se dispara:**
- Cuando el servidor MCP responde OK por primera vez (transición offline→online)
- Se usa flag `lastMcpConnectedState` para evitar duplicados

**Código:**
```javascript
// service-worker.js
let lastMcpConnectedState = false;
async function checkServerHealth() {
  try {
    const response = await fetch(`${SERVER_URL}/health`);
    if (!lastMcpConnectedState) {
      lastMcpConnectedState = true;
      self.Analytics.trackEvent('mcp_connected');
    }
    return { connected: true, ...data };
  } catch {
    lastMcpConnectedState = false;
    return { connected: false };
  }
}
```

**Re-trigger en login:**
```javascript
// syncOnboardingProgress()
const response = await chrome.runtime.sendMessage({ action: 'CHECK_MCP_STATUS' });
if (response?.connected) {
  await trackEvent('mcp_connected', { synced: true });
}
```

## Backend: Procesamiento de Eventos

### /api/analytics (POST)

Recibe eventos y actualiza el progreso de onboarding:

```typescript
async function updateOnboardingProgress(db, event) {
  const ONBOARDING_EVENTS = [
    'extension_installed',
    'trial_activated',
    'first_recording',
    'mcp_connected',
  ];

  if (!ONBOARDING_EVENTS.includes(event.event)) return;

  // Actualiza users/{userId}/onboarding si tiene userId
  if (event.userId) {
    await db.collection('users').doc(event.userId).set(
      { onboarding: updates },
      { merge: true }
    );
  }

  // También guarda en onboarding_progress/{installationId}
  if (event.installationId && event.installationId !== 'web') {
    await db.collection('onboarding_progress').doc(event.installationId).set(
      updates,
      { merge: true }
    );
  }
}
```

### /api/entitlements (GET)

Fusiona el progreso cuando se llama con userId + installationId:

```typescript
if (userId && installationId) {
  await mergeOnboardingProgress(db, userId, installationId);
}

async function mergeOnboardingProgress(db, userId, installationId) {
  // 1. Lee onboarding del usuario
  // 2. Lee onboarding_progress/{installationId}
  // 3. Fusiona con OR lógico
  // 4. Actualiza usuario si cambió algo
  // 5. Vincula installationId → userId
}
```

### /api/auth/session (GET)

También puede fusionar si recibe header `X-Installation-Id`:

```typescript
const installationId = request.headers.get('X-Installation-Id');

if (installationId) {
  // Fusiona onboarding_progress/{installationId} con user
  // Vincula installationId → userId
}
```

## Frontend: Dashboard

El componente `OnboardingSteps` muestra el progreso:

```tsx
<OnboardingSteps
  extensionInstalled={onboarding.extensionInstalled}
  trialActivated={onboarding.trialActivated}
  firstRecording={onboarding.firstRecording}
  mcpConnected={onboarding.mcpConnected}
  // ...
/>
```

### Vista Colapsada

Cuando los 4 pasos están completados, se muestra una vista colapsada con opción de expandir.

## Archivos Clave

| Archivo | Responsabilidad |
|---------|-----------------|
| `extension/chrome-extension/utils/analytics.js` | `trackEvent()`, `syncOnboardingProgress()` |
| `extension/chrome-extension/utils/auth.js` | Envía mensaje para sync al login |
| `extension/chrome-extension/background/service-worker.js` | Dispara eventos, maneja `SYNC_ONBOARDING_PROGRESS` |
| `frontend/app/api/analytics/route.ts` | Procesa eventos, actualiza Firestore |
| `frontend/app/api/entitlements/route.ts` | Fusiona onboarding |
| `frontend/app/api/auth/session/route.ts` | Retorna onboarding fusionado |
| `frontend/src/features/dashboard/components/onboarding-steps.tsx` | UI del onboarding |
| `frontend/src/features/dashboard/hooks/use-dashboard.ts` | Hook que obtiene datos |

## Nota Técnica: Contextos de Ejecución

La extensión tiene dos contextos de ejecución principales:

1. **Sidepanel** (window context)
   - Carga: firebase, auth.js, sidepanel.js
   - NO tiene acceso a analytics.js directamente

2. **Service Worker** (self context)
   - Carga: license.js, analytics.js
   - Maneja todos los eventos y analytics

Por esto, cuando el usuario hace login en el sidepanel:
1. `auth.js` envía mensaje `SYNC_ONBOARDING_PROGRESS` al service worker
2. Service worker llama `Analytics.syncOnboardingProgress()`
3. Los eventos se envían con el userId correcto

## Debugging

### Verificar eventos en consola de extensión

```javascript
// En el sidepanel, abrir DevTools y ver logs de [Analytics]
// Deberías ver:
// [Analytics] Tracked: extension_installed (uid: xxxxxxxx...)
// [Analytics] Syncing onboarding progress...
```

### Verificar en Firestore

1. Ir a Firebase Console → Firestore
2. Colección `users/{userId}` → campo `onboarding`
3. Colección `onboarding_progress/{installationId}`
4. Colección `analytics_events` → filtrar por evento

### Forzar re-sync

Si el onboarding no se actualiza, el usuario puede:
1. Cerrar sesión en la extensión
2. Volver a iniciar sesión
3. `syncOnboardingProgress()` se ejecutará automáticamente
