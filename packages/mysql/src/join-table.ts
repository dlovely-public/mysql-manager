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
import type { Mysql } from './mysql'
import type { Table } from './table'

export class JoinTable<
  LCR extends TableColumnsRecord = never,
  RCR extends TableColumnsRecord = never,
  LN extends string = never,
  LC extends TableColumns = never,
  RN extends string = never,
  RC extends TableColumns = never,
  TCR extends TableColumnsRecord = MergeRecordWithoutNever<
    [LCR, RCR, Record<LN, LC>, Record<RN, RC>]
  >
> {
  constructor(
    public readonly server: Mysql,
    public readonly left_table:
      | Table<LN, LC>
      | JoinTable<any, any, any, any, any, any, LCR>,
    public readonly left_key: ColumnsName<LC, LCR>,
    public readonly right_table:
      | Table<RN, RC>
      | JoinTable<any, any, any, any, any, any, RCR>,
    public readonly right_key: ColumnsName<RC, RCR>,
    public readonly join_type: JoinType
  ) {
    if (
      left_table.server !== this.server ||
      right_table.server !== this.server
    ) {
      throw new Error('JoinTable must be in the same server')
    }
    if (
      (left_table instanceof JoinTable && left_table.used) ||
      (right_table instanceof JoinTable && right_table.used)
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
    N extends string = never,
    C extends TableColumns = never
  >(
    table: Table<N, C> | JoinTable<any, any, any, any, any, any, CR>,
    key: ColumnsName<C, CR>,
    self_key: ColumnsName<never, TCR>,
    type: JoinType = JoinType.INNER
  ) {
    const join_table = new JoinTable(
      this.server,
      this,
      self_key,
      table,
      key,
      type
    ) as JoinTable<TCR, CR, never, never, N, C>
    return join_table
  }
  public leftJoin<
    CR extends TableColumnsRecord = never,
    N extends string = never,
    C extends TableColumns = never
  >(
    table: Table<N, C> | JoinTable<any, any, any, any, any, any, CR>,
    key: ColumnsName<C, CR>,
    self_key: ColumnsName<never, TCR>
  ) {
    return this.join(table, key, self_key, JoinType.LEFT)
  }
  public rightJoin<
    CR extends TableColumnsRecord = never,
    N extends string = never,
    C extends TableColumns = never
  >(
    table: Table<N, C> | JoinTable<any, any, any, any, any, any, CR>,
    key: ColumnsName<C, CR>,
    self_key: ColumnsName<never, TCR>
  ) {
    return this.join(table, key, self_key, JoinType.RIGHT)
  }
  public fullJoin<
    CR extends TableColumnsRecord = never,
    N extends string = never,
    C extends TableColumns = never
  >(
    table: Table<N, C> | JoinTable<any, any, any, any, any, any, CR>,
    key: ColumnsName<C, CR>,
    self_key: ColumnsName<never, TCR>
  ) {
    return this.join(table, key, self_key, JoinType.FULL)
  }

  public select<Column extends Partial<TableColumnsRecordMap<TCR>>>(
    columns?: Column,
    where?: Select.Options['where'],
    options: Omit<Select.Options, 'table' | 'columns' | 'where'> = {}
  ): Promise<SelectColumnsRecord<TCR, Column>[]> {
    const sql = formatJoinSelect({
      ...options,
      table: this.name,
      // @ts-ignore
      columns,
      where,
    })
    return this.server.execute<SelectColumnsRecord<TCR, Column>>(sql)
  }

  // public get __showTCR(): TCR {
  //   return null as any
  // }
}

export const createJoinTable = <
  LCR extends TableColumnsRecord = never,
  RCR extends TableColumnsRecord = never,
  LN extends string = never,
  LC extends TableColumns = never,
  RN extends string = never,
  RC extends TableColumns = never
>(
  left_table: Table<LN, LC> | JoinTable<any, any, any, any, any, any, LCR>,
  left_key: ColumnsName<LC, LCR>,
  right_table: Table<RN, RC> | JoinTable<any, any, any, any, any, any, RCR>,
  right_key: ColumnsName<RC, RCR>,
  join_type: JoinType
) => {
  return new JoinTable(
    left_table.server,
    left_table,
    left_key,
    right_table,
    right_key,
    join_type
  )
}

export enum JoinType {
  INNER = 'INNER',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  FULL = 'FULL',
}
