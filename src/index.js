'use strict';

require('dotenv').config();

const cachegoose = require('cachegoose');
const mongoose = require('mongoose');

const Client = require('./structures/Client');

const client = new Client({
  devs: ['422109629112254464', '395623202048704514', '266132370426429440'],
  partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
  messageCacheLifetime: 60,
  messageSweepInterval: 120,
});

cachegoose(mongoose);
mongoose.connect(
  process.env.DATABASE_URL,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  },
  err => {
    if (err) throw err;
    console.log('[Database] База данных Mongo успешно подключена.');
  },
);


// Заменить загрузку ивентов под новый хендлер
while (true) {}
//client.login();
//client.loadEvents().initializeHTTPServer();

module.exports = client;
