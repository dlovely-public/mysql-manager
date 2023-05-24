import { describe, it, expectTypeOf } from 'vitest'
import { ColumnType } from '../src/columns'

describe('columns', () => {
  const columns = [
    {
      name: 'id',
      type: 'int',
      not_null: true,
      has_defa: false,
      readonly: false,
    },
    {
      name: 'name',
      type: 'text',
      not_null: true,
      has_defa: false,
      readonly: false,
    },
    {
      name: 'created_at',
      type: 'datetime',

      not_null: true,
      has_defa: false,
      readonly: false,
    },
    {
      name: 'record',
      type: 'json',
      default: '{}',
      not_null: true,
      has_defa: false,
      readonly: false,
    },
  ] as const
  type Columns = typeof columns

  it('ColumnType', () => {
    expectTypeOf<ColumnType<Columns[0]>>().toEqualTypeOf<number>()
    expectTypeOf<ColumnType<Columns[1]>>().toEqualTypeOf<string>()
    expectTypeOf<ColumnType<Columns[2]>>().toEqualTypeOf<Date>()
    expectTypeOf<ColumnType<Columns[3]>>().toEqualTypeOf<Record<string, any>>()
  })
})
