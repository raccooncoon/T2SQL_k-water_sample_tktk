import { useState } from 'react'
import './App.css'
import ResizableLayout from './components/ResizableLayout'
import ChatPanel from './components/ChatPanel'
import SQLResultPanel from './components/SQLResultPanel'

function App() {
  const [generatedSQL, setGeneratedSQL] = useState(null)
  const [executedSQL, setExecutedSQL] = useState(null)
  const [showResultPanel, setShowResultPanel] = useState(false)
  const [resultTabTrigger, setResultTabTrigger] = useState(0)

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
    setResultTabTrigger(prev => prev + 1);
    setShowResultPanel(true)
  }

  return (
    <div className="app-container">
      <ResizableLayout
        leftPanel={
          <ChatPanel
            onSQLGenerate={handleSQLGenerate}
            onSQLExecute={handleSQLExecute}
            onShowResult={handleShowResult}
            onNewChat={() => setShowResultPanel(false)}
          />
        }
        rightPanel={
          <SQLResultPanel
            sql={generatedSQL}
            executedSQL={executedSQL}
            resultTabTrigger={resultTabTrigger}
          />
        }
        showRightPanel={showResultPanel}
      />
    </div>
  )
}

export default App
