import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { getCV } from '@/lib/cv'

export const dynamic = 'force-dynamic'

function buildPrompt(jobDescription: string, cv: string): string {
  return `You are an expert resume writer and ATS optimization specialist.

Tailor this resume to match the job description below. Rules:
- Keep ALL information truthful — only rephrase, reorder, or emphasize existing content
- Naturally incorporate ATS keywords from the job description
- Lead with the most relevant experience and skills for this specific role
- Adjust the summary to speak directly to this role's needs
- Reorder skills to put the most relevant ones first
- Output the FULL tailored resume in clean markdown
- Do NOT add fake experience or fake metrics

JOB DESCRIPTION:
${jobDescription}

ORIGINAL RESUME:
${cv}

Output only the tailored resume in markdown format. Start with the candidate's name.`
}

export async function POST(req: Request) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const { jobDescription, model = 'claude' } = await req.json()
  const cv = getCV()
  const prompt = buildPrompt(jobDescription, cv)
  const encoder = new TextEncoder()

  if (model === 'gpt4') {
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4096,
      stream: true,
    })

    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? ''
          if (text) controller.enqueue(encoder.encode(text))
        }
        controller.close()
      },
    })

    return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  }

  // Default: Claude
  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
