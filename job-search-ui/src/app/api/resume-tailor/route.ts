import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

function buildPrompt(resumeText: string, jobDescription: string): string {
  return `I'm applying for the following position.

JOB DESCRIPTION:
${jobDescription}

---

MY RESUME:
${resumeText}

---

Please turn this into a one-page, ATS-friendly resume that gives me the best chance of getting interviews. Follow these rules strictly:

1. Don't make up any experience — only use what's in my resume.
2. Rewrite and improve the wording so it's clearer, more results-focused, and uses the right keywords from the job description.
3. Remove anything weak, generic, or redundant.
4. Prioritize keywords the ATS will scan for — pull them directly from the job description.
5. Keep it to exactly one page — cut bullets if needed, never add a second page.
6. Lead with the strongest, most relevant experience for this specific role.
7. The summary must be targeted to this company and role — not generic.
8. Remove soft skills from the skills section — only hard technical skills.

Output in EXACTLY this format using these exact section headers (no other text before or after):

## IMPROVEMENTS
[A short numbered list of the main improvements you made and why]

## RESUME
[Full tailored resume in clean Markdown. Start with the candidate's name as an H1. Use ## for section headers, ### for job titles, and - for bullets.]

## LATEX
[The same resume as LaTeX code that compiles in Overleaf. Use \\documentclass[10pt,letterpaper]{article} with \\usepackage{geometry} (margin=0.55in), \\usepackage{enumitem}, \\usepackage{parskip}, and \\usepackage[hidelinks]{hyperref}. Professional single-column layout. No external fonts or complex packages — must compile on Overleaf with zero changes.]`
}

export async function POST(req: Request) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const { resumeText, jobDescription } = await req.json()
  const prompt = buildPrompt(resumeText, jobDescription)
  const encoder = new TextEncoder()

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
