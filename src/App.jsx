import { useState } from 'react'
import './App.css'
import ResizableLayout from './components/ResizableLayout'
import ChatPanel from './components/ChatPanel'
import SQLResultPanel from './components/SQLResultPanel'
import PanelToggleButton from './components/PanelToggleButton'

function App() {
  const [generatedSQL, setGeneratedSQL] = useState(null)
  const [executedSQL, setExecutedSQL] = useState(null)
  const [showResultPanel, setShowResultPanel] = useState(false)
  const [activeTab, setActiveTab] = useState('results')
  const [globalFeedback, setGlobalFeedback] = useState({}) // { queryContent: 'good'|'bad' }

  const handleSQLGenerate = (sql) => {
    setGeneratedSQL(sql)
  }

  const handleSQLExecute = (sql, originalQuery = "", timestamp = Date.now()) => {
    setExecutedSQL({
      query: sql,
      originalQuery: originalQuery,
      timestamp: timestamp
    })
    // Removed setShowResultPanel(true) - panel opens only on button click
    console.log('Executing SQL:', sql)
  }

  const handleShowResult = (sqlData = null) => {
    if (sqlData) {
      setExecutedSQL(sqlData);
    }

    // Only reset to 'results' tab if the panel was closed
    if (!showResultPanel) {
      setActiveTab('results');
    }

    setShowResultPanel(true)
  }

  // Handle feedback updates globally by query content
  const handleGlobalFeedback = (query, type) => {
    setGlobalFeedback(prev => {
      const current = prev[query];
      // Toggle if same type, otherwise set new type
      const newType = current === type ? null : type;
      return { ...prev, [query]: newType };
    });
  }

  return (
    <div className="app-container">
      <PanelToggleButton
        isOpen={showResultPanel}
        onClick={() => setShowResultPanel(!showResultPanel)}
      />
      <ResizableLayout
        leftPanel={
          <ChatPanel
            onSQLGenerate={handleSQLGenerate}
            onSQLExecute={handleSQLExecute}
            onShowResult={handleShowResult}
            onNewChat={() => setShowResultPanel(false)}
            globalFeedback={globalFeedback}
            onFeedbackUpdate={handleGlobalFeedback}
          />
        }
        rightPanel={
          <SQLResultPanel
            sql={generatedSQL}
            executedSQL={executedSQL}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            globalFeedback={globalFeedback}
            onFeedbackUpdate={handleGlobalFeedback}
          />
        }
        showRightPanel={showResultPanel}
      />
    </div>
  )
}

export default App
