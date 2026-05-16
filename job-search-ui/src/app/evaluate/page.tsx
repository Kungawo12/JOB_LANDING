'use client'

import { useState, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type AIModel = 'claude' | 'gpt4'

interface Evaluation {
  score: number
  grade: string
  atsScore: number
  matchedKeywords: string[]
  missingKeywords: string[]
  roleTitle: string
  company: string
  highlights: string[]
  gaps: string[]
  recommendation: string
  level: string
  remote: boolean
  salaryRange: string
  usedModel?: string
}

function ModelToggle({ model, onChange }: { model: AIModel; onChange: (m: AIModel) => void }) {
  return (
    <div
      className="flex rounded-lg p-0.5 gap-0.5"
      style={{ background: '#1a1a1a', border: '1px solid #252525' }}
    >
      {(['claude', 'gpt4'] as AIModel[]).map(m => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className="px-3 py-1 rounded-md text-xs font-medium transition-all"
          style={{
            background: model === m ? (m === 'claude' ? '#1e3a2a' : '#1e2a3a') : 'transparent',
            color: model === m ? (m === 'claude' ? '#22c55e' : '#60a5fa') : '#555',
          }}
        >
          {m === 'claude' ? '◈ Claude' : '✦ GPT-4o'}
        </button>
      ))}
    </div>
  )
}

function ATSBar({ score }: { score: number }) {
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-medium" style={{ color: '#737373' }}>ATS Match Score</span>
        <span className="text-sm font-bold" style={{ color }}>{score}%</span>
      </div>
      <div className="w-full rounded-full h-2" style={{ background: '#1f1f1f' }}>
        <div
          className="h-2 rounded-full transition-all duration-700"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
    </div>
  )
}

function ScoreBadge({ score, grade }: { score: number; grade: string }) {
  const color = score >= 4 ? '#22c55e' : score >= 3 ? '#f59e0b' : '#ef4444'
  return (
    <div
      className="rounded-xl p-4 text-center border"
      style={{ background: '#141414', borderColor: '#252525' }}
    >
      <p className="text-4xl font-bold" style={{ color }}>{score.toFixed(1)}</p>
      <p className="text-lg font-semibold mt-0.5" style={{ color }}>{grade}</p>
      <p className="text-xs mt-1" style={{ color: '#555' }}>Overall fit score</p>
    </div>
  )
}

