import React from 'react';

const ResultTabs = ({ activeTab, setActiveTab, hasExecutedSQL }) => {
    return (
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
                disabled={!hasExecutedSQL}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
                차트
            </button>
            <button
                className={`tab ${activeTab === 'schema' ? 'active' : ''}`}
                onClick={() => setActiveTab('schema')}
            >
                ⊟ 테이블 스키마
            </button>
            <button
                className={`tab ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
            >
                ⟲ 쿼리 히스토리
            </button>
        </div>
    );
};

export default ResultTabs;
