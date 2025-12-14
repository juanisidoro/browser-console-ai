# Estrategia de Monetización

> Modelo Freemium + Trial: Valor primero, fricción después.

## Modelo FREE → TRIAL → PRO

### FREE (Sin registro)

| Feature | Límite |
|---------|--------|
| Captura de logs | Todos los tipos |
| Filtros por tipo | Completo |
| Logs por grabación | **100 máximo** |
| Grabaciones | **5 máximo** (session only) |
| Formato de salida | **Solo Plain text** |
| MCP directo | Copy/paste manual |
| Export a archivo | No disponible |

### TRIAL (3-6 días)

| Feature | Límite |
|---------|--------|
| Todo de FREE | + mejoras |
| Logs por grabación | **500 máximo** |
| Grabaciones | **20 máximo** (session only) |
| Formatos de salida | **Plain + TOON + JSON** |
| **MCP directo** | Sí |
| Export a archivo | Sí |
| Duración | **3 días** (base) + **3 días** (si vincula cuenta) |

### PRO ($12/mes - Early Access $9/mes)

| Feature | Incluido |
|---------|----------|
| Todo de TRIAL | + sin límites |
| Logs por grabación | **Ilimitados** |
| Grabaciones | **Ilimitadas** |
| Formatos de salida | **Plain + TOON + JSON** |
| **MCP directo** | Sí |
| Export a archivo | Sí |
| Patrones avanzados | Include/exclude |
| Soporte prioritario | Sí |

## Sistema de Trial

### Flujo del Trial

```
┌─────────────────────────────────────────────────────────────────────┐
│                         TRIAL FLOW                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. Usuario instala extensión                                        │
│     └─> Genera installationId (UUID)                                │
│     └─> signInAnonymously() → userId                                │
│     └─> Auto-start trial base: 3 días                               │
│                                                                      │
│  2. Usuario vincula cuenta (opcional)                                │
│     └─> Google: chrome.identity OAuth                               │
│     └─> Email: magic link                                           │
│     └─> linkWithCredential preserva uid                             │
│     └─> Trial extendido: +3 días (total 6)                         │
│                                                                      │
│  3. Trial expira                                                     │
│     └─> Sin vincular: downgrade a FREE                              │
│     └─> Vinculado: upsell a PRO                                     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Duración del Trial

| Escenario | Duración | Condición |
|-----------|----------|-----------|
| Trial base | 3 días | Al instalar extensión |
| Trial extendido | 6 días | Al vincular email/Google |
| Trial web | 6 días | Signup desde web (incluye vinculación) |

### Reglas Anti-Abuso

| Regla | Implementación |
|-------|----------------|
| Trial base único | 1 por installationId |
| Trial extendido único | 1 por userId |
| Emails desechables | Bloqueados (lista negra) |
| Rate limiting | Por IP en extend-trial |

## Pricing

| Plan | Precio | Notas |
|------|--------|-------|
| FREE | $0 | Permanente |
| TRIAL | $0 | 3-6 días |
| PRO Early Access | $9/mes | Temporal, primeros usuarios |
| PRO Regular | $12/mes | Precio final |
| PRO Anual | $99/año | ~17% descuento |

## Palancas de Conversión (Upsell Triggers)

| Trigger | Plan | Mensaje |
|---------|------|---------|
| Log #101 | FREE | "You've reached the 100 log limit. Start trial for 500 logs." |
| Log #501 | TRIAL | "You've reached the 500 log limit. Upgrade for unlimited." |
| Recording #6 | FREE | "Free accounts can save 5 recordings. Start trial for 20." |
| Recording #21 | TRIAL | "Trial includes 20 recordings. Upgrade for unlimited." |
| Enable MCP | FREE | "MCP integration requires Trial or PRO. Try it free for 3 days." |
| Export | FREE | "Export to file requires Trial or PRO." |
| TOON/JSON | FREE | "Advanced formats require Trial or PRO." |
| Trial expiring | TRIAL | "Your trial expires in X days. Upgrade to keep MCP access." |

## Filosofía: Valor Primero

```
1. Usuario instala y usa inmediatamente (0 registro)
2. Auto-inicia trial con límites generosos (500 logs, MCP)
3. Experimenta el valor completo durante 3-6 días
4. Upgrade es decisión informada al final del trial
```

## PRO: Killer Feature

**MCP directo** es el diferenciador principal:

- Sin PRO: copiar logs manualmente, pegar en Claude, perder contexto
- Con PRO: un click, integración directa, contexto completo

### Nota técnica importante

- El MCP server es local → no existe DRM perfecto
- El control PRO principal está en la **extensión** (entitlements gating)
- El valor PRO se apoya en **entitlements verificables** vía API

## Sistema de Entitlements

```
User (Extension/Web)
    │
    ▼
