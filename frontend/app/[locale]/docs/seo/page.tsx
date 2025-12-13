import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import type { Locale } from "@/lib/i18n"
import type { Metadata } from "next"
import { Check, AlertCircle, Circle, Zap, Globe, FileText, BarChart3, Settings, Sparkles } from "lucide-react"

export const metadata: Metadata = {
  title: "SEO Checklist - International SEO Guide | Browser Console AI",
  description: "Comprehensive SEO checklist for international multilingual websites. Priority-based tasks for technical SEO, content optimization, and international targeting.",
}

// Status indicators
const StatusDone = () => (
  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-xs font-medium">
    <Check className="w-3 h-3" /> Done
  </span>
)

const StatusPartial = () => (
  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-medium">
    <AlertCircle className="w-3 h-3" /> Partial
  </span>
)

const StatusPending = () => (
  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
    <Circle className="w-3 h-3" /> Pending
  </span>
)

const StatusEasy = () => (
  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
    <Zap className="w-3 h-3" /> Easy
  </span>
)

interface ChecklistItemProps {
  done?: boolean
  partial?: boolean
  easy?: boolean
  children: React.ReactNode
  note?: string
}

function ChecklistItem({ done, partial, easy, children, note }: ChecklistItemProps) {
  return (
    <li className="flex items-start gap-3 py-2">
      <span className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
        done ? "bg-green-500/10 border-green-500/30 text-green-500" :
        partial ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-500" :
        "bg-muted border-border text-muted-foreground"
      }`}>
        {done && <Check className="w-3 h-3" />}
        {partial && <AlertCircle className="w-3 h-3" />}
      </span>
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={done ? "text-muted-foreground line-through" : ""}>{children}</span>
          {easy && <StatusEasy />}
        </div>
        {note && <p className="text-xs text-muted-foreground mt-1">{note}</p>}
      </div>
    </li>
  )
}

function SectionHeader({ icon: Icon, title, priority }: { icon: React.ElementType, title: string, priority: string }) {
  const priorityColors: Record<string, string> = {
    "P1": "bg-red-500/10 text-red-500 border-red-500/30",
    "P2": "bg-orange-500/10 text-orange-500 border-orange-500/30",
    "P3": "bg-blue-500/10 text-blue-500 border-blue-500/30",
    "P4": "bg-muted text-muted-foreground border-border",
  }

  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      <span className={`ml-auto px-2 py-1 rounded text-xs font-medium border ${priorityColors[priority]}`}>
        {priority}
      </span>
    </div>
  )
}

export default async function SEODocsPage({ params }: { params: { locale: Locale } }) {
  const { locale } = params

  return (
    <>
      <Header locale={locale} />
      <main className="pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Globe className="w-4 h-4" />
              <span>Internal Documentation</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              International SEO Checklist
            </h1>
            <p className="text-lg text-muted-foreground">
              Prioridades y acciones para un sitio web multilingue e internacional.
              Checklist adaptado para Browser Console AI con 6 idiomas y variantes por pais.
            </p>
          </div>

          {/* Status Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-2xl font-bold text-green-500">24</div>
              <div className="text-sm text-muted-foreground">Completados</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-500">3</div>
              <div className="text-sm text-muted-foreground">Parciales</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-2xl font-bold text-primary">4</div>
              <div className="text-sm text-muted-foreground">Faciles</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-2xl font-bold text-muted-foreground">9</div>
              <div className="text-sm text-muted-foreground">Pendientes</div>
            </div>
          </div>

          {/* Priority 1 - Critical */}
          <section className="mb-12 bg-card border border-border rounded-xl p-6">
            <SectionHeader icon={Zap} title="Estructura Multilingue" priority="P1" />
            <ul className="space-y-1">
              <ChecklistItem done>Rutas por idioma (<code className="text-xs bg-muted px-1 rounded">/en</code>, <code className="text-xs bg-muted px-1 rounded">/es</code>, <code className="text-xs bg-muted px-1 rounded">/fr</code>, <code className="text-xs bg-muted px-1 rounded">/de</code>, <code className="text-xs bg-muted px-1 rounded">/it</code>, <code className="text-xs bg-muted px-1 rounded">/pt</code>)</ChecklistItem>
              <ChecklistItem done>Sistema de i18n implementado</ChecklistItem>
              <ChecklistItem done>1 archivo por idioma (en.json, es.json, etc.)</ChecklistItem>
              <ChecklistItem done>Variantes por pais dentro del archivo (_variants)</ChecklistItem>
              <ChecklistItem done>Deteccion del pais por SSR (x-vercel-ip-country)</ChecklistItem>
              <ChecklistItem done>No duplicar archivos por pais</ChecklistItem>
            </ul>
          </section>

          <section className="mb-12 bg-card border border-border rounded-xl p-6">
            <SectionHeader icon={Globe} title="Hreflang + Canonical" priority="P1" />
            <ul className="space-y-1">
              <ChecklistItem done note="Implementado en layout.tsx con generateMetadata">
                Etiquetas hreflang para todas las versiones
              </ChecklistItem>
              <ChecklistItem done note="x-default apunta a /en">
                Etiqueta x-default
              </ChecklistItem>
              <ChecklistItem done note="Canonical dinamico en generateMetadata">
                Canonical correcto por idioma
              </ChecklistItem>
              <ChecklistItem done>Evitar paginas duplicadas entre idiomas</ChecklistItem>
              <ChecklistItem done>No indexar rutas incorrectas/antiguas</ChecklistItem>
            </ul>

            <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-sm font-medium mb-2 text-green-500">Implementado en app/[locale]/layout.tsx:</p>
              <pre className="text-xs bg-background p-3 rounded overflow-x-auto">{`export async function generateMetadata({ params }) {
  const { locale } = await params
  const languages: Record<string, string> = {}
  for (const l of locales) {
    languages[l] = \`\${baseUrl}/\${l}\`
  }
  languages["x-default"] = \`\${baseUrl}/en\`
  return {
    alternates: { canonical: \`\${baseUrl}/\${locale}\`, languages }
  }
}`}</pre>
            </div>
          </section>

          <section className="mb-12 bg-card border border-border rounded-xl p-6">
            <SectionHeader icon={FileText} title="Sitemaps por Idioma" priority="P1" />
            <ul className="space-y-1">
              <ChecklistItem done note="Actualizado con 6 idiomas + language alternates">
                sitemap.xml con todos los idiomas
              </ChecklistItem>
              <ChecklistItem note="Next.js genera un solo sitemap, alternativa: sitemap index">
                Sitemaps separados por idioma (opcional)
              </ChecklistItem>
              <ChecklistItem done>Sitemaps enlazados en robots.txt</ChecklistItem>
              <ChecklistItem done>URLs incluyen el idioma correspondiente</ChecklistItem>
            </ul>

            <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-sm font-medium mb-2 text-green-500">Implementado en app/sitemap.ts:</p>
              <pre className="text-xs bg-background p-3 rounded overflow-x-auto">{`// Incluye 6 idiomas con alternates
const sitemapEntries = locales.flatMap((locale) =>
  routes.map((route) => ({
    url: \`\${baseUrl}/\${locale}\${route.path}\`,
    alternates: {
      languages: Object.fromEntries(
        locales.map((l) => [l, \`\${baseUrl}/\${l}\${route.path}\`])
      ),
    },
  }))
)`}</pre>
            </div>
          </section>

          <section className="mb-12 bg-card border border-border rounded-xl p-6">
            <SectionHeader icon={Zap} title="Rendimiento (Core Web Vitals)" priority="P1" />
            <ul className="space-y-1">
              <ChecklistItem partial note="Medir con Lighthouse, objetivo < 2.5s">LCP &lt; 2.5s</ChecklistItem>
              <ChecklistItem partial note="Revisar layout shifts en animaciones">CLS &lt; 0.1</ChecklistItem>
              <ChecklistItem done note="Vercel Edge + CDN">TTFB &lt; 200ms</ChecklistItem>
              <ChecklistItem done note="Configurado en next.config.mjs con AVIF/WebP">Imagenes en WebP/AVIF</ChecklistItem>
              <ChecklistItem partial>Lazy loading para imagenes y recursos</ChecklistItem>
              <ChecklistItem done note="Next.js Turbopack">CSS/JS minificados</ChecklistItem>
              <ChecklistItem done>Cache y CDN configurados (Vercel)</ChecklistItem>
              <ChecklistItem note="Verificar score movil en PageSpeed Insights">Optimizado para movil (score &gt;85)</ChecklistItem>
            </ul>

            <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-sm font-medium mb-2 text-green-500">Optimizacion de imagenes habilitada en next.config.mjs:</p>
              <pre className="text-xs bg-background p-3 rounded overflow-x-auto">{`images: {
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
}`}</pre>
            </div>
          </section>

          {/* Priority 2 - Important */}
          <section className="mb-12 bg-card border border-border rounded-xl p-6">
            <SectionHeader icon={Settings} title="SEO Tecnico" priority="P2" />
            <ul className="space-y-1">
              <ChecklistItem done>robots.txt correcto</ChecklistItem>
              <ChecklistItem done note="Vercel maneja HTTPS automaticamente">HTTPS con HSTS</ChecklistItem>
              <ChecklistItem done>Evitar redirecciones multiples</ChecklistItem>
              <ChecklistItem note="Ejecutar crawler para verificar">No hay enlaces rotos</ChecklistItem>
              <ChecklistItem done>URLs limpias y legibles</ChecklistItem>
              <ChecklistItem easy note="Agregar componente Breadcrumb con JSON-LD">Breadcrumbs</ChecklistItem>
              <ChecklistItem easy note="Agregar header X-Robots-Tag en preview">No-index en entornos dev/staging</ChecklistItem>
            </ul>
          </section>

          <section className="mb-12 bg-card border border-border rounded-xl p-6">
            <SectionHeader icon={FileText} title="Metadatos por Pagina" priority="P2" />
            <ul className="space-y-1">
              <ChecklistItem done note="seoData traducido en page.tsx">&lt;title&gt; unico por idioma</ChecklistItem>
              <ChecklistItem done note="seoData traducido en page.tsx">&lt;meta description&gt; unico por idioma</ChecklistItem>
              <ChecklistItem done note="generateMetadata incluye OG tags">OG:title traducido</ChecklistItem>
              <ChecklistItem done note="generateMetadata incluye OG tags">OG:description traducido</ChecklistItem>
              <ChecklistItem note="Crear imagenes por idioma (opcional)">OG:image por idioma</ChecklistItem>
              <ChecklistItem done>Twitter Card configurado</ChecklistItem>
              <ChecklistItem done note="HtmlLang client component">&lt;html lang=&quot;xx&quot;&gt; dinamico</ChecklistItem>
            </ul>

            <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-sm font-medium mb-2 text-green-500">Implementado con HtmlLang client component:</p>
              <pre className="text-xs bg-background p-3 rounded overflow-x-auto">{`// src/components/seo/html-lang.tsx
"use client"
export function HtmlLang() {
  const { locale } = useI18n()
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])
  return null
}`}</pre>
            </div>
          </section>

          <section className="mb-12 bg-card border border-border rounded-xl p-6">
            <SectionHeader icon={FileText} title="Contenido por Pagina" priority="P2" />
            <ul className="space-y-1">
              <ChecklistItem done>H1 unico por pagina</ChecklistItem>
              <ChecklistItem done>Estructura clara: H1 → H2 → H3</ChecklistItem>
              <ChecklistItem partial note="Revisar keywords por mercado">Keywords adaptadas por idioma</ChecklistItem>
              <ChecklistItem done>CTA visible sin scroll</ChecklistItem>
              <ChecklistItem done>Variantes culturales por pais (hero, testimonios)</ChecklistItem>
              <ChecklistItem partial easy note="Revisar todas las imagenes">Imagenes con alt descriptivo</ChecklistItem>
              <ChecklistItem done>Contenido consistente entre idiomas</ChecklistItem>
              <ChecklistItem done>Evitar contenido delgado</ChecklistItem>
            </ul>
          </section>

          <section className="mb-12 bg-card border border-border rounded-xl p-6">
            <SectionHeader icon={Settings} title="Datos Estructurados (JSON-LD)" priority="P2" />
            <ul className="space-y-1">
              <ChecklistItem done note="Integrado en homepage">Organization</ChecklistItem>
              <ChecklistItem done note="Con traducciones por idioma">SoftwareApplication</ChecklistItem>
              <ChecklistItem easy note="Componente listo para usar">FAQ</ChecklistItem>
              <ChecklistItem done note="Con pasos traducidos">HowTo (install steps)</ChecklistItem>
              <ChecklistItem easy note="Componente listo para inner pages">BreadcrumbList</ChecklistItem>
              <ChecklistItem note="Usar Rich Results Test">Validado con Schema.org</ChecklistItem>
            </ul>

            <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-sm font-medium mb-2 text-green-500">Implementado en src/components/seo/json-ld.tsx:</p>
              <pre className="text-xs bg-background p-3 rounded overflow-x-auto">{`// Componentes disponibles:
// - OrganizationSchema
// - SoftwareApplicationSchema({ locale })
// - HowToSchema({ locale })
// - BreadcrumbSchema({ items, locale })
// - FAQSchema({ items })

// Uso en page.tsx:
<OrganizationSchema />
<SoftwareApplicationSchema locale={locale} />
<HowToSchema locale={locale} />`}</pre>
            </div>
          </section>

          {/* Priority 3 - Desirable */}
          <section className="mb-12 bg-card border border-border rounded-xl p-6">
            <SectionHeader icon={Globe} title="Localizacion Real" priority="P3" />
            <ul className="space-y-1">
              <ChecklistItem done>Hero adaptado por pais (UK, DE, etc.)</ChecklistItem>
              <ChecklistItem done>Bullets adaptados con variantes</ChecklistItem>
              <ChecklistItem partial note="Agregar testimonios por region">Testimonios localizados</ChecklistItem>
              <ChecklistItem note="Si aplica pricing page">Precios adaptados (GBP, EUR)</ChecklistItem>
              <ChecklistItem>Ejemplos/casos por region</ChecklistItem>
              <ChecklistItem>Imagenes culturalmente apropiadas</ChecklistItem>
            </ul>
          </section>

          <section className="mb-12 bg-card border border-border rounded-xl p-6">
            <SectionHeader icon={BarChart3} title="Tracking Internacional" priority="P3" />
            <ul className="space-y-1">
              <ChecklistItem partial note="Vercel Analytics activo">Google Analytics 4 / Vercel Analytics</ChecklistItem>
              <ChecklistItem note="Configurar propiedades por idioma">Search Console configurado</ChecklistItem>
              <ChecklistItem easy note="Agregar eventos personalizados">Eventos clave: CTA, registro, descarga</ChecklistItem>
              <ChecklistItem done note="Vercel detecta pais automaticamente">Deteccion de pais en Analytics</ChecklistItem>
              <ChecklistItem>Funnels por idioma</ChecklistItem>
            </ul>
          </section>

          {/* Priority 4 - Optional */}
          <section className="mb-12 bg-card border border-border rounded-xl p-6">
            <SectionHeader icon={Sparkles} title="Opcionales (Enterprise)" priority="P4" />
            <ul className="space-y-1">
              <ChecklistItem note="Opcional: redirect segun Accept-Language">Redireccion inteligente por idioma navegador</ChecklistItem>
              <ChecklistItem done>Selector de idioma facil en UI</ChecklistItem>
              <ChecklistItem>Backlinks internacionales</ChecklistItem>
              <ChecklistItem>A/B testing del hero por mercado</ChecklistItem>
              <ChecklistItem>Heatmaps por idioma</ChecklistItem>
            </ul>
          </section>

          {/* Quick Audit */}
          <section className="mb-12 bg-primary/5 border border-primary/20 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Check className="w-5 h-5 text-primary" />
              Auditoria Rapida (1 minuto)
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  Cada idioma tiene su propia URL
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  Hreflang correcto + x-default
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  Canonical correcto por idioma
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  Metadatos traducidos
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  OG tags por idioma
                </li>
              </ul>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  Contenido traducido + localizado
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                  Velocidad movil (verificar con Lighthouse)
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  Sitemaps con 6 idiomas + alternates
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  No duplicados indexados
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  JSON-LD integrados (Org, App, HowTo)
                </li>
              </ul>
            </div>
          </section>

          {/* Completed Items */}
          <section className="mb-12 bg-green-500/5 border border-green-500/20 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-green-500">
              <Check className="w-5 h-5" />
              Implementaciones Recientes
            </h2>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Sitemap.ts actualizado con 6 idiomas + language alternates</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> generateMetadata con hreflang, x-default y canonical</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> HtmlLang client component para html lang dinamico</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> JSON-LD schemas (Organization, SoftwareApplication, HowTo)</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Optimizacion de imagenes (AVIF/WebP) habilitada</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Metadata traducida por idioma (title, description, OG tags)</li>
            </ul>
          </section>

          {/* Next Steps */}
          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Proximos Pasos Recomendados</h2>
            <ol className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center">1</span>
                <div>
                  <strong>Validar JSON-LD con Rich Results Test</strong>
                  <p className="text-sm text-muted-foreground">Verificar que los schemas sean validos en search.google.com/test/rich-results</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center">2</span>
                <div>
                  <strong>Medir Core Web Vitals</strong>
                  <p className="text-sm text-muted-foreground">Ejecutar Lighthouse y PageSpeed Insights para verificar LCP, CLS y FID</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center">3</span>
                <div>
                  <strong>Agregar FAQSchema en paginas relevantes</strong>
                  <p className="text-sm text-muted-foreground">El componente ya existe, solo integrarlo donde haya FAQs</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center">4</span>
                <div>
                  <strong>Configurar Google Search Console</strong>
                  <p className="text-sm text-muted-foreground">Propiedades por idioma para monitorear rendimiento internacional</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center">5</span>
                <div>
                  <strong>Agregar BreadcrumbSchema en inner pages</strong>
                  <p className="text-sm text-muted-foreground">Usar el componente BreadcrumbSchema en /docs y subpaginas</p>
                </div>
              </li>
            </ol>
          </section>
        </div>
      </main>
      <Footer locale={locale} />
    </>
  )
}
