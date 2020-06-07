// Экспортируем модули сторонних разработчиков
const express = require('express'); // Веб-фреймворк
const morgan = require('morgan'); // Middleware HTTP запросов
const cors = require('cors');

// Импортируем собственные модули
const Route = require('../structures/Route');
const FileUtils = require('../utils/FileUtils');

// Экспортируем класс HTTP загрузчика
module.exports = class HTTPLoader {

  // В конструкторе получаем объект клиента
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

  // Инициализация веб-сервера
  initializeHTTPServer(port = process.env.PORT || 3000) { // Используем порт, предоставленный Heroku или 3000

    // Подключаем CORS
    let whitelist = ['http://localhost:8080', 'https://test.robo-hamster.ru', 'https://robo-hamster.ru'];
    let corsOptionsDelegate = function (req, callback) {
      let corsOptions;
      if (whitelist.indexOf(req.header('Origin')) !== -1) {
        corsOptions = { origin: true }
      } else {
        corsOptions = { origin: false }
      }
      callback(null, corsOptions)
    }

    this.app = express(); // Инициализируем веб-сервер
    this.app.use(cors(corsOptionsDelegate)); // Используем CORS
    this.app.use(express.json()); // Ожидается получение JSON
    this.app.disable('x-powered-by'); // Отключаем в заголовках ответа копирайт фреймворка

    this.app.use(
      morgan(
        `\n[HTTP]
          ':method :url - IP :remote-addr - Код :status - Размер :res[content-length] B - Время обработки :response-time ms'`
      )
    );

    this.app.listen(port, () => {
      console.log(`\n[HTTP] Сервер запущен на порту ${port}`);
    });

    return this.initializeRoutes();
  }

  // Инициализация маршрутов
  initializeRoutes(dirPath = 'src/api') {
    let success = 0;
    let failed = 0;
    return FileUtils.requireDirectory(dirPath, NewRoute => {
      if (Object.getPrototypeOf(NewRoute) !== Route) return;

      this.addRoute(new NewRoute(this.client)) ? success++ : failed++;
    }).then(() => {
      if (failed)
        console.warn(`[HTTP] Успешно загружено маршрутов: ${success}, в ${failed} ошибка.`);
      else
        console.log(`[HTTP] Успешно загружено маршрутов: ${success}`);
    });
  }

  // Добавляем новый маршрут
  addRoute(route) {
    if (!(route instanceof Route)) {
      console.log(`[HTTP] ${route} ошибка загрузки, не является роутом`);
      return false;
    }

    route._register(this.app);
    this.httpRoutes.push(route);
    return true;
  }
};