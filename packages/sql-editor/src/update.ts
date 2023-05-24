import { hasOwn } from '@dlovely/utils'
import { createSql } from './virtual-sql'
import type { Sql, SqlWithParams } from './virtual-sql'
import { type Where, formatWhereOptions } from './where'

export namespace Update {
  export interface Options {
    table: string
    data: Record<string, unknown>
    where?: Sql | Where.Options
    json_key?: Map<string, string>
  }
}

export const formatUpdate = (options: Update.Options): SqlWithParams => {
  const { table, data, where, json_key } = options
  const keys = [] as string[],
    vals = [] as unknown[]
  for (const key in data) {
    /* istanbul ignore else -- @preserve */
    if (hasOwn(data, key)) {
      const defa = json_key && json_key.get(key)
      const val = data[key] ?? defa
      keys.push(key)
      vals.push(val)
    }
  }
  json_key?.forEach((defa, key) => {
    if (keys.includes(key)) return
    keys.push(key)
    vals.push(defa)
  })
  const { sql, params } = formatWhereOptions(where)
  return createSql(
    `UPDATE ${table} SET ${keys.map(key => `${key}=?`).join()}${sql}`,
    ...vals,
    ...params
  )
}
