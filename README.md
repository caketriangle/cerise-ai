# Cake Triangle AI V10 — Cloudflare Pages

A specialized Bakery/Cake/Dessert AI with a context-aware domain boundary. It is intentionally **not** a general-purpose chatbot: unrelated questions are redirected, while supporting skills such as math, coding, research, weather, and business calculations are allowed when they are being used for a bakery-related purpose.

## V10 behavior
- Bangla, Banglish, English, mixed language and typos
- Natural intent/context understanding; not keyword-only filtering
- Cake, dessert, baking, pastry, ingredients, chocolate, decoration, food science, recipes, troubleshooting, storage, servings, bakery business and related topics
- Bakery-related math/coding/research/business tasks are allowed
- Completely unrelated requests are politely redirected
- Image upload and image analysis
- Cake design/image generation endpoint (Gemini image API; billing/eligible access may be required)
- Server-side API secrets only
- Responsive UI for phone, iPhone/iPad, tablet and desktop

## Deploy
1. Put these files in a GitHub repository with `index.html` at the repository root.
2. Connect the repo to Cloudflare Pages.
3. Framework preset: None. Build command: empty. Build output directory: `/`.
4. In Cloudflare project Settings → Variables and Secrets, add encrypted secrets:
   - `GROQ_API_KEY`
   - `GEMINI_API_KEY`
   - Optional: `SITE_ORIGIN` = your `https://your-project.pages.dev` origin
5. Redeploy after saving secrets.

## Security
Never put API keys in `index.html`, client-side JavaScript, GitHub, screenshots, or chat messages. The browser sends requests only to the Cloudflare Pages Function at `/api/chat`; keys are read from the server environment.

## Important
No system is 100% hack-proof. Do not connect private customer/order tables to this assistant unless you later build a strict server-side allowlist and authorization layer.

Image generation availability and pricing can change by Gemini model/tier. The UI is designed to return a clear error if image generation requires billing or a quota is exhausted.
