'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Dashboard', icon: '⬡' },
  { href: '/evaluate', label: 'Evaluate & Tailor', icon: '◈' },
  { href: '/workflow', label: 'Workflow', icon: '⟡' },
  { href: '/pipeline', label: 'Pipeline', icon: '⊞' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="w-52 flex-shrink-0 flex flex-col border-r"
      style={{ background: '#111111', borderColor: '#1f1f1f' }}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b" style={{ borderColor: '#1f1f1f' }}>
        <div className="flex items-center gap-2">
          <span className="text-green-500 text-xl">◈</span>
          <div>
            <p className="font-semibold text-sm text-white leading-none">Career Ops</p>
            <p className="text-xs mt-0.5" style={{ color: '#555' }}>Tenzin Kunga</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {links.map(({ href, label, icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors"
              style={{
                background: active ? '#1f2937' : 'transparent',
                color: active ? '#22c55e' : '#737373',
              }}
            >
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t text-xs" style={{ borderColor: '#1f1f1f', color: '#404040' }}>
        career-ops v1.7.0
      </div>
    </aside>
  )
}
