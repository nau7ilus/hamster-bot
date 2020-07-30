class Piece {
  constructor(store, file, directory, enabled = true) {
    this.client = store.client;
    this.name = file[file.length - 1].slice(0, -3);
    this.enabled = enabled;
    this.store = store;
    this.directory = directory;
  }

  toJSON() {
    return {
      directory: this.directory,
      file: this.file,
      path: this.path,
      name: this.name,
      type: this.type,
      enabled: this.enabled,
    };
  }
}

module.exports = Piece;
