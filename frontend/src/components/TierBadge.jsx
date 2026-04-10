export default function TierBadge({ tier }) {
  const map = {
    URGENT:   'badge-urgent',
    HIGH:     'badge-high',
    MODERATE: 'badge-moderate',
    LOW:      'badge-low',
  }
  const icons = { URGENT: '🔴', HIGH: '🟠', MODERATE: '🟡', LOW: '🟢' }
  return (
    <span className={map[tier] ?? 'badge-low'}>
      {icons[tier]} {tier}
    </span>
  )
}
