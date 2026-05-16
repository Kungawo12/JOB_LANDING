import fs from 'fs'
import path from 'path'

export interface Application {
  num: string
  date: string
  company: string
  role: string
  score: string
  status: string
  hasPDF: boolean
  report: string
  notes: string
}

export function getApplications(): Application[] {
  const trackerPath = path.join(process.cwd(), '..', 'career-ops', 'data', 'applications.md')
  const content = fs.readFileSync(trackerPath, 'utf-8')
  const lines = content.split('\n').filter(l => l.startsWith('|') && !l.startsWith('| #') && !l.startsWith('|---'))

  return lines.map(line => {
    const cols = line.split('|').map(c => c.trim()).filter(Boolean)
    return {
      num: cols[0] ?? '',
      date: cols[1] ?? '',
      company: cols[2] ?? '',
      role: cols[3] ?? '',
      score: cols[4] ?? '',
      status: cols[5] ?? '',
      hasPDF: cols[6] === '✅',
      report: cols[7] ?? '',
      notes: cols[8] ?? '',
    }
  })
}
