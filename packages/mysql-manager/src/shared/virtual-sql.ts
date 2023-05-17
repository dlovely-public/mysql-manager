import { isObject } from '../utils'

export interface SqlWithParams {
  sql: string
  params: any[]
}
export type Sql = SqlWithParams | SqlWithParams['sql']

export function isSql(sql: unknown): sql is Sql {
  if (typeof sql === 'string') return true
  return isObject(sql) && 'sql' in sql && 'params' in sql
}

export function formatSql(options: unknown): SqlWithParams {
  if (typeof options === 'string') return { sql: options, params: [] }
  const { sql = '', params = [] } = (options ?? {}) as SqlWithParams
  return { sql, params: sql ? params : [] }
}

export function createSql(sql = '', ...params: any[]): SqlWithParams {
  return { sql, params }
}
