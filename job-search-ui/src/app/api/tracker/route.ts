import { getApplications } from '@/lib/tracker'

export async function GET() {
  const apps = getApplications()
  return Response.json(apps)
}
