import path from 'node:path';

const SUPPORTED_EXTENSIONS = new Set(['.txt', '.md']);

export function parseUploadedDocument(file) {
  if (!file) {
    const error = new Error('Choose a .txt or .md file to import.');
    error.statusCode = 400;
    throw error;
  }

  const extension = path.extname(file.originalname).toLowerCase();

  if (!SUPPORTED_EXTENSIONS.has(extension)) {
    const error = new Error('Only .txt and .md files are supported.');
    error.statusCode = 400;
    throw error;
  }

  const content = file.buffer.toString('utf8');
  const title = path.basename(file.originalname, extension);

  return {
    title,
    contentHtml: extension === '.md' ? markdownToHtml(content) : textToHtml(content)
  };
}

export function markdownToHtml(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const html = [];
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      if (inList) {
        html.push('</ul>');
        inList = false;
      }
      continue;
    }

    const listMatch = trimmed.match(/^[-*]\s+(.+)$/);

    if (listMatch) {
      if (!inList) {
        html.push('<ul>');
        inList = true;
      }
      html.push(`<li>${escapeHtml(listMatch[1])}</li>`);
      continue;
    }

    if (inList) {
      html.push('</ul>');
      inList = false;
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);

    if (headingMatch) {
      const level = headingMatch[1].length;
      html.push(`<h${level}>${escapeHtml(headingMatch[2])}</h${level}>`);
      continue;
    }

    html.push(`<p>${escapeHtml(trimmed)}</p>`);
  }

  if (inList) {
    html.push('</ul>');
  }

  return html.join('\n') || '<p></p>';
}

export function textToHtml(text) {
  return text
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('\n') || '<p></p>';
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
