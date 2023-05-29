import type { Sql, SqlWithParams } from './virtual-sql'
import { type Where, formatWhereOptions } from './where'

export namespace Delete {
  export interface Options {
    database?: string
    table: string
    where: Sql | Where.Options
  }
}

export const formatDelete = (options: Delete.Options): SqlWithParams => {
  const { database, table, where } = options
  const { sql, params } = formatWhereOptions(where)
  const _table = database ? `${database}.${table}` : table
  return {
    sql: `DELETE FROM ${_table}${sql}`,
    params,
  }
}
