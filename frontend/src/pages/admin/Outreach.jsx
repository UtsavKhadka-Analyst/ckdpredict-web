import { useEffect, useState } from 'react'
import { Send, Download, CheckCircle2, Users, X } from 'lucide-react'
import Sidebar from '../../components/Sidebar'
import TierBadge from '../../components/TierBadge'
import { useRegistry } from '../../context/RegistryContext'

const TEMPLATES = {
  URGENT: {
    subject: 'Important: Your Kidney Health Requires Immediate Attention',
    body: `Dear Patient,

Our care team has reviewed your recent health data and your kidney health risk score indicates that immediate follow-up is needed.

Please contact our nephrology clinic within the next 24–48 hours to schedule an urgent appointment.

📞 Nephrology Clinic: (314) 555-0100
🌐 Patient Portal: ckdpredict.app/portal

If you experience sudden swelling, difficulty breathing, or severe pain — please call 911 or go to your nearest emergency room immediately.

With care,
CKDPredict Care Team
Saint Louis University Medical Center`,
  },
  HIGH: {
    subject: 'Your Kidney Health: Scheduling a Follow-Up',
    body: `Dear Patient,

Your recent kidney health assessment shows an elevated risk score that warrants a follow-up appointment within the next 2 weeks.

Early intervention can significantly slow the progression of kidney disease and improve long-term outcomes.

Please call us to schedule your appointment:
📞 (314) 555-0100
🌐 Patient Portal: ckdpredict.app/portal

With care,
CKDPredict Care Team`,
  },
  MODERATE: {
    subject: 'Kidney Health Monitoring — Routine Follow-Up',
    body: `Dear Patient,

Your kidney health risk score is in the moderate range. We recommend scheduling a routine follow-up within the next 3–6 months.

Steps you can take now:
• Reduce sodium intake (< 2g/day)
• Monitor your blood pressure regularly
• Stay active with moderate exercise

📞 (314) 555-0100 | 🌐 ckdpredict.app/portal

With care,
CKDPredict Care Team`,
  },
  LOW: {
    subject: 'Annual Kidney Health Screening Reminder',
    body: `Dear Patient,

This is a reminder that your annual kidney health screening is due. Routine monitoring helps detect any changes early.

Please schedule your annual visit at your convenience.

📞 (314) 555-0100 | 🌐 ckdpredict.app/portal

With care,
CKDPredict Care Team`,
  },
}



