class Piece {
  constructor(store, file, directory, enabled = true) {
    this.client = store.client;
    this.name = file.split(".")[0];
    this.enabled = enabled;
    this.store = store;
    this.directory = directory;
    console.log(this.name);
  }
}

module.exports = Piece;
