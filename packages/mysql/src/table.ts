import type {
  Delete,
  Update,
  Select,
  TableColumns,
  InsertColumns,
  UpdateColumns,
  SelectColumnsPick,
} from '@dlovely/sql-editor'
import {
  formatInsert,
  formatDelete,
  formatUpdate,
  formatSelect,
} from '@dlovely/sql-editor'
import type { MergeRecord, Split, UnionToTuple } from '@dlovely/utils'
import type { OkPacket } from 'mysql2'
import { useServer } from './mysql'
// import { JoinTable, JoinType } from './join-table.tss'
import { tables_control } from './file-control'

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

  // ! 未完成
  /* istanbul ignore next -- @preserve */
  public async create() {
    const server = useServer()
    const sql = ``
    const result = await server.execute(sql, this.database)
    if (__DEV__ && !__TEST__) {
      const table = tables_control.get(this.database, this.name)
      table.load
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
