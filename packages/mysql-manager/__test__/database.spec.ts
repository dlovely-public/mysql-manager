import { createMysqlServer, createMysqlPool } from '../src/mysql'
import { createDataBase } from '../src/database'

describe('database', () => {
  it('no active database', () => {
    expect(() => {
      createDataBase('database_1', false)
    }).toThrowError('no active server')
  })

  it('create by cache', () => {
    const database_1 = createMysqlServer().createDataBase('database_1')
    const database_2 = createDataBase('database_1', false)
    expect(database_1).toBe(database_2)
    expect(database_1.is_pool).toBe(false)
    const database_3 = createMysqlPool().createDataBase('database_3')
    const database_4 = createDataBase('database_3')
    expect(database_3).toBe(database_4)
    expect(database_3.is_pool).toBe(true)
  })

  it('create after clear cache', () => {
    const server = createMysqlServer()
    const database_1 = server.createDataBase('database_1')
    server.cleanUpCache()
    const database_2 = createDataBase('database_1', false)
    expect(database_1).not.toBe(database_2)
    expect(database_1).toEqual(database_2)
  })

  it('clear cache', () => {
    const server = createMysqlServer()
    server.createDataBase('database_1')
    server.createDataBase('database_2')
    server.createDataBase('database_3')
    expect([...server.database_cache.keys()]).toEqual([
      'database_1',
      'database_2',
      'database_3',
    ])
    server.cleanUpCache('database_1')
    expect([...server.database_cache.keys()]).toEqual([
      'database_2',
      'database_3',
    ])
    server.cleanUpCache()
    expect([...server.database_cache.keys()]).toEqual([])
  })
})
