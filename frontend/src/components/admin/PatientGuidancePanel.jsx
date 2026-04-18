import { X, AlertTriangle, Clock, CheckCircle, Activity } from 'lucide-react'

const TIER_CONFIG = {
  URGENT: {
    color:   'text-red-700',
    bg:      'bg-red-50',
    border:  'border-red-200',
    badge:   'bg-red-500 text-white',
    icon:    AlertTriangle,
    action:  'Contact within 24–48 hours',
    steps: [
      {
        title: 'Immediate Contact',
        icon: '📞',
        items: [
          'Call patient within 24–48 hours — do not wait for scheduled visit',
          'Arrange emergency nephrology referral if eGFR < 30 mL/min',
          'Assess for acute kidney injury triggers (dehydration, infection, nephrotoxins)',
        ],
      },
      {
        title: 'Medications (KDIGO 2024)',
        icon: '💊',
        items: [
          'SGLT2 inhibitors if diabetic + UACR ≥ 200 mg/g: empagliflozin 10 mg/day or dapagliflozin 10 mg/day',
          'Maximise ACE inhibitor or ARB to highest tolerated dose — do not combine both',
          'Hold NSAIDs, metformin (if eGFR < 30), and contrast agents immediately',
          'If Hb < 10 g/dL: consider erythropoiesis-stimulating agents + IV iron',
        ],
      },
      {
        title: 'Labs & Monitoring',
        icon: '🧪',
        items: [
          'Repeat eGFR + UACR within 1 month',
          'Full metabolic panel: potassium, bicarbonate, phosphorus, calcium',
          'CBC to assess anemia (target Hb 10–11.5 g/dL)',
          'Urine culture if infection suspected',
        ],
      },
      {
        title: 'Targets',
        icon: '🎯',
        items: [
          'BP target: < 120/80 mmHg',
          'Protein intake: 0.6–0.8 g/kg/day (low-protein diet)',
          'Sodium: < 2 g/day',
          'Fluid restriction if oliguria present',
        ],
      },
    ],
  },

  HIGH: {
    color:   'text-orange-700',
    bg:      'bg-orange-50',
    border:  'border-orange-200',
    badge:   'bg-orange-500 text-white',
    icon:    AlertTriangle,
    action:  'Schedule within 2 weeks',
    steps: [
      {
        title: 'Schedule & Referral',
        icon: '📅',
        items: [
          'Book clinic appointment within 2 weeks',
          'Consider nephrology referral if eGFR declining > 5 mL/min/year',
          'Dietitian referral for renal diet counselling',
        ],
      },
      {
        title: 'Medications (KDIGO 2024)',
        icon: '💊',
        items: [
          'Titrate ACE inhibitor or ARB to maximum tolerated dose',
          'SGLT2 inhibitor if diabetic: empagliflozin 10 mg/day or dapagliflozin 10 mg/day',
          'Statin therapy if 10-year CVD risk > 10% (atorvastatin 20–40 mg/day)',
          'Avoid NSAIDs — substitute acetaminophen for pain management',
        ],
      },
      {
        title: 'Labs & Monitoring',
        icon: '🧪',
        items: [
          'Repeat eGFR + UACR in 3 months',
          'Lipid panel + HbA1c if diabetic',
          'Annual urine culture screening',
          'Monitor potassium within 2 weeks of starting/changing RAAS therapy',
        ],
      },
      {
        title: 'Targets',
        icon: '🎯',
        items: [
          'BP target: < 130/80 mmHg',
          'Protein: 0.8 g/kg/day',
          'Sodium: < 2 g/day',
          'LDL: < 70 mg/dL if high CVD risk',
        ],
      },
    ],
  },

  MODERATE: {
    color:   'text-yellow-700',
    bg:      'bg-yellow-50',
    border:  'border-yellow-200',
    badge:   'bg-yellow-500 text-white',
    icon:    Clock,
    action:  'Routine follow-up in 3–6 months',
    steps: [
      {
        title: 'Follow-up Plan',
        icon: '📋',
        items: [
          'Schedule routine follow-up in 3–6 months',
          'Reinforce lifestyle modification at every visit',
          'Self-monitoring: home BP log, weight tracking',
        ],
      },
      {
        title: 'Medications (KDIGO 2024)',
        icon: '💊',
        items: [
          'Confirm ACE inhibitor or ARB is prescribed and patient is adherent',
          'Review all medications for nephrotoxic risk (NSAIDs, certain antibiotics)',
          'Diabetes management: optimise HbA1c to < 7% if diabetic',
        ],
      },
      {
        title: 'Labs & Monitoring',
        icon: '🧪',
        items: [
          'eGFR + UACR every 6 months',
          'HbA1c every 3 months if diabetic',
          'Annual lipid panel',
          'Vaccinações: influenza annually, pneumococcal if not done',
        ],
      },
      {
        title: 'Lifestyle Targets',
        icon: '🎯',
        items: [
          'BP target: < 130/80 mmHg',
          'Sodium: < 2 g/day (avoid processed foods)',
          'Physical activity: ≥ 150 min moderate exercise/week',
          'Weight: target BMI < 25 kg/m²',
        ],
      },
    ],
  },

  LOW: {
    color:   'text-green-700',
    bg:      'bg-green-50',
    border:  'border-green-200',
    badge:   'bg-green-600 text-white',
    icon:    CheckCircle,
    action:  'Annual screening',
    steps: [
      {
        title: 'Monitoring Schedule',
        icon: '📅',
        items: [
          'Annual eGFR + UACR screening',
          'Primary care follow-up once per year',
          'Screen for new-onset hypertension or diabetes at each visit',
        ],
      },
      {
        title: 'Prevention',
        icon: '🛡️',
        items: [
          'Avoid nephrotoxic medications (NSAIDs, high-dose contrast)',
          'Ensure adequate hydration especially in summer / illness',
          'Treat hypertension if BP ≥ 130/80 mmHg',
        ],
      },
      {
        title: 'Lifestyle Education',
        icon: '🥗',
        items: [
          'Low-sodium diet: < 2.3 g/day',
          'Mediterranean-style diet (vegetables, whole grains, lean protein)',
          'Limit alcohol: ≤ 1 drink/day women, ≤ 2/day men',
          'Smoking cessation if applicable',
        ],
      },
      {
        title: 'Targets',
        icon: '🎯',
        items: [
          'BP target: < 130/80 mmHg',
          'HbA1c < 7% if diabetic',
          'BMI: 18.5–24.9 kg/m²',
          'Physical activity: ≥ 150 min/week',
        ],
      },
    ],
  },
}

