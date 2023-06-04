import type {
  Select,
  ColumnsName,
  TableColumns,
  TableColumnsRecord,
  TableColumnsRecordMap,
  SelectColumnsRecord,
} from '@dlovely/sql-editor'
import { formatJoinSelect } from '@dlovely/sql-editor'
import type { MergeRecordWithoutNever } from '@dlovely/utils'
import { useServer } from './mysql'
import type { Table } from './table'

export class JoinTable<
  DB extends keyof MySql.DataBase,
  LCR extends TableColumnsRecord = never,
  RCR extends TableColumnsRecord = never,
  LN extends keyof MySql.DataBase[DB] & string = never,
  LC extends TableColumns = never,
  RN extends keyof MySql.DataBase[DB] & string = never,
  RC extends TableColumns = never,
  TCR extends TableColumnsRecord = MergeRecordWithoutNever<
    [LCR, RCR, Record<LN, LC>, Record<RN, RC>]
  >
> {
  constructor(
    public readonly left_table:
      | Table<DB, LN, LC>
      // @ts-ignore
      | JoinTable<any, any, any, any, any, any, any, LCR>,
    public readonly left_key: ColumnsName<LC, LCR>,
    public readonly right_table:
      | Table<DB, RN, RC>
      // @ts-ignore
      | JoinTable<any, any, any, any, any, any, any, RCR>,
    public readonly right_key: ColumnsName<RC, RCR>,
    public readonly join_type: JoinType
  ) {
    if (
      (left_table instanceof JoinTable && left_table._used) ||
      (right_table instanceof JoinTable && right_table._used)
    ) {
      throw new Error('JoinTable has been used')
    }
    if (left_table instanceof JoinTable) left_table._used = true
    if (right_table instanceof JoinTable) right_table._used = true
  }

  private _used = false
  public get used() {
    return this._used
  }

  public get name(): string {
    let { name: left_name } = this.left_table
    let { name: right_name } = this.right_table
    let left_key = this.left_key as string
    let right_key = this.right_key as string
    if (this.left_table instanceof JoinTable) {
      left_name = `(${left_name})`
    } else {
      left_key = `${left_name}.${left_key}`
    }
    if (this.right_table instanceof JoinTable) {
      right_name = `(${right_name})`
    } else {
      right_key = `${right_name}.${right_key}`
    }
    return `${left_name} ${this.join_type} JOIN ${right_name} ON ${left_key}=${right_key}`
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
    self_key: ColumnsName<never, TCR>,
    type: JoinType = JoinType.INNER
  ) {
    const join_table = new JoinTable(
      this,
      self_key,
      table,
      key,
      type
    ) as JoinTable<DB, TCR, CR, never, never, N, C>
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
    self_key: ColumnsName<never, TCR>
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
    self_key: ColumnsName<never, TCR>
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
    self_key: ColumnsName<never, TCR>
  ) {
    return this.join(table, key, self_key, JoinType.FULL)
  }

  public async select<Column extends Partial<TableColumnsRecordMap<TCR>>>(
    columns?: Column,
    where?: Select.Options['where'],
    options: Omit<Select.Options, 'table' | 'columns' | 'where'> = {}
  ): Promise<SelectColumnsRecord<TCR, Column>[]> {
    const server = useServer()
    const sql = formatJoinSelect({
      ...options,
      table: this.name,
      // @ts-ignore
      columns,
      where,
    })
    const result = await server.execute<SelectColumnsRecord<TCR, Column>>(sql)
    return result
  }

  public get __showTCR(): TCR {
    return null as any
  }
}

export enum JoinType {
  INNER = 'INNER',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  FULL = 'FULL',
}
