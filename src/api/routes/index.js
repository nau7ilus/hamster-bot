'use strict';

const guildController = require('../controllers/guilds');
const publicController = require('../controllers/public');
const userController = require('../controllers/users');

const checkAuth = require('../plugins/checkAuth');
const userSchema = require('../schemas/users');

const routes = [
  {
    method: 'GET',
    url: '/guilds/:guildId/:action',
    handler: guildController.getGuildData,
    preHandler: checkAuth,
  },
  {
    method: 'PATCH',
    url: '/guilds/:guildId/:action',
    handler: guildController.changeGuildData,
    preHandler: checkAuth,
  },

  { method: 'GET', url: '/public/blur', handler: publicController.blurImage },

  {
    method: 'POST',
    url: '/users/login',
    schema: userSchema.loginUser,
    handler: userController.loginUser,
  },
  { method: 'GET', url: '/users/:userID', handler: userController.getUser, preHandler: checkAuth },
];

module.exports = routes;
