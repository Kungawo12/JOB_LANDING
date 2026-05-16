'use client'

import { useEffect, useState } from 'react'

interface Application {
  num: string
  date: string
  company: string
  role: string
  score: string
  status: string
  hasPDF: boolean
  notes: string
}

const COLUMNS = [
  { key: 'Evaluated', label: 'Evaluated', color: '#3b82f6' },
  { key: 'Applied', label: 'Applied', color: '#f59e0b' },
  { key: 'Interview', label: 'Interview', color: '#8b5cf6' },
  { key: 'Offer', label: 'Offer', color: '#22c55e' },
  { key: 'Rejected', label: 'Rejected / Skipped', color: '#ef4444' },
]

function ScoreColor(score: string) {
  const n = parseFloat(score)
  if (n >= 4) return '#22c55e'
  if (n >= 3) return '#f59e0b'
  return '#ef4444'
}

function AppCard({ app }: { app: Application }) {
  const score = parseFloat(app.score)
  return (
    <div
      className="rounded-lg p-3 border mb-2"
      style={{ background: '#141414', borderColor: '#252525' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-sm text-white truncate">{app.company}</p>
          <p className="text-xs truncate mt-0.5" style={{ color: '#737373' }}>{app.role}</p>
        </div>
        {!isNaN(score) && (
          <span
            className="text-xs font-bold font-mono flex-shrink-0 px-1.5 py-0.5 rounded"
            style={{ color: ScoreColor(app.score), background: `${ScoreColor(app.score)}18` }}
          >
            {score.toFixed(1)}
          </span>
        )}
      </div>
      {app.notes && (
        <p className="text-xs mt-1.5 line-clamp-2" style={{ color: '#555' }}>{app.notes}</p>
      )}
      <p className="text-xs mt-2" style={{ color: '#404040' }}>{app.date}</p>
    </div>
  )
}

export default function PipelinePage() {
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/tracker')
      .then(r => r.json())
      .then(data => { setApps(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const grouped = (status: string) =>
    apps.filter(a =>
      status === 'Rejected'
        ? ['Rejected', 'Discarded', 'SKIP'].includes(a.status)
        : a.status === status
    )

  return (
    <div className="p-6 h-full flex flex-col" style={{ background: '#0a0a0a' }}>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Pipeline</h1>
        <p className="text-sm mt-1" style={{ color: '#555' }}>
          {apps.length} total applications
        </p>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm" style={{ color: '#555' }}>Loading...</p>
        </div>
      ) : apps.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <p className="text-4xl opacity-10">⊞</p>
          <p className="text-sm" style={{ color: '#555' }}>No applications yet.</p>
          <a
            href="/evaluate"
            className="text-sm px-4 py-2 rounded-lg font-medium"
            style={{ background: '#22c55e', color: '#000' }}
          >
            Evaluate your first job →
          </a>
        </div>
      ) : (
        <div className="flex-1 flex gap-4 overflow-auto pb-2">
          {COLUMNS.map(col => {
            const cards = grouped(col.key)
            return (
              <div
                key={col.key}
                className="flex-shrink-0 w-56 flex flex-col rounded-xl border overflow-hidden"
                style={{ background: '#0f0f0f', borderColor: '#1f1f1f' }}
              >
                {/* Column header */}
                <div
                  className="px-3 py-2.5 border-b flex items-center justify-between"
                  style={{ borderColor: '#1a1a1a' }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                    <span className="text-xs font-semibold" style={{ color: col.color }}>
                      {col.label}
                    </span>
                  </div>
                  <span
                    className="text-xs font-mono px-1.5 py-0.5 rounded"
                    style={{ background: '#1f1f1f', color: '#555' }}
                  >
                    {cards.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-auto p-2 scrollbar-thin">
                  {cards.length === 0 ? (
                    <p className="text-xs text-center py-6" style={{ color: '#333' }}>Empty</p>
                  ) : (
                    cards.map((app, i) => <AppCard key={i} app={app} />)
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
