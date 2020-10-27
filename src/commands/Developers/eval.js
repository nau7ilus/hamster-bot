'use strict';

const Command = require('structures/Command');

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: 'eval',
      description: 'Выполнить команду',
      devOnly: true,
    });
  }
  // eslint-disable-next-line
  async run({ args, message }) {
    eval(args.join(' '));
  }
};
