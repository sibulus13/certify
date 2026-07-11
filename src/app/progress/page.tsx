import type { Metadata } from 'next'
import { ProgressView } from '@/components/ProgressView'

export const metadata: Metadata = {
  title: 'Your Progress',
  description: 'Track your AWS Cloud Practitioner practice-exam scores over time and see what to study next.',
  robots: { index: false, follow: false }, // personal, device-local data
}

export default function ProgressPage() {
  return <ProgressView />
}
