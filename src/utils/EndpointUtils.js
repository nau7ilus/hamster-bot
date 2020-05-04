const fetch = require('node-fetch');

const API_URL = 'https://discordapp.com/api';

module.exports = class EndpointUtils {
    static authenticate({ client }, adminOnly = false, fetchGuilds = false) {
        return async (req, res, next) => {
            const authorization = req.get('Authorization');

            if (!authorization) {
                return res.status(400).json({ success: false });
            }

            const [identifier, token] = authorization.split(' ');

            if (!identifier || !token)
                return res.status(400).json({ success: false });

            if (!adminOnly) {
                try {
                    req.user = await this._fetchUser(token);

                    if (fetchGuilds)
                        req.guilds = await this._fetchGuilds(client, token);

                    return next();
                } catch (err) {
                    console.error(err);
                    return res.status(404).json({ success: false });
                }
            }
        };
    }

    static _fetchUser(token) {
        return this._request('/users/@me', token);
    }

    static async _fetchGuilds(client, token) {
        const guilds = await this._request('/users/@me/guilds', token);

        return guilds.map(guild => {
            guild.isBotOnGuild = client.guilds.cache.has(guild.id);
            let guildInDB = client.settings.find(find => guild.id === find.id) || null;
            guild.isPremium = guildInDB ? guildInDB.isPremium : null;
            return guild;
        });
    }

    static _request(endpoint, token) {
        if (!token) {
            throw new Error('You must provide a valid Token');
        }

        return fetch(`${API_URL}${endpoint}`, {
            headers: { Authorization: `Bearer ${token}` },
        }).then(res => (res.ok ? res.json() : Promise.reject(res)));
    }

    static handleUser({ client }) {
        return (req, res, next) => {
            let id = req.params.userId;

            if (!id) {
                return res.status(401).json({ error: 'Provide a valid user id' });
            }

            switch (id) {
                case '@me':
                    id = req.isAdmin ? client.user.id : req.user.id;
                    break;
                default:
                    if (!req.isAdmin && id !== req.user.id) {
                        return res.status(403).json({ error: 'Missing permissions' });
                    }
            }
            req.userId = id;

            return next();
        };
    }

    static handleGuild({ client }, permissions = 'MANAGE_GUILD') {
        return async (req, res, next) => {
            let id = req.params.guildId;

            if (!id) {
                return res
                    .status(401)
                    .json({ error: 'You must provide a valid guild id' });
            }

            const guild = client.guilds.cache.get(id);

            if (!guild) {
                return res.status(400).json({ success: false });
            }

            if (!req.isAdmin) {
                const member = await guild.members.fetch(req.user.id);

                if (!member || (permissions && !member.hasPermission(permissions))) {
                    return res.status(403).json({ error: 'Missing Permissions' });
                }
            }

            req.guildId = id;

            return next();
        };
    }
};
