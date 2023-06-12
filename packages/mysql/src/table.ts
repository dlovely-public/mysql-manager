import {
  Create,
  Delete,
  Update,
  Select,
  TableColumns,
  InsertColumns,
  UpdateColumns,
  SelectColumnsPick,
  TableColumnsRecord,
  ColumnsName,
} from '@dlovely/sql-editor'
import {
  formatInsert,
  formatDelete,
  formatUpdate,
  formatSelect,
  formatCreateTable,
} from '@dlovely/sql-editor'
import type { MergeRecord, Split, UnionToTuple } from '@dlovely/utils'
import type { OkPacket } from 'mysql2'
import { useServer } from './mysql'
import { JoinTable, JoinType } from './join-table'
import { tables_control } from './file-control'
import {
  type Column,
  columnTypeToTypeScriptType,
  genTypeFromKeyType,
} from './auto-type'

export class Table<
  DB extends keyof MySql.DataBase,
  Name extends keyof MySql.DataBase[DB] & string,
  // @ts-ignore
  Columns extends TableColumns = GenTableColumns<DB, Name>
> {
  constructor(public readonly database: DB, public readonly name: Name) {
    this._json_keys = new Map<string, string>()
  }
  private readonly _json_keys

  public async insert(...datas: InsertColumns<Columns>[]): Promise<OkPacket> {
    const server = useServer()
    const sql = formatInsert({
      table: this.name,
      datas,
      json_key: this._json_keys,
    })
    const result = await server.execute(sql, this.database)
    return result
  }

  public delete(where: Delete.Options['where']): Promise<OkPacket> {
    const server = useServer()
    const sql = formatDelete({
      table: this.name,
      where,
    })
    const result = server.execute(sql, this.database)
    return result
  }

  public update(
    data: UpdateColumns<Columns>,
    where?: Update.Options['where']
  ): Promise<OkPacket> {
    const server = useServer()
    const sql = formatUpdate({
      table: this.name,
      data,
      where,
      json_key: this._json_keys,
    })
    const result = server.execute(sql, this.database)
    return result
  }

  public select<Column extends Columns[number]['name']>(
    columns?: Column[],
    where?: Select.Options['where'],
    options: Omit<Select.Options, 'table' | 'columns' | 'where'> = {}
  ): Promise<SelectColumnsPick<Columns, Column>[]> {
    const server = useServer()
    // TODO 对columns进行校验
    const sql = formatSelect({
      ...options,
      table: this.name,
      columns,
      where,
    })
    return server.execute<SelectColumnsPick<Columns, Column>>(
      sql,
      this.database
    )
  }

  public join<
    CR extends TableColumnsRecord = never,
    N extends keyof MySql.DataBase[DB] & string = never,
    C extends TableColumns = never
  >(
    table:
      | Table<DB, N, C>
      // @ts-ignore
      | JoinTable<any, any, any, any, any, any, any, CR>,
    key: ColumnsName<C, CR>,
    self_key: ColumnsName<Columns, never>,
    type: JoinType = JoinType.INNER
  ) {
    const join_table = new JoinTable(
      this,
      self_key,
      table,
      key,
      type
    ) as JoinTable<DB, never, CR, Name, Columns, N, C>
    return join_table
  }
  public leftJoin<
    CR extends TableColumnsRecord = never,
    N extends keyof MySql.DataBase[DB] & string = never,
    C extends TableColumns = never
  >(
    table:
      | Table<DB, N, C>
      // @ts-ignore
      | JoinTable<any, any, any, any, any, any, any, CR>,
    key: ColumnsName<C, CR>,
    self_key: ColumnsName<Columns, never>
  ) {
    return this.join(table, key, self_key, JoinType.LEFT)
  }
  public rightJoin<
    CR extends TableColumnsRecord = never,
    N extends keyof MySql.DataBase[DB] & string = never,
    C extends TableColumns = never
  >(
    table:
      | Table<DB, N, C>
      // @ts-ignore
      | JoinTable<any, any, any, any, any, any, any, CR>,
    key: ColumnsName<C, CR>,
    self_key: ColumnsName<Columns, never>
  ) {
    return this.join(table, key, self_key, JoinType.RIGHT)
  }
  public fullJoin<
    CR extends TableColumnsRecord = never,
    N extends keyof MySql.DataBase[DB] & string = never,
    C extends TableColumns = never
  >(
    table:
      | Table<DB, N, C>
      // @ts-ignore
      | JoinTable<any, any, any, any, any, any, any, CR>,
    key: ColumnsName<C, CR>,
    self_key: ColumnsName<Columns, never>
  ) {
    return this.join(table, key, self_key, JoinType.FULL)
  }

  public async create(
    columns: Create.Options['columns'],
    options: Omit<Create.Options, 'database' | 'name' | 'columns'> = {}
  ) {
    const server = useServer()
    const sql = formatCreateTable({
      ...options,
      database: this.database,
      name: this.name,
      columns,
    })
    const result = await server.execute(sql, this.database)
    /* istanbul ignore next -- @preserve */
    if (__DEV__ && !__TEST__) {
      const table = tables_control.get(this.database, this.name)
      const _columns = new Map<string, Column>()
      const { json_key } = server
      for (const column of columns) {
        const type = ((column, json_key) => {
          switch (column.type) {
            case 'enum':
              return column.values.map(v => `'${v}'`).join(' | ')
            case 'json':
              if (json_key) return genTypeFromKeyType(json_key)
              return 'object'
            case 'set':
              return `(${column.values.map(v => `'${v}'`).join(' | ')})[]`
            default:
              return columnTypeToTypeScriptType(
                column.type,
                '',
                json_key?.[this.database]?.[this.name]?.[column.name]
              )
          }
        })(column, json_key)
        const readonly =
          ('auto_increment' in column && column.auto_increment) ?? false
        const not_null = column.not_null ?? false
        const has_defa = column.default !== null && column.default !== undefined
        const _column: Column = {
          type,
          readonly,
          not_null,
          has_defa,
        }
        _columns.set(column.name, _column)
      }
      table.load(_columns)
    }
    return result
  }

  public async truncate() {
    const server = useServer()
    const sql = `TRUNCATE TABLE ${this.name}`
    const result = await server.execute(sql, this.database)
    return result
  }

  public async drop() {
    const server = useServer()
    const sql = `DROP TABLE ${this.name}`
    const result = await server.execute(sql, this.database)
    /* istanbul ignore next -- @preserve */
    if (__DEV__ && !__TEST__) tables_control.delete(this.database, this.name)
    return result
  }
}

export type { OkPacket }

type GenTableColumns<
  DB extends keyof MySql.DataBase,
  Name extends Split<keyof MySql.Table>[1],
  Columns = MySql.DataBase[DB][Name]
> = UnionToTuple<
  MergeRecord<
    {
      [Key in keyof Columns]: Columns[Key] & { name: Key }
    }[keyof Columns]
  >
>
