import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const includeExtensions = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.json',
  '.md',
  '.sql',
  '.css',
  '.mjs',
  '.cjs',
])

const ignoreDirs = new Set([
  '.git',
  '.expo',
  'node_modules',
])

const suspiciousTokens = [
  String.fromCodePoint(0xc3),
  String.fromCodePoint(0xc6),
  String.fromCodePoint(0xc4),
  String.fromCodePoint(0xc2, 0xb7),
  String.fromCodePoint(0xe2, 0x2020, 0x2019),
  String.fromCodePoint(0xe1, 0xbb),
  String.fromCodePoint(0xef, 0xbf, 0xbd),
  String.fromCodePoint(0xfffd),
]

const issues = []

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoreDirs.has(entry.name)) continue

    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      walk(fullPath)
      continue
    }

    if (!includeExtensions.has(path.extname(entry.name))) continue

    const buffer = fs.readFileSync(fullPath)
    const text = buffer.toString('utf8')

    if (text.charCodeAt(0) === 0xfeff) {
      issues.push(`${path.relative(root, fullPath)}: UTF-8 BOM`)
    }

    for (const token of suspiciousTokens) {
      if (text.includes(token)) {
        issues.push(`${path.relative(root, fullPath)}: suspicious token "${token}"`)
        break
      }
    }
  }
}

walk(root)

if (issues.length > 0) {
  console.error('Encoding check failed:\n')
  for (const issue of issues) console.error(`- ${issue}`)
  process.exit(1)
}

console.log('Encoding check passed.')
