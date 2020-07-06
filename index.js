const { ShardingManager } = require("discord.js");

const manager = new ShardingManager("./src/index.js", {
  totalShards: "auto",
  respawn: true,
  token: process.env.DISCORD_TOKEN,
});
manager.spawn().then(() => {
  console.log("[Shard] Бот шардирован");
});
