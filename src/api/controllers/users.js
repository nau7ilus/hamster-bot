const FormData = require("form-data");
const { sign } = require("jsonwebtoken");
const { post } = require("axios");

const APIError = require("lib/structures/API/ApiError");
const Guild = require("lib/models/Guild");
const request = require("api/utils/request");

const API_URL = "https://discord.com/api";

/**
 * Получение данных о пользователе
 */
exports.getUser = async (req, res) => {
  const query = req.query && req.query.q ? req.query.q : "guilds identify";
  const { userID } = req.params;
  if (!userID) {
    return res
      .code(400)
      .send(new APIError({ message: "Не указан userID", status: 400, code: 20005 }));
  }

  const response = {};
  if (userID == "@me") {
    if (query.includes("identify")) response.identify = await _fetchUser(req.userData);

    if (query.includes("guilds")) response.guilds = await _fetchGuilds(req.userData, req.client);
  } else
    res.code(403).send(
      new APIError({
        message: "Отсутствует доступ",
        status: 403,
        code: 20004,
        details: { userID },
      })
    );

  res.code(200).send({ status: 200, request: { userID, query }, response });
};

/**
 * Авторизация пользователя
 */
exports.loginUser = async (req, res) => {
  // Проверяем наличие кода
  const { code, clientId, redirectUri } = req.body;
  if (!code || !clientId || !redirectUri) {
    return res
      .code(400)
      .send(new APIError({ message: "Не был указан код авторизации", status: 400, code: 20001 }));
  }

  try {
    // Запрашиваем токен через Discord API
    const { access_token, token_type, scope } = await _tokenRequest(code, clientId, redirectUri);

    // Проверим факт изменения ссылки
    if (scope !== process.env.EXPECT_SCOPES) {
      return res.code(401).send(
        new APIError({
          message: "Получены не все данные. Возможно, исходная ссылка изменена.",
          status: 401,
          details: { received: scope, expected: process.env.EXPECT_SCOPES },
        })
      );
    }

    // Получаем ID пользователя
    const { id } = await _fetchUser({ access_token, token_type });
    if (!id) throw new Error("Пользователь не найден");

    // Создаем JWT и отправляем его пользователю
    const token = sign({ access_token, token_type, id }, process.env.JWT_PRIVATE);
    return res.code(200).send({ access_token: token, token_type });
  } catch (err) {
    console.log(err.toJSON());
    res.code(500).send(
      new APIError({
        message: "Произошла ошибка при запросе токена у Discord",
        code: 20002,
        detail: err,
      })
    );
  }
};

function _fetchUser(userData) {
  return request("/users/@me", { userData });
}

async function _tokenRequest(code, clientId, redirectUri) {
  const form = new FormData();
  form.append("client_id", clientId);
  form.append("client_secret", process.env.DISCORD_SECRET);
  form.append("grant_type", "authorization_code");
  form.append("redirect_uri", redirectUri);
  form.append("scope", process.env.EXPECT_SCOPES);
  form.append("code", code);

  const res = await post(`${API_URL}/oauth2/token`, form, {
    headers: form.getHeaders(),
  });
  const isSuccess = res && res.status === 200;

  return isSuccess ? res.data : new Error(res.data);
}

async function _fetchGuilds(userData, client) {
  // Запрашиваем список серверов у пользователя
  const guilds = await request("/users/@me/guilds", { userData });

  return await Promise.all(
    guilds.map(async (guild) => {
      // Поиск сервера
      const clientGuild = client.guilds.cache.get(guild.id);

      // Есть ли бот на сервере?
      guild.is_common = !!clientGuild;

      // Список ролей
      guild.roles = guild.is_common
        ? clientGuild.roles.cache.toJSON().map((r) => {
            r.id;
            r.name;
            r.color;
            r.rawPosition;
          })
        : null;

      // Список текстовых каналов
      guild.text_channels = guild.is_common
        ? clientGuild.channels.cache
            .toJSON()
            .filter((c) => c.type === "text" || c.type === "news")
            .map((c) => {
              return {
                id: c.id,
                name: c.name,
                raw_position: c.rawPosition,
                topic: c.topic,
                nsfw: c.nsfw,
              };
            })
        : null;

      // Список голосовых каналов
      guild.voice_channels = guild.is_common
        ? clientGuild.channels.cache
            .toJSON()
            .filter((c) => c.type === "voice")
            .map((c) => {
              return {
                id: c.id,
                name: c.name,
                raw_position: c.rawPosition,
              };
            })
        : null;

      // Сервер премиум?
      const guildData = await Guild.findOne({ id: guild.id }).cache();
      guild.is_premium = guildData ? guildData.is_premium : false;
      return guild;
    })
  );
}
