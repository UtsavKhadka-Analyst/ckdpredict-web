import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react'
import api from '../api/client'

const SUGGESTED = [
  'How many urgent patients do we have?',
  'What does a risk score of 0.9 mean?',
  'Summarize today\'s outreach priority',
  'What is the financial impact of early intervention?',
]

function Message({ msg }) {
  const isBot = msg.role === 'assistant'
  return (
    <div className={`flex gap-2.5 ${isBot ? '' : 'flex-row-reverse'}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5
        ${isBot ? 'bg-teal-500' : 'bg-navy'}`}>
        {isBot ? <Bot size={14} className="text-white" /> : <User size={14} className="text-white" />}
      </div>
      <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed
        ${isBot
          ? 'bg-gray-100 text-gray-800 rounded-tl-sm'
          : 'bg-teal-500 text-white rounded-tr-sm'}`}>
        {msg.content}
      </div>
    </div>
  )
}

export default function ChatAssistant() {
  const [open, setOpen]       = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m CKD Assist. Ask me anything about your patient population, risk scores, or clinical priorities.' }
  ])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef             = useRef(null)
  const inputRef              = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150)
  }, [open])

  const send = async (text) => {
    const content = (text ?? input).trim()
    if (!content || loading) return
    setInput('')

    const userMsg = { role: 'user', content }
    const next = [...messages, userMsg]
    setMessages(next)
    setLoading(true)

    try {
      const { data } = await api.post('/chat/', {
        messages: next.map(m => ({ role: m.role, content: m.content }))
      })
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, the assistant is unavailable right now. Please try again.'
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center
          transition-all duration-200 ${open ? 'bg-gray-700 rotate-90' : 'bg-teal-500 hover:bg-teal-600'}`}
      >
        {open
          ? <X size={22} className="text-white" />
          : <MessageCircle size={22} className="text-white" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100
          flex flex-col overflow-hidden" style={{ height: '520px' }}>

          {/* Header */}
          <div className="bg-navy px-4 py-3.5 flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">CKD Assist</p>
              <p className="text-white/50 text-xs">Powered by Llama 3.3 · Live patient data</p>
            </div>
            <div className="ml-auto w-2 h-2 rounded-full bg-green-400" />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((m, i) => <Message key={i} msg={m} />)}
            {loading && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-teal-500 flex items-center justify-center shrink-0">
                  <Bot size={14} className="text-white" />
                </div>
                <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-3.5 py-2.5">
                  <Loader2 size={16} className="text-teal-500 animate-spin" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions (only before first user message) */}
          {messages.length === 1 && (
            <div className="px-4 pb-3 flex flex-wrap gap-1.5 shrink-0">
              {SUGGESTED.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs bg-teal-50 text-teal-700 border border-teal-200 rounded-full
                    px-3 py-1 hover:bg-teal-100 transition-colors text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-3 border-t border-gray-100 flex gap-2 shrink-0">
            <input
              ref={inputRef}
              className="flex-1 input py-2 text-sm"
              placeholder="Ask about patients, risk scores…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              disabled={loading}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl bg-teal-500 hover:bg-teal-600 disabled:opacity-40
                flex items-center justify-center transition-colors shrink-0"
            >
              <Send size={15} className="text-white" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
