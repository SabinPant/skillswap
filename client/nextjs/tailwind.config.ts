// tailwind.config.ts
// Minimal Tailwind v4 config — theme tokens are defined in globals.css
// via @theme blocks (v4's native mechanism). This file only specifies
// content paths for class scanning.
//
// See globals.css for the "Exchange Ledger" palette, typography, and
// semantic color tokens.

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './store/**/*.{ts,tsx}',
  ],
};

export default config;