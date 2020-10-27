'use strict';

const Store = require('./Base/Store');
const Language = require('./Language');

class LanguageStore extends Store {
  constructor(client) {
    super(client, ['languages', 'языков'], Language);
  }

  get default() {
    return this.get(this.client.language) || null;
  }
}

module.exports = LanguageStore;
