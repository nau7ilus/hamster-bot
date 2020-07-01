const { Router } = require("express");
const fetch = require("node-fetch");
const FormData = require("form-data");

const Route = require("../structures/Route");

const API_URL = "https://discordapp.com/api";

module.exports = class WebRoute extends Route {
  constructor(client) {
    super(
      {
        name: "web",
      },
      client
    );
  }

  register(app) {
    const router = Router();

    // Login
    router.post("/login", async (req, res) => {
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ error: "An authentication code wasn't provided!" });
      }
      try {
        const { access_token, token_type, scope } = await this._tokenRequest(code);

        // Проверим наличие необходимых данных
        if (scope !== "identify guilds connections") {
          return res.json({ success: false, message: "Изменена исходная ссылка авторизации" });
        }

        return res.json({ access_token, token_type });
      } catch (err) {
        console.error(err);
        console.error(err.headers);
        res.status(403).json({ error: "An error occurred while validating access token" });
      }
    });

    // Получение информации о боте
    router.get("/bot", async (req, res) => {
      // Создаем объект с информацией о клиенте
      try {
        const botInfo = {
          inviteUrl: `https://discordapp.com/oauth2/authorize?client_id=${this.client.id}&guild_id=&scope=bot&permissions=980937982`,
          guilds: this.client.guilds.cache.size,
          users: this.client.users.cache.size,
          channels: {
            text: this.client.channels.cache.filter((channel) => channel.type == "text").size,
            voice: this.client.channels.cache.filter((channel) => channel.type == "voice").size,
          },
        };
        console.log(botInfo);
        return res.json(botInfo);
      } catch (err) {
        console.error(err);
        console.error(err.headers);
        res.status(403).json({ error: "An error occurred while validating access token" });
      }
    });

    app.use(this.path, router);
  }

  _request(endpoint, token) {
    if (!token) {
      throw new Error("You must provide a valid authentication token");
    }

    return fetch(`${API_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => (res.ok ? res.json() : Promise.reject(res)));
  }

  _refreshToken(refreshToken) {
    return this._tokenRequest({
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    });
  }

  async _tokenRequest(code) {
    const body = new FormData();
    body.append("client_id", "629322882882863104");
    body.append("client_secret", process.env.DISCORD_SECRET);
    body.append("grant_type", "authorization_code");
    body.append("redirect_uri", "https://robo-hamster.ru");
    body.append("scope", "guilds identify connections");
    body.append("code", code);

    const req = await fetch(`${API_URL}/oauth2/token?grant_type=authorization_code`, {
      method: "POST",
      body,
    });
    return await req.json();
  }
};
