const host = process.env.MYSQL_HOST || 'localhost'
const port = Number(process.env.MYSQL_PORT || '3306')

export const default_config = { host, port }
export default { host, port }

import type { ConnectionOptions } from 'mysql2/typings/mysql/lib/Connection'
import type { PoolOptions } from 'mysql2/typings/mysql/lib/Pool'
export function mergeConfig<Config extends ConnectionOptions | PoolOptions>(
  config?: Config
): Config {
  if (!config) return default_config as Config
  return {
    ...default_config,
    ...config,
  }
}

export type { ConnectionOptions, PoolOptions }
