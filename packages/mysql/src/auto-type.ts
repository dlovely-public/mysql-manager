/* istanbul ignore file -- @preserve */
import { fill } from '@dlovely/utils'
import type { KeyType } from './config'
import { useServer } from './mysql'
import { tables_control } from './file-control'

export const genGlobalType = /*#__PURE__*/ async ({
  json_key,
}: {
  json_key?: Record<string, Record<string, Record<string, KeyType>>>
}) => {
  if (!__DEV__ || __TEST__) return
  const result = await getColumnInfo()
  for (const {
    TABLE_SCHEMA,
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    COLUMN_TYPE,
    EXTRA,
    IS_NULLABLE,
    COLUMN_DEFAULT,
  } of result) {
    const type = columnTypeToTypeScriptType(
      DATA_TYPE,
      COLUMN_TYPE,
      json_key?.[TABLE_SCHEMA]?.[TABLE_NAME]?.[COLUMN_NAME]
    )
    // TODO 可配置
    const readonly = EXTRA === 'auto_increment'
    const not_null = IS_NULLABLE === 'NO' || DATA_TYPE === 'json'
    const has_defa = COLUMN_DEFAULT !== null
    const column: Column = {
      type,
      readonly,
      not_null,
      has_defa,
    }

    const table_control = tables_control.get(TABLE_SCHEMA, TABLE_NAME)
    table_control.create(COLUMN_NAME, column)
  }
}

export /*#__PURE__*/ function columnTypeToTypeScriptType(
  DATA_TYPE: string,
  COLUMN_TYPE: string,
  json_key?: KeyType
) {
  switch (DATA_TYPE) {
    case 'tinyint':
    case 'smallint':
    case 'mediumint':
    case 'int':
    case 'bigint':
    case 'float':
    case 'double':
    case 'decimal':
    case 'bit':
    case 'bool':
    case 'boolean':
    case 'serial':
      return 'number'
    case 'date':
    case 'datetime':
    case 'time':
    case 'timestamp':
    case 'year':
      return 'Date'
    case 'char':
    case 'varchar':
    case 'tinytext':
    case 'text':
    case 'mediumtext':
    case 'longtext':
    case 'binary':
    case 'varbinary':
    case 'tinyblob':
    case 'mediumblob':
    case 'blob':
    case 'longblob':
      return 'string'
    case 'enum':
      return (
        COLUMN_TYPE.match(/'.*'/)?.[0].replace(/\s?,\s?/g, ' | ') || 'string'
      )
    case 'json':
      if (json_key) return genTypeFromKeyType(json_key)
      return 'object'
    case 'set':
      return (
        (COLUMN_TYPE.match(/'.*'/)?.[0].replace(/\s?,\s?/g, ' | ') ||
          'string') + '[]'
      )
    default:
      return 'any'
  }
}

export /*#__PURE__*/ function genTypeFromKeyType(json_key: string | KeyType) {
  if (typeof json_key === 'string') return json_key
  const { string, number, records, is_array } = json_key
  const type = [] as string[]
  if (string) type.push(`[key:string]: ${genTypeFromKeyType(string)}`)
  if (number) type.push(`[key:number]: ${genTypeFromKeyType(number)}`)
  if (records) {
    for (const [key, value] of Object.entries(records)) {
      type.push(`${key}: ${genTypeFromKeyType(value)}`)
    }
  }
  if (is_array) type.push(`[]`)
  return `{${type.join(';')}}`
}

interface ColumnInfo {
  [key: string]: any
  /** 数据库名 */
  TABLE_SCHEMA: string
  /** 数据表名 */
  TABLE_NAME: string
  /** 字段名 */
  COLUMN_NAME: string
  /** 序数 */
  ORDINAL_POSITION: number
  /** 默认值 */
  COLUMN_DEFAULT: string | null
  /** 允许空值 */
  IS_NULLABLE: 'YES' | 'NO'
  /** 数据类型 */
  DATA_TYPE: string
  /** 字段最大长度 */
  CHARACTER_MAXIMUM_LENGTH: number | null
  /** 字符名 */
  CHARACTER_SET_NAME: string | null
  /** 字符编码 */
  COLLATION_NAME: string | null
  /** 字段类型 */
  COLUMN_TYPE: string
  /** 键类型 */
  COLUMN_KEY: string
  /** 额外说明 */
  EXTRA: string
  /** 权限 */
  PRIVILEGES: string
  /** 字段注释 */
  COLUMN_COMMENT: string
}
async function getColumnInfo() {
  const server = useServer()
  const table = `information_schema.COLUMNS`
  const exclude_tables = [
    'mysql',
    'sys',
    'information_schema',
    'performance_schema',
  ]
  const order_by = ['TABLE_SCHEMA', 'TABLE_NAME', 'ORDINAL_POSITION']
  const result = await server.execute<ColumnInfo>({
    sql: `SELECT * FROM ${table} WHERE TABLE_SCHEMA NOT IN (${fill(
      exclude_tables.length
    )}) ORDER BY ${order_by.join()}`,
    params: exclude_tables,
  })
  return result
}

export interface Column {
  type: string
  readonly: boolean
  not_null: boolean
  has_defa: boolean
}
