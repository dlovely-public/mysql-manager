import { formatUpdate } from '../../src/shared/update'

describe('update', () => {
  it('normal', () => {
    expect(
      formatUpdate({ table: 'table', data: { name: 'Name', age: 18 } })
    ).toEqual({
      sql: 'UPDATE table SET name=?,age=?',
      params: ['Name', 18],
    })
  })

  it('with json', () => {
    expect(
      formatUpdate({
        table: 'table',
        data: { name: 'Name', age: 18 },
        json_key: new Map([['records', '{}']]),
      })
    ).toEqual({
      sql: 'UPDATE table SET name=?,age=?,records=?',
      params: ['Name', 18, '{}'],
    })
    expect(
      formatUpdate({
        table: 'table',
        data: { name: 'Name', records: '{id:0}' },
        json_key: new Map([['records', '{}']]),
      })
    ).toEqual({
      sql: 'UPDATE table SET name=?,records=?',
      params: ['Name', '{id:0}'],
    })
    expect(
      formatUpdate({
        table: 'table',
        data: { name: 'Name', records: null },
        json_key: new Map([['records', '{}']]),
      })
    ).toEqual({
      sql: 'UPDATE table SET name=?,records=?',
      params: ['Name', '{}'],
    })
  })
})
