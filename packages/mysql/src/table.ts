import type {
  Delete,
  Update,
  Select,
  TableColumn,
  TableColumns,
  InsertColumns,
  UpdateColumns,
  SelectColumnsPick,
  ColumnsName,
  TableColumnsRecord,
} from '@dlovely/sql-editor'
import {
  formatInsert,
  formatDelete,
  formatUpdate,
  formatSelect,
} from '@dlovely/sql-editor'
import { DataBase } from './database'
import type { OkPacket } from 'mysql2'
import { JoinTable, JoinType } from './join-table'

export class Table<Name extends string, Columns extends TableColumns> {
  public readonly server
  constructor(
    public readonly database: DataBase,
    public readonly name: Name,
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

  public join<
    CR extends TableColumnsRecord = never,
    N extends string = never,
    C extends TableColumns = never
  >(
    table: Table<N, C> | JoinTable<any, any, any, any, any, any, CR>,
    key: ColumnsName<C, CR>,
    self_key: ColumnsName<Columns, never>,
    type: JoinType = JoinType.INNER
  ) {
    const join_table = new JoinTable(
      this.server,
      this,
      self_key,
      table,
      key,
      type
    ) as JoinTable<never, CR, Name, Columns, N, C>
    return join_table
  }
}

export const createTable = <Columns extends TableColumns>(
  database: DataBase,
  name: string,
  columns: Columns
) => database.createTable(name, columns)

export type { OkPacket }
