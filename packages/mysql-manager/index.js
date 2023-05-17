'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./dist/mysql-manager.prod.cjs')
} else {
  module.exports = require('./dist/mysql-manager.cjs')
}
