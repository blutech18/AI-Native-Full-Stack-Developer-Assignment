# AI-Native Full Stack Developer Assignment Submission

## Google Drive Folder

https://drive.google.com/drive/folders/17_m6U7CsGezLOUy04aUzvxg4oNe8GFYb?usp=sharing

## Source Code

https://github.com/blutech18/AI-Native-Full-Stack-Developer-Assignment

## Live Product URL

https://ai-native-full-stack-developer-assignment.onrender.com/

## Walkthrough Video

https://drive.google.com/file/d/1nmm9_FUA9bnsCFms5oIjLK3dto61pk_9/view?usp=sharing

## Reviewer Accounts

- Maya Chen (`maya`)
- Noah Patel (`noah`)
- Lena Ortiz (`lena`)

## What Is Included

- Source code for the React/Vite frontend and Express backend
- `README.md` with local setup, run, test, and deployment instructions
- `ARCHITECTURE.md`
- `AI_WORKFLOW.md`
- `SUBMISSION.md`
- `WALKTHROUGH_VIDEO_URL.txt`
- Screenshots in the `screenshots/` folder

## Working Functionality

- Create a new document
- Rename a document as the owner
- Edit rich-text content in the browser
- Save and reopen documents
- Basic formatting: bold, italic, underline, headings, bulleted lists, and numbered lists
- Import `.txt` and `.md` files as editable documents
- Simulated reviewer users
- Owner/shared document distinction
- Grant and remove shared access
- Persist document and sharing data with a JSON file store
- Server-side HTML sanitization
- Automated sharing/access tests

## Local Setup

```bash
npm install
npm run dev
```

Open:

```txt
http://localhost:5173
```

The API runs on:

```txt
http://localhost:3001
```

## Tests

```bash
npm test
```

## Production Run

```bash
npm run build
npm start
```

## Notes and Tradeoffs

The app is intentionally scoped as a lightweight Google Docs-inspired editor rather than a full clone. I prioritized document creation/editing, persistence, upload, sharing, reviewer usability, clear docs, and a deployable build. Real-time collaboration, comments, version history, role-based permissions, and DOCX import/export were intentionally deferred.

## Next 2-4 Hours

- Add persistent disk storage or move persistence to a hosted database
- Add autosave and document version history
- Add edit/view permission roles
- Add comments or lightweight suggestion mode