export default function PatientGuidancePanel({ patient, onClose }) {
  if (!patient) return null

  const cfg   = TIER_CONFIG[patient.urgency_tier] ?? TIER_CONFIG.LOW
  const Icon  = cfg.icon
  const risk  = Math.round((patient.risk_score ?? 0) * 100)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className="fixed right-0 top-0 h-full w-[480px] bg-white shadow-2xl z-50 flex flex-col overflow-hidden">

        {/* Header */}
        <div className={`px-5 py-4 border-b ${cfg.border} ${cfg.bg} flex items-start justify-between`}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${cfg.badge}`}>
                {patient.urgency_tier}
              </span>
              <span className="text-xs text-gray-500 font-mono">{patient.patient_id?.slice(0,8)}…</span>
            </div>
            <p className={`text-sm font-bold ${cfg.color}`}>{cfg.action}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {patient.age ? `${Math.round(patient.age)} yr` : '—'} ·{' '}
              {{ M:'Male', F:'Female' }[patient.gender] ?? patient.gender ?? '—'} ·{' '}
              {patient.pathway ?? '—'} pathway ·{' '}
              {patient.city ?? '—'}{patient.state ? `, ${patient.state}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors mt-0.5">
            <X size={18} />
          </button>
        </div>

        {/* Risk summary bar */}
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/60 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-500">CKD Progression Risk</span>
              <span className={`text-sm font-bold ${cfg.color}`}>{risk}%</span>
            </div>
            <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${risk}%`,
                  background: patient.urgency_tier === 'URGENT' ? '#DC2626'
                    : patient.urgency_tier === 'HIGH'     ? '#EA580C'
                    : patient.urgency_tier === 'MODERATE' ? '#CA8A04' : '#16A34A',
                }}
              />
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-gray-400">Proj. Cost</p>
            <p className="text-sm font-bold text-gray-800">
              {patient.proj_cost ? `$${Number(patient.proj_cost).toLocaleString()}` : '—'}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-gray-400">Est. Savings</p>
            <p className="text-sm font-bold text-teal-600">
              {patient.potential_saving ? `$${Number(patient.potential_saving).toLocaleString()}` : '—'}
            </p>
          </div>
        </div>

        {/* Clinical guidance — scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          <div className="flex items-center gap-2 mb-1">
            <Activity size={14} className="text-teal-500" />
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">
              KDIGO 2024 Clinical Guidance
            </p>
          </div>

          {cfg.steps.map(({ title, icon, items }) => (
            <div key={title} className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4`}>
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-base">{icon}</span>
                <p className={`text-xs font-bold ${cfg.color}`}>{title}</p>
              </div>
              <ul className="space-y-1.5">
                {items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-700 leading-relaxed">
                    <span className="mt-0.5 shrink-0 text-gray-400">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Disclaimer */}
          <p className="text-xs text-gray-300 text-center pt-2 pb-4">
            Guidance based on KDIGO 2024 · Final clinical judgment belongs to the treating physician
          </p>
        </div>
      </aside>
    </>
  )
}
