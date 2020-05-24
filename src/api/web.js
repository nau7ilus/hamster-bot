const { Router } = require('express');

const fetch = require('node-fetch');
const btoa = require('btoa');

const Route = require('../structures/Route');

const API_URL = 'https://discordapp.com/api';

module.exports = class WebRoute extends Route {
    constructor(client) {
        super(
            {
                name: 'web',
            },
            client
        );
    }

    register(app) {
        const router = Router();

        // Login
        router.post('/login', async (req, res) => {
            const { code } = req.body;
            if (!code) {
                return res
                    .status(400)
                    .json({ error: "An authentication code wasn't provided!" });
            }
            try {
                const { access_token, token_type } = await this._tokenRequest(code);
                console.log({ access_token, token_type })
                return res.json({ access_token, token_type });
            } catch (err) {
                console.error(err);
                console.error(err.headers);
                res
                    .status(403)
                    .json({ error: 'An error occurred while validating access token' });
            }
        });

        // Получение информации о боте
        router.get('/bot', async (req, res) => {
            // Создаем объект с информацией о клиенте
            try {
                const botInfo = {
                    inviteUrl: `https://discordapp.com/oauth2/authorize?client_id=${this.client.id}&guild_id=&scope=bot&permissions=980937982`,
                    guilds: this.client.guilds.cache.size,
                    users: this.client.users.cache.size,
                    channels: {
                        text: this.client.channels.cache.filter(channel =>
                            channel.type == 'text').size,
                        voice: this.client.channels.cache.filter(channel =>
                            channel.type == 'voice').size
                    }
                }
                console.log(botInfo)
                return res.json(botInfo);
            } catch (err) {
                console.error(err);
                console.error(err.headers);
                res
                    .status(403)
                    .json({ error: 'An error occurred while validating access token' });
            }
        });

        app.use(this.path, router);
    }

    _request(endpoint, token) {
        if (!token) {
            throw new Error('You must provide a valid authentication token');
        }

        return fetch(`${API_URL}${endpoint}`, {
            headers: { Authorization: `Bearer ${token}` },
        }).then(res => (res.ok ? res.json() : Promise.reject(res)));
    }

    _refreshToken(refreshToken) {
        return this._tokenRequest({
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        });
    }

    async _tokenRequest(code) {
        const creds = btoa(`629322882882863104:${process.env.DISCORD_SECRET}`);
        const req = await fetch(`${API_URL}/oauth2/token?grant_type=authorization_code&code=${code}&redirect_uri=https://robo-hamster.ru`, {
            method: 'POST',
            headers: { Authorization: `Basic ${creds}` }
        })
        return await req.json();
    }
};
