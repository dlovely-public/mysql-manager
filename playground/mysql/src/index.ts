import Koa from 'koa'
// @ts-ignore
import { mysql, user_list } from './mysql'

const app = new Koa()

app.use(async ctx => {
  const result = await user_list.select()
  ctx.body = result
})

const port = 4000
app.listen(port, () => {
  console.log('Server running on port ' + port + '...')
})
