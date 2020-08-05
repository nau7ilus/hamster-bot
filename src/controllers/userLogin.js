const FormData = require("form-data");
const { Router } = require("express");
const { sign } = require("jsonwebtoken");
const { post } = require("axios");

const client = require("../index");
const Route = require("lib/structures/Route");
const ApplicationError = require("lib/structures/API/ApplicationError");

const API_URL = "https://discord.com/api";

module.exports = class extends Route {
  constructor(client) {
    super(
      {
        name: "login",
        parent: "users",
      },
      client
    );
  }

  register(app) {
    const router = Router();

    router.get("/", async (req, res) => {
      const { code } = req.body;
      if (!code) {
        return res
          .status(400)
          .json(new ApplicationError("Не был указан код авторизации", 400, 20001));
      }
      try {
        const { access_token, token_type, scope } = await this._tokenRequest(code);

        // Проверим наличие необходимых данных
        if (scope !== "identify guilds") {
          return res
            .status(400)
            .json(
              new ApplicationError(
                "Получены не все данные. Возможно, исходная ссылка изменена.",
                400
              )
            );
        }

        const token = sign({ access_token, token_type }, process.env.JWT_SECRET, {
          expiresIn: "1h",
        });

        return res.json({ token });
      } catch (err) {
        console.error(err);
        console.error(err.headers);
        res
          .status(500)
          .json(new ApplicationError("Произошла ошибка при запросе токена у Discord", 500, 20002));
      }
    });

    app.use(this.path, router);
  }

  async _tokenRequest(code) {
    const body = new FormData();
    body.append("client_id", client.user.id);
    body.append("client_secret", process.env.DISCORD_SECRET);
    body.append("grant_type", "authorization_code");
    body.append("redirect_uri", process.env.WEBSITE_URL);
    body.append("scope", "guilds identify");
    body.append("code", code);

    const req = await post(`${API_URL}/oauth2/token?grant_type=authorization_code`, body);
    return await req.json();
  }
};
