import { useState } from 'react'
import './App.css'
import ResizableLayout from './components/ResizableLayout'
import ChatPanel from './components/ChatPanel'
import SQLResultPanel from './components/SQLResultPanel'

function App() {
  const [generatedSQL, setGeneratedSQL] = useState(null)
  const [executedSQL, setExecutedSQL] = useState(null)
  const [showResultPanel, setShowResultPanel] = useState(false)

  const handleSQLGenerate = (sql) => {
    setGeneratedSQL(sql)
  }

  const handleSQLExecute = (sql) => {
    setExecutedSQL({
      query: sql,
      timestamp: Date.now()
    })
    setShowResultPanel(true)
    // Here you would typically make an API call to execute the SQL
    console.log('Executing SQL:', sql)
  }

  return (
    <div className="app-container">
      <ResizableLayout
        leftPanel={
          <ChatPanel
            onSQLGenerate={handleSQLGenerate}
            onSQLExecute={handleSQLExecute}
            onNewChat={() => setShowResultPanel(false)}
          />
        }
        rightPanel={
          <SQLResultPanel
            sql={generatedSQL}
            executedSQL={executedSQL}
          />
        }
        showRightPanel={showResultPanel}
      />
    </div>
  )
}

export default App
