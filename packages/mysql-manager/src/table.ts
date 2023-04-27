import type {
  TableColumn,
  TableColumns,
  InsertColumns,
  UpdateColumns,
  SelectColumnsPick,
} from '@mysql-manager/shared'
import {
  formatInsert,
  formatDelete,
  formatUpdate,
  formatSelect,
  formatSql,
} from '@mysql-manager/editor'
import type {
  Delete,
  Update,
  Select,
  SqlWithParams,
} from '@mysql-manager/editor'
import { DataBase } from './database'
import type { OkPacket } from 'mysql2'

export class Table<Columns extends TableColumns> {
  public readonly server
  constructor(
    public readonly database: DataBase,
    public readonly name: string,
    columns: Columns
  ) {
    this.server = database.server
    const column_cache = new Set<string>()
    for (const column of columns) {
      if (column_cache.has(column.name)) continue
      this.columns.push(column)
      column_cache.add(column.name)
      if (column.type === 'json') {
        this._json_keys.set(column.name, column.default)
      }
    }
  }
  public readonly columns = [] as TableColumn[]

  private readonly _json_keys = new Map<string, string>()
  public get json_keys() {
    return [...this._json_keys.keys()]
  }

  public async select<Column extends Columns[number]['name']>(
    columns?: Column[],
    where?: Select.Options['where'],
    options: Omit<Select.Options, 'table' | 'columns' | 'where'> = {}
    // @ts-ignore
  ) {
    // TODO 对columns进行校验
    const sql = formatSelect({
      ...options,
      table: this.name,
      columns,
      where,
    })
    return this.execute<SelectColumnsPick<Columns, Column>>(sql)
  }

  public async insert(...datas: InsertColumns<Columns>[]) {
    const sql = formatInsert({
      table: this.name,
      datas,
      json_key: this._json_keys,
    })
    return this.execute(sql)
  }

  public async update(
    data: UpdateColumns<Columns>,
    where?: Update.Options['where']
  ) {
    const sql = formatUpdate({
      table: this.name,
      data,
      where,
      json_key: this._json_keys,
    })
    return this.execute(sql)
  }

  public async delete(where: Delete.Options['where']) {
    const sql = formatDelete({
      table: this.name,
      where,
    })
    return this.execute(sql)
  }

  public async execute(options: Partial<SqlWithParams>): Promise<OkPacket>
  public async execute<T extends Record<string, unknown>>(
    options: Partial<SqlWithParams>
  ): Promise<T[]>
  public async execute(options: Partial<SqlWithParams>) {
    const { sql, params } = formatSql(options)
    /* istanbul ignore else -- @preserve */
    if (__TEST__) {
      return { sql, params }
    }
    /* istanbul ignore next -- @preserve */
    const { connection, release } = await this.server.getConnection()
    /* istanbul ignore next -- @preserve */
    const [result] = await connection.execute(sql, params)
    /* istanbul ignore next -- @preserve */
    release()
    /* istanbul ignore next -- @preserve */
    return result as any
  }
}

export const createTable = <Columns extends TableColumns>(
  database: DataBase,
  name: string,
  columns: Columns
) => database.createTable(name, columns)

export type { OkPacket }
