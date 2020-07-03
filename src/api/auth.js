const { Router } = require("express");

const Route = require("../structures/Route");
const EndpointUtils = require("../utils/EndpointUtils");

module.exports = class WebRoute extends Route {
  constructor(client) {
    super(
      {
        name: "auth",
      },
      client
    );
  }

  register(app) {
    const router = Router();
    router.post("/addrole", EndpointUtils.addRole(this, false, true));

    router.post("/removerole", EndpointUtils.removeRole(this, false, true));

    app.use(this.path, router);
  }
};
