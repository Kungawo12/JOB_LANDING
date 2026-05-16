'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type AIModel = 'claude' | 'gpt4'
type NodeStatus = 'idle' | 'running' | 'done' | 'error'

interface WorkflowNode {
  id: string
  label: string
  sublabel: string
  icon: string
  status: NodeStatus
  output?: string
}

const INITIAL_NODES: WorkflowNode[] = [
  { id: 'input',    label: 'Form Input',       sublabel: 'Job description',    icon: '📋', status: 'idle' },
  { id: 'evaluate', label: 'AI Evaluator',       sublabel: 'Analyzing job fit',          icon: '◈', status: 'idle' },
  { id: 'ats',      label: 'ATS Checker',       sublabel: 'Keyword extraction', icon: '⚡', status: 'idle' },
  { id: 'tailor',   label: 'Resume Tailor',     sublabel: 'Live rewrite',       icon: '✍', status: 'idle' },
  { id: 'pdf',      label: 'PDF / .md Export',  sublabel: 'Download ready',     icon: '📄', status: 'idle' },
]

const STATUS_STYLES: Record<NodeStatus, { border: string; glow: string; label: string; dot: string }> = {
  idle:    { border: '#252525', glow: 'none',                           label: '#555',    dot: '#333' },
  running: { border: '#22c55e', glow: '0 0 12px #22c55e55',             label: '#22c55e', dot: '#22c55e' },
  done:    { border: '#166534', glow: 'none',                           label: '#86efac', dot: '#22c55e' },
  error:   { border: '#7f1d1d', glow: 'none',                           label: '#fca5a5', dot: '#ef4444' },
}

