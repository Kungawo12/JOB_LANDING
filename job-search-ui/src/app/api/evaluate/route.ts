import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { getCV } from '@/lib/cv'

export const dynamic = 'force-dynamic'

function buildPrompt(jobDescription: string, cv: string): string {
  return `You are an expert job search advisor and ATS specialist.

Analyze this job description against this candidate's resume. Return a JSON object with this exact structure:

{
  "score": 4.2,
  "grade": "B+",
  "atsScore": 78,
  "matchedKeywords": ["React", "Next.js", "REST API", "MySQL", "JavaScript"],
  "missingKeywords": ["Docker", "AWS", "TypeScript", "GraphQL"],
  "roleTitle": "Full Stack Software Engineer",
  "company": "Acme Corp",
  "highlights": [
    "Strong React/Next.js match — candidate has production deployments",
    "Healthcare background differentiates for this health-tech role"
  ],
  "gaps": [
    "No Docker/container experience listed",
    "Requires 2+ years professional experience — candidate has ~1 year"
  ],
  "recommendation": "Apply — strong fit with React stack. Highlight Headstarter AI projects in cover letter.",
  "level": "Junior/Mid",
  "remote": true,
  "salaryRange": "$70K-90K"
}

Rules:
- score is 1.0-5.0
- grade is A/B/C/D/F with optional +/-
- atsScore is 0-100 (keyword match percentage)
- matchedKeywords: keywords from JD present in the resume (max 10)
- missingKeywords: important JD keywords NOT in resume (max 8)
- highlights: 2-4 concrete strengths for this specific role
- gaps: 2-4 concrete gaps or concerns
- recommendation: one clear sentence — apply or skip and why

JOB DESCRIPTION:
${jobDescription}

CANDIDATE RESUME:
${cv}

Return ONLY valid JSON, no explanation.`
}

export async function POST(req: Request) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const { jobDescription, model = 'claude' } = await req.json()
  const cv = getCV()
  const prompt = buildPrompt(jobDescription, cv)

  let text = ''

  if (model === 'gpt4') {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 1024,
    })
    text = res.choices[0].message.content ?? '{}'
  } else {
    const res = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })
    text = res.content[0].type === 'text' ? res.content[0].text : '{}'
  }

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  const data = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
  return Response.json({ ...data, usedModel: model === 'gpt4' ? 'GPT-4o' : 'Claude claude-sonnet-4-6' })
}
