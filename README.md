# SubTranslator

Free AI-powered subtitle translator. Upload `.srt` or `.ass` files, choose a target language from 90+ options, and translate using your own API key (Gemini, OpenAI, Anthropic, DeepSeek, or Kimi). Everything stays in your browser — no account required.

**Live:** https://subtranslator.hibapp.com · https://sub-translator.wilson-pc.workers.dev · **Repo:** https://github.com/wilson-pc/sub-translator

---

## Stack

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4
- **Backend:** Cloudflare Workers (Hono)
- **Storage:** IndexedDB (Dexie) — browser only
- **i18n:** react-i18next (English / Spanish)

---

## Getting started

### Prerequisites

- Node.js ≥ 18
- A [Cloudflare account](https://dash.cloudflare.com/sign-up) with Wrangler authenticated (`npx wrangler login`)

### Install dependencies

```bash
npm install
```

### Run development server

```bash
npm run dev
```

Opens at `http://localhost:5173`. The Cloudflare Worker runs locally via Vite's dev proxy.

---

## Build

Compiles TypeScript and bundles the app + worker:

```bash
npm run build
```

Output is placed in `dist/`. You can preview the production build locally:

```bash
npm run preview
```

---

## Deploy

Builds and deploys to Cloudflare Workers (assets served via Workers Assets):

```bash
npm run deploy
```

This runs `wrangler deploy` under the hood. Make sure you are logged in to Wrangler before deploying:

```bash
npx wrangler login
```

The worker name and compatibility settings are configured in [`wrangler.jsonc`](wrangler.jsonc).

---

## Other scripts

| Command | Description |
|---|---|
| `npm run lint` | Run ESLint across the project |
| `npm run cf-typegen` | Regenerate Cloudflare Worker type definitions |

---

## License

[MIT](LICENSE)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
