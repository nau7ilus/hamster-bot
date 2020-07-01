const Command = require('../../../structures/Command');

module.exports = new Command({
    name: 'eval',
    description: 'Выполнить команду',
    devOnly: true
}, async (client, message, args) => {
    eval(args.join(" "));
})