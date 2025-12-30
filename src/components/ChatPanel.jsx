import { useState, useRef, useEffect } from 'react';
import './ChatPanel.css';
import SQLHighlight from './SQLHighlight';
import './SQLHighlight.css';

function ChatPanel({ onSQLGenerate, onSQLExecute }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState({});
  const [conversationContext, setConversationContext] = useState({
    lastQuery: null,
    lastSQL: null,
    queryHistory: []
  });
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [chatSessions, setChatSessions] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState([
    '최근 7일간의 수질 데이터를 보여줘',
    'pH 수치가 7.0 이상인 데이터',
    '위치별 평균 탁도',
  ]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [popularSearches] = useState([
    '오늘 측정된 모든 데이터',
    '지난 달 온도 평균',
    '비정상 수질 데이터 찾기',
    '위치별 수질 통계',
  ]);
  const messagesEndRef = useRef(null);

  // Apply theme on mount and when changed
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark'); // 초기 다크모드 설정
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [isDarkMode]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e, presetQuery = null) => {
    if (e) e.preventDefault();
    const queryText = presetQuery || input;
    if (!queryText.trim() || isLoading) return;

    // Add to recent searches if it's a new query
    if (!recentSearches.includes(queryText.trim())) {
      setRecentSearches(prev => [queryText.trim(), ...prev.slice(0, 4)]);
    }

    // Create a new session if this is the first message
    if (messages.length === 0 && !activeSessionId) {
      const newSession = {
        id: Date.now(),
        title: queryText.trim().substring(0, 20) + (queryText.trim().length > 20 ? '...' : ''),
        lastMessage: queryText.trim(),
        timestamp: new Date()
      };
      setChatSessions(prev => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
    }

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: queryText.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Analyze the query first
    const analysis = analyzeQuery(userMessage.content);

    const assistantMessageId = Date.now() + 1;

    // If clarification is needed, ask first
    if (analysis.clarificationNeeded.length > 0) {
      const clarification = analysis.clarificationNeeded[0];

      setMessages(prev => [...prev, {
        id: assistantMessageId,
        type: 'assistant',
        content: `질문을 분석했습니다.\n\n${clarification.question}`,
        clarificationOptions: clarification.options,
        isWaitingForClarification: true,
        originalQuery: userMessage.content,
        timestamp: new Date()
      }]);

      setIsLoading(false);
      return;
    }

    // Otherwise, proceed with assumptions
    const assumptionMessage = analysis.assumptions.length > 0
      ? `\n\n💡 ${analysis.assumptions.join('\n💡 ')}`
      : '';

    // Simulate AI thinking process with multiple steps
    const thinkingSteps = [
      {
        text: '질문을 분석하고 있습니다...',
        delay: 500,
        detail: '사용자 질문: "' + userMessage.content + '"\n주요 키워드 추출: ' + (userMessage.content.match(/\S+/g) || []).slice(0, 3).join(', ') + '\n의도 파악: ' + analysis.intent + assumptionMessage
      },
      {
        text: '데이터베이스 스키마를 확인하고 있습니다...',
        delay: 700,
        detail: '테이블: water_quality\n컬럼: id, measurement_date, location, ph_level, turbidity, temperature\n인덱스: idx_measurement_date, idx_location'
      },
      {
        text: '최적의 SQL 쿼리를 생성하고 있습니다...',
        delay: 800,
        detail: 'JOIN 필요 여부: 없음\n정렬 방식: measurement_date DESC\n필터 조건: ' + (analysis.intent === 'recent' ? '날짜 범위' : '없음') + '\n예상 결과 수: ~100 rows'
      },
    ];

    // Add initial thinking message with assumptions
    setMessages(prev => [...prev, {
      id: assistantMessageId,
      type: 'assistant',
      content: analysis.assumptions.length > 0
        ? '질문을 분석했습니다.' + assumptionMessage + '\n\n' + thinkingSteps[0].text
        : thinkingSteps[0].text,
      isThinking: true,
      thinkingSteps: thinkingSteps,
      currentStepIndex: 0,
      assumptions: analysis.assumptions,
      timestamp: new Date()
    }]);

    // Simulate sequential thinking process
    for (let i = 0; i < thinkingSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, thinkingSteps[i].delay));

      if (i < thinkingSteps.length - 1) {
        setMessages(prev => prev.map(msg =>
          msg.id === assistantMessageId
            ? { ...msg, content: (analysis.assumptions.length > 0 ? '질문을 분석했습니다.' + assumptionMessage + '\n\n' : '') + thinkingSteps[i + 1].text, currentStepIndex: i + 1 }
            : msg
        ));
      }
    }

    // Generate SQL and show process
    const sqlQuery = generateMockSQL(userMessage.content, analysis);

    // Update conversation context
    setConversationContext(prev => ({
      lastQuery: userMessage.content,
      lastSQL: sqlQuery,
      queryHistory: [...prev.queryHistory, { query: userMessage.content, sql: sqlQuery }].slice(-5)
    }));

    // Show SQL generation process
    setMessages(prev => prev.map(msg =>
      msg.id === assistantMessageId
        ? { ...msg, content: 'SQL 쿼리를 생성했습니다:', isThinking: true, showProcess: true }
        : msg
    ));

    await new Promise(resolve => setTimeout(resolve, 300));

    // Update with final SQL in streaming style
    const sqlLines = sqlQuery.split('\n');
    let streamedSQL = '';

    for (let i = 0; i < sqlLines.length; i++) {
      streamedSQL += (i > 0 ? '\n' : '') + sqlLines[i];
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessageId
          ? {
            ...msg,
            content: 'SQL 쿼리를 생성했습니다:',
            streamedSQL: streamedSQL,
            isThinking: true
          }
          : msg
      ));
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Finalize message - Keep thinking steps visible
    setMessages(prev => prev.map(msg =>
      msg.id === assistantMessageId
        ? {
          ...msg,
          content: 'SQL 쿼리를 생성했습니다:',
          sql: sqlQuery,
          streamedSQL: undefined,
          isThinking: false,
          showProcess: false,
          // Keep thinkingSteps and mark all as completed
          completedSteps: true
        }
        : msg
    ));

    setIsLoading(false);

    // Notify parent component about SQL generation
    if (onSQLGenerate) {
      onSQLGenerate(sqlQuery);
    }
  };

  const handleExecuteSQL = async (sql, messageId) => {
    // Add execution status message
    const executionMessageId = Date.now();
    setMessages(prev => [...prev, {
      id: executionMessageId,
      type: 'system',
      content: 'SQL을 실행하고 있습니다...',
      isExecuting: true,
      timestamp: new Date()
    }]);

    // Simulate execution process
    await new Promise(resolve => setTimeout(resolve, 800));

    setMessages(prev => prev.map(msg =>
      msg.id === executionMessageId
        ? { ...msg, content: '데이터를 조회하고 있습니다...' }
        : msg
    ));

    await new Promise(resolve => setTimeout(resolve, 600));

    setMessages(prev => prev.map(msg =>
      msg.id === executionMessageId
        ? { ...msg, content: '✓ 실행 완료! 결과를 확인하세요.', isExecuting: false, isSuccess: true }
        : msg
    ));

    // Notify parent component
    if (onSQLExecute) {
      onSQLExecute(sql);
    }
  };

  const analyzeQuery = (query) => {
    const lowerQuery = query.toLowerCase();
    const analysis = {
      isAmbiguous: false,
      clarificationNeeded: [],
      assumptions: [],
      intent: 'general',
      isModification: false,
      isFollowUp: false
    };

    // Check if it's a modification request
    if (lowerQuery.includes('수정') || lowerQuery.includes('변경') ||
      lowerQuery.includes('바꿔') || lowerQuery.includes('다시') ||
      lowerQuery.includes('대신') || lowerQuery.includes('말고')) {
      analysis.isModification = true;
      analysis.intent = 'modify';

      if (!conversationContext.lastSQL) {
        analysis.assumptions.push('이전 쿼리가 없어 새로운 쿼리를 생성하겠습니다.');
      } else {
        analysis.assumptions.push(`이전 쿼리를 기반으로 수정하겠습니다.`);
      }
      return analysis;
    }

    // Check if it's a follow-up question
    if ((lowerQuery.includes('거기서') || lowerQuery.includes('그거') ||
      lowerQuery.includes('그것') || lowerQuery.includes('여기에') ||
      lowerQuery.includes('추가로') || lowerQuery.includes('그리고')) &&
      conversationContext.lastQuery) {
      analysis.isFollowUp = true;
      analysis.assumptions.push(`이전 질문 "${conversationContext.lastQuery}"을 참고하여 진행하겠습니다.`);
    }

    // Check for time period ambiguity
    if (lowerQuery.includes('최근') && !lowerQuery.match(/\d+/)) {
      analysis.isAmbiguous = true;
      analysis.clarificationNeeded.push({
        question: '기간을 정확히 알려주시겠어요?',
        options: ['최근 7일', '최근 1개월', '최근 3개월'],
        field: 'period'
      });
      analysis.assumptions.push('최근 7일 데이터로 가정하고 진행하겠습니다.');
    }

    // Check for aggregation type
    if (lowerQuery.includes('평균')) {
      analysis.intent = 'average';
      if (!lowerQuery.includes('ph') && !lowerQuery.includes('수질') && !lowerQuery.includes('탁도')) {
        analysis.assumptions.push('모든 수질 지표(pH, 탁도, 온도)의 평균을 계산하겠습니다.');
      }
    } else if (lowerQuery.includes('최근') || lowerQuery.includes('조회')) {
      analysis.intent = 'recent';
    } else if (lowerQuery.includes('모든') || lowerQuery.includes('전체')) {
      analysis.intent = 'all';
      analysis.assumptions.push('안전을 위해 최대 100개 행으로 제한하겠습니다.');
    } else if (lowerQuery.length < 5 ||
      (lowerQuery.includes('수질') && lowerQuery.length < 10) ||
      (lowerQuery.includes('데이터') && lowerQuery.length < 10) ||
      (lowerQuery.includes('조회') && lowerQuery.length < 10)) {
      analysis.isAmbiguous = true;
      analysis.clarificationNeeded.push({
        question: '조회하고 싶은 구체적인 내용을 선택하시거나 직접 입력해주세요.',
        options: ['최근 7일 전체 데이터', '위치별 평균 수질', '비정상 데이터 알림'],
        field: 'action'
      });
    }

    return analysis;
  };

  const generateMockSQL = (query, analysis) => {
    const lowerQuery = query.toLowerCase();

    // Handle modification requests
    if (analysis.isModification && conversationContext.lastSQL) {
      const lastSQL = conversationContext.lastSQL;

      // Modify LIMIT
      if (lowerQuery.includes('제한') || lowerQuery.includes('limit') || lowerQuery.match(/\d+개/)) {
        const limitMatch = query.match(/(\d+)/);
        const newLimit = limitMatch ? limitMatch[1] : '50';
        return lastSQL.replace(/LIMIT \d+/i, `LIMIT ${newLimit}`);
      }

      // Add WHERE condition
      if (lowerQuery.includes('추가') && lowerQuery.includes('조건')) {
        if (lowerQuery.includes('수원지a') || lowerQuery.includes('수원지 a')) {
          return lastSQL.replace(/WHERE/i, "WHERE location = '수원지A' AND");
        }
      }

      // Change ORDER BY
      if (lowerQuery.includes('오름차순') || lowerQuery.includes('asc')) {
        return lastSQL.replace(/DESC/gi, 'ASC');
      } else if (lowerQuery.includes('내림차순') || lowerQuery.includes('desc')) {
        return lastSQL.replace(/ASC/gi, 'DESC');
      }

      // Add GROUP BY
      if (lowerQuery.includes('그룹') || lowerQuery.includes('group')) {
        const baseSQL = lastSQL.replace(/ORDER BY.*$/i, '');
        return baseSQL + '\nGROUP BY location\nORDER BY location;';
      }

      return lastSQL + '\n-- Modified based on your request';
    }

    // Handle follow-up with context
    if (analysis.isFollowUp && conversationContext.lastQuery) {
      const combinedQuery = conversationContext.lastQuery + ' ' + query;
      return generateMockSQL(combinedQuery, { ...analysis, isFollowUp: false });
    }

    // Standard query generation with Korean aliases
    if (lowerQuery.includes('모든') || lowerQuery.includes('전체')) {
      return `SELECT
  id AS '번호',
  measurement_date AS '측정일시',
  location AS '위치',
  ph_level AS 'pH수치',
  turbidity AS '탁도',
  temperature AS '온도'
FROM water_quality
ORDER BY measurement_date DESC
LIMIT 100;`;
    } else if (lowerQuery.includes('평균')) {
      return `SELECT
  measurement_date AS '측정일시',
  AVG(ph_level) AS '평균_pH',
  AVG(turbidity) AS '평균_탁도',
  AVG(temperature) AS '평균_온도'
FROM water_quality
GROUP BY measurement_date
ORDER BY measurement_date DESC;`;
    } else if (lowerQuery.includes('최근')) {
      return `SELECT
  id AS '번호',
  measurement_date AS '측정일시',
  location AS '위치',
  ph_level AS 'pH수치',
  turbidity AS '탁도',
  temperature AS '온도'
FROM water_quality
WHERE measurement_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY measurement_date DESC;`;
    } else if (lowerQuery.includes('위치') || lowerQuery.includes('location')) {
      return `SELECT
  location AS '위치',
  COUNT(*) AS '측정횟수',
  AVG(ph_level) AS '평균_pH'
FROM water_quality
GROUP BY location;`;
    }
    return `SELECT
  id AS '번호',
  measurement_date AS '측정일시',
  location AS '위치',
  ph_level AS 'pH수치',
  turbidity AS '탁도',
  temperature AS '온도'
FROM water_quality
ORDER BY measurement_date DESC
LIMIT 10;`;
  };

  return (
    <div className={`chat-panel ${!isSidebarOpen ? 'sidebar-collapsed' : ''}`}>
      <div className="chat-header">
        <div className="header-top">
          <div className="header-content">
            <div className="header-title">
              <img src="kwater-logo.png" alt="K-water" className="app-logo" />
              <div className="header-text">
                <h2>수질 데이터 인텔리전스</h2>
                <img src="kwater-slogan2.png" alt="세상을 바꾸는 가치를 만듭니다" className="header-slogan" />
              </div>
            </div>
          </div>
          <div className="header-actions">
            <button
              className="theme-toggle"
              onClick={() => setIsDarkMode(!isDarkMode)}
              aria-label="테마 전환"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </div>

      <div className="chat-main-container">
        <div className="chat-sidebar">
          <div className="sidebar-header">
            <button
              className="sidebar-close-btn"
              onClick={() => setIsSidebarOpen(false)}
              title="히스토리 접기"
            >
              ⇠
            </button>
            <button className="new-chat-btn" onClick={() => {
              setMessages([]);
              setActiveSessionId(null);
            }}>
              <span>+</span> 새 채팅
            </button>
          </div>
          <div className="sidebar-content">
            <div className="sidebar-section">
              <span className="section-label">최근 대화</span>
              <div className="session-list">
                {chatSessions.length > 0 ? (
                  chatSessions.map(session => (
                    <div
                      key={session.id}
                      className={`session-item ${activeSessionId === session.id ? 'active' : ''}`}
                      onClick={() => setActiveSessionId(session.id)}
                    >
                      <div className="session-icon">💬</div>
                      <div className="session-info">
                        <div className="session-title">{session.title}</div>
                        <div className="session-meta">{session.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-history">
                    진행 중인 대화가 없습니다
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="sidebar-footer">
            <div className="user-profile">
              <div className="profile-avatar">👤</div>
              <div className="profile-name">K-water 관리자</div>
            </div>
          </div>
        </div>

        <div className="chat-content-area">
          <button
            className="sidebar-open-btn"
            onClick={() => setIsSidebarOpen(true)}
            title="히스토리 열기"
          >
            ⇢
          </button>
          <div className="chat-messages">
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.type} ${message.isThinking ? 'thinking' : ''} ${message.isSuccess ? 'success' : ''}`}>
                <div className="message-avatar">
                  {message.type === 'user' ? (
                    '👤'
                  ) : (
                    <div className="avatar-character">
                      <img src="CI_캐릭터.jpg" alt="K-water AI" className="avatar-logo" />
                    </div>
                  )}
                </div>
                <div className="message-content">
                  <div className={`message-text ${message.isThinking || message.isExecuting ? 'processing' : ''}`}>
                    {message.content}

                    {/* Show thinking steps (clickable) - Show during thinking or after completion */}
                    {message.thinkingSteps && (message.isThinking || message.completedSteps) && (
                      <div className="thinking-steps">
                        {message.thinkingSteps.map((step, idx) => (
                          <div
                            key={idx}
                            className={`thinking-step ${message.completedSteps || idx <= message.currentStepIndex ? 'active' : ''
                              } ${!message.completedSteps && idx === message.currentStepIndex ? 'current' : ''
                              } ${message.completedSteps ? 'completed' : ''
                              } ${expandedSteps[`${message.id}-${idx}`] ? 'expanded' : ''
                              }`}
                            onClick={() => {
                              if (message.completedSteps || idx <= message.currentStepIndex) {
                                setExpandedSteps(prev => ({
                                  ...prev,
                                  [`${message.id}-${idx}`]: !prev[`${message.id}-${idx}`]
                                }));
                              }
                            }}
                          >
                            <div className="step-header">
                              <span className="step-number">
                                {message.completedSteps ? '✓' : idx + 1}
                              </span>
                              <span className="step-text">{step.text}</span>
                              {(message.completedSteps || idx <= message.currentStepIndex) && (
                                <span className="step-icon">{expandedSteps[`${message.id}-${idx}`] ? '▼' : '▶'}</span>
                              )}
                            </div>
                            {expandedSteps[`${message.id}-${idx}`] && (
                              <div className="step-detail">
                                <pre>{step.detail}</pre>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Show streamed SQL */}
                    {message.streamedSQL && (
                      <div className="sql-preview-stream">
                        <SQLHighlight sql={message.streamedSQL} />
                      </div>
                    )}

                    {/* Show final SQL */}
                    {message.sql && !message.streamedSQL && (
                      <div className="sql-preview-wrapper">
                        <SQLHighlight sql={message.sql} />
                      </div>
                    )}
                  </div>

                  {/* Show clarification options */}
                  {message.clarificationOptions && message.isWaitingForClarification && (
                    <div className="clarification-options">
                      {message.clarificationOptions.map((option, idx) => (
                        <button
                          key={idx}
                          className="clarification-btn"
                          onClick={() => {
                            // Add user's choice as a new message
                            const choiceMessage = {
                              id: Date.now(),
                              type: 'user',
                              content: option,
                              timestamp: new Date()
                            };
                            setMessages(prev => [...prev, choiceMessage]);

                            // Continue with the original query + clarification
                            const enhancedQuery = `${message.originalQuery} (${option})`;
                            setInput(enhancedQuery);

                            // Mark the clarification as resolved
                            setMessages(prev => prev.map(msg =>
                              msg.id === message.id
                                ? { ...msg, isWaitingForClarification: false }
                                : msg
                            ));

                            // Trigger a new submission
                            setTimeout(() => {
                              document.querySelector('.chat-input-form').requestSubmit();
                            }, 100);
                          }}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}

                  {message.sql && !message.isThinking && (
                    <div className="message-actions">
                      <button
                        className="execute-btn"
                        onClick={() => handleExecuteSQL(message.sql, message.id)}
                      >
                        ▶ SQL 실행
                      </button>
                      <div className="quick-actions">
                        <button
                          className="quick-action-btn"
                          onClick={() => setInput('LIMIT을 50개로 수정해줘')}
                        >
                          ⟳ LIMIT 변경
                        </button>
                        <button
                          className="quick-action-btn"
                          onClick={() => setInput('오름차순으로 바꿔줘')}
                        >
                          ⇅ 정렬 변경
                        </button>
                        <button
                          className="quick-action-btn"
                          onClick={() => setInput('위치별로 그룹화해줘')}
                        >
                          ⊞ 그룹화
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          <div className="input-container">
            {messages.length === 0 && (
              <div className="search-suggestions">
                <div className="suggestion-section">
                  <span className="suggestion-label">인기 검색어</span>
                  <div className="suggestion-chips">
                    {popularSearches.map((search, idx) => (
                      <button
                        key={idx}
                        className="chip"
                        onClick={() => handleSubmit(null, search)}
                        disabled={isLoading}
                      >
                        <span className="chip-icon">★</span> {search}
                      </button>
                    ))}
                  </div>
                </div>
                {recentSearches.length > 0 && (
                  <div className="suggestion-section">
                    <span className="suggestion-label">최근 검색어</span>
                    <div className="suggestion-chips">
                      {recentSearches.map((search, idx) => (
                        <button
                          key={idx}
                          className="chip chip-recent"
                          onClick={() => handleSubmit(null, search)}
                          disabled={isLoading}
                        >
                          <span className="chip-icon">⟲</span> {search}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <form className="chat-input-form" onSubmit={handleSubmit}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="예: 최근 7일간의 수질 데이터를 보여줘"
                disabled={isLoading}
                className="chat-input"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="send-button"
              >
                {isLoading ? '⋯' : '→'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatPanel;
