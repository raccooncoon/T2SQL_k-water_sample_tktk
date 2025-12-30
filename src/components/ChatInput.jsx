import React from 'react';

const ChatInput = ({
    input,
    setInput,
    handleSubmit,
    isLoading,
    popularSearches,
    recentSearches,
    handleDeleteRecentSearch,
    showSuggestions
}) => {
    return (
        <div className="input-container">
            {showSuggestions && (
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
                                    <div
                                        key={idx}
                                        className="chip chip-recent"
                                        onClick={() => handleSubmit(null, search)}
                                    >
                                        <span className="chip-text">
                                            <span className="chip-icon">⟲</span> {search}
                                        </span>
                                        <button
                                            className="delete-chip-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteRecentSearch(search);
                                            }}
                                            title="삭제"
                                        >
                                            ×
                                        </button>
                                    </div>
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
    );
};

export default ChatInput;
