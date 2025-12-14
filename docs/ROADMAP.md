# Roadmap de Implementación

> Estado actual y próximos pasos del proyecto.

## Estado del Proyecto: MVP Completado

El MVP de Browser Console AI está funcional con todas las características core implementadas.

## Configuración Actual

| Aspecto | Valor |
|---------|-------|
| Límites FREE | 100 logs + 5 grabaciones |
| Límites TRIAL | 500 logs + 20 grabaciones + MCP |
| Límites PRO | Ilimitado |
| Trial base | 3 días |
| Trial extendido | 6 días (si vincula email/Google) |
| Formatos FREE | Solo Plain |
| Formatos TRIAL/PRO | Plain + TOON + JSON + Export |
| Token storage | `chrome.storage.local` |

---

## FASE 0: Fundación Arquitectura - COMPLETADO

**Objetivo**: Crear shared/core compilable y reglas en CLAUDE.md

### Estado

- [x] Crear estructura `/shared/core` con dominios separados
- [x] Implementar entidades: User, Session, LicensePayload, Plan, Entitlements
- [x] Implementar constantes: FREE_LIMITS, TRIAL_LIMITS, PRO_LIMITS
- [x] Crear tsconfig.json para compilar a `/shared/dist`
- [x] Actualizar CLAUDE.md con reglas InnerTech

---

## FASE 1: Firebase Auth - COMPLETADO

**Objetivo**: Autenticación funcional en web y extensión

### Implementado

- [x] Firebase Auth: Google + Email/Password en web
- [x] Firebase Auth en extensión (Anonymous-first)
- [x] `chrome.identity.launchWebAuthFlow` para OAuth en MV3
- [x] Firebase SDK local en extensión (CSP compliance)
- [x] Account linking (anonymous → Google/Email)
- [x] API: `/api/users/ensure` - upsert user en Firestore
- [x] API: `/api/auth/session` - verificar sesión

### Archivos Clave

| Archivo | Función |
|---------|---------|
| `extension/chrome-extension/utils/auth.js` | Firebase Auth + chrome.identity |
| `extension/chrome-extension/utils/firebase-config.js` | Configuración Firebase + OAuth |
| `extension/chrome-extension/lib/firebase-*.js` | SDK Firebase local |
| `frontend/src/infra/firebase/` | Firebase client + admin |
| `frontend/app/api/auth/` | Endpoints de auth |

---

## FASE 2: Stripe + Pagos - COMPLETADO

**Objetivo**: Checkout funcional y webhooks sincronizando Firestore

### Implementado

- [x] Stripe Checkout con metadata de Firebase UID
- [x] Webhook: `checkout.session.completed`
- [x] Webhook: `customer.subscription.updated`
- [x] Webhook: `customer.subscription.deleted`
- [x] Webhook: `invoice.payment_failed`
- [x] Customer Portal para gestión de suscripción
- [x] Prevención de suscripciones duplicadas

### Archivos Clave

| Archivo | Función |
|---------|---------|
| `frontend/app/api/stripe/checkout/route.ts` | Crear checkout session |
| `frontend/app/api/stripe/webhook/route.ts` | Procesar eventos Stripe |
| `frontend/app/api/stripe/portal/route.ts` | Crear portal session |

---

## FASE 3: Dashboard + Licencias - COMPLETADO

**Objetivo**: Dashboard PRO con token y entitlements

### Implementado

- [x] Dashboard con plan actual y uso
- [x] Generación de JWT license tokens
- [x] API: `/api/license` - generar/verificar tokens
- [x] API: `/api/entitlements` - obtener entitlements
- [x] UI: copiar token, rotar token
- [x] UI: manage billing (Stripe Portal)
- [x] Trial activation desde web
- [x] Onboarding flow

### Archivos Clave

| Archivo | Función |
|---------|---------|
| `frontend/app/api/entitlements/route.ts` | Calcular entitlements |
| `frontend/app/api/license/route.ts` | Generar/verificar JWT |
| `frontend/src/features/dashboard/` | Dashboard components |

---

## FASE 4: Extension FREE vs PRO - COMPLETADO

**Objetivo**: Límites FREE + upsell modals + validación token

### Implementado

- [x] Contador de logs con límite configurable
- [x] Límite de grabaciones por sesión
- [x] UI: plan badge (FREE/TRIAL/PRO)
- [x] UI: días restantes de trial
- [x] Validación de entitlements al abrir
- [x] Cache de entitlements (1 hora)
- [x] Upsell banners cuando alcanza límites
- [x] Sign in con Google desde extensión
- [x] Extend trial con email

