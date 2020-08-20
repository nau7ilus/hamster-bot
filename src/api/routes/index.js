const userController = require("api/controllers/users");
const publicController = require("api/controllers/public");
const guildController = require("api/controllers/guilds");

const userSchema = require("api/schemas/users");
const checkAuth = require("api/plugins/checkAuth");

const routes = [
  { method: "GET", url: "/guilds/:guildId/:action", handler: guildController.getGuildData },

  { method: "GET", url: "/public/blur", handler: publicController.blurImage },

  {
    method: "POST",
    url: "/users/login",
    schema: userSchema.loginUser,
    handler: userController.loginUser,
  },
  { method: "GET", url: "/users/:userID", handler: userController.getUser, preHandler: checkAuth },
];

module.exports = routes;
