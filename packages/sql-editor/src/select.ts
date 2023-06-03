import { isArray, isNumber } from '@dlovely/utils'
import { createSql } from './virtual-sql'
import type { Sql, SqlWithParams } from './virtual-sql'
import { type Where, formatWhereOptions } from './where'

export namespace Select {
  export interface Options {
    database?: string
    table: string
    distinct?: boolean
    columns?: string[]
    where?: Sql | Where.Options
    order_by?: Record<string, OrderByType>
    range?: Range
  }

  export type OrderByType = boolean | 'desc' | 'asc'
  export type Range =
    | number
    | [number, number]
    | { limit: number; offset: number }

  export type JoinColumn = Record<string, string[]>
  export interface JoinOptions extends Omit<Options, 'columns'> {
    columns?: JoinColumn
  }
}

export const formatSelect = (options: Select.Options): SqlWithParams => {
  const { database, table, columns, distinct, order_by, where, range } = options
  const distinct_sql = formatDistinct(columns?.length ? distinct : undefined)
  const columns_sql = formatColums(columns)
  const { sql: where_sql, params: where_params } = formatWhereOptions(where)
  const order_by_sql = formatOrderBy(order_by)
  const { sql: range_sql, params: range_params } = formatRange(range)
  const _table = database ? `${database}.${table}` : table
  return createSql(
    `SELECT${distinct_sql}${columns_sql} FROM ${_table}${where_sql}${order_by_sql}${range_sql}`,
    ...where_params,
    ...range_params
  )
}

export const formatJoinSelect = (
  options: Select.JoinOptions
): SqlWithParams => {
  const { columns: _columns, ..._options } = options
  const columns = formatJoinColumns(_columns)
  return formatSelect({ ..._options, columns })
}

function formatColums(columns?: Select.Options['columns']): string {
  if (!columns || !columns.length) return ' *'
  return ` ${columns.join()}`
}

function formatJoinColumns(
  columns?: Select.JoinOptions['columns']
): Select.Options['columns'] {
  if (!columns) return
  const _columns: Select.Options['columns'] = []
  for (const [table, cols] of Object.entries(columns)) {
    for (const col of cols) {
      _columns.push(`${table}.${col}`)
    }
  }
  return _columns
}

function formatDistinct(distinct?: Select.Options['distinct']): string {
  return distinct ? ' DISTINCT' : ''
}

function formatOrderBy(order_by?: Select.Options['order_by']): string {
  if (!order_by) return ''
  const _order_by = Object.entries(order_by)
  if (!_order_by.length) return ''
  return ` ORDER BY ${_order_by
    .map(([key, desc]) => `${key} ${formatOrderByType(desc).toUpperCase()}`)
    .join()}`
}

function formatOrderByType(type: Select.OrderByType) {
  if (typeof type === 'string') return type
  return type ? 'desc' : 'asc'
}

function formatRange(range?: Select.Range): SqlWithParams {
  if (!range) return createSql()
  if (isNumber(range)) return createSql(` LIMIT ?`, range)
  if (isArray(range)) return { sql: ` LIMIT ? OFFSET ?`, params: range }
  const { limit, offset } = range
  return createSql(` LIMIT ? OFFSET ?`, limit, offset)
}
