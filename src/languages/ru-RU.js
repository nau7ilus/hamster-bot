'use strict';

const Language = require('../structures/Language');

module.exports = class extends Language {
  get phrases() {
    return {
      DEFAULT: key => `${key} еще не переведен под русский язык.`,
      DEFAULT_LANGUAGE: 'Язык по умолчанию',
      ERR_GIF_FIND: ['**Произошла ошибка при поиске картинки.**', '**Попробуйте позже.**'],
      ERR_NO_PERMISSION: 'у вас нет прав на использование этой команды',
    };
  }
};