GET /api/entitlements
    │
    ├─> Input: Bearer token + installationId/browserId
    │
    └─> Output:
        {
          plan: 'free' | 'trial' | 'pro',
          planEndsAt: timestamp | null,
          daysRemaining: number | null,
          limits: {
            maxLogs: 100 | 500 | Infinity,
            maxRecordings: 5 | 20 | Infinity,
            formats: ['plain'] | ['plain', 'toon', 'json'],
            mcpEnabled: false | true,
            exportEnabled: false | true
          },
          canExtendTrial: boolean,
          requiresAuth: boolean
        }
```

### Prioridad de Entitlements

```
1. PRO subscription activa → plan=pro
2. Trial por userId (vinculado) → plan=trial
3. Trial por installationId (anónimo) → plan=trial
4. Default → plan=free
```

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Chrome Extension                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │ Auth.js      │───▶│ License.js   │───▶│ Sidepanel.js │          │
│  │ (Firebase)   │    │ (Entitlements│    │ (UI)         │          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
│         │                   │                                        │
│         ▼                   ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                     Gating Layer                              │  │
│  │  - Log count check (100/500/∞)                               │  │
│  │  - Recording count check (5/20/∞)                            │  │
│  │  - MCP enabled check                                          │  │
│  │  - Format enabled check                                       │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              │                                       │
│                              ▼ (if MCP enabled)                     │
│                    ┌─────────────────┐                              │
│                    │   MCP Server    │                              │
│                    │   (localhost)   │                              │
│                    └─────────────────┘                              │
│                              │                                       │
│                              ▼                                       │
│                    ┌─────────────────┐                              │
│                    │   Claude Code   │                              │
│                    │   (via stdio)   │                              │
│                    └─────────────────┘                              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Flujo de Usuario

### 1. Usuario Nuevo (FREE → TRIAL)

```
1. Instala extensión
2. Auto signInAnonymously() + auto trial 3 días
3. Usa con límites TRIAL (500 logs, MCP)
4. Ve banner "Extend trial +3 days with Google"
5. Click → Google OAuth → account linked
6. Trial extendido a 6 días
7. Al expirar: upsell modal → checkout
```

### 2. Usuario Existente (WEB → Extension)

```
1. Signup en web (trial 6 días)
2. Instala extensión
3. Sign in con Google
4. Hereda trial de userId
5. Mismo flujo de upsell al expirar
```

### 3. Usuario PRO

```
1. Checkout completado
2. Webhook actualiza Firestore
3. GET /api/entitlements → plan=pro
4. Extension sincroniza entitlements
5. Límites ilimitados activos
```

## Archivos Clave

| Archivo | Responsabilidad |
|---------|-----------------|
| `extension/chrome-extension/utils/auth.js` | Firebase Auth + OAuth |
| `extension/chrome-extension/utils/license.js` | Entitlements + gating |
| `extension/chrome-extension/sidepanel/sidepanel.js` | UI + trial banners |
| `frontend/app/api/entitlements/route.ts` | Calcular entitlements |
| `frontend/app/api/license/extend-trial/route.ts` | Extender trial |
| `frontend/app/api/stripe/webhook/route.ts` | Sync subscriptions |

## KPIs de Lanzamiento

| Métrica | Objetivo |
|---------|----------|
| Instalaciones mes 1 | 1000 |
| Trial start rate | 90%+ (auto) |
| Trial extend rate | 30% (vinculan cuenta) |
| Trial → PRO conversion | 5% |
| Churn mensual | < 5% |
| NPS | > 40 |

## Funnel a Trackear

```
Install → Trial Start → Trial Extend → Trial Expiring → Checkout → Convert → Retain
   │          │              │               │             │           │
   └──────────┴──────────────┴───────────────┴─────────────┴───────────┘
                              Analytics Events
```

### Eventos de Analytics

| Evento | Descripción |
|--------|-------------|
| `extension_installed` | Extensión instalada |
| `trial_started` | Trial base iniciado |
| `trial_extended` | Trial extendido (+3 días) |
| `trial_expiring` | Trial expira en < 24h |
| `trial_expired` | Trial expiró |
| `checkout_started` | Usuario inició checkout |
| `checkout_completed` | Pago exitoso |
| `subscription_canceled` | Usuario canceló |
| `limit_reached` | Usuario alcanzó límite |
| `upsell_shown` | Modal de upsell mostrado |
| `upsell_clicked` | Usuario hizo click en upgrade |
