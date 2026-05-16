import fs from 'fs'
import path from 'path'

export function getCV(): string {
  const cvPath = path.join(process.cwd(), '..', 'career-ops', 'cv.md')
  return fs.readFileSync(cvPath, 'utf-8')
}
