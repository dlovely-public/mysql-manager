/* istanbul ignore file -- @preserve */
import { join } from 'node:path'
import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'

export const root = process.cwd()

export const require = createRequire(root)

export const runtime_dir_path = join(root, '.mysql')
if (existsSync(runtime_dir_path))
  rmSync(runtime_dir_path, { recursive: true, force: true })

export const types_dir_path = join(runtime_dir_path, 'types')
mkdirSync(types_dir_path, { recursive: true })
export const global_type_path = join(runtime_dir_path, 'global.d.ts')
