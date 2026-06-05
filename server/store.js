import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sanitizeHtml from 'sanitize-html';

export const SEEDED_USERS = [
  { id: 'maya', name: 'Maya Chen' },
  { id: 'noah', name: 'Noah Patel' },
  { id: 'lena', name: 'Lena Ortiz' }
];

const starterHtml = `
  <h1>Welcome to Ajaia Docs</h1>
  <p>This lightweight editor supports rich text, saving, importing, and sharing.</p>
  <ul>
    <li>Create a document from scratch.</li>
    <li>Import a .txt or .md file.</li>
    <li>Share with another seeded user.</li>
  </ul>
`;

export function defaultData() {
  const now = new Date().toISOString();

  return {
    users: SEEDED_USERS,
    documents: [
      {
        id: 'doc_welcome',
        title: 'Product planning notes',
        contentHtml: starterHtml.trim(),
        ownerId: 'maya',
        sharedWith: ['noah'],
        createdAt: now,
        updatedAt: now
      }
    ]
  };
}

export class JsonStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.ensureReady();
  }

  ensureReady() {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });

    if (!fs.existsSync(this.filePath)) {
      this.write(defaultData());
    }
  }

  read() {
    this.ensureReady();
    return JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
  }

  write(data) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  getUsers() {
    return this.read().users;
  }

  requireUser(userId) {
    const user = this.getUsers().find((candidate) => candidate.id === userId);

    if (!user) {
      const error = new Error('Unknown user.');
      error.statusCode = 401;
      throw error;
    }

    return user;
  }

  listDocumentsForUser(userId) {
    this.requireUser(userId);
    const data = this.read();

    return data.documents
      .filter((document) => canAccessDocument(document, userId))
      .map((document) => toSummary(document, userId))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  getDocument(documentId, userId) {
    this.requireUser(userId);
    const document = this.findDocument(documentId);

    if (!canAccessDocument(document, userId)) {
      const error = new Error('You do not have access to this document.');
      error.statusCode = 403;
      throw error;
    }

    return decorateDocument(document, userId);
  }

  createDocument({ title, contentHtml, ownerId }) {
    this.requireUser(ownerId);
    const data = this.read();
    const now = new Date().toISOString();
    const document = {
      id: `doc_${crypto.randomUUID()}`,
      title: cleanTitle(title),
      contentHtml: normalizeHtml(contentHtml),
      ownerId,
      sharedWith: [],
      createdAt: now,
      updatedAt: now
    };

    data.documents.push(document);
    this.write(data);
    return decorateDocument(document, ownerId);
  }

  updateDocument(documentId, userId, changes) {
    this.requireUser(userId);
    const data = this.read();
    const document = data.documents.find((candidate) => candidate.id === documentId);

    if (!document) {
      const error = new Error('Document not found.');
      error.statusCode = 404;
      throw error;
    }

    if (!canAccessDocument(document, userId)) {
      const error = new Error('You do not have access to this document.');
      error.statusCode = 403;
      throw error;
    }

    if (Object.prototype.hasOwnProperty.call(changes, 'title')) {
      if (document.ownerId !== userId) {
        const error = new Error('Only the owner can rename a document.');
        error.statusCode = 403;
        throw error;
      }

      document.title = cleanTitle(changes.title);
    }

    if (Object.prototype.hasOwnProperty.call(changes, 'contentHtml')) {
      document.contentHtml = normalizeHtml(changes.contentHtml);
    }

    document.updatedAt = new Date().toISOString();
    this.write(data);
    return decorateDocument(document, userId);
  }

  shareDocument(documentId, ownerId, targetUserId) {
    this.requireUser(ownerId);
    this.requireUser(targetUserId);
    const data = this.read();
    const document = data.documents.find((candidate) => candidate.id === documentId);

    if (!document) {
      const error = new Error('Document not found.');
      error.statusCode = 404;
      throw error;
    }

    if (document.ownerId !== ownerId) {
      const error = new Error('Only the owner can share this document.');
      error.statusCode = 403;
      throw error;
    }

    if (targetUserId === ownerId) {
      const error = new Error('A document is already available to its owner.');
      error.statusCode = 400;
      throw error;
    }

    if (!document.sharedWith.includes(targetUserId)) {
      document.sharedWith.push(targetUserId);
      document.updatedAt = new Date().toISOString();
      this.write(data);
    }

    return decorateDocument(document, ownerId);
  }

  revokeShare(documentId, ownerId, targetUserId) {
    this.requireUser(ownerId);
    this.requireUser(targetUserId);
    const data = this.read();
    const document = data.documents.find((candidate) => candidate.id === documentId);

    if (!document) {
      const error = new Error('Document not found.');
      error.statusCode = 404;
      throw error;
    }

    if (document.ownerId !== ownerId) {
      const error = new Error('Only the owner can update sharing.');
      error.statusCode = 403;
      throw error;
    }

    document.sharedWith = document.sharedWith.filter((userId) => userId !== targetUserId);
    document.updatedAt = new Date().toISOString();
    this.write(data);
    return decorateDocument(document, ownerId);
  }

  findDocument(documentId) {
    const document = this.read().documents.find((candidate) => candidate.id === documentId);

    if (!document) {
      const error = new Error('Document not found.');
      error.statusCode = 404;
      throw error;
    }

    return document;
  }
}

export function canAccessDocument(document, userId) {
  return document.ownerId === userId || document.sharedWith.includes(userId);
}

export function cleanTitle(title) {
  const safeTitle = String(title || '').trim();

  if (safeTitle.length < 1) {
    const error = new Error('Title is required.');
    error.statusCode = 400;
    throw error;
  }

  return safeTitle.slice(0, 100);
}

export function normalizeHtml(contentHtml) {
  const html = String(contentHtml || '').trim();
  const sanitizedHtml = sanitizeHtml(html, {
    allowedTags: [
      'b',
      'blockquote',
      'br',
      'code',
      'div',
      'em',
      'h1',
      'h2',
      'h3',
      'i',
      'li',
      'ol',
      'p',
      'pre',
      'span',
      'strong',
      'u',
      'ul'
    ],
    allowedAttributes: {}
  }).trim();

  return sanitizedHtml.length > 0 ? sanitizedHtml : '<p></p>';
}

function decorateDocument(document, userId) {
  return {
    ...document,
    access: document.ownerId === userId ? 'owner' : 'shared'
  };
}

function toSummary(document, userId) {
  return {
    id: document.id,
    title: document.title,
    ownerId: document.ownerId,
    sharedWith: document.sharedWith,
    updatedAt: document.updatedAt,
    access: document.ownerId === userId ? 'owner' : 'shared'
  };
}
