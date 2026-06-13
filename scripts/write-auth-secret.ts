import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'

const targetPath = '.env.upload.local'
const secretKey = 'AUTH_SECRET='
const nextSecret = randomBytes(32).toString('base64url')
const lines = existsSync(targetPath)
  ? readFileSync(targetPath, 'utf8').split(/\r?\n/)
  : []

let wroteSecret = false
const updated = lines.map((line) => {
  if (!line.startsWith(secretKey)) return line
  wroteSecret = true
  return `${secretKey}${nextSecret}`
})

if (!wroteSecret) {
  updated.push(`${secretKey}${nextSecret}`)
}

writeFileSync(targetPath, `${updated.join('\n').replace(/\n*$/, '')}\n`)
console.log(`Wrote ${secretKey.slice(0, -1)} to ${targetPath}`)
