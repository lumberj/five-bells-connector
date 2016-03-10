'use strict'

const co = require('co')
const backend = require('../services/backend')
const subscriber = require('../services/subscriber')
const settlementQueue = require('../services/settlementQueue')

class App {
  constructor (config) {
    this.config = config
    this.backend = backend
    this.subscriber = subscriber
    this.settlementQueue = settlementQueue
  }

  start () {
    const log = this.log
    this.settlementQueue.startPruner()

    co.wrap(this._start).call(this).catch((err) => {
      log.critical((err && err.stack) ? err.stack : err)
    })
  }

  * _start () {
    // Connects to the backend and
    // subscribes to all the ledgers in the background
    yield this.backend.connect()
    yield this.subscriber.subscribePairs(this.config.get('tradingPairs'))
  }
}

module.exports = App
