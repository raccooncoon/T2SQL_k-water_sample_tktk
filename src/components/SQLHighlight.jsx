import { useState } from 'react';
import './SQLHighlight_Header.css';

function SQLHighlight({ sql, feedback, onFeedback }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedSQL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };
  const formatSQL = (code) => {
    if (!code) return '';

    // Step 1: Clean up and normalize
    let cleaned = code
      .replace(/\s+/g, ' ')
      .replace(/\s*,\s*/g, ', ')
      .trim();

    // Step 2: Define major keywords that start a new line
    const majorKeywords = ['SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'LIMIT', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN'];

    // Create a regex for major keywords
    const majorRegex = new RegExp(`\\b(${majorKeywords.join('|')})\\b`, 'gi');

    // Add markers for splitting
    let marked = cleaned.replace(majorRegex, '\n$1');

    // Step 3: Split into major sections
    const sections = marked.split('\n').filter(s => s.trim().length > 0);

    const formattedLines = [];

    sections.forEach(section => {
      const trimmed = section.trim();
      const firstWordMatch = trimmed.match(/^\S+/);
      if (!firstWordMatch) return;
      const firstWord = firstWordMatch[0].toUpperCase();

      // Keywords are 7 chars + 1 space = 8 chars offset
      if (firstWord === 'SELECT') {
        const content = trimmed.substring(6).trim();
        const columns = content.split(', ');

        // Find max length for AS alignment
        let maxLen = 0;
        const colParts = columns.map(col => {
          const parts = col.split(/\s+AS\s+/i);
          if (parts.length > 1) {
            maxLen = Math.max(maxLen, parts[0].length);
          }
          return parts;
        });

        colParts.forEach((parts, idx) => {
          let line = idx === 0 ? 'SELECT ' : '       ';
          if (parts.length > 1) {
            line += parts[0].padEnd(maxLen) + ' AS ' + parts[1];
          } else {
            line += parts[0];
          }
          if (idx < colParts.length - 1) line += ',';
          formattedLines.push(line);
        });
      }
      else if (firstWord === 'WHERE') {
        const content = trimmed.substring(6).trim();
        const parts = content.split(/\s+AND\s+/i);
        parts.forEach((part, idx) => {
          if (idx === 0) formattedLines.push(`WHERE  ${part}`);
          else formattedLines.push(`       AND ${part}`);
        });
      }
      else if (firstWord === 'FROM') {
        formattedLines.push(`FROM   ${trimmed.substring(5).trim()}`);
      }
      else if (firstWord === 'ORDER' || firstWord === 'GROUP') {
        const keyword = trimmed.split(/\s+/).slice(0, 2).join(' ').toUpperCase();
        const content = trimmed.split(/\s+/).slice(2).join(' ');
        formattedLines.push(`${keyword.padEnd(7)} ${content}`);
      }
      else if (firstWord === 'LIMIT') {
        formattedLines.push(`LIMIT  ${trimmed.substring(6).trim()}`);
      }
      else {
        formattedLines.push(trimmed);
      }
    });

    return formattedLines.join('\n');
  };

  const highlightSQL = (code) => {
    const keywords = /\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AND|OR|NOT|IN|EXISTS|BETWEEN|LIKE|IS|NULL|ORDER BY|GROUP BY|HAVING|LIMIT|OFFSET|AS|DISTINCT|COUNT|SUM|AVG|MAX|MIN|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TABLE|DATABASE|INDEX|VIEW|UNION|CASE|WHEN|THEN|ELSE|END|WITH|RECURSIVE|INTERVAL|DATE_SUB|NOW|DESC|ASC)\b/gi;
    const strings = /('([^'\\]|\\.)*'|"([^"\\]|\\.)*")/g;
    const numbers = /\b(\d+(\.\d+)?)\b/g;
    const functions = /\b([A-Z_]+)\s*(?=\()/g;
    const comments = /(--[^\n]*|\/\*[\s\S]*?\*\/)/g;

    let result = code;

    // Comments (highest priority)
    result = result.replace(comments, '<span class="sql-comment">$1</span>');

    // Strings
    result = result.replace(strings, '<span class="sql-string">$1</span>');

    // Keywords
    result = result.replace(keywords, (match) => `<span class="sql-keyword">${match.toUpperCase()}</span>`);

    // Functions
    result = result.replace(functions, '<span class="sql-function">$1</span>');

    // Numbers
    result = result.replace(numbers, '<span class="sql-number">$1</span>');

    return result;
  };

  const formattedSQL = formatSQL(sql);
  const highlightedHTML = highlightSQL(formattedSQL);
  const lines = highlightedHTML.split('\n');

  return (
    <pre className="sql-highlight">
      <div className="sql-header">
        <div className="window-dots">
          <span className="dot red"></span>
          <span className="dot yellow"></span>
          <span className="dot green"></span>
        </div>
        <span className="sql-lang-label">SQL</span>
        <div className="header-actions">
          {onFeedback && (
            <div className="feedback-group">
              <button
                className={`feedback-mini-btn thumbs-up ${feedback === 'good' ? 'active' : ''}`}
                onClick={() => onFeedback('good')}
                title="좋아요"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                </svg>
              </button>
              <div className="feedback-separator"></div>
              <button
                className={`feedback-mini-btn thumbs-down ${feedback === 'bad' ? 'active' : ''}`}
                onClick={() => onFeedback('bad')}
                title="싫어요"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
      <code className="sql-code-body">
        {lines.map((line, idx) => (
          <div
            key={idx}
            className="sql-line"
            dangerouslySetInnerHTML={{ __html: line || '&nbsp;' }}
          />
        ))}
      </code>
      <button
        className={`copy-btn ${copied ? 'copied' : ''}`}
        onClick={handleCopy}
        title="클립보드에 복사"
      >
        {copied ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        )}
      </button>
    </pre>
  );
}

export default SQLHighlight;
