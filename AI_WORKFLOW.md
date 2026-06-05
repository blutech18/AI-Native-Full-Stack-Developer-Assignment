# AI Workflow Note

## Tools Used

- Codex for implementation planning, code generation, and verification support.

## Where AI Sped Up the Work

AI helped turn the ambiguous assignment into a constrained product slice, scaffold the React/Express structure quickly, and generate a first pass for API routes, store logic, UI states, tests, and documentation.

## What I Changed or Rejected

I kept the implementation intentionally smaller than a full Google Docs clone. I rejected heavier choices such as real-time editing, DOCX parsing, OAuth, and native SQLite setup because they would add review risk inside the 4-6 hour limit. I also kept the persistence layer behind a store abstraction so the simple JSON approach remains honest but replaceable.

## Verification

I verified the sharing behavior with an automated API test. I also ran the production build to check that the client compiles. For UX reliability, I manually checked the intended reviewer flow: switch seeded users, create and save a document, import a `.txt` or `.md` file, share access, and confirm the document appears under "Shared with me."
