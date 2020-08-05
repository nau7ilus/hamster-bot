const Command = require("lib/structures/Command");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "eval",
      description: "Выполнить команду",
      devOnly: true,
    });
  }

  async run(client, message, args) {
    eval(args.join(" "));
  }
};
