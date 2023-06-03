/* istanbul ignore file -- @preserve */
import type { ConnectionOptions } from 'mysql2/typings/mysql/lib/Connection'
import type { PoolOptions } from 'mysql2/typings/mysql/lib/Pool'

export const defineMysqlConfig = (config: Partial<MysqlOptions>) => config

export interface MysqlOptions {
  /** mysql连接类型 */
  type: 'pool' | 'connection'
  /** mysql连接参数 */
  config: ConnectionOptions | PoolOptions
  /** 数据库默认选项 */
  database?: DBOptions
  /** json键的具体类型配置 */
  json_key?: Record<string, Record<string, Record<string, KeyType>>>
}
export interface DBOptions {
  /** 存储引擎 */
  engine?: string
  /** 字符类型 */
  charset?: string
  /** 字符编码 */
  collate?: string
}
export interface KeyType {
  /** json是否为数组 */
  is_array?: boolean
  /** 指定键值对 */
  records?: Record<string, string | KeyType>
  /** string泛值 */
  string?: string | KeyType
  /** number泛值 */
  number?: string | KeyType
}

import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { root, require } from './paths'

const ext_map = [
  ['.json', readJsonConfig],
  ['.js', readJsConfig],
  ['.ts', readJsConfig],
  ['.cjs', readJsConfig],
  ['.mjs', readJsConfig],
  ['.cts', readJsConfig],
  ['.mts', readJsConfig],
] as const

const default_config: MysqlOptions['config'] = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'localhost',
  password: process.env.MYSQL_AUTH,
}

export const genConfig = (): MysqlOptions => {
  let options: Partial<MysqlOptions> | null = null
  for (const [ext, fn] of ext_map) {
    const config_path = join(root, `mysql.config${ext}`)
    if (existsSync(config_path)) {
      options = fn(config_path)
      break
    }
  }
  if (!options) return { type: 'pool', config: default_config }
  return {
    ...options,
    type: options.type || 'pool',
    config: { ...default_config, ...options.config },
  }
}

function readJsonConfig(path: string) {
  return require(path)
}

function readJsConfig(path: string) {
  const module = require(path)
  if (module.default) {
    if ('config' in module.default) return module.default
    module.config = module.default
    delete module.default
  }
  return module
}
