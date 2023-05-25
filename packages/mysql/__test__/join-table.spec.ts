import { describe, it, expect, expectTypeOf } from 'vitest'
import { execute } from './mysql-server'
import { createMysqlPool, createMysqlServer } from '../src/mysql'
import { JoinType, createJoinTable } from '../src/join-table'

describe('join table', () => {
  const server = createMysqlServer()
  const database = server.createDataBase('database')
  const table1 = database.createTable('table1', [
    { name: 'id', readonly: true, not_null: true, has_defa: true, type: 'int' },
    {
      name: 'name',
      readonly: false,
      not_null: true,
      has_defa: false,
      type: 'text',
    },
  ] as const)
  const table2 = database.createTable('table2', [
    { name: 'id', readonly: true, not_null: true, has_defa: true, type: 'int' },
    {
      name: 'age',
      readonly: false,
      not_null: true,
      has_defa: false,
      type: 'smallint',
    },
  ] as const)
  const table3 = database.createTable('table3', [
    { name: 'id', readonly: true, not_null: true, has_defa: true, type: 'int' },
    {
      name: 'sex',
      readonly: false,
      not_null: true,
      has_defa: true,
      type: 'bool',
    },
  ] as const)
  const table4 = database.createTable('table4', [
    { name: 'id', readonly: true, not_null: true, has_defa: true, type: 'int' },
    {
      name: 'email',
      readonly: false,
      not_null: false,
      has_defa: false,
      type: 'varchar',
      length: 255,
    },
  ] as const)

  it('not same server', () => {
    const table = createMysqlPool()
      .createDataBase('database')
      .createTable('table', [
        {
          name: 'id',
          readonly: true,
          not_null: true,
          has_defa: true,
          type: 'int',
        },
        {
          name: 'age',
          readonly: false,
          not_null: true,
          has_defa: false,
          type: 'smallint',
        },
      ] as const)
    expect(() => {
      table1.join(table, 'id', 'id')
    }).toThrowError('JoinTable must be in the same server')
  })

  it('has been used', () => {
    const join_table = table1.join(table2, 'id', 'id')
    table2.join(join_table, 'table2.id', 'id')
    expect(() => {
      table3.join(join_table, 'table2.id', 'id')
    }).toThrowError('JoinTable has been used')
    expect(() => {
      join_table.join(table3, 'id', 'table2.id')
    }).toThrowError('JoinTable has been used')
  })

  it('join', () => {
    const join_table = table1.join(table2, 'id', 'id', JoinType.LEFT)
    expect(join_table.name).toBe(
      'table1 LEFT JOIN table2 ON table1.id=table2.id'
    )
    expect(join_table.used).toBe(false)
    expect(join_table.left_table).toBe(table1)
    expect(join_table.left_key).toBe('id')
    expect(join_table.right_table).toBe(table2)
    expect(join_table.right_key).toBe('id')
    table2.join(join_table, 'table2.id', 'id')
    expect(join_table.used).toBe(true)
  })

  it('more join', () => {
    const join_table_1 = table1.join(table2, 'id', 'id', JoinType.RIGHT)
    const join_table_2 = table3.join(table4, 'id', 'id', JoinType.FULL)
    const join_table_3 = join_table_1.join(
      join_table_2,
      'table3.id',
      'table1.id'
    )
    expect(join_table_3.name).toBe(
      '(table1 RIGHT JOIN table2 ON table1.id=table2.id) \
INNER JOIN (table3 FULL JOIN table4 ON table3.id=table4.id) \
ON table1.id=table3.id'
    )
  })

  it('left join', () => {
    const join_table = table1.leftJoin(table2, 'id', 'id')
    expect(join_table.name).toBe(
      'table1 LEFT JOIN table2 ON table1.id=table2.id'
    )
    const more_join_table = join_table.leftJoin(table3, 'id', 'table1.id')
    expect(more_join_table.name).toBe(
      '(table1 LEFT JOIN table2 ON table1.id=table2.id) \
LEFT JOIN table3 ON table1.id=table3.id'
    )
  })

  it('right join', () => {
    const join_table = table1.rightJoin(table2, 'id', 'id')
    expect(join_table.name).toBe(
      'table1 RIGHT JOIN table2 ON table1.id=table2.id'
    )
    const more_join_table = join_table.rightJoin(table3, 'id', 'table1.id')
    expect(more_join_table.name).toBe(
      '(table1 RIGHT JOIN table2 ON table1.id=table2.id) \
RIGHT JOIN table3 ON table1.id=table3.id'
    )
  })

  it('full join', () => {
    const join_table = table1.fullJoin(table2, 'id', 'id')
    expect(join_table.name).toBe(
      'table1 FULL JOIN table2 ON table1.id=table2.id'
    )
    const more_join_table = join_table.fullJoin(table3, 'id', 'table1.id')
    expect(more_join_table.name).toBe(
      '(table1 FULL JOIN table2 ON table1.id=table2.id) \
FULL JOIN table3 ON table1.id=table3.id'
    )
  })

  it('select', () => {
    const join_table = table1.join(table2, 'id', 'id')
    const select = () => join_table.select({ table1: ['id'], table2: ['age'] })
    select()
    expect(execute).toBeCalledWith({
      params: [],
      sql: 'SELECT table1.id,table2.age FROM table1 INNER JOIN table2 ON table1.id=table2.id',
    })
    expectTypeOf(join_table.select).parameter(0).toEqualTypeOf<
      | {
          table1?: ('id' | 'name')[]
          table2?: ('id' | 'age')[]
        }
      | undefined
    >()
    expectTypeOf(select).returns.resolves.items.toEqualTypeOf<{
      readonly id: number
      age: number
    }>()
  })

  it('create', () => {
    const join_table = table1.join(table2, 'id', 'id')
    const other_join_table = createJoinTable(
      table1,
      'id',
      table2,
      'id',
      JoinType.INNER
    )
    expect(join_table).toEqual(other_join_table)
  })
})
