import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bold,
  Check,
  FilePlus2,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Save,
  Share2,
  Underline,
  Upload
} from 'lucide-react';

const emptyDocument = '<h1>Untitled document</h1><p>Start writing here...</p>';

function request(path, { userId, body, method = 'GET' } = {}) {
  return fetch(path, {
    method,
    headers: {
      ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(userId ? { 'x-user-id': userId } : {})
    },
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined
  }).then(async (response) => {
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || 'Request failed.');
    }

    return payload;
  });
}

export default function App() {
  const [users, setUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState('maya');
  const [documents, setDocuments] = useState([]);
  const [activeDocument, setActiveDocument] = useState(null);
  const [titleDraft, setTitleDraft] = useState('');
  const [status, setStatus] = useState('Ready');
  const [error, setError] = useState('');
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);

  const currentUser = users.find((user) => user.id === currentUserId);
  const ownedDocuments = useMemo(
    () => documents.filter((document) => document.access === 'owner'),
    [documents]
  );
  const sharedDocuments = useMemo(
    () => documents.filter((document) => document.access === 'shared'),
    [documents]
  );
  const shareCandidates = users.filter(
    (user) => user.id !== currentUserId && !activeDocument?.sharedWith?.includes(user.id)
  );

  useEffect(() => {
    request('/api/users')
      .then(({ users: loadedUsers }) => setUsers(loadedUsers))
      .catch(showError);
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadDocuments(currentUserId);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (editorRef.current && activeDocument) {
      editorRef.current.innerHTML = activeDocument.contentHtml;
      setTitleDraft(activeDocument.title);
    }
  }, [activeDocument?.id]);

  async function loadDocuments(userId = currentUserId) {
    try {
      const { documents: loadedDocuments } = await request('/api/documents', { userId });
      setDocuments(loadedDocuments);

      if (loadedDocuments.length === 0) {
        setActiveDocument(null);
        return;
      }

      const stillVisible = loadedDocuments.find((document) => document.id === activeDocument?.id);
      await openDocument(stillVisible?.id || loadedDocuments[0].id, userId);
    } catch (caughtError) {
      showError(caughtError);
    }
  }

  async function openDocument(documentId, userId = currentUserId) {
    try {
      const { document } = await request(`/api/documents/${documentId}`, { userId });
      setActiveDocument(document);
      setTitleDraft(document.title);
      setStatus('Loaded');
      setError('');
    } catch (caughtError) {
      showError(caughtError);
    }
  }

  async function createDocument() {
    try {
      setStatus('Creating...');
      const { document } = await request('/api/documents', {
        userId: currentUserId,
        method: 'POST',
        body: {
          title: 'Untitled document',
          contentHtml: emptyDocument
        }
      });
      await loadDocuments(currentUserId);
      await openDocument(document.id, currentUserId);
      setStatus('Created');
    } catch (caughtError) {
      showError(caughtError);
    }
  }

  async function saveDocument() {
    if (!activeDocument || !editorRef.current) {
      return;
    }

    try {
      setStatus('Saving...');
      const { document } = await request(`/api/documents/${activeDocument.id}`, {
        userId: currentUserId,
        method: 'PATCH',
        body: activeDocument.access === 'owner'
          ? {
              title: titleDraft,
              contentHtml: editorRef.current.innerHTML
            }
          : {
              contentHtml: editorRef.current.innerHTML
            }
      });
      setActiveDocument(document);
      await loadDocuments(currentUserId);
      setStatus('Saved');
      setError('');
    } catch (caughtError) {
      showError(caughtError);
    }
  }

  async function shareDocument(userId) {
    if (!activeDocument) {
      return;
    }

    try {
      setStatus('Sharing...');
      const { document } = await request(`/api/documents/${activeDocument.id}/shares`, {
        userId: currentUserId,
        method: 'POST',
        body: { userId }
      });
      setActiveDocument(document);
      await loadDocuments(currentUserId);
      setStatus('Shared');
      setError('');
    } catch (caughtError) {
      showError(caughtError);
    }
  }

  async function revokeShare(userId) {
    if (!activeDocument) {
      return;
    }

    try {
      setStatus('Updating sharing...');
      const { document } = await request(`/api/documents/${activeDocument.id}/shares/${userId}`, {
        userId: currentUserId,
        method: 'DELETE'
      });
      setActiveDocument(document);
      await loadDocuments(currentUserId);
      setStatus('Sharing updated');
      setError('');
    } catch (caughtError) {
      showError(caughtError);
    }
  }

  async function uploadDocument(event) {
    const [file] = event.target.files;

    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setStatus('Importing...');
      const { document } = await request('/api/uploads', {
        userId: currentUserId,
        method: 'POST',
        body: formData
      });
      await loadDocuments(currentUserId);
      await openDocument(document.id, currentUserId);
      setStatus('Imported');
      setError('');
    } catch (caughtError) {
      showError(caughtError);
    } finally {
      event.target.value = '';
    }
  }

  function runCommand(command, value = null) {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
  }

  function showError(caughtError) {
    setError(caughtError.message);
    setStatus('Needs attention');
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-row">
          <div>
            <p className="eyebrow">Ajaia</p>
            <h1>Docs</h1>
          </div>
          <button className="icon-button primary" onClick={createDocument} aria-label="Create document" title="Create document">
            <FilePlus2 size={18} />
          </button>
        </div>

        <label className="field-label" htmlFor="user-select">Reviewer user</label>
        <select id="user-select" value={currentUserId} onChange={(event) => setCurrentUserId(event.target.value)}>
          {users.map((user) => (
            <option key={user.id} value={user.id}>{user.name}</option>
          ))}
        </select>

        <button className="import-button" onClick={() => fileInputRef.current?.click()}>
          <Upload size={17} />
          Import .txt or .md
        </button>
        <input
          ref={fileInputRef}
          className="visually-hidden"
          type="file"
          accept=".txt,.md,text/plain,text/markdown"
          onChange={uploadDocument}
        />

        <DocumentSection
          title="Owned"
          documents={ownedDocuments}
          activeDocumentId={activeDocument?.id}
          onOpen={openDocument}
        />
        <DocumentSection
          title="Shared with me"
          documents={sharedDocuments}
          activeDocumentId={activeDocument?.id}
          onOpen={openDocument}
        />
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">{currentUser ? `Signed in as ${currentUser.name}` : 'Signed in'}</p>
            <input
              className="title-input"
              value={titleDraft}
              onChange={(event) => setTitleDraft(event.target.value)}
              disabled={!activeDocument || activeDocument.access !== 'owner'}
              aria-label="Document title"
            />
          </div>
          <button className="save-button" onClick={saveDocument} disabled={!activeDocument}>
            <Save size={18} />
            Save
          </button>
        </header>

        {error && <div className="notice error">{error}</div>}

        {activeDocument ? (
          <div className="editor-layout">
            <div className="editor-panel">
              <Toolbar runCommand={runCommand} />
              <article
                ref={editorRef}
                className="editor"
                contentEditable
                suppressContentEditableWarning
                aria-label="Document editor"
              />
            </div>

            <aside className="sharing-panel">
              <div>
                <p className="eyebrow">Access</p>
                <h2>{activeDocument.access === 'owner' ? 'Owner controls' : 'Shared access'}</h2>
              </div>

              <div className="access-line">
                <span>Owner</span>
                <strong>{userName(users, activeDocument.ownerId)}</strong>
              </div>

              {activeDocument.access === 'owner' ? (
                <>
                  <label className="field-label" htmlFor="share-select">Share with</label>
                  <div className="share-row">
                    <select id="share-select" onChange={(event) => {
                      if (event.target.value) {
                        shareDocument(event.target.value);
                        event.target.value = '';
                      }
                    }}>
                      <option value="">Choose a user</option>
                      {shareCandidates.map((user) => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </select>
                    <Share2 size={18} />
                  </div>

                  <div className="shared-list">
                    {activeDocument.sharedWith.length > 0 ? (
                      activeDocument.sharedWith.map((userId) => (
                        <div className="shared-user" key={userId}>
                          <span>{userName(users, userId)}</span>
                          <button onClick={() => revokeShare(userId)}>Remove</button>
                        </div>
                      ))
                    ) : (
                      <p className="muted">No shared users yet.</p>
                    )}
                  </div>
                </>
              ) : (
                <p className="muted">You can edit and save content, but only the owner can rename or manage sharing.</p>
              )}

              <div className="status-pill">
                <Check size={16} />
                {status}
              </div>
            </aside>
          </div>
        ) : (
          <div className="empty-state">
            <h2>No documents yet</h2>
            <button onClick={createDocument}>
              <FilePlus2 size={18} />
              Create document
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

function DocumentSection({ title, documents, activeDocumentId, onOpen }) {
  return (
    <section className="document-section">
      <h2>{title}</h2>
      {documents.length > 0 ? (
        <div className="document-list">
          {documents.map((document) => (
            <button
              key={document.id}
              className={document.id === activeDocumentId ? 'document-link active' : 'document-link'}
              onClick={() => onOpen(document.id)}
            >
              <span>{document.title}</span>
              <small>{new Date(document.updatedAt).toLocaleString()}</small>
            </button>
          ))}
        </div>
      ) : (
        <p className="muted">None</p>
      )}
    </section>
  );
}

function Toolbar({ runCommand }) {
  return (
    <div className="toolbar" aria-label="Formatting toolbar">
      <button onClick={() => runCommand('bold')} aria-label="Bold" title="Bold"><Bold size={18} /></button>
      <button onClick={() => runCommand('italic')} aria-label="Italic" title="Italic"><Italic size={18} /></button>
      <button onClick={() => runCommand('underline')} aria-label="Underline" title="Underline"><Underline size={18} /></button>
      <span className="divider" />
      <button onClick={() => runCommand('formatBlock', 'h1')} aria-label="Heading 1" title="Heading 1"><Heading1 size={18} /></button>
      <button onClick={() => runCommand('formatBlock', 'h2')} aria-label="Heading 2" title="Heading 2"><Heading2 size={18} /></button>
      <button onClick={() => runCommand('formatBlock', 'p')} aria-label="Paragraph" title="Paragraph">P</button>
      <span className="divider" />
      <button onClick={() => runCommand('insertUnorderedList')} aria-label="Bulleted list" title="Bulleted list"><List size={18} /></button>
      <button onClick={() => runCommand('insertOrderedList')} aria-label="Numbered list" title="Numbered list"><ListOrdered size={18} /></button>
    </div>
  );
}

function userName(users, userId) {
  return users.find((user) => user.id === userId)?.name || userId;
}
