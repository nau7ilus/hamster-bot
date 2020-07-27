const mongoose = require("mongoose");
const cachegoose = require("cachegoose");

const Client = require("./structures/Client");

const client = new Client(
  process.env.DISCORD_TOKEN,
  // Разработчики
  [
    "422109629112254464", // Филипп
    "336207279412215809", // Артем
    "408740341135704065", // Андрей
  ]
);

client.loadCommands("./src/modules/cmds/").loadEvents("./src/modules/events/").initializeLoaders();

cachegoose(mongoose);
mongoose.connect(
  process.env.DATABASE_URL,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  },
  async (err) => {
    if (err) throw err;
    console.log("[Database] База данных Mongo успешно подключена.");
  }
);

module.exports = client;
