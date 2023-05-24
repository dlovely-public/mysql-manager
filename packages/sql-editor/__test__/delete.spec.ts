import { describe, it, expect } from 'vitest'
import { formatDelete } from '../src/delete'

describe('delete', () => {
  it('normal', () => {
    expect(
      formatDelete({ table: 'table', where: { key: 'id', val: 0, type: '=' } })
    ).toEqual({
      sql: 'DELETE FROM table WHERE id=?',
      params: [0],
    })
  })
})
