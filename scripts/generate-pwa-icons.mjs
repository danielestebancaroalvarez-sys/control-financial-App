import sharp from 'sharp'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const svg = readFileSync(join(root, 'public', 'icon.svg'))

const sizes = [192, 512]

for (const size of sizes) {
  const out = join(root, 'public', `icon-${size}.png`)
  await sharp(svg).resize(size, size).png().toFile(out)
  console.log(`Wrote ${out}`)
}
