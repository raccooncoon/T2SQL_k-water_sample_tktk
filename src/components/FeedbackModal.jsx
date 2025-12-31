import React, { useEffect, useRef } from 'react';
import './FeedbackModal.css';

const FeedbackModal = ({ isOpen, onClose, comment, onCommentChange, feedbackType }) => {
    const textareaRef = useRef(null);

    // Auto-focus the textarea when modal opens
    useEffect(() => {
        if (isOpen && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="feedback-modal-overlay" onClick={onClose}>
            <div className="feedback-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="feedback-modal-header">
                    <h3>{feedbackType === 'good' ? '좋은 점을 남겨주세요' : '아쉬운 점을 남겨주세요'}</h3>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="feedback-modal-body">
                    <textarea
                        ref={textareaRef}
                        className="feedback-textarea"
                        value={comment || ''}
                        onChange={(e) => onCommentChange(e.target.value)}
                        placeholder="여기에 내용을 입력해주세요..."
                    />
                </div>
                <div className="feedback-modal-footer">
                    <button className="feedback-save-btn" onClick={onClose}>
                        확인
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FeedbackModal;
