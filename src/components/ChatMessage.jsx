import React from 'react';
import SQLHighlight from './SQLHighlight';

const ChatMessage = ({
    message,
    expandedSteps,
    setExpandedSteps,
    handleExecuteSQL,
    setInput,
    handleClarification
}) => {
    return (
        <div className={`message ${message.type} ${message.isThinking ? 'thinking' : ''} ${message.isSuccess ? 'success' : ''}`}>
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
                                onClick={() => handleClarification(message, option)}
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
    );
};

export default ChatMessage;
