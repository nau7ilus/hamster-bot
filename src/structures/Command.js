const { readdirSync } = require('fs');

module.exports = class Command {
	#dirs;

	constructor(props, runFunction) {
		this.name = props.name;
		this.description = props.description;
		this.run = runFunction;
		if (props.hasOwnProperty('category')) {
			this.category = props.category;
		} else {
			this.#dirs = readdirSync('./src/modules/cmds');
			this.#dirs.forEach(dir => {
				const category = readdirSync(`./src/modules/cmds/${dir}`);
				if (category.includes(`${this.name}.js`)) this.category = dir;
			});
			this.#dirs = undefined;
		}

		if (props.usage) this.usage = props.usage;
		if (props.clientPermissions) this.clientPermissions = props.clientPermissions.length > 0 ? props.clientPermissions : ['SEND_MESSAGES'];
		if (props.userPermissions) this.userPermissions = props.userPermissions.length > 0 ? props.userPermissions : ['SEND_MESSAGES'];
		if (props.aliases) this.aliases = props.aliases;
		if (props.guildOnly) this.guildOnly = props.guildOnly;
		if (props.devOnly) this.devOnly = props.devOnly;
		if (props.nsfw) this.nsfw = props.nsfw;

		if (this.category === 'administration') this.userPermissions = ['ADMINISTRATOR'];
	}

	deleteMessage(message) {
		const client = require('../index.js');
		if (client.hasPermission('MANAGE_MESSAGES')) message.delete();
	}
};