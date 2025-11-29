import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { Send, Upload, Bot, User, FileText } from 'lucide-react'
import './App.css'

// IMPORTANT: Configuring the connection to your Python Backend
const API_URL = "https://effective-disco-wrjgrrq75gpg25ggq-8000.app.github.dev"

function App() {
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hello! Please upload an RFP PDF to start analyzing.', category: null }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFileUploaded, setIsFileUploaded] = useState(false)
  const messagesEndRef = useRef(null)

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }
  useEffect(scrollToBottom, [messages])

  // 1. Handle File Upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setIsLoading(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      await axios.post(`${API_URL}/upload-pdf`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setIsFileUploaded(true)
      setMessages(prev => [...prev, { 
        role: 'bot', 
        text: `✅ Processed ${file.name}. I am ready! Ask me about Risks (Legal) or Architecture (Technical).` 
      }])
    } catch (error) {
      alert("Error uploading file: " + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // 2. Handle Chat Message
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input
    setInput('')
    
    // Add User Message to UI
    setMessages(prev => [...prev, { role: 'user', text: userMessage }])
    setIsLoading(true)

    try {
     // Prepare History: Convert our React state to the format Python expects
      // We filter out "thinking" messages and only send text
      const historyPayload = messages
        .filter(msg => msg.role !== 'system') // Remove system messages if any
        .map(msg => ({
          role: msg.role === 'bot' ? 'assistant' : 'user',
          content: msg.text
        }))

      // Call Python API
      const response = await axios.post(`${API_URL}/chat`, {
        question: userMessage,
        history: historyPayload
      })

      // Add Bot Response to UI
      const data = response.data
      setMessages(prev => [...prev, { 
        role: 'bot', 
        text: data.answer, 
        category: data.category, // 'LEGAL' or 'TECHNICAL'
        sources: data.sources // <--- Capture the sources array
      }])

    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: "⚠️ Error: " + error.message }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <Bot size={24} className="text-blue-500" />
        <h1>RFP Intelligent Analyst</h1>
        <span className="badge">v1.0</span>
      </div>

      {/* Upload Overlay (If file not uploaded yet) */}
      {!isFileUploaded && (
        <div className="upload-overlay">
          <div className="upload-box">
            <FileText size={48} style={{marginBottom: '20px', color: '#94a3b8'}} />
            <h2>Upload RFP Document</h2>
            <p style={{color: '#94a3b8', marginBottom: '20px'}}>Upload a PDF to initialize the AI Agent</p>
            
            <input 
              type="file" 
              accept=".pdf" 
              onChange={handleFileUpload} 
              style={{display: 'none'}} 
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <span style={{
                background: '#3b82f6', color: 'white', padding: '12px 24px', 
                borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
              }}>
                {isLoading ? "Processing..." : "Select PDF"}
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Chat Window */}
      <div className="chat-window">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <div className="avatar">
              {msg.role === 'bot' ? <Bot size={20} color="white" /> : <User size={20} color="white" />}
            </div>
            <div className="bubble">
              {msg.category && (
                <div className={`category-tag ${msg.category}`}>
                  {msg.category} AGENT
                </div>
              )}
              {msg.text}
              
              {/* NEW: Render Sources if they exist */}
              {msg.sources && msg.sources.length > 0 && (
                <div style={{marginTop: '10px', fontSize: '0.8rem', color: '#cbd5e1', borderTop: '1px solid #475569', paddingTop: '5px'}}>
                  <strong>Sources:</strong> {msg.sources.join(', ')}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && isFileUploaded && (
          <div className="message bot">
            <div className="avatar"><Bot size={20} /></div>
            <div className="bubble" style={{fontStyle: 'italic'}}>Thinking...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="input-area">
        <input 
          type="text" 
          placeholder="Ask about risks, costs, or tech stack..." 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          disabled={!isFileUploaded}
        />
        <button onClick={sendMessage} disabled={!isFileUploaded || isLoading}>
          <Send size={20} />
        </button>
      </div>
    </div>
  )
}

export default App