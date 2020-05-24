const Route = require('../structures/Route');
const FileUtils = require('../utils/FileUtils');
const chalk = require('chalk');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

module.exports = class HTTPLoader {
  constructor(client) {
    this.client = client;

    this.httpServer = null;
    this.httpRoutes = [];
  }

  async load() {
    try {
      await this.initializeHTTPServer('/api');
      await this.initializeHTTPServer('//api');
      this.client.httpServer = this.app;
      this.client.httpRoutes = this.httpRoutes;
      return true;
    } catch (err) {
      console.error(err);
    }
  }

  initializeHTTPServer(port = process.env.PORT || 3000) {
    let whitelist = ['http://localhost:8080', 'https://test.robo-hamster.ru', 'https://robo-hamster.ru']
    let corsOptionsDelegate = function (req, callback) {
      let corsOptions;
      if (whitelist.indexOf(req.header('Origin')) !== -1) {
        corsOptions = { origin: true } // reflect (enable) the requested origin in the CORS response
      } else {
        corsOptions = { origin: false } // disable CORS for this request
      }
      callback(null, corsOptions) // callback expects two parameters: error and options
    }

    this.app = express();
    this.app.use(cors(corsOptionsDelegate));
    this.app.use(express.json());
    this.app.disable('x-powered-by');

    this.app.use(
      morgan(
        `${chalk.cyan('[HTTP]')} ${chalk.green(
          ':method :url - IP :remote-addr - Код :status - Размер :res[content-length] B - Время обработки :response-time ms'
        )}`
      )
    );

    this.app.listen(port, () => {
      this.client.log(`Сервер работает на порту ${port}`, {
        tags: ['HTTP'],
        color: 'green',
      });
    });

    return this.initializeRoutes();
  }

  // Routes

  initializeRoutes(dirPath = 'src/api') {
    let success = 0;
    let failed = 0;
    return FileUtils.requireDirectory(dirPath, NewRoute => {
      if (Object.getPrototypeOf(NewRoute) !== Route) return;

      this.addRoute(new NewRoute(this.client)) ? success++ : failed++;
    }).then(() => {
      if (failed)
        this.client.error(`${success} HTTP роуты загружены, ${failed} ошибка.`);
      else
        this.client.log(`Все ${success} HTTP роуты загружены без ошибок.`, {
          tags: ['HTTP'],
          color: 'green',
        });
    });
  }

  /**
   * Add a new Route
   * @param {Route} route - Route to be added
   */
  addRoute(route) {
    if (!(route instanceof Route)) {
      console.log(`${route} ошибка загрузки, не является роутом`);
      return false;
    }

    route._register(this.app);
    this.httpRoutes.push(route);
    return true;
  }
};
