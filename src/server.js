'use strict'

const compress = require('koa-compress')
const serve = require('koa-static')
const route = require('koa-route')
const errorHandler = require('five-bells-shared/middlewares/error-handler')
const koa = require('koa')
const path = require('path')
const logger = require('koa-mag')
const log = require('./services/log')

const metadata = require('./controllers/metadata')
const health = require('./controllers/health')
const pairs = require('./controllers/pairs')
const payments = require('./controllers/payments')
const quote = require('./controllers/quote')
const notifications = require('./controllers/notifications')

const passport = require('koa-passport')

class Server {
  constructor (app) {
    this.app = app
    this.config = app.config
    const koaApp = this.koaApp = koa()

    // Configure passport
    require('./services/auth')

    // Logger
    koaApp.use(logger())
    koaApp.use(errorHandler({log: log('error-handler')}))
    koaApp.use(passport.initialize())

    koaApp.use(route.get('/', metadata.getResource))
    koaApp.use(route.get('/health', health.getResource))
    koaApp.use(route.get('/pairs', pairs.getCollection))
    koaApp.use(route.put('/payments/:uuid', payments.put))
    koaApp.use(route.get('/quote', quote.get))
    koaApp.use(route.post('/notifications', notifications.post))

    // Serve static files
    koaApp.use(serve(path.join(__dirname, 'public')))

    // Compress
    koaApp.use(compress())
  }

  listen () {
    const config = this.config
    const app = this.app

    if (config.getIn(['server', 'secure'])) {
      const https = require('https')
      const tls = config.get('tls')

      const options = {
        port: config.getIn(['server', 'port']),
        host: config.getIn(['server', 'bind_ip']),
        key: tls.key,
        cert: tls.cert,
        ca: tls.ca,
        crl: tls.crl,
        requestCert: config.getIn(['auth', 'client_certificates_enabled']),

        // Certificates are checked in the passport-client-cert middleware
        // Authorization check is disabled here to allow clients to connect
        // to some endpoints without presenting client certificates, or using a
        // different authentication method (e.g., Basic Auth)
        rejectUnauthorized: false
      }

      https.createServer(
        options, this.koaApp.callback()).listen(config.getIn(['server', 'port']))
    } else {
      this.koaApp.listen(config.getIn(['server', 'port']))
    }

    log('app').info('connector listening on ' + config.getIn(['server', 'bind_ip']) + ':' +
      config.getIn(['server', 'port']))
    log('app').info('public at ' + config.getIn(['server', 'base_uri']))
    for (let pair of config.get('tradingPairs')) {
      log('app').info('pair', pair)
    }

    app.start()
  }

  callback () {
    return this.koaApp.callback()
  }
}

module.exports = Server
