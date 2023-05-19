import { describe, it, expect, expectTypeOf, beforeEach } from 'vitest'
import { execute } from './mysql-server'
import { createMysqlServer } from '../../src/manager/mysql'
import { createTable, OkPacket } from '../../src/manager/table'

describe('Table', () => {
  const database = createMysqlServer().createDataBase('database')
  const common_columns = [
    {
      name: 'id',
      readonly: true,
      not_null: true,
      has_defa: false,
      type: 'int',
    },
    {
      name: 'create_time',
      readonly: true,
      not_null: true,
      has_defa: true,
      type: 'timestamp',
    },
    {
      name: 'update_time',
      readonly: true,
      not_null: true,
      has_defa: true,
      type: 'timestamp',
    },
    {
      name: 'reviser',
      readonly: false,
      not_null: false,
      has_defa: false,
      type: 'int',
    },
  ] as const
  const table = createTable(database, 'table', common_columns)

  beforeEach(() => {
    database.cleanUpCache()
  })

  it('create by cache', () => {
    const table_1 = database.createTable('table', common_columns)
    const table_2 = database.createTable('table', common_columns)
    expect(table_1).toBe(table_2)
  })

  it('create after clear cache', () => {
    const table_1 = database.createTable('table', common_columns)
    expect(table_1).not.toBe(table)
    expect(table_1).toEqual(table)
  })

  it('clear cache', () => {
    database.createTable('table_1', common_columns)
    database.createTable('table_2', common_columns)
    database.createTable('table_3', common_columns)
    expect([...database.table_cache.keys()]).toEqual([
      'table_1',
      'table_2',
      'table_3',
    ])
    database.cleanUpCache('table_1')
    expect([...database.table_cache.keys()]).toEqual(['table_2', 'table_3'])
    database.cleanUpCache()
    expect([...database.table_cache.keys()]).toEqual([])
  })

  it('duplicate columns', () => {
    const table = createTable(database, 'account', [
      ...common_columns,
      common_columns[0],
    ])
    expect(table.columns).toStrictEqual(common_columns)
  })

  it('json columns', () => {
    const table = createTable(database, 'account', [
      ...common_columns,
      {
        name: 'records',
        not_null: false,
        has_defa: false,
        readonly: false,
        type: 'json',
        default: '{}',
      },
    ])
    expect(table.json_keys).toEqual(['records'])
  })

  it('insert', async () => {
    table.insert({ reviser: 0 })
    expect(execute).toBeCalledWith({
      sql: 'INSERT INTO table (reviser) VALUES (?)',
      params: [0],
    })
    expectTypeOf(table.insert).parameters.items.toEqualTypeOf<{
      reviser?: number
    }>()
    expectTypeOf(table.insert).returns.resolves.toEqualTypeOf<OkPacket>()
  })

  it('delete', async () => {
    table.delete({ key: 'id', val: 0, type: '=' })
    expect(execute).toBeCalledWith({
      sql: 'DELETE FROM table WHERE id=?',
      params: [0],
    })
    expectTypeOf(table.delete).returns.resolves.toEqualTypeOf<OkPacket>()
  })

  it('update', async () => {
    table.update({ reviser: 1 }, { key: 'id', val: 0, type: '=' })
    expect(execute).toBeCalledWith({
      sql: 'UPDATE table SET reviser=? WHERE id=?',
      params: [1, 0],
    })
    expectTypeOf(table.update).returns.resolves.toEqualTypeOf<OkPacket>()
  })

  it('select', async () => {
    table.select()
    expect(execute).toBeCalledWith({
      sql: 'SELECT * FROM table',
      params: [],
    })
    expectTypeOf(table.select).returns.resolves.items.toEqualTypeOf<{
      readonly id: number
      readonly create_time: Date
      readonly update_time: Date
      reviser?: number
    }>()
    const select = () => table.select(['id', 'reviser'])
    expectTypeOf(select).returns.resolves.items.toEqualTypeOf<{
      readonly id: number
      reviser?: number
    }>()
  })
})
