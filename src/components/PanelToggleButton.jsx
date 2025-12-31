import React from 'react';

const PanelToggleButton = ({ isOpen, onClick }) => {
    return (
        <button
            className={`panel-toggle-btn ${isOpen ? 'open' : 'closed'}`}
            onClick={onClick}
            title={isOpen ? '결과창 닫기' : '결과창 열기'}
            aria-label={isOpen ? 'Close result panel' : 'Open result panel'}
        >
            <div className="btn-content">
                <span className="toggle-icon">
                    {isOpen ? '▶' : '◀'}
                </span>
                <span className="toggle-text">
                    {isOpen ? '결과 감추기' : '결과 보기'}
                </span>
            </div>
        </button>
    );
};

export default PanelToggleButton;
