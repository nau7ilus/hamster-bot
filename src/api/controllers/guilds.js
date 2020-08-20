const APIError = require("lib/structures/API/ApiError");
const Guild = require("lib/models/Guild");

exports.getGuildData = async (req, res) => {
  try {
    console.log("params", req.params);
    const { guildId, action } = req.params;
    if (!guildId) return res.code(400).send({ error: "Не указан ID сервера для поиска" });
    const guildSettings = await Guild.findOne({ id: guildId });
    if (!guildSettings) return res.code(404).send({ error: "Сервер не найден в базе данных" });
    const response = {
      common: guildSettings.common,
    };
    return { data: response[action] || null };
  } catch (err) {
    return err;
  }
};
