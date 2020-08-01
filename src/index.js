const mongoose = require("mongoose");
const cachegoose = require("cachegoose");

const Client = require("lib/structures/Client");

const client = new Client({
  devs: [
    "422109629112254464", // Филипп
    "336207279412215809", // Артем
    "408740341135704065", // Андрей
    "395623202048704514",
  ],
});

client.login(process.env.DISCORD_TOKEN);
client.loadCommands().loadEvents().initializeHTTPServer();

cachegoose(mongoose);
mongoose.connect(
  process.env.DATABASE_URL,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  },
  async (err) => {
    if (err) throw err;
    console.log("[Database] База данных Mongo успешно подключена.");
  }
);

const Guild = require("lib/models/Guild");
Guild.findOneAndUpdate({ id: "625036675059548220" }, { "common.language": "en-US" }).catch(
  console.log
);

module.exports = client;
