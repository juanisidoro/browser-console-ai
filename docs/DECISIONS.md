# Decisiones Técnicas y de Producto

> Registro de decisiones tomadas para el MVP.

## Producto

| Decisión | Valor | Razón |
|----------|-------|-------|
| Modelo de negocio | Freemium | Valor primero, fricción después |
| Killer feature PRO | MCP directo | Diferenciador claro vs copy/paste |
| Early access price | $9/mes | Validar willingness to pay |
| Regular price | $12/mes | Balance accesibilidad/valor |
| Cloud history | Post-MVP | Simplificar lanzamiento |

## Límites FREE/PRO

| Aspecto | FREE | PRO |
|---------|------|-----|
| Logs por grabación | 100 | Ilimitado |
| Grabaciones | 5 (session only) | Ilimitado (local) |
| Formatos | Plain text | Plain + TOON + JSON |
| MCP directo | No | Sí |
| Export archivo | No | Sí |
| Include/exclude patterns | Básico | Avanzado |

### Upsell Triggers

| Trigger | Momento exacto |
|---------|----------------|
| Logs | Log #101 |
| Grabaciones | Grabación #6 |
| MCP | Al intentar activar |
| Export | Al pulsar botón |
| Formatos | Al seleccionar TOON/JSON |

## Arquitectura

| Decisión | Valor | Razón |
|----------|-------|-------|
| Arquitectura | InnerTech (Clean + Hexagonal) | Consistencia 3 runtimes |
| Shared core | `/shared/core` compilado a `/dist` | Portabilidad entre runtimes |
| Separar auth/licensing | Sí | Auth = identidad, licensing = permisos |
| Crypto en CORE | No | CORE puro, jose en INFRA |
| Users desde cliente | No | Server-side via `/api/users/ensure` |

## Seguridad MVP

| Decisión | Valor | Razón |
|----------|-------|-------|
| Token JWT expiry | 7 días | Balance seguridad/UX |
| Token refresh | Automático < 24h | Sin fricción |
| Grace period offline | 3 días | Suficiente para fin de semana |
| Token storage | `chrome.storage.local` | Más robusto que sync |
| Device fingerprint | Post-MVP | Simplificar lanzamiento |
| Límite dispositivos | Post-MVP | Complejidad alta, valor bajo |

## Stack Tecnológico

| Componente | Decisión | Razón |
|------------|----------|-------|
| Frontend | Next.js 16 + React 19 | Ya existente |
| Auth | Firebase Auth | Simple, escalable |
| Database | Firestore | Sin backend separado |
| Pagos | Stripe | Estándar industria |
| JWT | jose | Ligero, bien mantenido |
| Styling | Tailwind + shadcn/ui | Ya existente |

## Lo que NO hacemos en MVP

| Característica | Razón |
|----------------|-------|
| CQRS | Overkill para 4 casos de uso |
| Domain Events | Sin flujos async complejos |
| DI Containers | Adapters directos suficientes |
| Límite dispositivos | Complejidad alta |
| Cloud history | Team plan post-tracción |
| Analytics dashboard | El producto es la extensión |
| Tests E2E extensión | Manual en MVP |

## Foco MVP

El objetivo del MVP es responder:

1. **¿Entienden el valor?** → Medir uso de captura
2. **¿MCP cambia su workflow?** → Medir conversión MCP
3. **¿Pagan?** → Medir checkout completados
4. **¿Vuelven?** → Medir retention 7/30 días

Todo lo demás es secundario hasta validar estas preguntas.
