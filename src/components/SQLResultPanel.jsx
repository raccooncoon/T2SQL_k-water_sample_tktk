import { useState, useEffect, useRef, useCallback } from 'react';
import './SQLResultPanel.css';
import SQLHighlight from './SQLHighlight';
import './SQLHighlight.css';
import ResultTabs from './ResultTabs';
import TableResults from './TableResults';
import ChartDashboard from './ChartDashboard';
import {
  generateAllMockResults,
  generateSchemaData,
  downloadExcel,
  getMockData
} from '../utils/resultUtils';

function SQLResultPanel({ sql, executedSQL }) {
  const [activeTab, setActiveTab] = useState('results');
  const [allResults, setAllResults] = useState(generateAllMockResults());
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

  // Primary columns that are shown by default
  // Primary columns that are shown by default
  const primaryColumns = [
    '번호', '측정일시', '위치', 'pH수치', '탁도', '온도', '잔류염소', '평균_pH', '측정횟수',
    '측정일자', '지역', '가정용_사용량', '청구금액', // water_usage
    '시설ID', '시설명', '가동상태', '최근점검일', '가동률', '담당자' // facility_status
  ];

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

  // Initialize visible columns when results change
  useEffect(() => {
    if (allResults.length > 0) {
      const allKeys = Object.keys(allResults[0]);
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

      // Determine which table's data to load
      let targetTable = 'water_quality';
      if (sqlQuery.toLowerCase().includes('water_usage')) {
        targetTable = 'water_usage';
      } else if (sqlQuery.toLowerCase().includes('facility_status')) {
        targetTable = 'facility_status';
      }

      const newResults = getMockData(targetTable);
      setAllResults(newResults);
      setPage(0);
      setDisplayedResults(newResults.slice(0, 20));

      setQueryHistory(prev => [
        {
          id: Date.now(),
          query: sqlQuery,
          timestamp: new Date(),
          executionTime: '0.023s',
          rowCount: newResults.length,
          results: [...newResults]
        },
        ...prev.slice(0, 9)
      ]);
      setActiveTab('results');
    }
  }, [executedSQL]);

  // Wait, I should verify the `useState` line first.
  // Replacing the useEffect logic and the useState definition in one go if possible.


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
    return () => observerRef.current?.disconnect();
  }, [loadMoreResults]);

  useEffect(() => {
    const sentinel = document.getElementById('scroll-sentinel');
    if (sentinel && observerRef.current) {
      observerRef.current.observe(sentinel);
    }
    return () => observerRef.current?.disconnect();
  }, [displayedResults]);

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
        <ResultTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          hasExecutedSQL={!!executedSQL}
        />

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
                          <div className="section-title">표시 컬럼 설정</div>
                          {(() => {
                            const allKeys = allResults.length > 0 ? Object.keys(allResults[0]) : [];
                            return allKeys.map((key, index) => {
                              const isVisible = visibleColumns.includes(key);
                              const visibleIndex = visibleColumns.indexOf(key);

                              return (
                                <div key={key} className={`column-item ${isVisible ? 'active' : 'hidden'}`}>
                                  <div className="column-item-main">
                                    <input
                                      type="checkbox"
                                      checked={isVisible}
                                      onChange={() => toggleColumn(key)}
                                    />
                                    <span className="column-name-text">{key}</span>
                                  </div>
                                  {isVisible && (
                                    <div className="reorder-btns">
                                      <button
                                        className="reorder-btn"
                                        onClick={(e) => { e.stopPropagation(); moveColumn(visibleIndex, -1); }}
                                        disabled={visibleIndex === 0}
                                        title="순서 위로"
                                      >↑</button>
                                      <button
                                        className="reorder-btn"
                                        onClick={(e) => { e.stopPropagation(); moveColumn(visibleIndex, 1); }}
                                        disabled={visibleIndex === visibleColumns.length - 1}
                                        title="순서 아래로"
                                      >↓</button>
                                    </div>
                                  )}
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <button className="download-btn" onClick={() => downloadExcel(allResults)}>↓ 엑셀 다운로드</button>
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
              <TableResults
                displayedResults={displayedResults}
                visibleColumns={visibleColumns}
                allResultsCount={allResults.length}
                tableContainerRef={tableContainerRef}
              />
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
              <ChartDashboard displayedResults={displayedResults} />
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
