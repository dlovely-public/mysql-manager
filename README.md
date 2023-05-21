# mysql-manager

## 目录

- [快速入门](#快速入门)
- 客户端
- 数据库
- 数据表
- 数据表操作
  - 增
  - 删
  - 改
  - 查
  - 联表

## 快速入门

### 安装

```sh
# npm
$ npm install --save mysql-manager
# yarn
$ yarn add mysql-manager
# pnpm
$ pnpm add mysql-manager
```

### 使用

```ts
// mysql-table.ts
export const table1_columns = [
  { name: 'id', readonly: true, not_null: true, has_defa: true },
  { name: 'name', readonly: false, not_null: true, has_defa: false }
]
// mysql.ts
import { createMySqlPool } from 'mysql-manager'
import { table1_columns } from './mysql-table'

const server = createMySqlPool()
export const database = server.createDataBase('database')

export const table1 = database.createTable('table1', table1_columns)
// index.ts
import { table1 } from './mysql'

!async function() {
  const result = await table1.select()
  console.log(result)
}
```
