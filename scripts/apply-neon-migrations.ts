import { readFileSync, readdirSync } from 'node:fs'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { neon } from '@neondatabase/serverless'

const migrationsDir = join(process.cwd(), 'db', 'migrations')

function loadEnvLocal() {
  const envPath = join(process.cwd(), '.env.local')
  if (!existsSync(envPath)) return

  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex === -1) continue

    const key = trimmed.slice(0, separatorIndex)
    const rawValue = trimmed.slice(separatorIndex + 1)
    const value = rawValue.replace(/^['"]|['"]$/g, '')
    process.env[key] ??= value
  }
}

loadEnvLocal()

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not configured')
}

function splitSqlStatements(sql: string): string[] {
  const statements: string[] = []
  let current = ''
  let inDollarQuote = false

  for (let index = 0; index < sql.length; index += 1) {
    const nextTwo = sql.slice(index, index + 2)

    if (nextTwo === '$$') {
      inDollarQuote = !inDollarQuote
      current += nextTwo
      index += 1
      continue
    }

    if (sql[index] === ';' && !inDollarQuote) {
      const statement = current.trim()
      if (statement) statements.push(statement)
      current = ''
      continue
    }

    current += sql[index]
  }

  const tail = current.trim()
  if (tail) statements.push(tail)
  return statements
}

async function main() {
  const sql = neon(databaseUrl!)
  const files = readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort()

  for (const file of files) {
    const migration = readFileSync(join(migrationsDir, file), 'utf8')
    for (const statement of splitSqlStatements(migration)) {
      await sql.query(statement)
    }
    console.log(`applied ${file}`)
  }
}

main()
