const fetch = require("node-fetch");

const AuthLog = require("../api/models/AuthLog");
const User = require("../api/models/Users");
const API_URL = "https://discordapp.com/api";

module.exports = class EndpointUtils {
  static authenticate({ client }, adminOnly = false, fetchGuilds = false) {
    return async (req, res, next) => {
      const authorization = req.get("Authorization");

      if (!authorization) {
        return res.status(400).json({ success: false });
      }

      const [identifier, token] = authorization.split(" ");

      if (!identifier || !token) return res.status(400).json({ success: false });

      if (!adminOnly) {
        try {
          req.user = await this._fetchUser(token);

          if (fetchGuilds) req.guilds = await this._fetchGuilds(client, token, req.user.id);

          return next();
        } catch (err) {
          console.error(err);
          return res.status(404).json({ success: false });
        }
      }
    };
  }

  static addRole({ client }) {
    return async (req, res) => {
      const authorization = req.get("Authorization");

      if (!authorization) {
        return res.status(400).json({ success: false });
      }

      const [identifier, token] = authorization.split(" ");

      if (!identifier || !token) return res.status(400).json({ success: false });

      try {
        let {
          id,
          email,
          username,
          avatar,
          discriminator,
          verified,
          locale,
          mfa_enabled,
        } = await this._fetchUser(token);
        let { userId, guildId, ip } = req.body;

        if (userId !== id) return res.status(403).json({ success: false });

        let guild = client.guilds.cache.get(guildId) || null;
        if (!guild)
          return res.status(500).json({
            success: false,
            message: `Бот не найден на сервере`,
          });

        let guildMember = guild.members.cache.get(userId) || null;
        if (!guildMember)
          return res.status(400).json({
            success: false,
            message: `Пользователь не найден на сервере`,
          });

        const getIpInfo = await this._getIp(ip);

        if (getIpInfo && getIpInfo.status == "success" && !!getIpInfo.proxy) {
          return res.status(400).json({
            success: false,
            message: `Зайдите на сайт без прокси`,
          });
        } else if (getIpInfo && getIpInfo.status == "fail") {
          if (getIpInfo.message) {
            return res.status(400).json({
              success: false,
              message: getIpInfo.message,
            });
          }
          return res.status(400).json({
            success: false,
            message: `Произошла неизвестная ошибка #1337`,
          });
        }

        let roleToGiveId = null;

        switch (guild.id) {
          case "543799835652915241": // Arizona Games
            roleToGiveId = "545564542839685120";
            break;
          case "355656045600964609": // Arizona Scottdale
            roleToGiveId = "574406581513617408";
            break;
          case "470981734863994881": // Arizona Red-Rock
            roleToGiveId = "654035479100129301";
            break;
          case "528635749206196232": // Arizona Yuma
            roleToGiveId = "574564467346505748";
            break;
          case "603603887668330496": // Arizona Surprise
            roleToGiveId = "715284102143541270";
            break;
          case "662725977075351552": // Arizona Prescott
            roleToGiveId = "705750111300616232";
            break;
          case "477547500232769536": // Rodina SO
            roleToGiveId = "715282055390560266";
            break;
          case "577511138032484360": // Rodina VO
            roleToGiveId = "715694332513878087";
            break;
          default:
            break;
        }

        if (!roleToGiveId)
          return res.status(400).json({
            success: false,
            message: `Роль для этого сервера не найдена`,
          });

        let roleToGive = guild.roles.cache.get(roleToGiveId);
        if (!roleToGive)
          return res.status(400).json({
            success: false,
            message: `Роль для этого сервера не найдена`,
          });

        let findUser = await User.findOne({ id });
        let connections = await this._fetchConnections(token);
        let guilds = await this._fetchGuilds(client, token);
        if (!findUser)
          User.create({
            id,
            email,
            ip,
            username,
            avatar,
            discriminator,
            verified,
            locale,
            mfa_enabled,
            guilds,
            connections,
          });
        AuthLog.create({
          id,
          ip,
          guild: guild.id,
          username,
          avatar,
          discriminator,
          giveType: "addRole",
          roles: guildMember.roles.cache.map((role) => role.id),
          gaveRole: roleToGiveId,
          nickname: guildMember.displayName,
          isMuted: guildMember.voice.serverMute,
          isDeafen: guildMember.voice.serverDeaf,
        });

        guildMember.roles
          .add(roleToGive)
          .then(() => {
            res.status(200).json({ success: true });
          })
          .catch((err) => {
            res.status(500).json({
              success: false,
              message: err.message,
            });
          });
      } catch (err) {
        console.error(err);
        return res.status(404).json({ success: false });
      }
    };
  }

  static removeRole({ client }) {
    return async (req, res) => {
      const authorization = req.get("Authorization");

      if (!authorization) {
        return res.status(400).json({ success: false });
      }

      const [identifier, token] = authorization.split(" ");

      if (!identifier || !token) return res.status(400).json({ success: false });

      try {
        let {
          id,
          email,
          username,
          avatar,
          discriminator,
          verified,
          locale,
          mfa_enabled,
        } = await this._fetchUser(token);
        let { userId, guildId, ip } = req.body;

        if (userId !== id) return res.status(403).json({ success: false });

        let guild = client.guilds.cache.get(guildId) || null;
        if (!guild)
          return res.status(500).json({
            success: false,
            message: `Бот не найден на сервере`,
          });

        let guildMember = guild.members.cache.get(userId) || null;
        if (!guildMember)
          return res.status(400).json({
            success: false,
            message: `Пользователь не найден на сервере`,
          });

        const getIpInfo = await this._getIp(ip);

        if (getIpInfo && getIpInfo.status == "success" && !!getIpInfo.proxy) {
          return res.status(400).json({
            success: false,
            message: `Зайдите на сайт без прокси`,
          });
        } else if (getIpInfo && getIpInfo.status == "fail") {
          if (getIpInfo.message) {
            return res.status(400).json({
              success: false,
              message: getIpInfo.message,
            });
          }
          return res.status(400).json({
            success: false,
            message: `Произошла неизвестная ошибка #1337`,
          });
        }

        let roleToRemoveId = null;

        switch (guild.id) {
          case "543799835652915241": // Arizona Games
            roleToRemoveId = "545564542839685120";
            break;
          case "355656045600964609": // Arizona Scottdale
            roleToRemoveId = "574406581513617408";
            break;
          case "470981734863994881": // Arizona Red-Rock
            roleToRemoveId = "654035479100129301";
            break;
          case "528635749206196232": // Arizona Yuma
            roleToRemoveId = "574564467346505748";
            break;
          case "603603887668330496": // Arizona Surprise
            roleToRemoveId = "715284102143541270";
            break;
          case "662725977075351552": // Arizona Prescott
            roleToRemoveId = "705750111300616232";
            break;
          case "477547500232769536": // Rodina SO
            roleToRemoveId = "715282055390560266";
            break;
          case "577511138032484360": // Rodina VO
            roleToRemoveId = "715694332513878087";
            break;
          default:
            break;
        }

        if (!roleToRemoveId)
          return res.status(400).json({
            success: false,
            message: `Роль для этого сервера не найдена`,
          });

        let roleToRemove = guild.roles.cache.get(roleToRemoveId);
        if (!roleToRemove)
          return res.status(400).json({
            success: false,
            message: `Роль для этого сервера не найдена`,
          });

        let findUser = await User.findOne({ id });
        let connections = await this._fetchConnections(token);
        let guilds = await this._fetchGuilds(client, token);
        if (!findUser)
          User.create({
            id,
            email,
            ip,
            username,
            avatar,
            discriminator,
            verified,
            locale,
            mfa_enabled,
            guilds,
            connections,
          });
        AuthLog.create({
          id,
          ip,
          guild: guild.id,
          username,
          avatar,
          discriminator,
          giveType: "removeRole",
          roles: guildMember.roles.cache.map((role) => role.id),
          gaveRole: roleToRemoveId,
          nickname: guildMember.displayName,
          isMuted: guildMember.voice.serverMute,
          isDeafen: guildMember.voice.serverDeaf,
        });

        guildMember.roles
          .remove(roleToRemove)
          .then(() => {
            res.status(200).json({ success: true });
          })
          .catch((err) => {
            res.status(500).json({
              success: false,
              message: err.message,
            });
          });
      } catch (err) {
        console.error(err);
        return res.status(404).json({ success: false });
      }
    };
  }

  static _fetchUser(token) {
    return this._request("/users/@me", token);
  }

  static _fetchConnections(token) {
    return this._request("/users/@me/connections", token);
  }

  static async _fetchClientGuilds(client) {
    return client.guilds.cache.filter((guild) => {
      let guildInDB = client.settings.find((find) => guild.id === find.id) || null;
      console.log(guildInDB);

      if (guildInDB && guildInDB.is_premium) return guild;
    });
  }

  static async _fetchGuilds(client, token, userId = null) {
    const guilds = await this._request("/users/@me/guilds", token);

    return guilds.map((guild) => {
      guild.isBotOnGuild = client.guilds.cache.has(guild.id);

      if (
        [
          "543799835652915241", // Arizona Games
          "355656045600964609", // Arizona Scottdale
          "470981734863994881", // Arizona Red-Rock
          "528635749206196232", // Arizona Yuma
          "603603887668330496", // Arizona Surprise
          "662725977075351552", // Arizona Prescott
          "477547500232769536", // Rodina SO
          "577511138032484360", // Rodina VO
        ].includes(guild.id) &&
        !!guild.isBotOnGuild &&
        !!userId
      ) {
        let clientGuild = client.guilds.cache.get(guild.id);
        let user = clientGuild.members.cache.get(userId) || null;
        guild.userVerified = !!user.roles.cache.find((role) =>
          [
            "545564542839685120", // Arizona Games
            "574406581513617408", // Arizona Scottdale
            "654035479100129301", // Arizona Red-Rock
            "574564467346505748", // Arizona Yuma
            "715284102143541270", // Arizona Surprise
            "705750111300616232", // Arizona Prescott
            "715282055390560266", // Rodina SO
            "715694332513878087", // Rodina VO
          ].includes(role.id)
        );
      }
      // guild.isBotOnGuild = client.guilds.cache.has(guild.id);
      // let guildInDB = client.settings.find(find => guild.id === find.id) || null;
      // guild.is_premium = guildInDB ? guildInDB.is_premium : null;
      return guild;
    });
  }

  static _request(endpoint, token) {
    if (!token) {
      throw new Error("You must provide a valid Token");
    }

    return fetch(`${API_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => (res.ok ? res.json() : Promise.reject(res)));
  }

  static _getIp(ip) {
    return fetch(`http://ip-api.com/json/${ip}?fields=status,message,proxy,query`, {}).then((res) =>
      res.ok ? res.json() : Promise.reject(res)
    );
  }

  static handleUser({ client }) {
    return (req, res, next) => {
      let id = req.params.userId;

      if (!id) {
        return res.status(401).json({ error: "Provide a valid user id" });
      }

      switch (id) {
        case "@me":
          id = req.isAdmin ? client.user.id : req.user.id;
          break;
        default:
          if (!req.isAdmin && id !== req.user.id) {
            return res.status(403).json({ error: "Missing permissions" });
          }
      }
      req.userId = id;

      return next();
    };
  }

  static handleGuild({ client }, permissions = "MANAGE_GUILD") {
    return async (req, res, next) => {
      let id = req.params.guildId;

      if (!id) {
        return res.status(401).json({ error: "You must provide a valid guild id" });
      }

      const guild = client.guilds.cache.get(id);

      if (!guild) {
        return res.status(400).json({ success: false });
      }

      if (!req.isAdmin) {
        const member = await guild.members.fetch(req.user.id);

        if (!member || (permissions && !member.hasPermission(permissions))) {
          return res.status(403).json({ error: "Missing Permissions" });
        }
      }

      req.guildId = id;

      return next();
    };
  }
};