export default function EvaluatePage() {
  const [jd, setJd] = useState('')
  const [model, setModel] = useState<AIModel>('claude')
  const [phase, setPhase] = useState<'idle' | 'evaluating' | 'tailoring' | 'done'>('idle')
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null)
  const [tailoredResume, setTailoredResume] = useState('')
  const [activeTab, setActiveTab] = useState<'eval' | 'resume'>('eval')
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null)

  async function handleAnalyze() {
    if (!jd.trim()) return
    setPhase('evaluating')
    setEvaluation(null)
    setTailoredResume('')

    // Step 1: evaluate
    const evalRes = await fetch('/api/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobDescription: jd, model }),
    })
    const evalData: Evaluation = await evalRes.json()
    setEvaluation(evalData)
    setActiveTab('eval')
    setPhase('tailoring')

    // Step 2: stream tailored resume
    const tailorRes = await fetch('/api/tailor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobDescription: jd, model }),
    })

    const reader = tailorRes.body?.getReader()
    readerRef.current = reader ?? null
    const decoder = new TextDecoder()
    let full = ''

    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })
        setTailoredResume(full)
      }
    }

    setPhase('done')
  }

  function handleDownload() {
    const blob = new Blob([tailoredResume], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const company = evaluation?.company ?? 'role'
    a.download = `tenzin-kunga-resume-${company.toLowerCase().replace(/\s+/g, '-')}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const isStreaming = phase === 'tailoring'
  const isLoading = phase === 'evaluating' || phase === 'tailoring'

  return (
    <div className="h-full flex flex-col" style={{ background: '#0a0a0a' }}>
      {/* Top bar */}
      <div
        className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0"
        style={{ borderColor: '#1f1f1f', background: '#0f0f0f' }}
      >
        <div>
          <h1 className="text-base font-semibold text-white">Evaluate & Tailor</h1>
          <p className="text-xs mt-0.5" style={{ color: '#555' }}>
            Paste a job description → get ATS score + live tailored resume
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ModelToggle model={model} onChange={setModel} />
          {tailoredResume && (
            <button
              onClick={handleDownload}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
              style={{ background: '#1a2e1a', color: '#22c55e', border: '1px solid #22c55e44' }}
            >
              ↓ Download .md
            </button>
          )}
        </div>

      {/* Main split view */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left — JD input */}
        <div
          className="w-2/5 flex flex-col border-r flex-shrink-0"
          style={{ borderColor: '#1f1f1f' }}
        >
          <div className="flex-1 flex flex-col p-4 gap-3">
            <label className="text-xs font-medium" style={{ color: '#737373' }}>
              JOB DESCRIPTION
            </label>
            <textarea
              value={jd}
              onChange={e => setJd(e.target.value)}
              placeholder="Paste the full job description here...&#10;&#10;Include: role title, requirements, responsibilities, tech stack."
              className="flex-1 resize-none rounded-lg p-3 text-sm outline-none border transition-colors scrollbar-thin"
              style={{
                background: '#111',
                borderColor: '#222',
                color: '#e5e5e5',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                lineHeight: '1.6',
              }}
              disabled={isLoading}
            />
            <button
              onClick={handleAnalyze}
              disabled={!jd.trim() || isLoading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: isLoading ? '#1a2e1a' : '#22c55e',
                color: isLoading ? '#22c55e' : '#000',
                cursor: !jd.trim() || isLoading ? 'not-allowed' : 'pointer',
                opacity: !jd.trim() ? 0.5 : 1,
              }}
            >
              {phase === 'evaluating' && '◌ Analyzing match...'}
              {phase === 'tailoring' && '◌ Tailoring resume...'}
              {(phase === 'idle' || phase === 'done') && '▶ Analyze & Tailor'}
            </button>
          </div>

          {/* ATS Score */}
          {evaluation && (
            <div className="px-4 pb-4 space-y-3 border-t pt-4" style={{ borderColor: '#1a1a1a' }}>
              <ATSBar score={evaluation.atsScore} />

              {/* Matched keywords */}
              <div>
                <p className="text-xs mb-1.5" style={{ color: '#555' }}>MATCHED</p>
                <div className="flex flex-wrap gap-1">
                  {evaluation.matchedKeywords.map(kw => (
                    <span
                      key={kw}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: '#14532d', color: '#86efac' }}
                    >
                      ✓ {kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Missing keywords */}
              {evaluation.missingKeywords.length > 0 && (
                <div>
                  <p className="text-xs mb-1.5" style={{ color: '#555' }}>MISSING / ADD</p>
                  <div className="flex flex-wrap gap-1">
                    {evaluation.missingKeywords.map(kw => (
                      <span
                        key={kw}
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: '#431407', color: '#fdba74' }}
                      >
                        ✗ {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right — Results */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          {evaluation && (
            <div
              className="flex border-b flex-shrink-0"
              style={{ borderColor: '#1f1f1f', background: '#0f0f0f' }}
            >
              {(['eval', 'resume'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="px-5 py-3 text-xs font-medium border-b-2 transition-colors"
                  style={{
                    borderColor: activeTab === tab ? '#22c55e' : 'transparent',
                    color: activeTab === tab ? '#22c55e' : '#555',
                  }}
                >
                  {tab === 'eval' ? 'Evaluation' : 'Tailored Resume'}
                  {tab === 'resume' && isStreaming && (
                    <span className="ml-1.5 text-green-500">●</span>
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-auto p-5 scrollbar-thin">
            {/* Empty state */}
            {phase === 'idle' && (
              <div className="h-full flex flex-col items-center justify-center text-center gap-3">
                <div className="text-4xl opacity-20">◈</div>
                <p className="text-sm" style={{ color: '#555' }}>
                  Paste a job description on the left and click Analyze
                </p>
                <p className="text-xs" style={{ color: '#333' }}>
                  You'll get an ATS score, keyword analysis, and a live-tailored resume
                </p>
              </div>
            )}

            {/* Loading state */}
            {phase === 'evaluating' && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="text-green-500 text-2xl animate-pulse">◌</div>
                  <p className="text-sm" style={{ color: '#555' }}>Analyzing job fit...</p>
                </div>
              </div>
            )}

            {/* Evaluation tab */}
            {evaluation && activeTab === 'eval' && (
              <div className="space-y-5 max-w-2xl">
                {/* Header */}
                <div className="flex gap-4">
                  <ScoreBadge score={evaluation.score} grade={evaluation.grade} />
                  <div className="flex-1 space-y-2">
                    <div>
                      <p className="text-lg font-bold text-white">{evaluation.roleTitle}</p>
                      <p className="text-sm" style={{ color: '#737373' }}>{evaluation.company}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {evaluation.level && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#1e293b', color: '#7dd3fc' }}>
                          {evaluation.level}
                        </span>
                      )}
                      {evaluation.remote && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#1a2e1a', color: '#86efac' }}>
                          Remote
                        </span>
                      )}
                      {evaluation.salaryRange && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#1c1917', color: '#d6d3d1' }}>
                          {evaluation.salaryRange}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recommendation */}
                <div
                  className="rounded-lg p-4 border text-sm"
                  style={{
                    background: evaluation.score >= 3.5 ? '#0d1f12' : '#1c0a0a',
                    borderColor: evaluation.score >= 3.5 ? '#166534' : '#7f1d1d',
                    color: evaluation.score >= 3.5 ? '#86efac' : '#fca5a5',
                  }}
                >
                  <p className="font-semibold mb-0.5 text-xs" style={{ opacity: 0.7 }}>RECOMMENDATION</p>
                  {evaluation.recommendation}
                </div>

                {/* Highlights */}
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: '#737373' }}>STRENGTHS FOR THIS ROLE</p>
                  <ul className="space-y-1.5">
                    {evaluation.highlights.map((h, i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <span style={{ color: '#22c55e' }}>✓</span>
                        <span style={{ color: '#d4d4d4' }}>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Gaps */}
                {evaluation.gaps.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-2" style={{ color: '#737373' }}>GAPS TO ADDRESS</p>
                    <ul className="space-y-1.5">
                      {evaluation.gaps.map((g, i) => (
                        <li key={i} className="flex gap-2 text-sm">
                          <span style={{ color: '#f59e0b' }}>△</span>
                          <span style={{ color: '#d4d4d4' }}>{g}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Tailored Resume tab */}
            {evaluation && activeTab === 'resume' && (
              <div
                className="rounded-xl p-6 border"
                style={{ background: '#111', borderColor: '#1f1f1f' }}
              >
                <div className={`resume-preview ${isStreaming ? 'streaming-cursor' : ''}`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {tailoredResume || ' '}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