export default function Outreach() {
  const { patients, loading }     = useRegistry()
  const [tierFilter, setTier]     = useState('URGENT')
  const [selected, setSelected]   = useState(new Set())
  const [template, setTemplate]   = useState(TEMPLATES.URGENT)
  const [sent, setSent]           = useState(new Set())
  const [sending, setSending]     = useState(false)
  const [showPreview, setPreview] = useState(false)

  useEffect(() => {
    setTemplate(TEMPLATES[tierFilter] ?? TEMPLATES.URGENT)
    setSelected(new Set())
  }, [tierFilter])

  const visible = patients.filter(p => p.urgency_tier === tierFilter)

  const toggleAll = () => {
    if (selected.size === visible.length) setSelected(new Set())
    else setSelected(new Set(visible.map(p => p.patient_id)))
  }

  const toggleOne = (id) => {
    const s = new Set(selected)
    s.has(id) ? s.delete(id) : s.add(id)
    setSelected(s)
  }

  const handleSend = async () => {
    if (!selected.size) return
    setSending(true)
    await new Promise(r => setTimeout(r, 1200)) // simulate send
    setSent(prev => new Set([...prev, ...selected]))
    setSelected(new Set())
    setSending(false)
  }

  const handleExport = () => {
    const rows = visible
      .filter(p => selected.has(p.patient_id))
      .map(p => `${p.patient_id},${p.urgency_tier},${p.risk_score},${p.age ?? ''},${p.gender ?? ''},${p.city ?? ''}`)
    const csv = ['Patient ID,Tier,Risk Score,Age,Gender,City', ...rows].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a'); a.href = url
    a.download = `outreach_${tierFilter.toLowerCase()}_${new Date().toISOString().slice(0,10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-100 px-6 py-3.5 sticky top-0 z-20 shadow-sm">
          <h1 className="text-base font-bold text-gray-900">Patient Outreach</h1>
          <p className="text-xs text-gray-400 mt-0.5">Compose and simulate outreach messages by risk tier</p>
        </header>

        <main className="flex-1 p-6">
          <div className="flex gap-5 h-full">
            {/* Left — patient list */}
            <div className="w-80 shrink-0 flex flex-col gap-3">
              {/* Tier tabs */}
              <div className="card p-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Filter by tier</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {['URGENT','HIGH','MODERATE','LOW'].map(t => {
                    const cols = {
                      URGENT: 'bg-red-500 text-white', HIGH: 'bg-orange-500 text-white',
                      MODERATE: 'bg-yellow-500 text-white', LOW: 'bg-green-600 text-white'
                    }
                    const inactive = {
                      URGENT: 'bg-red-50 text-red-600', HIGH: 'bg-orange-50 text-orange-600',
                      MODERATE: 'bg-yellow-50 text-yellow-700', LOW: 'bg-green-50 text-green-700'
                    }
                    return (
                      <button
                        key={t}
                        onClick={() => setTier(t)}
                        className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${tierFilter === t ? cols[t] : inactive[t]}`}
                      >
                        {t} ({patients.filter(p => p.urgency_tier === t).length})
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Select all */}
              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600">
                  <input type="checkbox"
                    checked={selected.size === visible.length && visible.length > 0}
                    onChange={toggleAll}
                    className="accent-teal-500"
                  />
                  Select all ({visible.length})
                </label>
                <span className="text-xs text-teal-600 font-semibold">{selected.size} selected</span>
              </div>

              {/* Patient list */}
              <div className="card p-0 overflow-hidden flex-1">
                <div className="divide-y divide-gray-50 max-h-[50vh] overflow-y-auto">
                  {loading ? (
                    <div className="p-6 text-center text-gray-400 text-xs animate-pulse">Loading…</div>
                  ) : visible.map(p => (
                    <label
                      key={p.patient_id}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors
                        ${sent.has(p.patient_id) ? 'opacity-50' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(p.patient_id)}
                        onChange={() => toggleOne(p.patient_id)}
                        disabled={sent.has(p.patient_id)}
                        className="accent-teal-500 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-xs text-gray-500 truncate">{p.patient_id.slice(0,12)}…</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400">{(p.risk_score*100).toFixed(0)}%</span>
                          {p.city && <span className="text-xs text-gray-400">· {p.city}</span>}
                        </div>
                      </div>
                      {sent.has(p.patient_id) && (
                        <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                      )}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Right — message composer */}
            <div className="flex-1 flex flex-col gap-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="card text-center py-3">
                  <p className="text-2xl font-black text-gray-800">{visible.length}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{tierFilter} patients</p>
                </div>
                <div className="card text-center py-3">
                  <p className="text-2xl font-black text-teal-600">{selected.size}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Selected</p>
                </div>
                <div className="card text-center py-3">
                  <p className="text-2xl font-black text-green-600">{sent.size}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Messages sent</p>
                </div>
              </div>

              {/* Composer */}
              <div className="card flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-800">Message Template</p>
                  <div className="flex gap-2">
                    <button onClick={() => setPreview(v => !v)} className="btn-secondary py-1.5 px-3 text-xs">
                      {showPreview ? 'Edit' : 'Preview'}
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Subject</label>
                  <input
                    className="input text-sm"
                    value={template.subject}
                    onChange={e => setTemplate(t => ({ ...t, subject: e.target.value }))}
                  />
                </div>

                <div className="flex-1 flex flex-col">
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Message body</label>
                  {showPreview ? (
                    <div className="flex-1 bg-gray-50 rounded-xl p-4 text-xs text-gray-700 whitespace-pre-line font-mono leading-relaxed border border-gray-200">
                      {template.body}
                    </div>
                  ) : (
                    <textarea
                      className="flex-1 input text-xs font-mono resize-none leading-relaxed"
                      rows={12}
                      value={template.body}
                      onChange={e => setTemplate(t => ({ ...t, body: e.target.value }))}
                    />
                  )}
                </div>

                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                  <div className="flex-1 text-xs text-gray-400">
                    {selected.size > 0
                      ? `Ready to send to ${selected.size} patient${selected.size !== 1 ? 's' : ''}`
                      : 'Select patients from the list to send'}
                  </div>
                  <button
                    onClick={handleExport}
                    disabled={!selected.size}
                    className="btn-secondary flex items-center gap-1.5 py-2 px-4 text-xs disabled:opacity-40"
                  >
                    <Download size={13} /> Export list
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={!selected.size || sending}
                    className="btn-primary flex items-center gap-1.5 py-2 px-5 text-xs disabled:opacity-40"
                  >
                    <Send size={13} />
                    {sending ? 'Sending…' : `Send to ${selected.size || 0}`}
                  </button>
                </div>

                <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700">
                  ⚠️ <strong>Demo mode</strong> — messages are simulated. No real communications are sent.
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
