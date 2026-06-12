import type { MetadataRoute } from 'next'
import { getAllExams } from '@/lib/questions'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://certify.app'
  const exams = getAllExams()

  const examUrls: MetadataRoute.Sitemap = exams.map((exam) => ({
    url: `${base}/exam/${exam.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: exam.isFree ? 0.9 : 0.7,
  }))

  return [
    { url: base, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    ...examUrls,
  ]
}
