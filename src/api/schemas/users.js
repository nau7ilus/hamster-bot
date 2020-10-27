'use strict';

exports.loginUser = {
  description: 'Авторизация пользователя через Discord OAuth 2.0',
  tags: ['users'],
  summary: 'Генерирует токен для дальнейших запросов',
  body: {
    type: 'object',
    required: ['code', 'clientId', 'redirectUri'],
    properties: {
      clientId: { type: 'string' },
      code: { type: 'string' },
      redirectUri: { type: 'string' },
    },
  },
  response: {
    200: {
      description: 'Успешная обработка запроса',
      type: 'object',
      properties: {
        access_token: { type: 'string' },
        token_type: { type: 'string' },
      },
    },
  },
};
