import { describe, it, expect, expectTypeOf } from 'vitest'
import { execute } from './mysql-server'
import { Table } from '../src/table'
import { JoinTable, JoinType } from '../src/join-table'

describe('join table', () => {
  const table1 = new Table('database1', 'table1')
  const table2 = new Table('database1', 'table2')
  const table3 = new Table('database2', 'table1')
  const table4 = new Table('database2', 'table2')

  it('join', () => {
    const join_table = table1.join(table2, 'column2', 'column1')
    expect(join_table.name).toBe(
      'table1 INNER JOIN table2 ON table1.column1=table2.column2'
    )
    expect(join_table.used).toBe(false)
    expect(join_table.left_table).toBe(table1)
    expect(join_table.left_key).toBe('column1')
    expect(join_table.right_table).toBe(table2)
    expect(join_table.right_key).toBe('column2')
    table2.join(join_table, 'table1.column1', 'column2')
    expect(join_table.used).toBe(true)
  })

  it('has been used', () => {
    const join_table = table1.join(table2, 'column2', 'column1')
    table2.join(join_table, 'table1.column2', 'column3')
    expect(() => {
      table3.join(join_table, 'table1.column2', 'column1')
    }).toThrowError('JoinTable has been used')
    expect(() => {
      // @ts-expect-error 不是同一数据库
      join_table.join(table3, 'column1', 'table1.column2')
    }).toThrowError('JoinTable has been used')
  })

  it('more join', () => {
    const join_table_1 = table1.join(
      table2,
      'column2',
      'column1',
      JoinType.RIGHT
    )
    const join_table_2 = table3.join(
      table4,
      'column2',
      'column1',
      JoinType.FULL
    )
    const join_table_3 = join_table_1.join(
      join_table_2,
      'table2.column2',
      'table1.column1'
    )
    expect(join_table_3.name).toBe(
      '(table1 RIGHT JOIN table2 ON table1.column1=table2.column2) \
INNER JOIN (table1 FULL JOIN table2 ON table1.column1=table2.column2) \
ON table1.column1=table2.column2'
    )
  })

  it('left join', () => {
    const join_table = table1.leftJoin(table2, 'column2', 'column1')
    expect(join_table.name).toBe(
      'table1 LEFT JOIN table2 ON table1.column1=table2.column2'
    )
    const more_join_table = join_table.leftJoin(
      table1,
      'column3',
      'table2.column2'
    )
    expect(more_join_table.name).toBe(
      '(table1 LEFT JOIN table2 ON table1.column1=table2.column2) \
LEFT JOIN table1 ON table2.column2=table1.column3'
    )
  })

  it('right join', () => {
    const join_table = table1.rightJoin(table2, 'column2', 'column1')
    expect(join_table.name).toBe(
      'table1 RIGHT JOIN table2 ON table1.column1=table2.column2'
    )
    const more_join_table = join_table.rightJoin(
      table1,
      'column3',
      'table2.column2'
    )
    expect(more_join_table.name).toBe(
      '(table1 RIGHT JOIN table2 ON table1.column1=table2.column2) \
RIGHT JOIN table1 ON table2.column2=table1.column3'
    )
  })

  it('full join', () => {
    const join_table = table1.fullJoin(table2, 'column2', 'column1')
    expect(join_table.name).toBe(
      'table1 FULL JOIN table2 ON table1.column1=table2.column2'
    )
    const more_join_table = join_table.fullJoin(
      table1,
      'column3',
      'table2.column2'
    )
    expect(more_join_table.name).toBe(
      '(table1 FULL JOIN table2 ON table1.column1=table2.column2) \
FULL JOIN table1 ON table2.column2=table1.column3'
    )
  })

  it('select', () => {
    const join_table = table1.join(table2, 'column2', 'column1')
    const select = () =>
      join_table.select({
        table1: ['column3', 'column4'],
        table2: ['column1', 'column2'],
      })
    select()
    expect(execute).toBeCalledWith({
      sql: 'SELECT table1.column3,table1.column4,table2.column1,table2.column2 \
FROM table1 INNER JOIN table2 ON table1.column1=table2.column2',
      params: [],
    })
    expectTypeOf(join_table.select).parameter(0).toEqualTypeOf<
      | {
          table1?: ('column1' | 'column2' | 'column3' | 'column4' | 'column5')[]
          table2?: ('column1' | 'column2' | 'column3')[]
        }
      | undefined
    >()
    expectTypeOf(select).returns.resolves.items.toEqualTypeOf<{
      column1: 'none' | 'admin' | 'super'
      column2: {
        key1: string
        key2: number
      }[]
      column4: string
      column3?: number
    }>()
  })

  it('table columns record', () => {
    const join_table = new JoinTable(
      table3,
      'column1',
      table4,
      'column2',
      JoinType.LEFT
    )
    expect(join_table.__showTCR).toBeNull()
    expectTypeOf(join_table.__showTCR).toEqualTypeOf<{
      table1: [
        {
          type: string
          readonly: false
          not_null: true
          has_defa: false
          name: 'column1'
        },
        {
          type: string
          readonly: false
          not_null: false
          has_defa: true
          name: 'column2'
        }
      ]
      table2: [
        {
          type: '0' | '1' | '2' | '3'
          readonly: false
          not_null: true
          has_defa: false
          name: 'column1'
        },
        {
          type: {
            key1: string
            key2: number
          }[]
          readonly: false
          not_null: true
          has_defa: false
          name: 'column2'
        },
        {
          type: {
            key1: string
            key2: number
          }
          readonly: false
          not_null: true
          has_defa: false
          name: 'column3'
        }
      ]
    }>()
  })
})
