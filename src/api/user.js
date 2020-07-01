const { Router } = require("express");

const Route = require("../structures/Route");
const EndpointUtils = require("../utils/EndpointUtils");

module.exports = class WebRoute extends Route {
  constructor(client) {
    super(
      {
        name: "user",
      },
      client
    );
  }

  register(app) {
    const router = Router();
    router.get("/@me", EndpointUtils.authenticate(this, false, true), (req, res) => {
      return res.json({ user: req.user, guilds: req.guilds });
    });

    app.use(this.path, router);
  }
};
