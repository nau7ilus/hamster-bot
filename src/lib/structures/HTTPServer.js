const express = require("express");
const morgan = require("morgan");
const { readdirSync } = require("fs");

const Route = require("./Route");

module.exports = class HTTPServer {
  constructor(client) {
    this.client = client;

    this.httpServer = null;
    this.httpRoutes = [];
  }

  async load() {
    try {
      await this.initializeHTTPServer();
      this.client.httpServer = this.app;
      this.client.httpRoutes = this.httpRoutes;
      return true;
    } catch (err) {
      console.error(err);
    }
  }

  initializeHTTPServer(port = process.env.PORT || 3000) {
    this.app = express();
    this.app.use(express.json());
    this.app.disable("x-powered-by");

    this.app.use(
      morgan(
        `\n[HTTP]
          ':method :url - IP :remote-addr - Код :status - Размер :res[content-length] B - Время обработки :response-time ms'`
      )
    );

    this.app.listen(port, () => {
      console.log(`[HTTP] Сервер запущен на порту ${port}`);
    });

    return this.initializeRoutes();
  }

  initializeRoutes(dirPath = "routes") {
    let success = 0;
    let failed = 0;
    const files = readdirSync(`./src/${dirPath}`).filter((name) => name.endsWith(".js"));
    try {
      files.forEach((fileName) => {
        const NewRoute = require(`${dirPath}/${fileName}`);
        if (Object.getPrototypeOf(NewRoute) !== Route) return;
        this.addRoute(new NewRoute(this.client)) ? success++ : failed++;
      });
    } catch (err) {
      console.log(err);
    }

    console.log(`[HTTP] Успешно загружено ${success} маршрута, в ${failed} ошибка`);
  }

  // Добавляем новый маршрут
  addRoute(route) {
    if (!(route instanceof Route)) {
      console.log(`[HTTP] ${route.name} ошибка загрузки, не является инстансом роута`);
      return false;
    }

    route._register(this.app);
    this.httpRoutes.push(route);
    console.log(`[HTTP] Маршрут /${route.name} успешно загрузки`);
    return true;
  }
};
