import { useState, useEffect, useRef, useCallback } from 'react';
import './SQLResultPanel.css';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import SQLHighlight from './SQLHighlight';
import './SQLHighlight.css';

function SQLResultPanel({ sql, executedSQL }) {
  const [activeTab, setActiveTab] = useState('results');
  const [allResults] = useState(generateAllMockResults()); // Generate 200 rows
  const [displayedResults, setDisplayedResults] = useState([]);
  const [page, setPage] = useState(0);
  const [queryHistory, setQueryHistory] = useState([]);
  const [schemaData] = useState(generateSchemaData());
  const [visibleColumns, setVisibleColumns] = useState([]);
  const [isColumnPickerOpen, setIsColumnPickerOpen] = useState(false);
  const tableContainerRef = useRef(null);
  const observerRef = useRef(null);
  const columnPickerRef = useRef(null);
  const processedExecutionRef = useRef(null);

  // Close column picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (columnPickerRef.current && !columnPickerRef.current.contains(event.target)) {
        setIsColumnPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Primary columns that are shown by default
  const primaryColumns = ['번호', '측정일시', '위치', 'pH수치', '평균_pH', '측정횟수'];

  // Initialize visible columns when results change
  useEffect(() => {
    if (allResults.length > 0) {
      const allKeys = Object.keys(allResults[0]);
      // If it's the first time or SQL executed, set default visible columns
      const initialVisible = allKeys.filter(key =>
        primaryColumns.includes(key) || allKeys.length <= 4
      );
      setVisibleColumns(initialVisible);
    }
  }, [allResults]);

  // Reset and load initial data when SQL is executed
  useEffect(() => {
    if (executedSQL && executedSQL.timestamp !== processedExecutionRef.current) {
      processedExecutionRef.current = executedSQL.timestamp;

      const sqlQuery = executedSQL.query;
      setPage(0);
      setDisplayedResults(allResults.slice(0, 20));

      setQueryHistory(prev => [
        {
          id: Date.now(),
          query: sqlQuery,
          timestamp: new Date(),
          executionTime: '0.023s',
          rowCount: allResults.length,
          results: [...allResults] // Store a copy of results
        },
        ...prev.slice(0, 9)
      ]);
      setActiveTab('results');
    }
  }, [executedSQL, allResults]);

  // Load history query results
  const loadHistoryQuery = (historyItem) => {
    setActiveTab('results');
    setPage(0);
    setDisplayedResults(historyItem.results.slice(0, 20));
  };

  // Load more data when scrolling
  const loadMoreResults = useCallback(() => {
    const nextPage = page + 1;
    const start = nextPage * 20;
    const end = start + 20;

    if (start < allResults.length) {
      setDisplayedResults(prev => [...prev, ...allResults.slice(start, end)]);
      setPage(nextPage);
    }
  }, [page, allResults]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreResults();
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMoreResults]);

  useEffect(() => {
    const sentinel = document.getElementById('scroll-sentinel');
    if (sentinel && observerRef.current) {
      observerRef.current.observe(sentinel);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [displayedResults]);

  // Excel download function
  const downloadExcel = () => {
    if (allResults.length === 0) return;

    // Create CSV content
    const headers = Object.keys(allResults[0]);
    const csvRows = [
      headers.join(','),
      ...allResults.map(row =>
        headers.map(header => {
          const value = row[header];
          // Escape values containing commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ];
    const csvContent = csvRows.join('\n');

    // Create blob and download
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `query_results_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  function generateAllMockResults() {
    const results = [];
    const locations = ['수원지A', '수원지B', '수원지C'];
    const baseDate = new Date('2024-01-01');

    for (let i = 0; i < 1000; i++) {
      const date = new Date(baseDate);
      date.setHours(date.getHours() + i);

      results.push({
        '번호': i + 1,
        '측정일시': date.toISOString().slice(0, 16).replace('T', ' '),
        '위치': locations[i % 3],
        'pH수치': (6.5 + Math.random() * 1.5).toFixed(2),
        '탁도': (0.3 + Math.random() * 1.2).toFixed(2),
        '온도': (12 + Math.random() * 8).toFixed(1)
      });
    }

    return results;
  }

  function generateSchemaData() {
    return [
      {
        table: 'water_quality',
        columns: [
          { name: 'id', type: 'INT', key: 'PRI', nullable: false },
          { name: 'measurement_date', type: 'DATETIME', key: 'MUL', nullable: false },
          { name: 'location', type: 'VARCHAR(100)', key: 'MUL', nullable: false },
          { name: 'ph_level', type: 'DECIMAL(4,2)', key: '', nullable: true },
          { name: 'turbidity', type: 'DECIMAL(5,2)', key: '', nullable: true },
          { name: 'temperature', type: 'DECIMAL(5,2)', key: '', nullable: true },
        ],
        indexes: ['PRIMARY', 'idx_measurement_date', 'idx_location'],
        rowCount: 15420
      },
      {
        table: 'water_sources',
        columns: [
          { name: 'id', type: 'INT', key: 'PRI', nullable: false },
          { name: 'name', type: 'VARCHAR(100)', key: '', nullable: false },
          { name: 'region', type: 'VARCHAR(50)', key: '', nullable: false },
          { name: 'capacity', type: 'INT', key: '', nullable: true },
        ],
        indexes: ['PRIMARY'],
        rowCount: 25
      }
    ];
  }

  // Toggle column visibility
  const toggleColumn = (column) => {
    setVisibleColumns(prev =>
      prev.includes(column)
        ? prev.filter(c => c !== column)
        : [...prev, column]
    );
  };

  // Move column order
  const moveColumn = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= visibleColumns.length) return;

    const newColumns = [...visibleColumns];
    const [movedColumn] = newColumns.splice(index, 1);
    newColumns.splice(newIndex, 0, movedColumn);
    setVisibleColumns(newColumns);
  };

  return (
    <div className="sql-result-panel">
      <div className="panel-header-container">
        <div className="panel-tabs">
          <button
            className={`tab ${activeTab === 'results' ? 'active' : ''}`}
            onClick={() => setActiveTab('results')}
          >
            ≡ 결과
          </button>
          <button
            className={`tab ${activeTab === 'chart' ? 'active' : ''}`}
            onClick={() => setActiveTab('chart')}
            disabled={!executedSQL}
          >
            ◐ 차트
          </button>
          <button
            className={`tab ${activeTab === 'schema' ? 'active' : ''}`}
            onClick={() => setActiveTab('schema')}
          >
            ⊟ 스키마
          </button>
          <button
            className={`tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            ⟲ 히스토리
          </button>
        </div>

        <div className="panel-sub-header">
          {activeTab === 'results' && (
            <>
              <div className="results-info">
                <span className="results-count">
                  • {displayedResults.length} / {allResults.length} 행 표시 중
                </span>
                <span className="execution-time">
                  ⚡ 실행 시간: 0.023초
                </span>
              </div>
              <div className="results-actions">
                <div className="column-settings-container" ref={columnPickerRef}>
                  <button
                    className={`action-btn column-settings-btn ${isColumnPickerOpen ? 'active' : ''}`}
                    onClick={() => setIsColumnPickerOpen(!isColumnPickerOpen)}
                  >
                    ⚙ 컬럼 설정
                  </button>
                  {isColumnPickerOpen && (
                    <div className="column-picker-dropdown">
                      <div className="dropdown-header">컬럼 설정 (표시 및 순서)</div>
                      <div className="column-list">
                        <div className="dropdown-section">
                          <div className="section-title">표시 중인 컬럼</div>
                          {visibleColumns.map((key, index) => (
                            <div key={key} className="column-item active">
                              <input type="checkbox" checked={true} onChange={() => toggleColumn(key)} />
                              <span className="column-name-text">{key}</span>
                              <div className="reorder-btns">
                                <button className="reorder-btn" onClick={(e) => { e.stopPropagation(); moveColumn(index, -1); }} disabled={index === 0}>↑</button>
                                <button className="reorder-btn" onClick={(e) => { e.stopPropagation(); moveColumn(index, 1); }} disabled={index === visibleColumns.length - 1}>↓</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <button className="download-btn" onClick={downloadExcel}>↓ 엑셀 다운로드</button>
              </div>
            </>
          )}
          {activeTab === 'chart' && (
            <>
              <h3 style={{ margin: 0, fontSize: '14px' }}>📈 데이터 시각화</h3>
              <span className="chart-count" style={{ fontSize: '12px', opacity: 0.7 }}>최근 50개 행 표시</span>
            </>
          )}
          {activeTab === 'schema' && (
            <>
              <h3 style={{ margin: 0, fontSize: '14px' }}>⊟ 데이터베이스 스키마</h3>
              <span className="table-count" style={{ fontSize: '12px', opacity: 0.7 }}>{schemaData.length}개 테이블</span>
            </>
          )}
          {activeTab === 'history' && (
            <>
              <h3 style={{ margin: 0, fontSize: '14px' }}>⟲ 쿼리 히스토리</h3>
              <span className="history-count" style={{ fontSize: '12px', opacity: 0.7 }}>{queryHistory.length}개 쿼리</span>
            </>
          )}
        </div>
      </div>

      <div className="panel-content">
        {activeTab === 'results' && (
          <div className="results-view">
            {executedSQL ? (
              <>
                <div className="table-container" ref={tableContainerRef}>
                  <table className="results-table">
                    <thead>
                      <tr>
                        {visibleColumns.map(key => (
                          <th key={key}>{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {displayedResults.map((row, idx) => (
                        <tr key={idx}>
                          {visibleColumns.map((key, i) => (
                            <td key={i}>{row[key]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {displayedResults.length < allResults.length && (
                    <div id="scroll-sentinel" className="scroll-sentinel">
                      <div className="loading-spinner">더 불러오는 중...</div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="empty-state">
                <span className="empty-icon">⊡</span>
                <p>SQL을 실행하면 결과가 여기에 표시됩니다</p>
                <small>채팅에서 "SQL 실행" 버튼을 클릭하세요</small>
              </div>
            )}
          </div>
        )}

        {activeTab === 'chart' && (
          <div className="chart-view">
            {executedSQL && displayedResults.length > 0 ? (
              <>
                <div className="charts-container">
                  <div className="chart-section">
                    <h4>▸ pH 수치 추이</h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={displayedResults.slice(0, 50)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="측정일시"
                          tick={{ fontSize: 11 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="pH수치"
                          stroke="#1a73e8"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          name="pH 수치"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="chart-section">
                    <h4>▸ 위치별 탁도 비교</h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={displayedResults.slice(0, 20)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="위치" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="탁도" fill="#10b981" name="탁도" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="chart-section">
                    <h4>▸ 시간별 온도 변화</h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={displayedResults.slice(0, 50)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="측정일시"
                          tick={{ fontSize: 11 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="온도"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          name="온도 (°C)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <span className="empty-icon">◐</span>
                <p>SQL을 실행하면 차트가 여기에 표시됩니다</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'schema' && (
          <div className="schema-view">
            <div className="schema-list">
              {schemaData.map((table, idx) => (
                <div key={idx} className="schema-table">
                  <div className="table-header">
                    <div className="table-name">
                      <span className="icon">▪</span>
                      <strong>{table.table}</strong>
                    </div>
                    <span className="row-count">{table.rowCount.toLocaleString()}개 행</span>
                  </div>
                  <div className="table-columns">
                    {table.columns.map((col, i) => (
                      <div key={i} className="column-row">
                        <span className={`column-name ${col.key ? 'key' : ''}`}>
                          {col.key === 'PRI' && '● '}
                          {col.key === 'MUL' && '○ '}
                          {col.name}
                        </span>
                        <span className="column-type">{col.type}</span>
                        {!col.nullable && <span className="not-null">필수</span>}
                      </div>
                    ))}
                  </div>
                  <div className="table-indexes">
                    <strong>인덱스:</strong> {table.indexes.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-view">
            {queryHistory.length > 0 ? (
              <div className="history-list">
                {queryHistory.map((item) => (
                  <div
                    key={item.id}
                    className="history-item"
                    onClick={() => loadHistoryQuery(item)}
                  >
                    <div className="history-meta">
                      <span className="history-time">
                        {item.timestamp.toLocaleTimeString()}
                      </span>
                      <span className="history-stats">
                        ⚡ {item.executionTime} • {item.rowCount}개 행
                      </span>
                    </div>
                    <div className="history-query-wrapper">
                      <SQLHighlight sql={item.query} />
                    </div>
                    <div className="history-action">
                      <span className="action-hint">→ 클릭하여 결과 보기</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <span className="empty-icon">⟲</span>
                <p>실행된 쿼리가 없습니다</p>
                <small>SQL을 실행하면 이력이 여기에 표시됩니다</small>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SQLResultPanel;
