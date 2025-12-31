import { useState, useRef, useEffect } from 'react';
import './ChatPanel.css';
import './SQLHighlight.css';
import './ChatPanel_Feedback.css';
import ChatSidebar from './ChatSidebar';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { analyzeQuery, generateMockSQL } from '../utils/chatUtils';

function ChatPanel({ onSQLGenerate, onSQLExecute, onShowResult, onNewChat, globalFeedback, onFeedbackUpdate, globalComments, onCommentUpdate }) {
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
    '지역별 물 사용량 비교',
    '점검이 필요한 시설물 확인',
    'pH 수치가 8.0 이상인 데이터',
    '수원지A 평균 탁도',
    '전기전도도가 300 이상인 곳',
    '어제 수원지B의 잔류염소 수치',
    '탁도가 0.5 이하인 깨끗한 물',
  ]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const loadedSessionRef = useRef(null); // Track which session acts as the 'owner' of the current messages
  const [popularSearches] = useState([
    '수질 데이터 평균 보여줘',
    '비정상 수질 데이터 찾기',
    '이번 달 수도 사용량 패턴',
    '수원지B 최근 데이터',
    '가동률 90% 이상인 시설',
    'pH 8.5 이상인 위험 구간',
    '모든 수원지의 암모니아성 질소 비교',
    '탁도 상위 10개 지점',
    '최근 24시간 실시간 현황',
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

  // Phase 1: Guard - Update loadedSessionRef only when messages change.
  // This explicitly marks determining "which session these messages belong to".
  // IMPORTANT: Do NOT include activeSessionId in dependency. We only want to update ownership when CONTENT changes.
  useEffect(() => {
    if (activeSessionId) {
      loadedSessionRef.current = activeSessionId;
    }
  }, [messages]); // Intentionally exclude activeSessionId to prevent premature updates during switch

  // Phase 2: Sync - Only sync if the active session matches the loaded message owner.
  // This prevents syncing stale messages (from previous session) to the new active session ID.
  useEffect(() => {
    if (activeSessionId && activeSessionId === loadedSessionRef.current && messages.length > 0) {
      setChatSessions(prev => prev.map(session =>
        session.id === activeSessionId
          ? { ...session, messages: [...messages], lastMessage: messages[messages.length - 1].content }
          : session
      ));
    }
  }, [messages, activeSessionId]);

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
      const newSessionId = Date.now();
      const newSession = {
        id: newSessionId,
        title: queryText.trim().substring(0, 20) + (queryText.trim().length > 20 ? '...' : ''),
        lastMessage: queryText.trim(),
        timestamp: new Date(),
        messages: [] // Initialize with empty messages
      };
      setChatSessions(prev => [newSession, ...prev]);
      setActiveSessionId(newSessionId);
      // loadedSessionRef will be updated by Phase 1 useEffect after messages update
    }

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: queryText.trim(),
      originalQuery: queryText.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Analyze the query first using utility
    const analysis = analyzeQuery(userMessage.content, conversationContext);

    const assistantMessageId = Date.now() + 1;

    // If clarification is needed, ask first
    if (analysis.clarificationNeeded.length > 0) {
      const clarification = analysis.clarificationNeeded[0];
      const otherNeedsCount = analysis.clarificationNeeded.length - 1;

      setMessages(prev => [...prev, {
        id: assistantMessageId,
        type: 'assistant',
        content: `정확한 SQL 생성을 위해 추가 정보가 필요합니다.\n\n${clarification.question}` +
          (otherNeedsCount > 0 ? `\n\n(이후에 ${otherNeedsCount}개의 추가 확인 사항이 더 있습니다.)` : ''),
        clarificationOptions: clarification.options,
        isWaitingForClarification: true,
        originalQuery: queryText.trim(),
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
        detail: '테이블: water_quality\n컬럼: id, measurement_date, location, ph_level, turbidity, temperature, residual_chlorine, toc, ammonia_nitrogen, conductivity\n인덱스: idx_measurement_date, idx_location'
      },
      {
        text: '최적의 SQL 쿼리를 생성하고 있습니다...',
        delay: 800,
        detail: 'JOIN 필요 여부: 없음\n정렬 방식: measurement_date DESC\n필터 조건: ' + (analysis.intent === 'recent' ? '날짜 범위' : '없음') + '\n예상 결과 수: ~100 rows'
      },
    ];

    // Add initial thinking message
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
      originalQuery: queryText.trim(),
    }]);

    // Expand the first thinking step initially
    setExpandedSteps(prev => ({ ...prev, [`${assistantMessageId}-0`]: true }));

    // Simulate sequential thinking process
    for (let i = 0; i < thinkingSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, thinkingSteps[i].delay));

      if (i < thinkingSteps.length - 1) {
        setExpandedSteps(prev => ({
          ...prev,
          [`${assistantMessageId}-${i}`]: false,
          [`${assistantMessageId}-${i + 1}`]: true
        }));

        setMessages(prev => prev.map(msg =>
          msg.id === assistantMessageId
            ? { ...msg, content: (analysis.assumptions.length > 0 ? '질문을 분석했습니다.' + assumptionMessage + '\n\n' : '') + thinkingSteps[i + 1].text, currentStepIndex: i + 1 }
            : msg
        ));
      } else {
        setTimeout(() => {
          setExpandedSteps(prev => ({
            ...prev,
            [`${assistantMessageId}-${i}`]: false
          }));
        }, 500);
      }
    }

    // Generate SQL using utility
    const sqlQuery = generateMockSQL(userMessage.content, analysis, conversationContext);

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

    // Finalize message
    setMessages(prev => prev.map(msg =>
      msg.id === assistantMessageId
        ? {
          ...msg,
          content: 'SQL 쿼리를 생성했습니다:',
          sql: sqlQuery,
          streamedSQL: undefined,
          isThinking: false,
          showProcess: false,
          completedSteps: true
        }
        : msg
    ));

    setIsLoading(false);
    if (onSQLGenerate) onSQLGenerate(sqlQuery);
  };

  const startNewChat = () => {
    setMessages([]);
    setActiveSessionId(null);
    setIsSidebarOpen(false);

    // Reset view (close result panel)
    if (onNewChat) onNewChat();

    // Scroll to top for new chat
    setTimeout(() => {
      const messagesArea = document.querySelector('.chat-messages');
      if (messagesArea) {
        messagesArea.scrollTop = 0;
      }
    }, 0);
  };

  const handleSessionSelect = (sessionId) => {
    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
      console.log(`[ChatPanel] Switching to session ${sessionId}`);
      setActiveSessionId(sessionId);
      setMessages(session.messages || []);

      // Reset view (close result panel) when switching sessions
      if (onNewChat) onNewChat();

      // The existing useEffect on [messages] will automatically scroll to bottom
      // when the new messages are loaded.
    }
  };

  const handleDeleteSession = (e, sessionId) => {
    e.stopPropagation(); // Prevents selecting session before deleting

    setChatSessions(prev => prev.filter(s => s.id !== sessionId));

    // If deleted session was active, start new chat
    if (activeSessionId === sessionId) {
      startNewChat();
    }
  };

  const handleExecuteSQL = async (sql, messageId) => {
    // Find the original query from the message history
    const originalMsg = messages.find(m => m.id === messageId);
    const originalQuery = originalMsg?.originalQuery || "";

    const executionMessageId = Date.now();

    // Mark the original message as executed
    setMessages(prev => prev.map(msg =>
      msg.id === messageId ? { ...msg, wasExecuted: true } : msg
    ));

    setMessages(prev => [...prev, {
      id: executionMessageId,
      type: 'system',
      content: 'SQL을 실행하고 있습니다...',
      isExecuting: true,
      timestamp: new Date()
    }]);

    await new Promise(resolve => setTimeout(resolve, 800));

    setMessages(prev => prev.map(msg =>
      msg.id === executionMessageId
        ? { ...msg, content: '데이터를 조회하고 있습니다...' }
        : msg
    ));

    await new Promise(resolve => setTimeout(resolve, 600));

    const executionTimestamp = Date.now();
    setMessages(prev => prev.map(msg =>
      msg.id === executionMessageId
        ? {
          ...msg,
          content: '✓ 실행 완료! 결과를 확인하세요.',
          isExecuting: false,
          isSuccess: true,
          executionData: {
            query: sql,
            originalQuery: originalQuery,
            timestamp: executionTimestamp
          }
        }
        : msg
    ));

    if (onSQLExecute) onSQLExecute(sql, originalQuery, executionTimestamp);
  };

  const handleClarification = (message, option) => {
    const choiceMessage = {
      id: Date.now(),
      type: 'user',
      content: option,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, choiceMessage]);
    setMessages(prev => prev.map(msg =>
      msg.id === message.id
        ? { ...msg, isWaitingForClarification: false }
        : msg
    ));
    const combinedQuery = `${message.originalQuery} ${option}`;
    handleSubmit(null, combinedQuery);
  };

  const handleCheckResults = (executionData = null) => {
    // 1. Open the Result Panel and set specific data if provided
    if (onShowResult) onShowResult(executionData);

    // 2. Wait a bit for the rendering/animation and scroll
    setTimeout(() => {
      const resultPanel = document.querySelector('.sql-result-panel');
      if (resultPanel) {
        resultPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleFeedback = (messageId, feedbackType) => {
    // Check if we have global handler
    const targetMsg = messages.find(m => m.id === messageId);
    if (targetMsg && targetMsg.sql && onFeedbackUpdate) {
      onFeedbackUpdate(targetMsg.sql, feedbackType);
      return; // Handled globally
    }

    // Fallback Update local messages state
    setMessages(prev => prev.map(msg =>
      msg.id === messageId
        ? { ...msg, feedback: feedbackType } // 'good' or 'bad'
        : msg
    ));
  };

  const handleFeedbackComment = (messageId, comment) => {
    const targetMsg = messages.find(m => m.id === messageId);
    if (targetMsg && targetMsg.sql && onCommentUpdate) {
      onCommentUpdate(targetMsg.sql, comment);
    }
  };

  const handleDeleteRecentSearch = (searchToDelete) => {
    setRecentSearches(prev => prev.filter(search => search !== searchToDelete));
  };

  return (
    <div className={`chat-panel ${!isSidebarOpen ? 'sidebar-collapsed' : ''}`}>
      <div className="chat-header">
        <div className="header-top">
          <div className="header-content">
            <div className="header-title">
              <img src="kwater-logo.png" alt="K-water" className="app-logo" />
              <div className="header-text">
                <h2>K-water 데이터 인텔리전스</h2>
                <img src="kwater-slogan2.png" alt="세상을 바꾸는 가치를 만듭니다" className="header-slogan" />
              </div>
            </div>
          </div>
          <div className="header-actions">
            <button className="header-new-chat-btn" onClick={startNewChat} title="새 채팅 시작">
              <span>+</span> 새 채팅
            </button>
            <button
              className="theme-toggle"
              onClick={() => setIsDarkMode(!isDarkMode)}
              aria-label="테마 전환"
            >
              {isDarkMode ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="chat-main-container">
        <ChatSidebar
          chatSessions={chatSessions}
          activeSessionId={activeSessionId}
          setActiveSessionId={handleSessionSelect}
          onDeleteSession={handleDeleteSession}
          setIsSidebarOpen={setIsSidebarOpen}
          startNewChat={startNewChat}
        />

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
              <ChatMessage
                key={message.id}
                message={{
                  ...message,
                  // Override feedback with global state if the key exists (even if null)
                  feedback: (message.sql && globalFeedback && Object.prototype.hasOwnProperty.call(globalFeedback, message.sql))
                    ? globalFeedback[message.sql]
                    : message.feedback,
                  feedbackComment: (message.sql && globalComments && Object.prototype.hasOwnProperty.call(globalComments, message.sql))
                    ? globalComments[message.sql]
                    : ''
                }}
                expandedSteps={expandedSteps}
                setExpandedSteps={setExpandedSteps}
                handleExecuteSQL={handleExecuteSQL}
                setInput={setInput}
                handleClarification={handleClarification}
                handleCheckResults={handleCheckResults}
                handleFeedback={handleFeedback}
                onFeedbackComment={handleFeedbackComment}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          <ChatInput
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            popularSearches={popularSearches}
            recentSearches={recentSearches}
            handleDeleteRecentSearch={handleDeleteRecentSearch}
            showSuggestions={messages.length === 0}
          />
        </div>
      </div>
    </div>
  );
}

export default ChatPanel;
