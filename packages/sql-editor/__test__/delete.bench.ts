import { bench, describe } from 'vitest'
import { formatDelete } from '../src/delete'

describe('where options', () => {
  bench('options', () => {
    formatDelete({ table: 'table', where: { key: 'id', val: 0, type: '=' } })
  })
  bench('sql', () => {
    formatDelete({ table: 'table', where: { sql: ' WHERE id=?', params: [0] } })
  })
})
