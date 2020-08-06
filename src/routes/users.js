const FormData = require("form-data");
const { Router } = require("express");
const { sign } = require("jsonwebtoken");
const { get, post } = require("axios");

const Route = require("lib/structures/API/Route");
const APIError = require("lib/structures/API/ApiError");
const checkAuth = require("middlewares/checkAuth");
const Guild = require("lib/models/Guild");
const { verifiedRoles } = require("lib/utils/constants");

const API_URL = "https://discord.com/api";

module.exports = class extends Route {
  constructor(client) {
    super("users", client);
  }

  register(app) {
    const router = Router();

    router.post("/login", async (req, res) => {
      // Проверяем наличие кода
      const { code } = req.body;
      if (!code) {
        return res
          .status(400)
          .json(
            new APIError({ message: "Не был указан код авторизации", status: 400, code: 20001 })
          );
      }

      try {
        // Запрашиваем токен через Discord API
        const { access_token, token_type, scope } = await this._tokenRequest(code);

        // Проверим факт изменения ссылки
        if (scope !== process.env.EXPECT_SCOPES) {
          return res.status(401).json(
            new APIError({
              message: "Получены не все данные. Возможно, исходная ссылка изменена.",
              status: 401,
              details: { received: scope, expected: process.env.EXPECT_SCOPES },
            })
          );
        }

        // Создаем JWT и отправляем его пользователю
        const token = sign({ access_token, token_type }, process.env.JWT_PRIVATE, {
          expiresIn: "1h",
        });
        return res.json({ token });
      } catch (err) {
        console.log(err);
        res.status(500).json(
          new APIError({
            message: "Произошла ошибка при запросе токена у Discord",
            code: 20002,
            detail: err,
          })
        );
      }
    });

    router.get("/:userID", checkAuth, async (req, res) => {
      const query = req.query && req.query.q ? req.query.q : "guilds identify";
      const { userID } = req.params;
      if (!userID) {
        return res
          .status(400)
          .json(new APIError({ message: "Не указан userID", status: 400, code: 20005 }));
      }

      const response = {};
      if (userID == "@me") {
        if (query.includes("identify")) response.identify = await this._fetchUser(req.userData);

        if (query.includes("guilds")) response.guilds = await this._fetchGuilds(req.userData);
      } else
        res.status(403).json(
          new APIError({
            message: "Отсутствует доступ",
            status: 403,
            code: 20004,
            details: { userID },
          })
        );

      // Проверка полученных данных
      query.split(" ").forEach((name) => {
        if (!response[name]) {
          res.status(500).json(
            new APIError({
              message: "Произошла ошибка при получении данных",
              details: { userID, query, name },
            })
          );
          return false;
        }
      });

      res.status(200).json({ status: 200, request: { userID, query }, response });
    });

    app.use(this.path, router);
  }

  _fetchUser(userData) {
    return this._request("/users/@me", userData);
  }

  async _request(endpoint, userData = {}) {
    if (!userData) {
      throw new Error("Вы должны указать валидный токен");
    }
    const res = await get(`${API_URL}${endpoint}`, {
      headers: { Authorization: `${userData.token_type} ${userData.access_token}` },
    });
    const isSuccess = res && res.status === 200;
    return isSuccess ? res.data : null;
  }

  async _tokenRequest(code) {
    const form = new FormData();
    form.append("client_id", this.client.user.id);
    form.append("client_secret", process.env.DISCORD_SECRET);
    form.append("grant_type", "authorization_code");
    form.append("redirect_uri", process.env.WEBSITE_URL);
    form.append("scope", process.env.EXPECT_SCOPES);
    form.append("code", code);

    const res = await post(`${API_URL}/oauth2/token`, form, {
      headers: form.getHeaders(),
    });
    const isSuccess = res && res.status === 200;

    return isSuccess ? res.data : new Error(res.data);
  }

  async _fetchGuilds(token, userId = null) {
    // Запрашиваем список серверов у пользователя
    const guilds = await this._request("/users/@me/guilds", token);

    return await Promise.all(
      guilds.map(async (guild) => {
        // Есть ли бот на сервере?
        guild.is_common = this.client.guilds.cache.has(guild.id);

        // Сервер премиум?
        const guildData = await Guild.findOne({ id: guild.id }).cache();
        guild.is_premium = guildData ? guildData.common.is_premium : false;

        // Если один из серверов аризоны
        if (
          verifiedRoles.map((elem) => elem.guildID).includes(guild.id) &&
          guild.isBotOnGuild &&
          userId
        ) {
          // Проверяем наличие роли проверенного на сервере аризоны
          const clientGuild = this.client.guilds.cache.get(guild.id);
          const user = clientGuild.members.cache.get(userId) || null;
          guild.userVerified = !!user.roles.cache.find((role) =>
            verifiedRoles.map((elem) => elem.roleID).includes(role.id)
          );
        }
        return guild;
      })
    );
  }
};
