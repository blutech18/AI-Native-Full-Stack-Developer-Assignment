import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import multer from 'multer';
import { parseUploadedDocument } from './importers.js';
import { JsonStore } from './store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const defaultDataFile = path.join(__dirname, 'data', 'store.json');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024
  }
});

export function createApp(options = {}) {
  const app = express();
  const store = options.store || new JsonStore(process.env.DATA_FILE || defaultDataFile);

  app.locals.store = store;
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_request, response) => {
    response.json({ ok: true });
  });

  app.get('/api/users', (_request, response) => {
    response.json({ users: store.getUsers() });
  });

  app.get('/api/documents', withUser(store, (request, response) => {
    response.json({ documents: store.listDocumentsForUser(request.user.id) });
  }));

  app.post('/api/documents', withUser(store, (request, response) => {
    const document = store.createDocument({
      title: request.body.title,
      contentHtml: request.body.contentHtml,
      ownerId: request.user.id
    });

    response.status(201).json({ document });
  }));

  app.get('/api/documents/:id', withUser(store, (request, response) => {
    response.json({ document: store.getDocument(request.params.id, request.user.id) });
  }));

  app.patch('/api/documents/:id', withUser(store, (request, response) => {
    const changes = {};

    if (Object.prototype.hasOwnProperty.call(request.body, 'title')) {
      changes.title = request.body.title;
    }

    if (Object.prototype.hasOwnProperty.call(request.body, 'contentHtml')) {
      changes.contentHtml = request.body.contentHtml;
    }

    const document = store.updateDocument(request.params.id, request.user.id, changes);

    response.json({ document });
  }));

  app.post('/api/documents/:id/shares', withUser(store, (request, response) => {
    const document = store.shareDocument(request.params.id, request.user.id, request.body.userId);
    response.json({ document });
  }));

  app.delete('/api/documents/:id/shares/:userId', withUser(store, (request, response) => {
    const document = store.revokeShare(request.params.id, request.user.id, request.params.userId);
    response.json({ document });
  }));

  app.post('/api/uploads', withUser(store, upload.single('file'), (request, response) => {
    const parsed = parseUploadedDocument(request.file);
    const document = store.createDocument({
      title: parsed.title,
      contentHtml: parsed.contentHtml,
      ownerId: request.user.id
    });

    response.status(201).json({ document });
  }));

  const distPath = path.join(projectRoot, 'dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (_request, response) => {
      response.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.use((error, _request, response, _next) => {
    if (error.code === 'LIMIT_FILE_SIZE') {
      response.status(400).json({ error: 'File must be 1 MB or smaller.' });
      return;
    }

    response.status(error.statusCode || 500).json({
      error: error.statusCode ? error.message : 'Something went wrong.'
    });
  });

  return app;
}

function withUser(store, ...handlers) {
  return [
    (request, _response, next) => {
      try {
        const userId = request.header('x-user-id');
        request.user = store.requireUser(userId);
        next();
      } catch (error) {
        next(error);
      }
    },
    ...handlers
  ];
}
