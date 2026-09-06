'use client';
import { useState } from 'react';

function syntaxHighlight(json) {
  if (typeof json !== 'string') json = JSON.stringify(json, null, 2);
  return json
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = 'json-number';
        if (/^"/.test(match)) {
          cls = /:$/.test(match) ? 'json-key' : 'json-string';
        } else if (/true|false/.test(match)) {
          cls = 'json-bool';
        } else if (/null/.test(match)) {
          cls = 'json-null';
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
}

export default function ResponseViewer({ data, isError }) {
  const [copied, setCopied] = useState(false);
  if (!data) return null;

  const jsonStr = JSON.stringify(data, null, 2);
  const highlighted = syntaxHighlight(jsonStr);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="response-viewer">
      <div className="response-header">
        <div className="response-header-left">
          <span className={`response-badge ${isError ? 'error' : 'success'}`}>
            {isError ? '✗ Error' : '✓ Success'}
          </span>
          <span className="response-label">Response</span>
        </div>
        <button className="copy-btn" onClick={handleCopy}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <div className="response-body">
        <pre dangerouslySetInnerHTML={{ __html: highlighted }} />
      </div>
    </div>
  );
}
