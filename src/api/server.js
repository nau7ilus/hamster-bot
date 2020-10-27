'use strict';

const fastify = require('fastify');
const routes = require('./routes');

module.exports = class {
  constructor(client) {
    this.client = client;
  }

  async load() {
    await this.startServer();
  }

  startServer(port = process.env.PORT || 4000) {
    this.app = fastify();
    this.loadRoutes();

    this.app
      .register(require('fastify-cors'))
      .addHook('onRequest', (req, res, done) => {
        req.client = this.client;
        done();
      })
      .listen(port, '0.0.0.0')
      .then(() => {
        console.log('[HTTP] Сервер успешно запущен на порту %d', port);
      })
      .catch(err => {
        console.error(err);
        process.exit(1);
      });
  }

  loadRoutes() {
    routes.forEach(route => {
      this.app.route(route);
    });
  }
};
