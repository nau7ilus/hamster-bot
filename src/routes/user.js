const { Router } = require("express");

const Route = require("lib/structures/Route");
// const { userLogin } = require("../controllers/user");

module.exports = class WebRoute extends Route {
  constructor(client) {
    super({ name: "user" }, client);
  }

  register(app) {
    const router = Router();
    router.get("/@me");
    // router.post("/login", userLogin);
    // router.get("/@me");
    // router.get("/:id");

    app.use(this.path, router);
  }
};
