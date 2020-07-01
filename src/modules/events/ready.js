// Импортируем модули сторонних разработчиков
const { DateTime } = require("luxon"); // Форматирование времени

module.exports = async (client) => {
  console.log(`\n[Ready] Бот запущен. Авторизован как ${client.user.tag // prettier-ignore
		} | Серверов: ${client.guilds.cache.size} | Пользователей: ${ // prettier-ignore
		client.users.cache.size}`) // prettier-ignore

  console.log(`[Ready] Время: ${DateTime.local().toFormat("TT")}`);
  console.log(`[Ready] RAM: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`);

  // Отправлять каждые 20 минут информацию об использованной памяти
  setInterval(() => {
    console.log(`\n[Ready] Время: ${DateTime.local().toFormat("TT")}`);
    console.log(`[Ready] RAM: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`);
  }, 20 * 60 * 1000);
};
