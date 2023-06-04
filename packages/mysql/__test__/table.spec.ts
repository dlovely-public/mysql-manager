import { describe, it, expect } from 'vitest'
import { execute } from './mysql-server'
import { Table } from '../src/table'

describe('Table', () => {
  it('default', () => {
    const table = new Table('database1', 'table1')
    expect(table.database).toBe('database1')
    expect(table.name).toBe('table1')
  })

  it('insert', async ({ expect }) => {
    const table = new Table('database1', 'table1')
    await table.insert({ column3: 3, column4: 'value4' })
    expect(execute).toBeCalledWith(
      {
        sql: 'INSERT INTO table1 (column3,column4) VALUES (?,?)',
        params: [3, 'value4'],
      },
      'database1'
    )
  })

  it('delete', async ({ expect }) => {
    const table = new Table('database1', 'table1')
    await table.delete(' WHERE id = 1')
    expect(execute).toBeCalledWith(
      {
        sql: 'DELETE FROM table1 WHERE id = 1',
        params: [],
      },
      'database1'
    )
  })

  it('update', async ({ expect }) => {
    const table = new Table('database1', 'table1')
    await table.update({ column3: 3 }, ' WHERE id = 1')
    expect(execute).toBeCalledWith(
      {
        sql: 'UPDATE table1 SET column3=? WHERE id = 1',
        params: [3],
      },
      'database1'
    )
  })

  it('select', async ({ expect }) => {
    const table = new Table('database1', 'table1')
    await table.select(['column1'], ' WHERE id = 1')
    expect(execute).toBeCalledWith(
      {
        sql: 'SELECT column1 FROM table1 WHERE id = 1',
        params: [],
      },
      'database1'
    )
  })

  it('truncate', async ({ expect }) => {
    const table = new Table('database1', 'table1')
    await table.truncate()
    expect(execute).toBeCalledWith('TRUNCATE TABLE table1', 'database1')
  })

  it('drop', async ({ expect }) => {
    const table = new Table('database1', 'table1')
    await table.drop()
    expect(execute).toBeCalledWith('DROP TABLE table1', 'database1')
  })
})
