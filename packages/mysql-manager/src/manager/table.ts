import type {
  TableColumn,
  TableColumns,
  InsertColumns,
  UpdateColumns,
  SelectColumnsPick,
} from '../utils'
import {
  formatInsert,
  formatDelete,
  formatUpdate,
  formatSelect,
} from '../shared'
import type { Delete, Update, Select } from '../shared'
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

  public select<Column extends Columns[number]['name']>(
    columns?: Column[],
    where?: Select.Options['where'],
    options: Omit<Select.Options, 'table' | 'columns' | 'where'> = {}
    // @ts-ignore
  ): Promise<SelectColumnsPick<Columns, Column>[]> {
    // TODO 对columns进行校验
    const sql = formatSelect({
      ...options,
      table: this.name,
      columns,
      where,
    })
    return this.server.execute<SelectColumnsPick<Columns, Column>>(sql)
  }

  public insert(...datas: InsertColumns<Columns>[]): Promise<OkPacket> {
    const sql = formatInsert({
      table: this.name,
      datas,
      json_key: this._json_keys,
    })
    return this.server.execute(sql)
  }

  public update(
    data: UpdateColumns<Columns>,
    where?: Update.Options['where']
  ): Promise<OkPacket> {
    const sql = formatUpdate({
      table: this.name,
      data,
      where,
      json_key: this._json_keys,
    })
    return this.server.execute(sql)
  }

  public delete(where: Delete.Options['where']): Promise<OkPacket> {
    const sql = formatDelete({
      table: this.name,
      where,
    })
    return this.server.execute(sql)
  }
}

export const createTable = <Columns extends TableColumns>(
  database: DataBase,
  name: string,
  columns: Columns
) => database.createTable(name, columns)

export type { OkPacket }
