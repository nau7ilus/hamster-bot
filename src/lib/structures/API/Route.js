module.exports = class Route {
  constructor(name, client) {
    this.name = name;
    this.client = client;
  }

  get path() {
    return `/${this.name}`;
  }

  _register(app) {
    if (this.subRoutes) {
      this.subRoutes.forEach((route) => {
        route._register(app);
      });
    }
    this.register(app);
  }
};
