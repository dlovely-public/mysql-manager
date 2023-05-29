export interface TableColumn {
  readonly name: string
  readonly type: unknown
  readonly not_null: boolean
  readonly has_defa: boolean
  readonly readonly: boolean
}
export type TableColumns = readonly TableColumn[]
export type TableColumnsRecord = Record<string, TableColumns>