function NodeCard({ node }: { node: WorkflowNode }) {
  const s = STATUS_STYLES[node.status]
  return (
    <div
      className="rounded-xl border p-4 w-40 flex-shrink-0 transition-all duration-300 relative"
      style={{ background: '#111', borderColor: s.border, boxShadow: s.glow }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xl">{node.icon}</span>
        <span
          className="w-2 h-2 rounded-full transition-all duration-300"
          style={{
            background: s.dot,
            boxShadow: node.status === 'running' ? `0 0 6px ${s.dot}` : 'none',
          }}
        />
      </div>
      <p className="text-xs font-semibold text-white leading-tight">{node.label}</p>
      <p className="text-xs mt-0.5" style={{ color: s.label }}>{node.sublabel}</p>
      {node.status === 'running' && (
        <div className="mt-2 flex gap-0.5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-1 h-1 rounded-full animate-bounce"
              style={{ background: '#22c55e', animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      )}
      {node.status === 'done' && (
        <p className="text-xs mt-1.5" style={{ color: '#22c55e' }}>✓ Complete</p>
      )}
    </div>
  )
}

function Arrow({ active }: { active: boolean }) {
  return (
    <div className="flex items-center flex-shrink-0 px-1">
      <div
        className="h-px w-8 transition-all duration-500"
        style={{ background: active ? '#22c55e' : '#252525' }}
      />
      <div
        className="border-t border-r w-2 h-2 rotate-45 -ml-1 transition-all duration-500"
        style={{ borderColor: active ? '#22c55e' : '#252525' }}
      />
    </div>
  )
}

function ModelToggle({ model, onChange }: { model: AIModel; onChange: (m: AIModel) => void }) {
  return (
    <div className="flex rounded-lg p-0.5 gap-0.5" style={{ background: '#1a1a1a', border: '1px solid #252525' }}>
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

export default function WorkflowPage() {
  const [jd, setJd] = useState('')
  const [model, setModel] = useState<AIModel>('claude')
  const [nodes, setNodes] = useState<WorkflowNode[]>(INITIAL_NODES)
  const [tailoredResume, setTailoredResume] = useState('')
  const [evaluation, setEvaluation] = useState<Record<string, unknown> | null>(null)
  const [running, setRunning] = useState(false)
  const [log, setLog] = useState<string[]>([])

  function setNodeStatus(id: string, status: NodeStatus, output?: string) {
    setNodes(prev =>
      prev.map(n => (n.id === id ? { ...n, status, output: output ?? n.output } : n))
    )
  }

  function addLog(msg: string) {
    setLog(prev => [...prev, `${new Date().toLocaleTimeString()} — ${msg}`])
  }

  async function runWorkflow() {
    if (!jd.trim() || running) return
    setRunning(true)
    setTailoredResume('')
    setEvaluation(null)
    setLog([])
    setNodes(INITIAL_NODES)

    // Step 1: Form Input
    setNodeStatus('input', 'running')
    addLog('Form input received — job description loaded')
    await delay(600)
    setNodeStatus('input', 'done', `${jd.length} characters`)

    // Step 2: Claude Evaluator
    setNodeStatus('evaluate', 'running')
    addLog('Sending to Claude claude-sonnet-4-6 for evaluation...')
    let latestEval: Record<string, unknown> = {}
    try {
      const evalRes = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription: jd, model }),
      })
      const evalData = await evalRes.json()
      latestEval = evalData
      setEvaluation(evalData)
      setNodeStatus('evaluate', 'done', JSON.stringify(evalData))
      addLog(`Evaluation complete — score ${evalData.score}/5, grade ${evalData.grade}`)
    } catch {
      setNodeStatus('evaluate', 'error')
      addLog('ERROR: Evaluation failed')
      setRunning(false)
      return
    }

    // Step 3: ATS Checker (visual — data already in evaluation)
    setNodeStatus('ats', 'running')
    addLog('Extracting ATS keywords and calculating match score...')
    await delay(700)
    const matched = (latestEval.matchedKeywords as string[] | undefined) ?? []
    const missing = (latestEval.missingKeywords as string[] | undefined) ?? []
    setNodeStatus('ats', 'done', `${matched.length} matched, ${missing.length} gaps`)
    addLog(`ATS: ${matched.length} keywords matched, ${missing.length} missing`)

    // Step 4: Resume Tailor (streaming)
    setNodeStatus('tailor', 'running')
    addLog('Streaming tailored resume from Claude...')
    try {
      const tailorRes = await fetch('/api/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription: jd, model }),
      })
      const reader = tailorRes.body?.getReader()
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
      setNodeStatus('tailor', 'done', `${full.length} chars`)
      addLog(`Resume tailored — ${full.split('\n').length} lines generated`)
    } catch {
      setNodeStatus('tailor', 'error')
      addLog('ERROR: Tailoring failed')
      setRunning(false)
      return
    }

    // Step 5: PDF export
    setNodeStatus('pdf', 'running')
    addLog('Preparing export...')
    await delay(500)
    setNodeStatus('pdf', 'done')
    addLog('Export ready — download available')

    setRunning(false)
  }

  function delay(ms: number) {
    return new Promise(res => setTimeout(res, ms))
  }

  function handleDownload() {
    const blob = new Blob([tailoredResume], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tenzin-kunga-tailored-resume.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  const anyDone = nodes.some(n => n.status === 'done')
  const allDone = nodes.every(n => n.status === 'done')

  return (
    <div className="h-full flex flex-col" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <div
        className="px-6 py-4 border-b flex-shrink-0 flex items-center justify-between"
        style={{ borderColor: '#1f1f1f', background: '#0f0f0f' }}
      >
        <div>
          <h1 className="text-base font-semibold text-white">Workflow</h1>
          <p className="text-xs mt-0.5" style={{ color: '#555' }}>
            Visual AI pipeline — form input → AI evaluator → ATS checker → resume tailor → PDF
          </p>
        </div>
        <ModelToggle model={model} onChange={setModel} />
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: input + controls */}
        <div
          className="w-72 flex-shrink-0 border-r flex flex-col"
          style={{ borderColor: '#1f1f1f' }}
        >
          <div className="flex-1 p-4 flex flex-col gap-3">
            <label className="text-xs font-medium" style={{ color: '#737373' }}>
              JOB DESCRIPTION
            </label>
            <textarea
              value={jd}
              onChange={e => setJd(e.target.value)}
              placeholder="Paste job description to trigger the workflow..."
              disabled={running}
              className="flex-1 resize-none rounded-lg p-3 text-xs outline-none border scrollbar-thin"
              style={{
                background: '#111',
                borderColor: '#222',
                color: '#d4d4d4',
                fontFamily: 'monospace',
                lineHeight: '1.6',
              }}
            />
            <button
              onClick={runWorkflow}
              disabled={!jd.trim() || running}
              className="py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: running ? '#1a2e1a' : '#22c55e',
                color: running ? '#22c55e' : '#000',
                cursor: !jd.trim() || running ? 'not-allowed' : 'pointer',
                opacity: !jd.trim() ? 0.4 : 1,
              }}
            >
              {running ? '◌ Running workflow...' : '▶ Run Workflow'}
            </button>
          </div>

          {/* Execution log */}
          {log.length > 0 && (
            <div
              className="border-t p-3 flex-shrink-0"
              style={{ borderColor: '#1a1a1a' }}
            >
              <p className="text-xs font-semibold mb-2" style={{ color: '#555' }}>EXECUTION LOG</p>
              <div className="space-y-1 max-h-36 overflow-auto scrollbar-thin">
                {log.map((entry, i) => (
                  <p key={i} className="text-xs font-mono" style={{ color: '#444', lineHeight: '1.5' }}>
                    {entry}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: workflow + output */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Node graph */}
          <div
            className="border-b flex-shrink-0 p-6"
            style={{ borderColor: '#1f1f1f', background: '#0c0c0c' }}
          >
            <p className="text-xs font-semibold mb-4" style={{ color: '#444' }}>WORKFLOW NODES</p>
            <div className="flex items-center">
              {nodes.map((node, i) => (
                <div key={node.id} className="flex items-center">
                  <NodeCard node={node} />
                  {i < nodes.length - 1 && (
                    <Arrow active={nodes[i].status === 'done'} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Output area */}
          <div className="flex-1 overflow-auto p-5 scrollbar-thin">
            {/* Empty state */}
            {!anyDone && !running && (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
                <div className="text-5xl opacity-10">◈</div>
                <p className="text-sm" style={{ color: '#444' }}>
                  Paste a job description and run the workflow to see it in action
                </p>
              </div>
            )}

            {/* Running state — show streaming resume */}
            {tailoredResume && (
              <div className="space-y-4">
                {/* ATS result banner */}
                {evaluation && (
                  <div
                    className="rounded-lg p-4 border flex flex-wrap gap-4"
                    style={{ background: '#0d1f12', borderColor: '#166534' }}
                  >
                    <div>
                      <p className="text-xs" style={{ color: '#555' }}>Score</p>
                      <p className="text-xl font-bold" style={{ color: '#22c55e' }}>
                        {(evaluation.score as number)?.toFixed(1)} / 5 — {evaluation.grade as string}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: '#555' }}>ATS Match</p>
                      <p className="text-xl font-bold" style={{ color: '#22c55e' }}>
                        {evaluation.atsScore as number}%
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs mb-1" style={{ color: '#555' }}>Matched keywords</p>
                      <div className="flex flex-wrap gap-1">
                        {(evaluation.matchedKeywords as string[] | undefined)?.map(kw => (
                          <span
                            key={kw}
                            className="text-xs px-1.5 py-0.5 rounded"
                            style={{ background: '#14532d', color: '#86efac' }}
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                    {allDone && (
                      <div className="flex items-end">
                        <button
                          onClick={handleDownload}
                          className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                          style={{ background: '#22c55e', color: '#000' }}
                        >
                          ↓ Download Resume
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Live resume */}
                <div
                  className="rounded-xl border p-6"
                  style={{ background: '#111', borderColor: '#1f1f1f' }}
                >
                  <p className="text-xs font-semibold mb-4" style={{ color: '#444' }}>
                    TAILORED RESUME {!allDone && <span className="text-green-500 ml-1">● streaming</span>}
                  </p>
                  <div className={`resume-preview ${running && nodes[3].status === 'running' ? 'streaming-cursor' : ''}`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {tailoredResume}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
