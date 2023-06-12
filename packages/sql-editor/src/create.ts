import { fill } from '@dlovely/utils'
import {
  createSql,
  formatSql,
  type Sql,
  type SqlWithParams,
} from './virtual-sql'

export namespace Create {
  export interface Options extends DataBase {
    database: string
    name: string
    engine?: string
    columns: Column[]
    comment?: string
  }

  export interface DataBase {
    name: string
    if_not_exists?: boolean
    charset?: string
    collate?: string
  }
}

export const formatCreateTable = (options: Create.Options): SqlWithParams => {
  const {
    database,
    name,
    if_not_exists,
    engine,
    charset,
    collate,
    columns,
    comment,
  } = options
  const { sql: columns_sql, params: columns_params } = formatColumns(columns)
  let sql = `-- ?.? definition\nCREATE TABLE${
    if_not_exists ? ' IF NOT EXISTS' : ''
  } ? (\n${columns_sql}\n)`
  const params = [database, name, name, ...columns_params]
  if (engine) {
    sql += ' ENGINE=?'
    params.push(engine)
  }
  if (charset) {
    sql += ' CHARSET=?'
    params.push(charset)
  }
  if (collate) {
    sql += ' COLLATE=?'
    params.push(collate)
  }
  if (comment) {
    sql += ' COMMENT=?'
    params.push(comment)
  }
  return { sql, params }
}

function formatColumns(columns: Create.Column[]): SqlWithParams {
  if (!columns.length) throw new Error('columns is required')
  const sql: string[] = []
  const params: any[] = []
  let has_primary_key = false
  const keys: SqlWithParams[] = []
  for (const column of columns) {
    const { sql: _sql, params: _params } = formatColumn(column)
    sql.push(_sql)
    params.push(..._params.filter(p => p !== undefined))
    if (column.primary_key && !has_primary_key) {
      keys.unshift(createSql(`PRIMARY KEY (?)`, column.name))
      has_primary_key = true
    }
    if (column.unique) {
      if (typeof column.unique === 'string') {
        keys.push(createSql(`UNIQUE KEY ? (?)`, column.unique, column.name))
      } else {
        keys.push(createSql(`UNIQUE KEY (?)`, column.name))
      }
    }
    if (column.check) {
      let sql = `CHECK (?)`
      if (typeof column.check === 'string') {
        keys.push({ sql, params: [column.check] })
      } else {
        const { rule, name } = column.check
        const params = [rule]
        if (name) {
          sql = `CONSTRAINT ? ` + sql
          params.unshift(name)
        }
        keys.push({ sql, params })
      }
    }
    if (column.foreign_key) {
      const { name, table, table_key, on_update, on_delete } =
        column.foreign_key
      const _on_update = on_update
        ? ` ON UPDATE ${on_update.toUpperCase()}`
        : ''
      const _on_delete = on_delete
        ? ` ON DELETE ${on_delete.toUpperCase()}`
        : ''
      keys.push(createSql(`KEY ? (?)`, name, column.name))
      keys.push(
        createSql(
          `CONSTRAINT ? FOREIGN KEY (?) REFERENCES ? (?)${_on_update}${_on_delete}`,
          name,
          column.name,
          table,
          table_key
        )
      )
    }
  }
  for (const { sql: _sql, params: _params } of keys) {
    sql.push(_sql)
    params.push(..._params)
  }
  return { sql: `  ${sql.join(',\n  ')}`, params }
}

function formatColumn(column: Create.Column): SqlWithParams {
  const { sql: type_sql, params: type_params } = formatSql(
    formatColumnType(column)
  )
  const {
    name,
    default: _default,
    not_null,
    comment,
    charset,
    collate,
  } = column
  let sql = `? ${type_sql}`
  const params = [name, ...type_params]
  if (not_null) {
    sql += ' NOT NULL'
  }
  if ('auto_increment' in column && column.auto_increment) {
    sql += ' AUTO_INCREMENT'
  }
  const { sql: default_sql, params: default_params } = formatSql(
    formatDefault(_default)
  )
  if (default_sql) {
    sql += default_sql
    params.push(...default_params)
  }
  if (comment) {
    sql += ' COMMENT ?'
    params.push(comment)
  }
  if (charset) {
    sql += ' CHARACTER SET ?'
    params.push(charset)
  }
  if (collate) {
    sql += ' COLLATE ?'
    params.push(collate)
  }
  return { sql, params }
}

function formatColumnType(column: Create.Column): Sql {
  const { type } = column
  switch (type) {
    case 'char':
    case 'varchar':
      if (!column.length) throw new Error('length is required')
      return `${type}(${column.length})`
    case 'json':
      delete column.default
      return `json`
    case 'enum':
    case 'set':
      if (!column.values?.length) throw new Error('values is required')
      return createSql(
        `${type}(${fill(column.values.length)})`,
        ...column.values
      )
    default:
      return type
  }
}

function formatDefault(_default: Create.Column['default']): Sql {
  if (_default === undefined || _default === null) return ''
  if (typeof _default === 'string' || typeof _default === 'number') {
    return createSql(` DEFAULT ?`, _default)
  }
  const on_update = _default.on_update ? ` ON UPDATE CURRENT_TIMESTAMP` : ''
  return ` DEFAULT CURRENT_TIMESTAMP${on_update}`
}

export const formatCreateDatabase = (
  options: Create.DataBase
): SqlWithParams => {
  const { name, if_not_exists, charset, collate } = options
  let sql = `CREATE DATABASE`
  const params: any[] = []
  if (if_not_exists) {
    sql += ' IF NOT EXISTS'
  }
  sql += ' ?'
  params.push(name)
  if (charset) {
    sql += ' CHARACTER SET ?'
    params.push(charset)
  }
  if (collate) {
    sql += ' COLLATE ?'
    params.push(collate)
  }
  return { sql, params }
}

export namespace Create {
  export type Column =
    | NumberColumn
    | StringColumn
    | CharColumn
    | DateColumn
    | JsonColumn
    | CollectColumn

  export interface BaseColumn {
    name: string
    comment?: string

    default?: Default | string | number
    not_null?: boolean
    primary_key?: boolean
    unique?: boolean | string
    check?:
      | {
          rule: string
          name?: string
        }
      | string
    foreign_key?: {
      name: string
      table: string
      table_key: string
      on_update?: ForeignOperation
      on_delete?: ForeignOperation
    }

    charset?: string
    collate?: string
  }
  export interface NumberColumn extends BaseColumn {
    type:
      | 'int'
      | 'tinyint'
      | 'smallint'
      | 'mediumint'
      | 'bigint'
      | 'bool'
      | 'float'
      | 'double'
    auto_increment?: boolean
    default?: number
  }
  export interface StringColumn extends BaseColumn {
    type:
      | 'text'
      | 'tinytext'
      | 'mediumtext'
      | 'longtext'
      | 'blob'
      | 'tinyblob'
      | 'mediumblob'
      | 'longblob'
  }
  export interface CharColumn extends BaseColumn {
    type: 'char' | 'varchar'
    length: number
  }
  export interface DateColumn extends BaseColumn {
    type: 'date' | 'datetime' | 'timestamp'
    default?: Default
  }
  export interface JsonColumn extends BaseColumn {
    type: 'json'
    not_null: true
    default?: undefined
  }
  export interface CollectColumn extends BaseColumn {
    type: 'enum' | 'set'
    values: string[]
  }

  export type ForeignOperation =
    | 'cascade'
    | 'set null'
    | 'set default'
    | 'restrict'
    | 'no action'
  export interface Default {
    on_update?: boolean
  }
}
