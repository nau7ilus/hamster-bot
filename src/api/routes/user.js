const { Router } = require("express");

const Route = require("../../structures/Route");
// const { userLogin } = require("../controllers/user");

module.exports = class WebRoute extends Route {
  constructor() {
    super({ name: "user" });
  }

  register(app) {
    const router = Router();
    // router.post("/login", userLogin);
    // router.get("/@me");
    // router.get("/:id");

    app.use(this.path, router);
  }
};
