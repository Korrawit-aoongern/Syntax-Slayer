# Syntax Slayer

A web-based educational game that teaches IT vocabulary through memory matching and light combat mechanics.

The actual Next.js app lives in `./syntax-slayer`.

**Quick Start**
1. `cd syntax-slayer`
2. `npm install`
3. `npm run dev`

**Scripts**
1. `npm run dev` runs the local dev server
2. `npm run build` builds the production bundle
3. `npm run start` starts the production server
4. `npm run lint` runs ESLint
5. `npm test` runs Jest + React Testing Library

**Project Structure (Inside `./syntax-slayer`)**
1. `app/components` UI components
2. `app/components/game` game-specific UI blocks
3. `app/data` JSON data and configuration constants
4. `app/types` shared TypeScript types
5. `app/utils` helpers and game logic utilities
6. `app/game` main gameplay page

**Vocabulary Data**
- Add new terms in `syntax-slayer/app/data/vocab.json`
- Make sure each entry has a unique `id`

**Persistence**
- Progress is saved to `localStorage` under `syntax-slayer-session-v1`

If you want a more detailed gameplay or contribution section, I can extend this README.  
