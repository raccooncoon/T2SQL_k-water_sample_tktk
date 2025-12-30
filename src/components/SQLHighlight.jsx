function SQLHighlight({ sql }) {
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
    result = result.replace(keywords, '<span class="sql-keyword">$1</span>');

    // Functions
    result = result.replace(functions, '<span class="sql-function">$1</span>');

    // Numbers
    result = result.replace(numbers, '<span class="sql-number">$1</span>');

    return result;
  };

  return (
    <pre className="sql-highlight">
      <code dangerouslySetInnerHTML={{ __html: highlightSQL(sql) }} />
    </pre>
  );
}

export default SQLHighlight;
