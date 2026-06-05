# Architecture Note

## What I Prioritized

I prioritized a complete, reviewable product slice over a broad Google Docs clone. The app focuses on the flows the assignment explicitly evaluates: creating and editing documents, preserving rich-text content, importing files, sharing with another user, and demonstrating persistence.

## Shape of the App

The client is a React/Vite app with a compact document workspace: a sidebar for user switching and document lists, a contenteditable editor, a formatting toolbar, and an access panel. The backend is an Express API with a small `JsonStore` abstraction that persists users, documents, owners, and shared user IDs to `server/data/store.json`. Editor HTML is sanitized on the server to keep the supported rich-text tags while removing unsafe markup.

I chose JSON file persistence instead of SQLite to keep setup dependable for reviewers and avoid native database installation issues. The store is intentionally isolated behind a class so it could be swapped for SQLite or Postgres without changing the React client.

## Sharing Model

Auth is simulated through seeded users and the `x-user-id` request header. Each document has exactly one owner and a `sharedWith` list. Owners can rename and manage sharing. Owners and shared users can edit content. Unshared users receive a `403` from document access endpoints.

## File Handling

The upload flow accepts `.txt` and `.md` files up to 1 MB and turns each upload into a new document owned by the current user. Markdown import intentionally supports a small useful subset: headings, paragraphs, and unordered lists.

## Tradeoffs

I intentionally deprioritized real-time collaboration, comments, granular permissions, conflict resolution, and DOCX parsing. With another 2-4 hours, I would add autosave, document version history, and role-based permissions such as view-only versus edit access.
