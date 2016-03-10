'use strict'
const loadConnectorConfig = require('./lib/config')

const App = require('./app')
const Server = require('./server')

function createServer () {
  const config = loadConnectorConfig()
  const app = new App(config)
  return new Server(app)
}

function _listen () {
  const server = createServer()
  server.listen()
}

const server = createServer()

module.exports = {
  app: server,
  _test: {
    BalanceCache: require('./lib/balance-cache'),
    balanceCache: require('./services/balance-cache'),
    loadConnectorConfig: require('./lib/config'),
    SettlementQueue: require('./lib/settlementQueue'),
    config: server.app.config,
    logger: require('./services/log'),
    backend: server.app.backend
  }
}

if (!module.parent) {
  _listen()
}
