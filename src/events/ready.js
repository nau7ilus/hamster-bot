const { DateTime } = require('luxon');
const Logger = require('../utils/Logger.js');

module.exports = async (client) => {
	Logger.event(
		Logger.setColor('#c0433f', `Бот запущен! Авторизован как ${
			Logger.setColor('orange', client.user.tag, '#c0433f')
			} | Серверов: ${client.guilds.cache.size + Logger.setColor('#c0433f')} | Пользователей: ${client.users.cache.size + Logger.setColor('#c0433f')}`)
	);

	Logger.event('Время : ' + Logger.setColor('yellow', DateTime.local().toFormat('TT')));
	Logger.event(`RAM : ${Logger.setColor('magenta', (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2))} ` + Logger.setColor('blue', 'MB'));

	let premiumGuilds = ['625036675059548220'];

	console.log(client.guilds.cache.map(guild => {
		// if (premiumGuilds.includes(guild.id)) guild.isPremium = true
		// else 
		guild.isPremium = false
	}))

	setInterval(() => {
		Logger.event('Время : ' + Logger.setColor('yellow', DateTime.local().toFormat('TT')));
		Logger.event(`RAM : ${Logger.setColor('magenta', (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2))} ` + Logger.setColor('blue', 'MB'));
	}, 20 * 60 * 1000);
}
	;