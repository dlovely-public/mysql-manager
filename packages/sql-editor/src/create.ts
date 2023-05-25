import { fill } from '@dlovely/utils'
import { Sql, SqlWithParams, formatSql } from './virtual-sql'
import { createSql } from './virtual-sql'

export namespace Create {
  export interface Options {
    database: string
    name: string
    columns: Column[]
    engine?: string
    charset?: string
    collate?: string
    comment?: string
    if_not_exists?: boolean
  }

  export type Column =
    | NumberColumn
    | StringColumn
    | CharColumn
    | DateColumn
    | JsonColumn
    | CollectColumn
  export type ForeignOperation =
    | 'cascade'
    | 'set null'
    | 'set default'
    | 'restrict'
    | 'no action'
  export interface Default {
    on_update?: boolean
  }

  export interface BaseColumn {
    name: string
    comment?: string

    auto_increment?: boolean
    default?: Default | string | number
    not_null?: boolean
    primary_key?: boolean
    unique?: boolean | string
    check?: boolean | string
    foreign_key?: {
      name: string
      self_key: string
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
  }
  export interface JsonColumn extends BaseColumn {
    type: 'json'
    default?: undefined
  }
  export interface CollectColumn extends BaseColumn {
    type: 'enum' | 'set'
    values: string[]
  }
}

export const formatCreate = (options: Create.Options): SqlWithParams => {
  const { sql: columns_sql, params: columns_params } = formatColumns(
    options.columns
  )
  return createSql(
    `-- ?.? definition\nCREATE TABLE${
      options.if_not_exists ? ' IF NOT EXISTS' : ''
    } ? (\n${columns_sql}\n) ENGINE=? CHARACTER SET=? COLLATE=? COMMENT=?`,
    options.database,
    options.name,
    options.name,
    ...columns_params,
    options.engine || 'InnoDB',
    options.charset || 'utf8mb4',
    options.collate || 'utf8mb4_general_ci',
    options.comment || ''
  )
}

function formatColumns(columns: Create.Column[]): SqlWithParams {
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
      if (typeof column.check === 'string') {
        keys.push(createSql(`CHECK (?)`, column.check))
      } else {
        keys.push(createSql(`CHECK (?)`, column.name))
      }
    }
    if (column.foreign_key) {
      const { name, self_key, table, table_key, on_update, on_delete } =
        column.foreign_key
      const _on_update = on_update
        ? ` ON UPDATE ${on_update.toUpperCase()}`
        : ''
      const _on_delete = on_delete
        ? ` ON DELETE ${on_delete.toUpperCase()}`
        : ''
      keys.push(
        createSql(
          `CONSTRAINT ? FOREIGN KEY (?) REFERENCES ?(?)${_on_update}${_on_delete}`,
          name,
          self_key,
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
    auto_increment,
    default: _default,
    not_null,
    comment,
    charset,
    collate,
  } = column
  const _auto_increment = auto_increment ? ' AUTO_INCREMENT' : ''
  const _not_null = not_null ? ' NOT NULL' : ''
  const { sql: default_sql, params: default_params } = formatSql(
    formatDefault(_default)
  )
  const _comment = comment ? ` COMMENT ?` : ''
  const _charset = charset ? ` CHARACTER SET ?` : ''
  const _collate = collate ? ` COLLATE ?` : ''
  return createSql(
    `? ${type_sql}${_charset}${_collate}${_not_null}${_auto_increment}${default_sql}${_comment}`,
    name,
    ...type_params,
    charset,
    collate,
    ...default_params,
    comment
  )
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
