import { describe, it, expect } from 'vitest'
import { execute } from './mysql-server'
import { Table } from '../src/table'

describe('Table', () => {
  it('default', () => {
    // @ts-ignore
    const table = new Table('database', 'table')
    expect(table.database).toBe('database')
    expect(table.name).toBe('table')
  })

  it('insert', async ({ expect }) => {
    // @ts-ignore
    const table = new Table('database', 'table')
    await table.insert({ id: 1, name: 'name' })
    expect(execute).toBeCalledWith(
      {
        sql: 'INSERT INTO table (id,name) VALUES (?,?)',
        params: [1, 'name'],
      },
      'database'
    )
  })

  it('delete', async ({ expect }) => {
    // @ts-ignore
    const table = new Table('database', 'table')
    await table.delete(' WHERE id = 1')
    expect(execute).toBeCalledWith(
      {
        sql: 'DELETE FROM table WHERE id = 1',
        params: [],
      },
      'database'
    )
  })

  it('update', async ({ expect }) => {
    // @ts-ignore
    const table = new Table('database', 'table')
    await table.update({ name: 'name' }, ' WHERE id = 1')
    expect(execute).toBeCalledWith(
      {
        sql: 'UPDATE table SET name=? WHERE id = 1',
        params: ['name'],
      },
      'database'
    )
  })

  it('select', async ({ expect }) => {
    // @ts-ignore
    const table = new Table('database', 'table')
    await table.select(['id'], ' WHERE id = 1')
    expect(execute).toBeCalledWith(
      {
        sql: 'SELECT id FROM table WHERE id = 1',
        params: [],
      },
      'database'
    )
  })

  it('truncate', async ({ expect }) => {
    // @ts-ignore
    const table = new Table('database', 'table')
    await table.truncate()
    expect(execute).toBeCalledWith('TRUNCATE TABLE table', 'database')
  })

  it('drop', async ({ expect }) => {
    // @ts-ignore
    const table = new Table('database', 'table')
    await table.drop()
    expect(execute).toBeCalledWith('DROP TABLE table', 'database')
  })
})
