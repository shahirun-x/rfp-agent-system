import ReactMarkdown from 'react-markdown'
import { Send, Upload, Bot, User, FileText, Download, Sparkles } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import './App.css'

// IMPORTANT: Configuring the connection to your Python Backend
const API_URL = "https://rfp-agent-system.onrender.com"

function App() {
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hello! Please upload an RFP PDF to start analyzing.', category: null }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFileUploaded, setIsFileUploaded] = useState(false)
  const messagesEndRef = useRef(null)
  const [pendingApproval, setPendingApproval] = useState(null) // Stores the draft waiting for approval

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
        text: ` Processed ${file.name}. I am ready! Ask me about Risks (Legal) or Architecture (Technical).` 
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
      setMessages(prev => [...prev, { role: 'bot', text: " Error: " + error.message }])
    } finally {
      setIsLoading(false)
    }
  }
  // 3. Handle Download
  const handleDownload = async () => {
    if (messages.length < 2) {
      alert("Chat is empty. Nothing to download.")
      return
    }

    try {
      // Prepare history payload
      const historyPayload = messages
        .filter(msg => msg.role !== 'system')
        .map(msg => ({
          role: msg.role === 'bot' ? 'AI Agent' : 'User',
          content: msg.text
        }))

      // Request file from backend
      const response = await axios.post(`${API_URL}/download-report`, {
        history: historyPayload
      }, {
        responseType: 'blob' // Important: tells Axios this is a file, not JSON
      })

      // Create a link to download the file in browser
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'RFP_Analysis.docx')
      document.body.appendChild(link)
      link.click()
      link.remove()

    } catch (error) {
      alert("Error downloading report: " + error.message)
    }
  }
  // 4. Handle Auto-Generate Brief
  const handleGenerateBrief = async () => {
    if (!isFileUploaded) return
    setIsLoading(true)
    setMessages(prev => [...prev, { role: 'bot', text: ' Drafting Executive Brief...', category: 'WRITER' }])

    try {
      const response = await axios.post(`${API_URL}/generate-brief`)
      const draft = response.data.answer
      
      // Remove placeholder
      setMessages(prev => {
        const newMsgs = [...prev]
        newMsgs.pop()
        return [...newMsgs, { role: 'bot', text: draft, category: 'WRITER' }]
      })
      
      // TRIGGER APPROVAL MODE
      setPendingApproval(draft) 
      
    } catch (error) {
      alert("Error: " + error.message)
    } finally {
      setIsLoading(false)
    }
  }
  const handleRefine = async (feedback) => {
    setPendingApproval(null) // Hide buttons
    setMessages(prev => [...prev, { role: 'user', text: `Feedback: ${feedback}` }])
    setIsLoading(true)
    
    try {
      const response = await axios.post(`${API_URL}/refine-brief`, {
        original_text: pendingApproval, // Send the draft
        feedback: feedback
      })
      
      const newDraft = response.data.answer
      setMessages(prev => [...prev, { role: 'bot', text: newDraft, category: 'WRITER' }])
      setPendingApproval(newDraft) // Ask for approval again! (Loop)
      
    } catch (error) {
      alert("Error refining: " + error.message)
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
        {/* NEW: Download Button */}
        {messages.length > 1 && (
          <button 
            onClick={handleDownload}
            style={{background: '#475569', padding: '8px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px'}}
          >
            <Download size={16} /> Export
          </button>
        )}
        {/* NEW: Generate Brief Button */}
        {isFileUploaded && (
          <button 
            onClick={handleGenerateBrief}
            disabled={isLoading}
            style={{
              background: 'linear-gradient(45deg, #8b5cf6, #ec4899)', // Cool gradient
              padding: '8px 12px', 
              fontSize: '0.8rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '5px',
              border: 'none',
              marginRight: '10px'
            }}
          >
            <Sparkles size={16} /> Auto-Brief
          </button>
        )}
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
              {<ReactMarkdown>{msg.text}</ReactMarkdown>}
              
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
      {/* HUMAN IN THE LOOP CONTROLS */}
      {pendingApproval && (
        <div style={{
          padding: '15px', background: '#334155', borderTop: '1px solid #475569', 
          display: 'flex', flexDirection: 'column', gap: '10px'
        }}>
          <div style={{color: '#cbd5e1', fontSize: '0.9rem'}}>
             <strong>Manager Review:</strong> Do you approve this draft?
          </div>
          <div style={{display: 'flex', gap: '10px'}}>
            <button 
              onClick={() => { setPendingApproval(null); alert("Draft Approved & Saved!") }}
              style={{background: '#10b981', flex: 1}}
            >
               Approve
            </button>
            <button 
              onClick={() => {
                const feedback = prompt("What should be changed?");
                if(feedback) handleRefine(feedback);
              }}
              style={{background: '#ef4444', flex: 1}}
            >
               Reject & Edit
            </button>
          </div>
        </div>
      )}

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