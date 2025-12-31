import { useState, useRef, useEffect } from 'react';
import './ResizableLayout.css';

function ResizableLayout({ leftPanel, rightPanel, showRightPanel = false, minLeftWidth = 400, minRightWidth = 400 }) {
  const [leftWidth, setLeftWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !containerRef.current) return;

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

      const minLeftPercentage = (minLeftWidth / containerRect.width) * 100;
      const minRightPercentage = (minRightWidth / containerRect.width) * 100;

      if (newLeftWidth >= minLeftPercentage && newLeftWidth <= (100 - minRightPercentage)) {
        setLeftWidth(newLeftWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, minLeftWidth, minRightWidth]);

  return (
    <div className={`resizable-layout ${showRightPanel ? 'split-view' : 'full-view'}`} ref={containerRef}>
      <div
        className="resizable-panel left-panel"
        style={{ width: showRightPanel ? `${leftWidth}%` : '100%' }}
      >
        {leftPanel}
      </div>

      <div
        className={`resizer ${isDragging ? 'dragging' : ''}`}
        onMouseDown={() => setIsDragging(true)}
      >
        <div className="resizer-handle">
          <div className="resizer-line"></div>
        </div>
      </div>

      <div className="resizable-panel right-panel" style={{ width: showRightPanel ? `${100 - leftWidth}%` : '0%' }}>
        {rightPanel}
      </div>
    </div>
  );
}

export default ResizableLayout;
