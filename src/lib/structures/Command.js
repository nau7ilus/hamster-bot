const { readdirSync } = require("fs");

module.exports = class Command {
  constructor(props, runFunction) {
    this.name = props.name;
    this.description = props.description;
    this.category = props.category
      ? props.category
      : () => {
          const cats = readdirSync("./src/cmds");
          cats.forEach((dir) => {
            const cat = readdirSync(`./src/cmds/${dir}`);
            if (cat.includes(`${this.name}.js`)) return dir;
            else return "Unknown";
          });
        };
    this.clientPermissions =
      props.clientPermissions && props.clientPermissions.length > 0
        ? props.clientPermissions
        : ["SEND_MESSAGES"];
    this.userPermissions =
      props.userPermissions && props.userPermissions.length > 0
        ? props.userPermissions
        : ["SEND_MESSAGES"];
    if (this.category === "administration") this.userPermissions = ["ADMINISTRATOR"];

    this.aliases = props.aliases;
    this.guildOnly = props.guildOnly;
    this.devOnly = props.devOnly;
    this.nsfw = props.nsfw;

    this.run = runFunction;
  }

  deleteMessage(message) {
    const client = require("../../index.js");
    if (client.hasPermission("MANAGE_MESSAGES")) message.delete();
  }
};
