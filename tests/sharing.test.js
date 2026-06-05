import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../server/app.js';
import { JsonStore } from '../server/store.js';

let tempDir;
let app;

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ajaia-docs-'));
  const store = new JsonStore(path.join(tempDir, 'store.json'));
  app = createApp({ store });
});

afterEach(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});

describe('document sharing', () => {
  it('lets an owner share a document and blocks users who were not granted access', async () => {
    const createResponse = await request(app)
      .post('/api/documents')
      .set('x-user-id', 'maya')
      .send({ title: 'Launch brief', contentHtml: '<p>Draft</p>' })
      .expect(201);

    const documentId = createResponse.body.document.id;

    await request(app)
      .get(`/api/documents/${documentId}`)
      .set('x-user-id', 'lena')
      .expect(403);

    await request(app)
      .post(`/api/documents/${documentId}/shares`)
      .set('x-user-id', 'maya')
      .send({ userId: 'noah' })
      .expect(200);

    const sharedList = await request(app)
      .get('/api/documents')
      .set('x-user-id', 'noah')
      .expect(200);

    expect(sharedList.body.documents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: documentId,
          access: 'shared',
          ownerId: 'maya'
        })
      ])
    );
  });

  it('lets shared users edit content without owner-only title changes', async () => {
    const createResponse = await request(app)
      .post('/api/documents')
      .set('x-user-id', 'maya')
      .send({ title: 'Editable shared doc', contentHtml: '<p>Draft</p>' })
      .expect(201);

    const documentId = createResponse.body.document.id;

    await request(app)
      .post(`/api/documents/${documentId}/shares`)
      .set('x-user-id', 'maya')
      .send({ userId: 'noah' })
      .expect(200);

    const updateResponse = await request(app)
      .patch(`/api/documents/${documentId}`)
      .set('x-user-id', 'noah')
      .send({ contentHtml: '<p>Noah edit</p>' })
      .expect(200);

    expect(updateResponse.body.document).toEqual(
      expect.objectContaining({
        access: 'shared',
        contentHtml: '<p>Noah edit</p>',
        title: 'Editable shared doc'
      })
    );
  });
});
