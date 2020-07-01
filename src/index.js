// Импортируем модули сторонних разработчиков
const { connect } = require('mongoose'); // База данных
require('dotenv/config');

// Импортируем модули отечественной разработки
const Client = require('./structures/Client');
const Guild = require('./api/models/Guild');

// Оглашаем клиента
const client = new Client(
    process.env.DISCORD_TOKEN, // Токен
    // Разработчики
    [
        "422109629112254464", // Филипп
        "336207279412215809", // Артем
        "408740341135704065" // Андрей
    ]);

client
    .loadCommands('./src/modules/cmds/') // Загружаем команды
    .loadEvents('./src/modules/events/') // Загружаем события
    .initializeLoaders(); // Запускаем HTTP загрузчик

// Подключаемся к базе данных
connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
}, async (err) => {
    if (err) throw err;
    console.log('[Database] База данных Mongo успешно подключена.');
    client.setSettings(await Guild.find({})); // Устанавливаем настройки серверов для клиента
});

// Экспортируем клиента
module.exports = client;