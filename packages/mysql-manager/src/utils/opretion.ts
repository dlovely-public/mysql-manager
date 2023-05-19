import type {
  TableColumn,
  TableColumns,
  TableColumnsRecord,
  ColumnType,
} from './columns'
import type { DPick, MergeRecord, UnionToIntersection } from './type-utils'

export type TableColumnsName<Columns extends TableColumns> =
  Columns[number]['name']
export type TableColumnsRecordName<ColumnsRecord extends TableColumnsRecord> = {
  [Table in keyof ColumnsRecord]: Table extends string
    ? `${Table}.${TableColumnsName<ColumnsRecord[Table]>}`
    : never
}[keyof ColumnsRecord]
export type ColumnsName<
  Columns extends TableColumns = never,
  ColumnsRecord extends TableColumnsRecord = never
> =
  | ([Columns] extends [never] ? never : TableColumnsName<Columns>)
  | ([ColumnsRecord] extends [never]
      ? never
      : TableColumnsRecordName<ColumnsRecord>)

export type TableColumnsRecordMap<ColumnsRecord extends TableColumnsRecord> =
  ColumnsRecord extends TableColumnsRecord
    ? {
        [Table in keyof ColumnsRecord]: TableColumnsName<ColumnsRecord[Table]>[]
      }
    : never

export type InsertColumns<Columns extends TableColumns> = MergeRecord<
  {
    [Key in Columns[number] as IsReadOnly<
      Key,
      never,
      IsRequire<Key, Key['name'], never>
    >]: ColumnType<Key>
  } & {
    [Key in Columns[number] as IsReadOnly<
      Key,
      never,
      IsRequire<Key, never, Key['name']>
    >]?: ColumnType<Key>
  }
>

export type UpdateColumns<Columns extends TableColumns> = MergeRecord<{
  [Key in Columns[number] as IsReadOnly<
    Key,
    never,
    Key['name']
  >]?: ColumnType<Key>
}>

export type SelectColumns<Columns extends TableColumns> = MergeRecord<
  {
    readonly [Key in Columns[number] as IsReadOnly<
      Key,
      IsExist<Key, Key['name'], never>,
      never
    >]: ColumnType<Key>
  } & {
    readonly [Key in Columns[number] as IsReadOnly<
      Key,
      IsExist<Key, never, Key['name']>,
      never
    >]?: ColumnType<Key>
  } & {
    [Key in Columns[number] as IsReadOnly<
      Key,
      never,
      IsExist<Key, Key['name'], never>
    >]: ColumnType<Key>
  } & {
    [Key in Columns[number] as IsReadOnly<
      Key,
      never,
      IsExist<Key, never, Key['name']>
    >]?: ColumnType<Key>
  }
>
export type SelectColumnsPick<
  Columns extends TableColumns,
  Column extends TableColumnsName<Columns>
> = [Column] extends [never]
  ? SelectColumns<Columns>
  : DPick<SelectColumns<Columns>, Column>
export type SelectColumnsRecord<
  ColumnsRecord extends TableColumnsRecord,
  Column extends Partial<TableColumnsRecordMap<ColumnsRecord>>
> = [Column] extends [never]
  ? UnionToIntersection<
      {
        [Table in keyof ColumnsRecord]: SelectColumns<ColumnsRecord[Table]>
      }[keyof ColumnsRecord]
    >
  : UnionToIntersection<
      {
        [Table in keyof Column]: Table extends keyof ColumnsRecord
          ? Column[Table] extends Array<infer Col extends string>
            ? SelectColumnsPick<ColumnsRecord[Table], Col>
            : never
          : never
      }[keyof Column]
    >

type IsReadOnly<
  Column extends TableColumn,
  True = true,
  False = false
> = Column['readonly'] extends true ? True : False
type IsRequire<
  Column extends TableColumn,
  True = true,
  False = false
> = Column['has_defa'] extends true
  ? False
  : Column['not_null'] extends true
  ? True
  : False
type IsExist<
  Column extends TableColumn,
  True = true,
  False = false
> = Column['not_null'] extends true ? True : False