### Archivos Clave

| Archivo | Función |
|---------|---------|
| `extension/chrome-extension/utils/license.js` | Gestión de entitlements |
| `extension/chrome-extension/sidepanel/sidepanel.js` | UI + handlers |
| `extension/chrome-extension/background/service-worker.js` | Log gating |

---

## FASE 5: MCP Server - COMPLETADO

**Objetivo**: MCP server funcional con HTTP bridge

### Implementado

- [x] MCP server con stdio transport
- [x] HTTP bridge en puerto configurable (default 9876)
- [x] Endpoints: POST/GET /logs, /stats, DELETE /logs
- [x] Formato TOON encoder para logs concisos
- [x] Session/recording isolation
- [x] Tools MCP: get_console_logs, get_console_stats, clear_console_logs

### Archivos Clave

| Archivo | Función |
|---------|---------|
| `extension/mcp-server/src/index.js` | Startup MCP + HTTP |
| `extension/mcp-server/src/http-bridge.js` | Express endpoints |
| `extension/mcp-server/src/logs-store.js` | In-memory storage |
| `extension/mcp-server/src/toon-encoder.js` | Formato TOON |

---

## FASE 6: Privacy & Compliance - COMPLETADO

**Objetivo**: GDPR/CCPA compliance

### Implementado

- [x] Privacy consent system
- [x] Consent modal en web
- [x] Consent storage en Firestore
- [x] Analytics solo con consent
- [x] Marketing consent separado

### Archivos Clave

| Archivo | Función |
|---------|---------|
| `frontend/src/features/privacy/` | Privacy components |
| `frontend/app/api/privacy/consent/route.ts` | Save consent |

---

## FASE 7: Admin Panel - COMPLETADO

**Objetivo**: Panel de administración básico

### Implementado

- [x] Dashboard de analytics
- [x] Vista de usuarios
- [x] Vista de eventos
- [x] Filtros por fecha
- [x] Acceso restringido por rol

### Archivos Clave

| Archivo | Función |
|---------|---------|
| `frontend/src/features/admin/` | Admin components |
| `frontend/app/api/admin/` | Admin endpoints |
| `frontend/app/(admin)/admin/` | Admin pages |

---

## Próximos Pasos (Post-MVP)

### P1 - Alta Prioridad

| Feature | Descripción | Estado |
|---------|-------------|--------|
| Magic link confirm | Confirmar email link y vincular cuenta | Pendiente |
| One-time codes | Códigos para vincular extension ↔ web | Pendiente |
| Rate limiting | Limitar requests por IP/user | Pendiente |
| Disposable email block | Bloquear emails temporales | Pendiente |

### P2 - Media Prioridad

| Feature | Descripción | Estado |
|---------|-------------|--------|
| Device fingerprinting | Detectar reinstalaciones | Pendiente |
| Export recordings | Exportar a JSON/CSV | Parcial |
| Share recordings | Links compartibles | Pendiente |
| Chrome Web Store | Publicar extensión | Pendiente |

### P3 - Baja Prioridad

| Feature | Descripción | Estado |
|---------|-------------|--------|
| Team plan | Multi-usuario con workspace | Pendiente |
| Cloud history | Persistir recordings en cloud | Pendiente |
| Slack/Discord alerts | Notificaciones de errores | Pendiente |
| API pública | REST API para integraciones | Pendiente |

---

## Definition of Done - MVP

- [x] Usuario puede instalar extensión y capturar logs inmediatamente
- [x] Usuario FREE tiene límites (100 logs, 5 recordings)
- [x] Usuario puede iniciar trial (3 días) al instalar
- [x] Usuario puede extender trial (+3 días) vinculando cuenta
- [x] Usuario puede hacer checkout y convertirse en PRO
- [x] Usuario PRO tiene límites ilimitados + MCP
- [x] MCP server recibe logs y los expone a Claude Code
- [x] Dashboard muestra plan y permite gestionar suscripción
- [x] Admin puede ver analytics y usuarios

---

## Métricas de Éxito

| Métrica | Objetivo | Actual |
|---------|----------|--------|
| Instalaciones | 1000/mes | TBD |
| Trial → PRO conversion | 5% | TBD |
| PRO churn | < 5%/mes | TBD |
| NPS | > 40 | TBD |
