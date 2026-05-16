'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

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

const STATUS_COLORS: Record<string, string> = {
  Evaluated: '#3b82f6',
  Applied: '#f59e0b',
  Interview: '#8b5cf6',
  Offer: '#22c55e',
  Rejected: '#ef4444',
  Discarded: '#6b7280',
  SKIP: '#6b7280',
  Responded: '#06b6d4',
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="rounded-xl p-5 border flex flex-col gap-1"
      style={{ background: '#141414', borderColor: '#252525' }}
    >
      <p className="text-3xl font-bold" style={{ color }}>{value}</p>
      <p className="text-sm" style={{ color: '#737373' }}>{label}</p>
    </div>
  )
}

export default function Dashboard() {
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/tracker')
      .then(r => r.json())
      .then(data => { setApps(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const counts = {
    evaluated: apps.filter(a => a.status === 'Evaluated').length,
    applied: apps.filter(a => a.status === 'Applied').length,
    interview: apps.filter(a => a.status === 'Interview').length,
    offer: apps.filter(a => a.status === 'Offer').length,
  }

  const recent = [...apps].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8)

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p style={{ color: '#737373' }} className="text-sm mt-1">
          Your job search at a glance, Tenzin.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Evaluated" value={counts.evaluated} color="#3b82f6" />
        <StatCard label="Applied" value={counts.applied} color="#f59e0b" />
        <StatCard label="In Interview" value={counts.interview} color="#8b5cf6" />
        <StatCard label="Offers" value={counts.offer} color="#22c55e" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link
          href="/evaluate"
          className="rounded-xl p-5 border flex items-center gap-3 group transition-colors"
          style={{ background: '#141414', borderColor: '#252525' }}
        >
          <span className="text-2xl">◈</span>
          <div>
            <p className="font-semibold text-white text-sm">Evaluate a Job</p>
            <p className="text-xs mt-0.5" style={{ color: '#737373' }}>
              Paste a JD → get an ATS score + live tailored resume
            </p>
          </div>
          <span className="ml-auto" style={{ color: '#333' }}>→</span>
        </Link>
        <Link
          href="/pipeline"
          className="rounded-xl p-5 border flex items-center gap-3 transition-colors"
          style={{ background: '#141414', borderColor: '#252525' }}
        >
          <span className="text-2xl">⊞</span>
          <div>
            <p className="font-semibold text-white text-sm">View Pipeline</p>
            <p className="text-xs mt-0.5" style={{ color: '#737373' }}>
              Track all applications by stage
            </p>
          </div>
          <span className="ml-auto" style={{ color: '#333' }}>→</span>
        </Link>
      </div>

      {/* Recent Applications */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: '#252525' }}
      >
        <div
          className="px-5 py-3 border-b flex items-center justify-between"
          style={{ background: '#141414', borderColor: '#252525' }}
        >
          <p className="text-sm font-semibold text-white">Recent Applications</p>
          <Link href="/pipeline" className="text-xs" style={{ color: '#737373' }}>View all →</Link>
        </div>

        {loading && (
          <div className="px-5 py-8 text-center text-sm" style={{ color: '#555' }}>Loading...</div>
        )}

        {!loading && apps.length === 0 && (
          <div className="px-5 py-10 text-center">
            <p className="text-sm mb-3" style={{ color: '#555' }}>No applications yet.</p>
            <Link
              href="/evaluate"
              className="text-sm px-4 py-2 rounded-lg font-medium"
              style={{ background: '#22c55e', color: '#000' }}
            >
              Evaluate your first job →
            </Link>
          </div>
        )}

        {!loading && recent.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #1f1f1f' }}>
                {['Date', 'Company', 'Role', 'Score', 'Status'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium" style={{ color: '#555' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map((app, i) => (
                <tr
                  key={i}
                  className="border-t"
                  style={{ borderColor: '#1a1a1a' }}
                >
                  <td className="px-4 py-3" style={{ color: '#737373' }}>{app.date}</td>
                  <td className="px-4 py-3 font-medium text-white">{app.company}</td>
                  <td className="px-4 py-3" style={{ color: '#a3a3a3' }}>{app.role}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs" style={{ color: '#22c55e' }}>{app.score}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: `${STATUS_COLORS[app.status] ?? '#555'}22`,
                        color: STATUS_COLORS[app.status] ?? '#aaa',
                      }}
                    >
                      {app.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
