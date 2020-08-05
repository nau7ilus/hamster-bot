const { Router } = require("express");

const Route = require("lib/structures/Route");
const userLogin = require("controllers/userLogin");

module.exports = class extends Route {
  constructor(client) {
    super(
      {
        name: "users",
        subRoutes: [new userLogin()],
      },
      client
    );
  }

  register(app) {
    const router = Router();
    router.get("/@me", (req, res) => {
      res.json({ test: 12 });
    });
    // router.post("/login", userLogin);
    // router.get("/@me");
    // router.get("/:id");

    app.use(this.path, router);
  }
};
