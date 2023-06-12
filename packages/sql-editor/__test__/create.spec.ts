import { describe, it, expect } from 'vitest'
import {
  type Create,
  formatCreateDatabase,
  formatCreateTable,
} from '../src/create'

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

describe('create table', () => {
  const column = {
    name: 'id',
    type: 'int',
  } as Create.NumberColumn
  const columns = [column]

  it('without columns', () => {
    expect(() =>
      formatCreateTable({
        name: 'table',
        database: 'database',
        columns: [],
      })
    ).toThrowError('columns is required')
  })

  it('columns', () => {
    expect(
      formatCreateTable({
        name: 'table',
        database: 'database',
        columns,
      })
    ).toEqual({
      sql: `\
-- ?.? definition
CREATE TABLE ? (
  ? int
)`,
      params: ['database', 'table', 'table', 'id'],
    })
  })

  it('char column', () => {
    expect(() =>
      formatCreateTable({
        name: 'table',
        database: 'database',
        columns: [
          // @ts-expect-error length是必需属性
          {
            name: 'name',
            type: 'char',
          },
        ],
      })
    ).toThrowError('length is required')
    expect(
      formatCreateTable({
        name: 'table',
        database: 'database',
        columns: [
          {
            name: 'name',
            type: 'char',
            length: 50,
          },
        ],
      })
    ).toEqual({
      sql: `\
-- ?.? definition
CREATE TABLE ? (
  ? char(50)
)`,
      params: ['database', 'table', 'table', 'name'],
    })
  })

  it('json column', () => {
    expect(
      formatCreateTable({
        name: 'table',
        database: 'database',
        columns: [
          // @ts-expect-error json类型不允许有default
          {
            name: 'record',
            type: 'json',
            not_null: true,
            default: {},
          },
        ],
      })
    ).toEqual({
      sql: `\
-- ?.? definition
CREATE TABLE ? (
  ? json NOT NULL
)`,
      params: ['database', 'table', 'table', 'record'],
    })
  })

  it('enum or set column', () => {
    expect(() =>
      formatCreateTable({
        name: 'table',
        database: 'database',
        columns: [
          {
            name: 'status',
            type: 'enum',
            values: [],
            default: 'active',
          },
        ],
      })
    ).toThrowError('values is required')
    expect(
      formatCreateTable({
        name: 'table',
        database: 'database',
        columns: [
          {
            name: 'status',
            type: 'enum',
            values: ['active', 'inactive'],
            default: 'active',
          },
        ],
      })
    ).toEqual({
      sql: `\
-- ?.? definition
CREATE TABLE ? (
  ? enum(?,?) DEFAULT ?
)`,
      params: [
        'database',
        'table',
        'table',
        'status',
        'active',
        'inactive',
        'active',
      ],
    })
  })

  it('if not exists', () => {
    expect(
      formatCreateTable({
        name: 'table',
        database: 'database',
        if_not_exists: true,
        columns,
      })
    ).toEqual({
      sql: `\
-- ?.? definition
CREATE TABLE IF NOT EXISTS ? (
  ? int
)`,
      params: ['database', 'table', 'table', 'id'],
    })
  })

  it('table comment', () => {
    expect(
      formatCreateTable({
        name: 'table',
        database: 'database',
        columns,
        comment: 'comment',
      })
    ).toEqual({
      sql: `\
-- ?.? definition
CREATE TABLE ? (
  ? int
) COMMENT=?`,
      params: ['database', 'table', 'table', 'id', 'comment'],
    })
  })

  it('column comment', () => {
    expect(
      formatCreateTable({
        name: 'table',
        database: 'database',
        columns: [
          {
            ...column,
            comment: 'comment',
          },
        ],
      })
    ).toEqual({
      sql: `\
-- ?.? definition
CREATE TABLE ? (
  ? int COMMENT ?
)`,
      params: ['database', 'table', 'table', 'id', 'comment'],
    })
  })

  it('engine', () => {
    expect(
      formatCreateTable({
        name: 'table',
        database: 'database',
        columns,
        engine: 'InnoDB',
      })
    ).toEqual({
      sql: `\
-- ?.? definition
CREATE TABLE ? (
  ? int
) ENGINE=?`,
      params: ['database', 'table', 'table', 'id', 'InnoDB'],
    })
  })

  it('table charset', () => {
    expect(
      formatCreateTable({
        name: 'table',
        database: 'database',
        columns,
        charset: 'utf8mb4',
      })
    ).toEqual({
      sql: `\
-- ?.? definition
CREATE TABLE ? (
  ? int
) CHARSET=?`,
      params: ['database', 'table', 'table', 'id', 'utf8mb4'],
    })
  })

  it('column charset', () => {
    expect(
      formatCreateTable({
        name: 'table',
        database: 'database',
        columns: [
          {
            ...column,
            charset: 'utf8mb4',
          },
        ],
      })
    ).toEqual({
      sql: `\
-- ?.? definition
CREATE TABLE ? (
  ? int CHARACTER SET ?
)`,
      params: ['database', 'table', 'table', 'id', 'utf8mb4'],
    })
  })

  it('table collate', () => {
    expect(
      formatCreateTable({
        name: 'table',
        database: 'database',
        columns,
        collate: 'utf8mb4_unicode_ci',
      })
    ).toEqual({
      sql: `\
-- ?.? definition
CREATE TABLE ? (
  ? int
) COLLATE=?`,
      params: ['database', 'table', 'table', 'id', 'utf8mb4_unicode_ci'],
    })
  })

  it('column collate', () => {
    expect(
      formatCreateTable({
        name: 'table',
        database: 'database',
        columns: [
          {
            ...column,
            collate: 'utf8mb4_unicode_ci',
          },
        ],
      })
    ).toEqual({
      sql: `\
-- ?.? definition
CREATE TABLE ? (
  ? int COLLATE ?
)`,
      params: ['database', 'table', 'table', 'id', 'utf8mb4_unicode_ci'],
    })
  })

  it('not_null', () => {
    expect(
      formatCreateTable({
        name: 'table',
        database: 'database',
        columns: [
          {
            ...column,
            not_null: true,
          },
        ],
      })
    ).toEqual({
      sql: `\
-- ?.? definition
CREATE TABLE ? (
  ? int NOT NULL
)`,
      params: ['database', 'table', 'table', 'id'],
    })
  })

  it('auto_increment', () => {
    expect(
      formatCreateTable({
        name: 'table',
        database: 'database',
        columns: [
          {
            ...column,
            auto_increment: true,
          },
        ],
      })
    ).toEqual({
      sql: `\
-- ?.? definition
CREATE TABLE ? (
  ? int AUTO_INCREMENT
)`,
      params: ['database', 'table', 'table', 'id'],
    })
  })

  it('normal default', () => {
    expect(
      formatCreateTable({
        name: 'table',
        database: 'database',
        columns: [
          {
            ...column,
            default: 1,
          },
        ],
      })
    ).toEqual({
      sql: `\
-- ?.? definition
CREATE TABLE ? (
  ? int DEFAULT ?
)`,
      params: ['database', 'table', 'table', 'id', 1],
    })
  })

  it('special default', () => {
    expect(
      formatCreateTable({
        name: 'table',
        database: 'database',
        columns: [
          {
            name: 'time',
            type: 'timestamp',
            default: {},
          },
        ],
      })
    ).toEqual({
      sql: `\
-- ?.? definition
CREATE TABLE ? (
  ? timestamp DEFAULT CURRENT_TIMESTAMP
)`,
      params: ['database', 'table', 'table', 'time'],
    })
    expect(
      formatCreateTable({
        name: 'table',
        database: 'database',
        columns: [
          {
            name: 'time',
            type: 'timestamp',
            default: {
              on_update: true,
            },
          },
        ],
      })
    ).toEqual({
      sql: `\
-- ?.? definition
CREATE TABLE ? (
  ? timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)`,
      params: ['database', 'table', 'table', 'time'],
    })
  })

  it('single primary_key', () => {
    expect(
      formatCreateTable({
        name: 'table',
        database: 'database',
        columns: [
          {
            ...column,
            primary_key: true,
          },
        ],
      })
    ).toEqual({
      sql: `\
-- ?.? definition
CREATE TABLE ? (
  ? int,
  PRIMARY KEY (?)
)`,
      params: ['database', 'table', 'table', 'id', 'id'],
    })
  })

  it('multiple primary_key', () => {
    expect(
      formatCreateTable({
        name: 'table',
        database: 'database',
        columns: [
          {
            ...column,
            primary_key: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: 255,
            primary_key: true,
          },
        ],
      })
    ).toEqual({
      sql: `\
-- ?.? definition
CREATE TABLE ? (
  ? int,
  ? varchar(255),
  PRIMARY KEY (?)
)`,
      params: ['database', 'table', 'table', 'id', 'name', 'id'],
    })
  })

  it('unique', () => {
    expect(
      formatCreateTable({
        name: 'table',
        database: 'database',
        columns: [
          {
            ...column,
            unique: true,
          },
        ],
      })
    ).toEqual({
      sql: `\
-- ?.? definition
CREATE TABLE ? (
  ? int,
  UNIQUE KEY (?)
)`,
      params: ['database', 'table', 'table', 'id', 'id'],
    })
  })

  it('unique with name', () => {
    expect(
      formatCreateTable({
        name: 'table',
        database: 'database',
        columns: [
          {
            ...column,
            unique: 'name',
          },
        ],
      })
    ).toEqual({
      sql: `\
-- ?.? definition
CREATE TABLE ? (
  ? int,
  UNIQUE KEY ? (?)
)`,
      params: ['database', 'table', 'table', 'id', 'name', 'id'],
    })
  })

  it('check', () => {
    expect(
      formatCreateTable({
        name: 'table',
        database: 'database',
        columns: [
          {
            name: 'age',
            type: 'int',
            check: 'age > 0',
          },
        ],
      })
    ).toEqual({
      sql: `\
-- ?.? definition
CREATE TABLE ? (
  ? int,
  CHECK (?)
)`,
      params: ['database', 'table', 'table', 'age', 'age > 0'],
    })
    expect(
      formatCreateTable({
        name: 'table',
        database: 'database',
        columns: [
          {
            name: 'age',
            type: 'int',
            check: { rule: 'age > 0' },
          },
        ],
      })
    ).toEqual({
      sql: `\
-- ?.? definition
CREATE TABLE ? (
  ? int,
  CHECK (?)
)`,
      params: ['database', 'table', 'table', 'age', 'age > 0'],
    })
  })

  it('check with name', () => {
    expect(
      formatCreateTable({
        name: 'table',
        database: 'database',
        columns: [
          {
            name: 'age',
            type: 'int',
            check: {
              name: 'check_age',
              rule: 'age > 0',
            },
          },
        ],
      })
    ).toEqual({
      sql: `\
-- ?.? definition
CREATE TABLE ? (
  ? int,
  CONSTRAINT ? CHECK (?)
)`,
      params: ['database', 'table', 'table', 'age', 'check_age', 'age > 0'],
    })
  })

  it('foreign_key', () => {
    expect(
      formatCreateTable({
        name: 'table',
        database: 'database',
        columns: [
          {
            name: 'user_id',
            type: 'int',
            foreign_key: {
              name: 'fk_user_id',
              table: 'user',
              table_key: 'id',
            },
          },
        ],
      })
    ).toEqual({
      sql: `\
-- ?.? definition
CREATE TABLE ? (
  ? int,
  KEY ? (?),
  CONSTRAINT ? FOREIGN KEY (?) REFERENCES ? (?)
)`,
      params: [
        'database',
        'table',
        'table',
        'user_id',
        'fk_user_id',
        'user_id',
        'fk_user_id',
        'user_id',
        'user',
        'id',
      ],
    })

    expect(
      formatCreateTable({
        name: 'table',
        database: 'database',
        columns: [
          {
            name: 'user_id',
            type: 'int',
            foreign_key: {
              name: 'fk_user_id',
              table: 'user',
              table_key: 'id',
              on_update: 'cascade',
            },
          },
        ],
      })
    ).toEqual({
      sql: `\
-- ?.? definition
CREATE TABLE ? (
  ? int,
  KEY ? (?),
  CONSTRAINT ? FOREIGN KEY (?) REFERENCES ? (?) ON UPDATE CASCADE
)`,
      params: [
        'database',
        'table',
        'table',
        'user_id',
        'fk_user_id',
        'user_id',
        'fk_user_id',
        'user_id',
        'user',
        'id',
      ],
    })

    expect(
      formatCreateTable({
        name: 'table',
        database: 'database',
        columns: [
          {
            name: 'user_id',
            type: 'int',
            foreign_key: {
              name: 'fk_user_id',
              table: 'user',
              table_key: 'id',
              on_delete: 'cascade',
            },
          },
        ],
      })
    ).toEqual({
      sql: `\
-- ?.? definition
CREATE TABLE ? (
  ? int,
  KEY ? (?),
  CONSTRAINT ? FOREIGN KEY (?) REFERENCES ? (?) ON DELETE CASCADE
)`,
      params: [
        'database',
        'table',
        'table',
        'user_id',
        'fk_user_id',
        'user_id',
        'fk_user_id',
        'user_id',
        'user',
        'id',
      ],
    })
  })
})
