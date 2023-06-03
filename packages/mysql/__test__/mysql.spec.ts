import { describe, it, expect } from 'vitest'
import { execute, connection } from './mysql-server'
import { useServer } from '../src/mysql'

describe('mysql', () => {
  it('use default server', () => {
    const server = useServer()
    expect(server.type).toBe('pool')
    expect(server.config).toEqual({
      host: 'localhost',
      port: 3306,
      user: 'localhost',
      password: undefined,
    })
    expect(server.options).toBeUndefined()
    expect(server.json_key).toBeUndefined()
    expect(server.active_database).toBeUndefined()
  })

  it('change database', () => {
    const server = useServer()
    expect(server.active_database).toBeUndefined()
    expect(server.config.database).toBeUndefined()
    server.use('test')
    expect(server.active_database).toBeUndefined()
    expect(server.config.database).toBeUndefined()
    // @ts-ignore
    server.type = 'connection'
    server.use('test')
    expect(server.active_database).toBe('test')
    expect(server.config.database).toBe('test')
  })

  it('get connection', async ({ expect }) => {
    const server = useServer()
    const {
      active_database,
      connection: _connection,
      release,
    } = await server.getConnection()
    expect(active_database).toBe('test')
    expect(_connection).toBe(connection)
    expect(release).toBeDefined()
    release()
  })

  it('execute', async ({ expect }) => {
    const server = useServer()
    const result = await server.execute('test')
    expect(execute).toBeCalledWith('test')
    expect(result).toEqual({ sql: 'test', params: [] })
  })
})
