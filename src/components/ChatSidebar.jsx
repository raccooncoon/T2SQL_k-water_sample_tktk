import React from 'react';

const ChatSidebar = ({
    chatSessions,
    activeSessionId,
    setActiveSessionId,
    setIsSidebarOpen,
    startNewChat
}) => {
    return (
        <div className="chat-sidebar">
            <div className="sidebar-header">
                <button
                    className="sidebar-close-btn"
                    onClick={() => setIsSidebarOpen(false)}
                    title="히스토리 접기"
                >
                    ⇠
                </button>
                <button className="new-chat-btn" onClick={startNewChat}>
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
                                        <div className="session-meta">
                                            {session.timestamp instanceof Date
                                                ? session.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                : new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                            }
                                        </div>
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
    );
};

export default ChatSidebar;
