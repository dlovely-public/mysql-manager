import { describe, it, expect } from 'vitest'
import { formatInsert } from '../../src/shared/insert'

describe('insert', () => {
  it('no keys', () => {
    expect(() => formatInsert({ table: 'table', datas: [] })).toThrowError(
      'unless 1 keys'
    )
    expect(() => formatInsert({ table: 'table', datas: {} })).toThrowError(
      'unless 1 keys'
    )
  })

  it('single', () => {
    expect(
      formatInsert({ table: 'table', datas: { name: 'Name', age: 18 } })
    ).toEqual({
      sql: 'INSERT INTO table (name,age) VALUES (?,?)',
      params: ['Name', 18],
    })
  })

  it('mutiple', () => {
    expect(
      formatInsert({
        table: 'table',
        datas: [
          { name: 'Name_1', age: 18 },
          { name: 'Name_2', age: 18 },
        ],
      })
    ).toEqual({
      sql: 'INSERT INTO table (name,age) VALUES (?,?),(?,?)',
      params: ['Name_1', 18, 'Name_2', 18],
    })
  })

  it('single with json', () => {
    expect(
      formatInsert({
        table: 'table',
        datas: { name: 'Name', age: 18 },
        json_key: new Map([['records', '{}']]),
      })
    ).toEqual({
      sql: 'INSERT INTO table (name,age,records) VALUES (?,?,?)',
      params: ['Name', 18, '{}'],
    })
  })

  it('mutiple with json', () => {
    expect(
      formatInsert({
        table: 'table',
        datas: [
          { name: 'Name_1', records: '{"id":0}' },
          { name: 'Name_2', age: 18 },
        ],
        json_key: new Map([['records', '{}']]),
      })
    ).toEqual({
      sql: 'INSERT INTO table (name,records,age) VALUES (?,?,?),(?,?,?)',
      params: ['Name_1', '{"id":0}', undefined, 'Name_2', '{}', 18],
    })
  })
})
