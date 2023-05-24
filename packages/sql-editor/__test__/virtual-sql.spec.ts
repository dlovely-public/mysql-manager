import { describe, it, expect } from 'vitest'
import { isSql, formatSql, createSql } from '../src/virtual-sql'

describe('virtual-sql', () => {
  it('isSql', () => {
    expect(isSql('test')).toBe(true)
    expect(isSql({})).toBe(false)
    expect(isSql({ sql: 'test' })).toBe(false)
    expect(isSql({ sql: 'test', params: [] })).toBe(true)
  })

  it('formatSql', () => {
    expect(formatSql(undefined)).toEqual({ sql: '', params: [] })
    expect(formatSql('test')).toEqual({ sql: 'test', params: [] })
    expect(formatSql({ sql: 'test' })).toEqual({
      sql: 'test',
      params: [],
    })
    expect(formatSql({ params: ['val'] })).toEqual({
      sql: '',
      params: [],
    })
    expect(formatSql({ sql: 'test', params: ['val'] })).toEqual({
      sql: 'test',
      params: ['val'],
    })
  })

  it('formatSql', () => {
    expect(createSql('test')).toEqual({ sql: 'test', params: [] })
    expect(createSql('test', 1, 'a')).toEqual({
      sql: 'test',
      params: [1, 'a'],
    })
  })
})
