import { describe, it, expect } from 'vitest'
import { formatCreateDatabase } from '../src/create'

describe('create database', () => {
  it('just name', () => {
    expect(formatCreateDatabase({ name: 'test' })).toEqual({
      sql: 'CREATE DATABASE ?',
      params: ['test'],
    })
  })

  it('if not exists', () => {
    expect(
      formatCreateDatabase({
        name: 'test',
        if_not_exists: true,
      })
    ).toEqual({
      sql: 'CREATE DATABASE IF NOT EXISTS ?',
      params: ['test'],
    })
  })

  it('charset', () => {
    expect(
      formatCreateDatabase({
        name: 'test',
        charset: 'utf8mb4',
      })
    ).toEqual({
      sql: 'CREATE DATABASE ? CHARACTER SET ?',
      params: ['test', 'utf8mb4'],
    })
  })

  it('collate', () => {
    expect(
      formatCreateDatabase({
        name: 'test',
        collate: 'utf8mb4_unicode_ci',
      })
    ).toEqual({
      sql: 'CREATE DATABASE ? COLLATE ?',
      params: ['test', 'utf8mb4_unicode_ci'],
    })
  })
})
