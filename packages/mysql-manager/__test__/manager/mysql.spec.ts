import { createMysqlServer, createMysqlPool } from '../../src/manager/mysql'
import { default_config } from '../../src/manager/config'

describe('mysql', () => {
  it('extra database config', () => {
    const server = createMysqlServer({ database: 'database' })
    expect(server.config).toEqual(default_config)
    const pool = createMysqlPool({ database: 'database' })
    expect(pool.config).toEqual(default_config)
  })

  it('server connection', async ({ expect }) => {
    const server = createMysqlServer()
    const { connection, release } = await server.getConnection()
    expect(connection).toBe(Symbol.for('test connection'))
    expect(connection).toBe(server.connection)
    release()
    expect(server.connection).toBeUndefined()
  })

  it('mysql server', () => {
    const server_1 = createMysqlServer()
    const server_2 = createMysqlServer()
    expect(server_1).toBe(server_2)

    const server_3 = createMysqlServer({ user: 'root' })
    expect(server_3).toBe(server_1)
    expect(server_3).toBe(server_2)
  })

  it('mysql pool', () => {
    const pool_1 = createMysqlPool()
    const pool_2 = createMysqlPool()
    expect(pool_1).toBe(pool_2)

    const pool_3 = createMysqlPool({ user: 'root' })
    expect(pool_3).toBe(pool_1)
    expect(pool_3).toBe(pool_2)
  })
})
