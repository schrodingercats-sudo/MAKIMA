# SEO, AEO, GEO & Open Graph Master Guide for Web Applications

This document outlines the strict guidelines and solutions implemented to guarantee 100% perfect Open Graph link previews, Google indexing, AI engine optimization (AEO/GEO), and Vercel deployment compatibility.

---

## 1. Open Graph (OG) & Social Card Rules

### A. Image Dimensions & File Weight
- **Aspect Ratio:** `1.91:1`
- **Resolution:** **`1200 × 630` pixels** (Exact).
- **Format:** High-performance **JPEG (`.jpg`)** or **WebP (`.webp`)** under **200 KB**.
- **Why:** PNG files >1MB cause Discord and Twitter scrapers to hit internal 3-second timeouts, resulting in blank gray preview cards or broken image icons.

### B. Full Absolute HTTPS URLs Only
- **Incorrect:** `<meta property="og:image" content="/images/og-image.jpg" />`
- **Correct:** `<meta property="og:image" content="https://makima-web.vercel.app/og-image.jpg" />`
- Social scrapers (Discordbot, Twitterbot, WhatsApp, iMessage) **cannot resolve relative paths**.

### C. Attribute Syntax Standard
- **Open Graph tags:** MUST use `property="og:..."` attribute.
- **Twitter Card tags:** MUST use `name="twitter:..."` attribute.
- Mixing `name="og:image"` breaks W3C & OpenGraph parsers.

### D. Sweet-Spot Character Lengths (opengraph.xyz Audit)
- **Title (`title` & `og:title`):** **50–55 characters** max (prevents truncation on Google, X, LinkedIn).
- **Description (`description` & `og:description`):** **150–155 characters** max (fits Google Search & Discord preview cards).

---

## 2. Vercel SPA Deployment Configuration (`vercel.json`)

### Exclude Static Media from SPA Rewrites
When deploying Single Page Applications (Vite / React) on Vercel:
```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/((?!.*\\.).*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/og-image.(jpg|png|webp)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        },
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ]
}
```
- **Why:** The regex `/((?!.*\\.).*)` ensures that requests containing file extensions (`.jpg`, `.png`, `.webp`, `.svg`, `.json`, `.xml`, `.mp4`) are served directly as raw binary static files and **never intercepted by React SPA index.html routing**.

---

## 3. AEO (Answer Engine) & GEO (Generative Engine) Optimization

- **Structured Data (`JSON-LD`):** Embed `Schema.org` schemas (`WebSite`, `Person`, `FAQPage`, `BreadcrumbList`) in `index.html`.
- **AI Crawler Permissions (`robots.txt`):** Explicitly allow AI search crawlers (`GPTBot`, `ClaudeBot`, `PerplexityBot`, `Bytespider`).
- **XML Sitemap (`sitemap.xml`):** Fully indexed XML sitemap with explicit `<image:image>` entries.

---

## 4. Google Search Console & Vercel Analytics

- **Search Console:** Google HTML verification file `public/google3690ce1ff1168d6d.html` + `<meta name="google-site-verification" content="3690ce1ff1168d6d" />`.
- **Analytics:** `@vercel/analytics` integrated via `<Analytics />` in `src/App.jsx`.
