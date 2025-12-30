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
    );
};

export default ResultTabs;
