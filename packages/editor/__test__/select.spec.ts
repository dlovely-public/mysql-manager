import { formatSelect } from '../src/select'

describe('select', () => {
  it('columns', () => {
    expect(formatSelect({ table: 'table' })).toEqual({
      sql: 'SELECT * FROM table',
      params: [],
    })
    expect(formatSelect({ table: 'table', columns: [] })).toEqual({
      sql: 'SELECT * FROM table',
      params: [],
    })
    expect(formatSelect({ table: 'table', columns: ['id', 'name'] })).toEqual({
      sql: 'SELECT id,name FROM table',
      params: [],
    })
  })

  it('distinct', () => {
    expect(formatSelect({ table: 'table', distinct: true })).toEqual({
      sql: 'SELECT * FROM table',
      params: [],
    })
    expect(
      formatSelect({ table: 'table', columns: [], distinct: true })
    ).toEqual({
      sql: 'SELECT * FROM table',
      params: [],
    })
    expect(
      formatSelect({ table: 'table', columns: ['id', 'name'], distinct: true })
    ).toEqual({
      sql: 'SELECT DISTINCT id,name FROM table',
      params: [],
    })
  })

  it('order_by', () => {
    expect(formatSelect({ table: 'table', order_by: {} })).toEqual({
      sql: 'SELECT * FROM table',
      params: [],
    })
    expect(formatSelect({ table: 'table', order_by: { id: true } })).toEqual({
      sql: 'SELECT * FROM table ORDER BY id DESC',
      params: [],
    })
    expect(formatSelect({ table: 'table', order_by: { id: false } })).toEqual({
      sql: 'SELECT * FROM table ORDER BY id ASC',
      params: [],
    })
    expect(formatSelect({ table: 'table', order_by: { id: 'desc' } })).toEqual({
      sql: 'SELECT * FROM table ORDER BY id DESC',
      params: [],
    })
    expect(formatSelect({ table: 'table', order_by: { id: 'asc' } })).toEqual({
      sql: 'SELECT * FROM table ORDER BY id ASC',
      params: [],
    })
  })

  it('range', () => {
    expect(formatSelect({ table: 'table', range: 0 })).toEqual({
      sql: 'SELECT * FROM table',
      params: [],
    })
    expect(formatSelect({ table: 'table', range: 10 })).toEqual({
      sql: 'SELECT * FROM table LIMIT ?',
      params: [10],
    })
    expect(formatSelect({ table: 'table', range: [10, 20] })).toEqual({
      sql: 'SELECT * FROM table LIMIT ? OFFSET ?',
      params: [10, 20],
    })
    expect(
      formatSelect({ table: 'table', range: { limit: 10, offset: 20 } })
    ).toEqual({
      sql: 'SELECT * FROM table LIMIT ? OFFSET ?',
      params: [10, 20],
    })
  })
})
