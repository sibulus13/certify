import { describe, it, expect } from 'vitest'
import { detectTopics, AWS_TOPICS } from './aws-topics'

describe('detectTopics', () => {
  it('detects EC2 from "Elastic Compute Cloud"', () => {
    const topics = detectTopics('A question about Elastic Compute Cloud spot instances')
    expect(topics.some((t) => t.name === 'EC2')).toBe(true)
  })

  it('detects S3 from bucket reference', () => {
    const topics = detectTopics('Which S3 storage class is cheapest?')
    expect(topics.some((t) => t.name === 'S3')).toBe(true)
  })

  it('detects IAM from policy reference', () => {
    const topics = detectTopics('An IAM role with least privilege permissions')
    expect(topics.some((t) => t.name === 'IAM')).toBe(true)
  })

  it('detects Lambda from serverless reference', () => {
    const topics = detectTopics('A serverless function triggered by an event')
    expect(topics.some((t) => t.name === 'Lambda')).toBe(true)
  })

  it('detects Shared Responsibility Model', () => {
    const topics = detectTopics('The shared responsibility model for security of the cloud')
    expect(topics.some((t) => t.name === 'Shared Responsibility Model')).toBe(true)
  })

  it('detects Global Infrastructure from availability zone reference', () => {
    const topics = detectTopics('Deploy across multiple availability zones in a region')
    expect(topics.some((t) => t.name === 'Global Infrastructure')).toBe(true)
  })

  it('returns empty array for unrecognized text', () => {
    const topics = detectTopics('Random text with no AWS keywords here xyz123')
    expect(topics).toHaveLength(0)
  })

  it('detects multiple topics from combined text', () => {
    const text = 'EC2 instance behind an Elastic Load Balancer in a VPC with IAM role'
    const topics = detectTopics(text)
    const names = topics.map((t) => t.name)
    expect(names).toContain('EC2')
    expect(names).toContain('Elastic Load Balancing')
    expect(names).toContain('VPC')
    expect(names).toContain('IAM')
  })

  it('all topics have valid https docsUrl', () => {
    for (const topic of AWS_TOPICS) {
      expect(topic.docsUrl).toMatch(/^https:\/\//)
    }
  })

  it('all topics have non-empty name', () => {
    for (const topic of AWS_TOPICS) {
      expect(topic.name.length).toBeGreaterThan(0)
    }
  })
})
