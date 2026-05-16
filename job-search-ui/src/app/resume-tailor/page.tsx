'use client'

import { useState, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type Tab = 'improvements' | 'preview' | 'latex'

function parseOutput(text: string) {
  const impMatch = text.match(/## IMPROVEMENTS\n([\s\S]*?)(?=\n## RESUME|\n## LATEX|$)/)
  const resumeMatch = text.match(/## RESUME\n([\s\S]*?)(?=\n## LATEX|$)/)
  const latexMatch = text.match(/## LATEX\n([\s\S]*)/)
  return {
    improvements: impMatch?.[1]?.trim() ?? '',
    resume: resumeMatch?.[1]?.trim() ?? '',
    latex: latexMatch?.[1]?.trim() ?? '',
  }
}

export default function ResumeTailorPage() {
  const [resumeText, setResumeText] = useState('')
  const [jd, setJd] = useState('')
  const [phase, setPhase] = useState<'idle' | 'generating' | 'done'>('idle')
  const [output, setOutput] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('improvements')
  const previewRef = useRef<HTMLDivElement>(null)

  const { improvements, resume, latex } = parseOutput(output)
  const isLoading = phase === 'generating'
  const hasResult = !!(improvements || resume || latex)

  async function handleGenerate() {
    if (!resumeText.trim() || !jd.trim()) return
    setPhase('generating')
    setOutput('')
    setActiveTab('improvements')

    const res = await fetch('/api/resume-tailor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeText, jobDescription: jd }),
    })

    const reader = res.body?.getReader()
    const decoder = new TextDecoder()
    let full = ''

    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })
        setOutput(full)
      }
    }

    setPhase('done')
  }

  function downloadTex() {
    const blob = new Blob([latex], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'resume-tailored.tex'
    a.click()
    URL.revokeObjectURL(url)
  }

  function handlePrint() {
    const content = previewRef.current?.innerHTML ?? ''
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head>
      <title>Tailored Resume</title>
      <meta charset="utf-8" />
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Times New Roman', Times, serif; max-width: 7.5in; margin: 0.5in auto; font-size: 10.5pt; color: #000; line-height: 1.45; }
        h1 { font-size: 18pt; text-align: center; margin-bottom: 3px; letter-spacing: 0.5px; }
        h2 { font-size: 9.5pt; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 1px solid #000; padding-bottom: 2px; margin: 11px 0 4px; font-weight: 700; }
        h3 { font-size: 10.5pt; margin: 5px 0 1px; font-weight: 600; }
        p { margin: 0 0 4px; font-size: 10.5pt; }
        ul { margin: 2px 0 4px 15px; padding: 0; }
        li { margin-bottom: 2px; font-size: 10.5pt; }
        a { color: #000; text-decoration: none; }
        hr { border: 0; border-top: 1px solid #bbb; margin: 6px 0; }
        strong { font-weight: 700; }
        em { font-style: italic; }
        @media print {
          @page { margin: 0.45in; size: letter; }
          body { margin: 0; }
        }
      </style>
    </head><body>${content}</body></html>`)
    win.document.close()
    setTimeout(() => { win.focus(); win.print() }, 400)
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'improvements', label: 'Improvements' },
    { id: 'preview', label: 'Resume Preview' },
    { id: 'latex', label: 'LaTeX Code' },
  ]

  return (
    <div className="h-full flex flex-col" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <div
        className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0"
        style={{ borderColor: '#1f1f1f', background: '#0f0f0f' }}
      >
        <div>
          <h1 className="text-base font-semibold text-white">Resume Tailor</h1>
          <p className="text-xs mt-0.5" style={{ color: '#555' }}>
            Paste your resume + job description → ATS-optimized resume + LaTeX for Overleaf
          </p>
        </div>
        {phase === 'done' && (
          <div className="flex items-center gap-2">
            {resume && (
              <button
                onClick={handlePrint}
                className="text-xs px-3 py-1.5 rounded-lg font-medium"
                style={{ background: '#1a1a2e', color: '#60a5fa', border: '1px solid #60a5fa33' }}
              >
                ⎙ Print as PDF
              </button>
            )}
            {latex && (
              <button
                onClick={downloadTex}
                className="text-xs px-3 py-1.5 rounded-lg font-medium"
                style={{ background: '#1a2e1a', color: '#22c55e', border: '1px solid #22c55e33' }}
              >
                ↓ Download .tex
              </button>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: inputs */}
        <div
          className="w-2/5 flex flex-col border-r flex-shrink-0 p-4 gap-3"
          style={{ borderColor: '#1f1f1f' }}
        >
          <div className="flex-1 flex flex-col gap-1.5 min-h-0">
            <label className="text-xs font-medium flex-shrink-0" style={{ color: '#737373' }}>
              YOUR RESUME
            </label>
            <textarea
              value={resumeText}
              onChange={e => setResumeText(e.target.value)}
              placeholder={"Paste your full resume text here...\n\nCopy from your Word doc, PDF, or LinkedIn."}
              disabled={isLoading}
              className="flex-1 resize-none rounded-lg p-3 outline-none border scrollbar-thin"
              style={{
                background: '#111',
                borderColor: '#222',
                color: '#e5e5e5',
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                lineHeight: '1.6',
              }}
            />
          </div>

          <div className="flex-1 flex flex-col gap-1.5 min-h-0">
            <label className="text-xs font-medium flex-shrink-0" style={{ color: '#737373' }}>
              JOB DESCRIPTION
            </label>
            <textarea
              value={jd}
              onChange={e => setJd(e.target.value)}
              placeholder={"Paste the full job description here...\n\nInclude: title, requirements, responsibilities, tech stack."}
              disabled={isLoading}
              className="flex-1 resize-none rounded-lg p-3 outline-none border scrollbar-thin"
              style={{
                background: '#111',
                borderColor: '#222',
                color: '#e5e5e5',
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                lineHeight: '1.6',
              }}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={!resumeText.trim() || !jd.trim() || isLoading}
            className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all flex-shrink-0"
            style={{
              background: isLoading ? '#1a2e1a' : '#22c55e',
              color: isLoading ? '#22c55e' : '#000',
              cursor: !resumeText.trim() || !jd.trim() || isLoading ? 'not-allowed' : 'pointer',
              opacity: !resumeText.trim() || !jd.trim() ? 0.5 : 1,
            }}
          >
            {isLoading ? '◌ Tailoring resume...' : '▶ Tailor Resume'}
          </button>
        </div>

        {/* Right: results */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {hasResult && (
            <div
              className="flex border-b flex-shrink-0"
              style={{ borderColor: '#1f1f1f', background: '#0f0f0f' }}
            >
              {TABS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className="px-5 py-3 text-xs font-medium border-b-2 transition-colors"
                  style={{
                    borderColor: activeTab === id ? '#22c55e' : 'transparent',
                    color: activeTab === id ? '#22c55e' : '#555',
                  }}
                >
                  {label}
                  {isLoading && id === 'improvements' && !improvements && (
                    <span className="ml-1.5 animate-pulse" style={{ color: '#22c55e' }}>●</span>
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-auto p-5 scrollbar-thin">
            {/* Empty state */}
            {phase === 'idle' && (
              <div className="h-full flex flex-col items-center justify-center text-center gap-3">
                <div className="text-5xl opacity-10">⊟</div>
                <p className="text-sm" style={{ color: '#555' }}>
                  Paste your resume and a job description, then click Tailor Resume
                </p>
                <p className="text-xs" style={{ color: '#333' }}>
                  You'll get: a list of improvements, a live resume preview, and LaTeX code for Overleaf
                </p>
              </div>
            )}

            {/* Generating + no content yet */}
            {phase === 'generating' && !hasResult && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="text-2xl animate-pulse" style={{ color: '#22c55e' }}>◌</div>
                  <p className="text-sm" style={{ color: '#555' }}>Tailoring your resume...</p>
                </div>
              </div>
            )}

            {/* Improvements tab */}
            {hasResult && activeTab === 'improvements' && (
              <div
                className="rounded-xl p-6 border"
                style={{ background: '#111', borderColor: '#1f1f1f' }}
              >
                <div className={`resume-preview ${isLoading && !improvements ? 'streaming-cursor' : ''}`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {improvements || (isLoading ? '*Generating improvements…*' : '*No improvements captured.*')}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {/* Resume Preview tab — white background to look like paper */}
            {hasResult && activeTab === 'preview' && (
              <div
                className="rounded-xl border overflow-hidden"
                style={{ borderColor: '#1f1f1f' }}
              >
                {phase === 'done' && resume && (
                  <div className="px-4 py-2 border-b flex items-center gap-2" style={{ background: '#0f0f0f', borderColor: '#1f1f1f' }}>
                    <span className="text-xs" style={{ color: '#555' }}>Preview — click</span>
                    <button
                      onClick={handlePrint}
                      className="text-xs px-2 py-0.5 rounded font-medium"
                      style={{ background: '#1a1a2e', color: '#60a5fa' }}
                    >
                      ⎙ Print as PDF
                    </button>
                    <span className="text-xs" style={{ color: '#555' }}>to export</span>
                  </div>
                )}
                <div className="p-8" style={{ background: '#fff' }}>
                  <div ref={previewRef} className="resume-print-preview">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {resume || (isLoading ? '*Generating resume preview…*' : '')}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            )}

            {/* LaTeX tab */}
            {hasResult && activeTab === 'latex' && (
              <div
                className="rounded-xl border"
                style={{ background: '#111', borderColor: '#1f1f1f' }}
              >
                <div className="px-4 py-2.5 border-b flex items-center justify-between" style={{ borderColor: '#1a1a1a' }}>
                  <p className="text-xs" style={{ color: '#555' }}>
                    Copy into Overleaf → compile → download PDF
                  </p>
                  {latex && (
                    <button
                      onClick={downloadTex}
                      className="text-xs px-2.5 py-1 rounded font-medium"
                      style={{ background: '#1a2e1a', color: '#22c55e' }}
                    >
                      ↓ .tex
                    </button>
                  )}
                </div>
                <pre
                  className="p-5 text-xs overflow-auto scrollbar-thin"
                  style={{
                    color: '#a3e635',
                    fontFamily: 'monospace',
                    lineHeight: '1.65',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {latex || (isLoading ? 'Generating LaTeX…' : '')}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
