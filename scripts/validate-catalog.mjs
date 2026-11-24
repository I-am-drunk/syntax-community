import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const CATALOG_PATH = path.join(ROOT, 'catalog', 'catalog.json')
const PACKAGES_DIR = path.join(ROOT, 'packages')

const EXT_BY_KIND = {
  course: '.syntaxcourse',
  plugin: '.syntaxplugin',
  'embedded-plugin': '.syntaxembeddedplugin',
}

const ID_RE = /^[a-z0-9][a-z0-9-]{1,62}$/
const SEMVER_RE = /^\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?$/i
const FORBIDDEN_SANDBOX_PATTERNS = [
  /fetch\s*\(/i,
  /XMLHttpRequest/i,
  /document\.cookie/i,
  /window\.top/i,
  /<script[^>]+src=/i,
  /eval\s*\(/i,
]

const errors = []

function fail(msg) {
  errors.push(msg)
}

if (!fs.existsSync(CATALOG_PATH)) {
  console.error('ERROR: catalog/catalog.json does not exist.')
  process.exit(1)
}

const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'))
if (catalog.schemaVersion !== 1 || !Array.isArray(catalog.packages)) {
  fail('catalog.json must have schemaVersion 1 and a packages array.')
}

const seenIds = new Set()
for (const pkg of catalog.packages ?? []) {
  const label = pkg?.id || '(unknown)'
  if (typeof pkg.id !== 'string' || !ID_RE.test(pkg.id)) {
    fail(`[${label}] invalid id format`)
  } else if (seenIds.has(pkg.id)) {
    fail(`[${label}] duplicate package id`)
  } else {
    seenIds.add(pkg.id)
  }

  if (pkg.schemaVersion !== 1) fail(`[${label}] schemaVersion must be 1`)
  const expectedExt = EXT_BY_KIND[pkg.kind]
  if (!expectedExt) {
    fail(`[${label}] invalid kind "${pkg.kind}"`)
  } else if (pkg.extension !== expectedExt) {
    fail(`[${label}] extension must be "${expectedExt}" for kind "${pkg.kind}"`)
  }

  if (typeof pkg.name !== 'string' || pkg.name.trim().length < 2) fail(`[${label}] missing name`)
  if (typeof pkg.tagline !== 'string' || pkg.tagline.trim().length < 4) fail(`[${label}] missing tagline`)
  if (typeof pkg.description !== 'string' || pkg.description.trim().length < 8) fail(`[${label}] missing description`)
  if (typeof pkg.version !== 'string' || !SEMVER_RE.test(pkg.version)) fail(`[${label}] invalid SemVer version`)
  if (typeof pkg.iconSvg !== 'string' || !pkg.iconSvg.trim().startsWith('<svg') || !pkg.iconSvg.includes('</svg>')) {
    fail(`[${label}] every package must include a valid inline SVG icon`)
  }
  if (!pkg.author || typeof pkg.author.handle !== 'string' || typeof pkg.author.displayName !== 'string') {
    fail(`[${label}] missing author.handle or author.displayName`)
  }
  if (typeof pkg.touchesCore !== 'boolean') {
    fail(`[${label}] touchesCore must be boolean`)
  } else if (pkg.touchesCore && (typeof pkg.coreTouchReason !== 'string' || pkg.coreTouchReason.trim().length < 8)) {
    fail(`[${label}] touchesCore plugins must provide a plain-English coreTouchReason`)
  }
  if (pkg.kind === 'embedded-plugin') {
    if (!pkg.aiUsage || typeof pkg.aiUsage.summary !== 'string' || !Array.isArray(pkg.aiUsage.blocks) || pkg.aiUsage.blocks.length === 0 || typeof pkg.aiUsage.example !== 'string') {
      fail(`[${label}] embedded plugins (.syntaxembeddedplugin) must include a complete aiUsage card`)
    }
  }
  if (!pkg.safety || typeof pkg.safety.sandboxed !== 'boolean') {
    fail(`[${label}] missing safety scorecard`)
  }
  if (typeof pkg.sandboxHtml === 'string') {
    for (const pattern of FORBIDDEN_SANDBOX_PATTERNS) {
      if (pattern.test(pkg.sandboxHtml)) {
        fail(`[${label}] sandboxHtml matched forbidden security pattern ${pattern}`)
      }
    }
  }

  const pkgFile = path.join(PACKAGES_DIR, `${pkg.id}${pkg.extension}`)
  if (!fs.existsSync(pkgFile)) {
    fail(`[${label}] missing package file packages/${pkg.id}${pkg.extension}`)
  } else {
    const raw = fs.readFileSync(pkgFile, 'utf8')
    const hash = crypto.createHash('sha256').update(raw).digest('hex')
    if (catalog.checksums?.[pkg.id] !== hash) {
      fail(`[${label}] SHA-256 mismatch between catalog.json checksums and packages/${pkg.id}${pkg.extension}`)
    }
    const parsedFile = JSON.parse(raw)
    if (parsedFile.id !== pkg.id || parsedFile.version !== pkg.version) {
      fail(`[${label}] package file metadata does not match catalog.json entry`)
    }
  }
}

for (const pkg of catalog.packages ?? []) {
  for (const dep of pkg.requires ?? []) {
    if (!seenIds.has(dep.id)) {
      fail(`[${pkg.id}] required dependency "${dep.id}" does not exist in catalog.json`)
    }
  }
}

if (errors.length > 0) {
  console.error('Catalog validation failed:')
  for (const err of errors) console.error(' -', err)
  process.exit(1)
}

console.log(`Validated ${catalog.packages.length} Syntax packages and checksums cleanly.`)
