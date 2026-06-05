# Ajaia Docs Assessment

A lightweight collaborative document editor built for the Ajaia full-stack assignment. It supports document creation, rich-text editing, save/reopen persistence, file import, and simple owner-based sharing with seeded users.

## Live Demo

https://ai-native-full-stack-developer-assignment.onrender.com/

## Stack

- React + Vite client
- Express API
- JSON file persistence in `server/data/store.json`
- Vitest + Supertest for API behavior tests

## Local Setup

```bash
npm install
npm run dev
```

Open the Vite app at `http://localhost:5173`.

The Express API runs at `http://localhost:3001`.

## Seeded Users

Use the reviewer user selector in the app to simulate login:

- Maya Chen (`maya`)
- Noah Patel (`noah`)
- Lena Ortiz (`lena`)

The seeded starter document is owned by Maya and shared with Noah, which makes the owned/shared distinction visible immediately.

## Features

- Create, rename, edit, save, and reopen documents.
- Rich text editing for bold, italic, underline, headings, bulleted lists, and numbered lists.
- Import `.txt` and `.md` files as new editable documents.
- Owner can grant and remove access for other seeded users.
- Shared users can open and edit document content, but only owners can rename or manage sharing.
- Documents and sharing data persist in a local JSON store after refresh or server restart.

## Tests

```bash
npm test
```

The included test verifies the core sharing path: unshared users are blocked, an owner can share, and the shared user sees the document in their shared list.

## Production Build

```bash
npm run serve
```

This builds the Vite client and serves it from the Express server on `http://localhost:3001`.

## Deployment Path

This app can be deployed to a Node host such as Render, Railway, Fly.io, or an Azure App Service. Use:

- Build command: `npm install && npm run build`
- Start command: `npm start`
- Optional environment variables:
  - `PORT`
  - `DATA_FILE`

For a public review deployment, use persistent disk storage for `DATA_FILE` so uploaded/imported documents survive restarts.
