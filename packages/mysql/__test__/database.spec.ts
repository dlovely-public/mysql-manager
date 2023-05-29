import { describe, it } from 'vitest'
import { execute } from './mysql-server'
import { DataBase } from '../src/database'

describe('database', () => {
  it('create', async ({ expect }) => {
    // @ts-ignore
    const db = new DataBase('test')
    const result = await db.create()
    expect(execute).toBeCalledWith({
      sql: 'CREATE DATABASE ?',
      params: ['test'],
    })
    expect(result).toEqual({
      sql: 'CREATE DATABASE ?',
      params: ['test'],
    })
  })

  it('drop', async ({ expect }) => {
    // @ts-ignore
    const db = new DataBase('test')
    const result = await db.drop()
    expect(execute).toBeCalledWith({
      sql: 'DROP DATABASE IF EXISTS ?',
      params: ['test'],
    })
    expect(result).toEqual({
      sql: 'DROP DATABASE IF EXISTS ?',
      params: ['test'],
    })
  })
})
