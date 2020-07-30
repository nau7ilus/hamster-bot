module.exports = class Route {
  constructor(options, client) {
    this.name = options.name;
    this.parentRoute = options.parent || "";
    this.client = client;
    this.subRoutes = null;
  }

  get path() {
    return `${this.parentRoute ? this.parentRoute.path : ""}/${this.name}`;
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
