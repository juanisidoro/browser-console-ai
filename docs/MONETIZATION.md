# Estrategia de Monetización

> Modelo Freemium: Valor primero, fricción después.

## Modelo FREE vs PRO

### FREE (Sin registro)

| Feature | Límite |
|---------|--------|
| Captura de logs | ✅ Todos los tipos |
| Filtros por tipo | ✅ Completo |
| Logs por grabación | **100 máximo** |
| Grabaciones | **5 máximo** (session only) |
| Formato de salida | **Solo Plain text** |
| MCP directo | ❌ Copy/paste manual |
| Export a archivo | ❌ No disponible |
| Historial cloud | ❌ No disponible |

### PRO ($12/mes - Early Access $9/mes)

| Feature | Incluido |
|---------|----------|
| Todo de FREE | ✅ |
| Logs por grabación | **Ilimitados** |
| Grabaciones | **Ilimitadas** (local) |
| Formatos de salida | **Plain + TOON + JSON** |
| **MCP directo** | ✅ Killer feature |
| Export a archivo | ✅ |
| Patrones avanzados | ✅ Include/exclude |
| Soporte prioritario | ✅ |

> **Nota MVP**: Cloud history = "Coming soon" / Team plan (post-tracción)

## Pricing

| Plan | Precio | Notas |
|------|--------|-------|
| FREE | $0 | Sin registro |
| PRO Early Access | $9/mes | Temporal, primeros usuarios |
| PRO Regular | $12/mes | Precio final |
| PRO Anual | $99/año | ~17% descuento |

## Palancas de Conversión (Upsell Triggers)

| Trigger | Momento | Mensaje |
|---------|---------|---------|
| Límite de logs | Log #101 | "You've reached the 100 log limit. Upgrade for unlimited." |
| Límite grabaciones | Grabación #6 | "Free accounts can save 5 recordings. Upgrade for unlimited." |
| Enable MCP | Al intentar activar | "MCP integration requires PRO. Connect directly to Claude Code." |
| Exportar | Al pulsar Export | "Export to file is a PRO feature." |
| Formato TOON/JSON | Al seleccionar | "Advanced formats require PRO subscription." |

## Filosofía: Valor Primero

```
1. Usuario instala y usa inmediatamente (0 registro)
2. Experimenta el valor (captura logs, ve utilidad)
3. Encuentra límite natural cuando escala uso
4. Upgrade es decisión informada, no barrera inicial
```

## PRO: Killer Feature

**MCP directo** es el diferenciador principal:

- Sin PRO: copiar logs manualmente, pegar en Claude, perder contexto
- Con PRO: un click, integración directa, contexto completo

### Nota técnica importante

- El MCP server es local → no existe DRM perfecto
- El control PRO principal está en la **extensión** (UX gating + token)
- El middleware del server añade control, no blindaje absoluto
- El valor PRO debe apoyarse en **entitlements verificables**

## Sistema de Licencias (MVP)

```
User (Firebase) → JWT Token → Extension valida → MCP Server valida
```

| Medida | Implementación |
|--------|----------------|
| Token JWT | Firmado con secret, expira en 7 días |
| Refresh | Automático si quedan < 24h |
| Validación | Server valida token en cada request |
| Grace period | 3 días offline, luego downgrade a FREE |
| Storage | `chrome.storage.local` (NO sync en MVP) |

## Post-MVP (Cuando haya tracción)

- Device IDs y límite de dispositivos
- Revocación de tokens
- UX de gestión de dispositivos
- Cloud history (Team plan)
- Analytics de errores

## Features Futuras

### Team Plan ($29/mes)

- Dashboard de analytics de errores
- Alertas en tiempo real (Slack/Discord)
- Logs persistentes en cloud (7 días)
- API para integraciones custom
- Múltiples usuarios por workspace

### Premium Features

| Feature | Descripción |
|---------|-------------|
| AI Error Explainer | Botón "Explain this error" con AI integrado |
| Session Replay | Ver secuencia de logs como timeline |
| Smart Grouping | Agrupar errores similares automáticamente |
| Performance Insights | Detectar patrones de errores |
| Share Session | Link compartible para debugging en equipo |

## Estado de Implementación

### Completado (v1.0)

| Componente | Estado | Descripción |
|------------|--------|-------------|
| Firebase Auth | ✅ | Google Sign-in, session management |
| Stripe Checkout | ✅ | Subscription flow, webhooks |
| Customer Portal | ✅ | Manage subscription via Stripe |
| JWT License Tokens | ✅ | Generated on dashboard, validated in extension |
| Extension Gating | ✅ | Log limits, recording limits, MCP access |
| Sidepanel License UI | ✅ | Plan badge, token input, limits display |
| MCP Gating | ✅ | Only PRO users can send to MCP server |
| Upsell Banners | ✅ | Shown when limits reached |

### Arquitectura del Sistema de Licencias

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Dashboard     │────▶│   JWT Token     │
│   (Auth)        │     │   (License Tab) │     │   (Copy)        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Chrome Extension                             │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│   │ Sidepanel    │───▶│ Service      │───▶│ License      │     │
│   │ (Token UI)   │    │ Worker       │    │ Manager      │     │
│   └──────────────┘    └──────────────┘    └──────────────┘     │
│                              │                                   │
│                              ▼                                   │
│   ┌───────────────────────────────────────────────────────┐    │
│   │ Gating: Logs(100), Recordings(5), MCP(PRO only)       │    │
│   └───────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼ (PRO only)
                    ┌─────────────────┐
                    │   MCP Server    │
                    │   (localhost)   │
                    └─────────────────┘
                                │
                                ▼
                    ┌─────────────────┐
                    │   Claude Code   │
                    │   (via stdio)   │
                    └─────────────────┘
```

### Flujo de Usuario

1. **FREE User**:
   - Instala extension, usa inmediatamente
   - Puede grabar hasta 100 logs por grabación
   - Puede tener hasta 5 grabaciones por sesión
   - Ve banner de "Upgrade" cuando alcanza límites
   - Los recordings se guardan localmente (no MCP)

2. **PRO User**:
   - Se registra en website (Firebase Auth)
   - Paga vía Stripe Checkout
   - Copia token JWT desde Dashboard
   - Pega token en Extension (Settings → License)
   - Logs ilimitados, recordings ilimitados
   - Recordings se envían a MCP server
   - Claude Code puede consultar logs directamente

### Archivos Clave

| Archivo | Responsabilidad |
|---------|-----------------|
| `extension/chrome-extension/utils/license.js` | Gestión de licencias, decodificación JWT |
| `extension/chrome-extension/background/service-worker.js` | Gating de límites, comunicación con MCP |
| `extension/chrome-extension/sidepanel/sidepanel.js` | UI de licencia, token input |
| `frontend/app/api/stripe/webhook/route.ts` | Sync de suscripciones con Firestore |
| `frontend/src/features/dashboard/components/LicenseCard.tsx` | Generación y display de tokens |

## KPIs de Lanzamiento

| Métrica | Objetivo |
|---------|----------|
| Instalaciones mes 1 | 1000 |
| Conversión FREE→PRO | 3-5% |
| Churn mensual | < 5% |
| NPS | > 40 |

## Funnel a Trackear

```
Install → Use → Hit limit → View pricing → Convert → Retain
```
