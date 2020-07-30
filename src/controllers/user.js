const FormData = require("form-data");
const fetch = require("node-fetch");
const ApplicationError = require("lib/structures/ApiErrors/ApplicationError");
const client = require("../index");

const API_URL = "https://discord.com/api";

exports.userLogin = async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.json(new ApplicationError("Не был указан код авторизации", 400, 20001));
  }
  try {
    const { access_token, token_type, scope } = await _tokenRequest(code);

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
};

async function _tokenRequest(code) {
  const body = new FormData();
  body.append("client_id", client.user.id);
  body.append("client_secret", process.env.DISCORD_SECRET);
  body.append("grant_type", "authorization_code");
  body.append("redirect_uri", process.env.WEBSITE_URL);
  body.append("scope", "guilds identify");
  body.append("code", code);

  const req = await fetch(`${API_URL}/oauth2/token?grant_type=authorization_code`, {
    method: "POST",
    body,
  });
  return await req.json();
}
