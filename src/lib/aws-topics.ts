export type AwsTopic = {
  name: string
  docsUrl: string
  keywords: RegExp
}

// Map of AWS services/concepts to official documentation pages.
// Used to generate reference links on exam pages.
export const AWS_TOPICS: AwsTopic[] = [
  {
    name: 'EC2',
    docsUrl: 'https://docs.aws.amazon.com/ec2/latest/userguide/',
    keywords: /\bEC2\b|Elastic Compute|spot instance|on-demand|reserved instance|dedicated host/i,
  },
  {
    name: 'S3',
    docsUrl: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/',
    keywords: /\bS3\b|Simple Storage Service|bucket|object storage|static website hosting/i,
  },
  {
    name: 'IAM',
    docsUrl: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/',
    keywords: /\bIAM\b|Identity and Access|least privilege|role|policy|permission/i,
  },
  {
    name: 'VPC',
    docsUrl: 'https://docs.aws.amazon.com/vpc/latest/userguide/',
    keywords: /\bVPC\b|Virtual Private Cloud|subnet|security group|NACL|network access/i,
  },
  {
    name: 'RDS',
    docsUrl: 'https://docs.aws.amazon.com/rds/latest/userguide/',
    keywords: /\bRDS\b|Relational Database|Aurora|MySQL|PostgreSQL|Oracle|SQL Server/i,
  },
  {
    name: 'Lambda',
    docsUrl: 'https://docs.aws.amazon.com/lambda/latest/dg/',
    keywords: /\bLambda\b|serverless|function as a service|FaaS/i,
  },
  {
    name: 'CloudWatch',
    docsUrl: 'https://docs.aws.amazon.com/cloudwatch/latest/monitoring/',
    keywords: /CloudWatch|monitoring|metrics|alarms|logs/i,
  },
  {
    name: 'CloudTrail',
    docsUrl: 'https://docs.aws.amazon.com/awscloudtrail/latest/userguide/',
    keywords: /CloudTrail|audit log|API activity|governance/i,
  },
  {
    name: 'CloudFront',
    docsUrl: 'https://docs.aws.amazon.com/cloudfront/latest/developerguide/',
    keywords: /CloudFront|CDN|content delivery|edge location/i,
  },
  {
    name: 'Route 53',
    docsUrl: 'https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/',
    keywords: /Route 53|DNS|domain name|routing policy/i,
  },
  {
    name: 'DynamoDB',
    docsUrl: 'https://docs.aws.amazon.com/dynamodb/latest/developerguide/',
    keywords: /DynamoDB|NoSQL|key-value|document database/i,
  },
  {
    name: 'Elastic Load Balancing',
    docsUrl: 'https://docs.aws.amazon.com/elasticloadbalancing/latest/userguide/',
    keywords: /Elastic Load Balanc|ELB|Application Load Balancer|Network Load Balancer/i,
  },
  {
    name: 'Auto Scaling',
    docsUrl: 'https://docs.aws.amazon.com/autoscaling/ec2/userguide/',
    keywords: /Auto Scaling|horizontal scaling|scale out|scale in/i,
  },
  {
    name: 'Shared Responsibility Model',
    docsUrl: 'https://aws.amazon.com/compliance/shared-responsibility-model/',
    keywords: /shared responsibility|security of the cloud|security in the cloud/i,
  },
  {
    name: 'Well-Architected Framework',
    docsUrl: 'https://aws.amazon.com/architecture/well-architected/',
    keywords: /well-architected|operational excellence|reliability pillar|performance efficiency|cost optimization|sustainability/i,
  },
  {
    name: 'AWS Pricing & Billing',
    docsUrl: 'https://aws.amazon.com/pricing/',
    keywords: /pricing|billing|cost|pay-as-you-go|total cost of ownership|TCO/i,
  },
  {
    name: 'Support Plans',
    docsUrl: 'https://aws.amazon.com/premiumsupport/plans/',
    keywords: /support plan|Basic|Developer|Business|Enterprise|Trusted Advisor/i,
  },
  {
    name: 'Global Infrastructure',
    docsUrl: 'https://aws.amazon.com/about-aws/global-infrastructure/',
    keywords: /availability zone|region|edge location|local zone|global infrastructure/i,
  },
  {
    name: 'Security & Compliance',
    docsUrl: 'https://docs.aws.amazon.com/security/',
    keywords: /KMS|encryption|Shield|WAF|Inspector|GuardDuty|Security Hub|compliance/i,
  },
  {
    name: 'Storage Services',
    docsUrl: 'https://aws.amazon.com/products/storage/',
    keywords: /Glacier|EFS|EBS|Storage Gateway|FSx|Snowball|DataSync/i,
  },
]

// Returns topics detected in the combined text of an exam's questions.
export function detectTopics(text: string): AwsTopic[] {
  return AWS_TOPICS.filter((t) => t.keywords.test(text))
}
