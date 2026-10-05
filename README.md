# TERBI

Shopify Liquid theme for the TERBI 3C demonstration store.

- Store: https://terbi-gjlghl4q.myshopify.com
- Theme: `terbi` (ID `192777290009`)
- Brand: TERBI; primary and secondary buttons use 4px corners.
- Catalogue: six simulated charging, audio and desk products, four collections and two content pages.
- Content: 22 Metaobject entries and 22 resource bindings, including technical specifications, hero content, category cards, illustrated guides, CTA content and FAQs.

## Structure

The eight Shopify theme directories are `assets`, `blocks`, `config`, `layout`, `locales`, `sections`, `snippets` and `templates`.

`demo-import-result.json` and `demo-metaobjects-result.json` record the imported demonstration resources and their Shopify IDs. These IDs belong to this store; another store needs its own data import and references.

## Development

Use Node.js 22 or newer. Install with `npm ci`, then run `npm test`. The layout test uses system Chrome; set `CHROME_PATH` if Chrome is installed elsewhere.

Run Shopify Theme Check with `npx @shopify/cli theme check --fail-level error`.

Development uses `dev`; `production` holds the published theme snapshot. This initial import puts the same snapshot on both branches. No automatic deployment workflow is configured.

## Content and branding

The theme was copied from the TERKKIN project and adapted to TERBI at the owner's explicit request. The brand and 3C demonstration content replace the source project's outdoor marketing content in the active storefront. Product illustrations, prices and specifications are simulated; no reviews, certifications, sales figures or discounts are invented.

Keep credentials in environment variables. Do not commit access tokens, app secrets, storefront passwords, customer data, local caches or browser profiles. Store access is currently password protected.
