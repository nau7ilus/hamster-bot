const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const app = express();
const fetch = require('node-fetch');
const btoa = require('btoa');
const EndpointUtils = require('./utils/EndpointUtils');
const chalk = require('chalk');

const API_URL = 'https://discordapp.com/api';

exports.run = async (client) => {
    let whitelist = ['http://localhost:8080', 'https://test.robo-hamster.ru', 'https://robo-hamster.ru']
    let corsOptionsDelegate = function (req, callback) {
        let corsOptions;
        if (whitelist.indexOf(req.header('Origin')) !== -1) {
            corsOptions = { origin: true } // reflect (enable) the requested origin in the CORS response
        } else {
            corsOptions = { origin: false } // disable CORS for this request
        }
        callback(null, corsOptions) // callback expects two parameters: error and options
    }

    app.use(cors(corsOptionsDelegate));
    app.use(express.json());
    app.disable('x-powered-by');

    app.use(
        morgan(
            `${chalk.cyan('[HTTP]')} ${chalk.green(
                ':method :url - IP :remote-addr - Код :status - Размер :res[content-length] B - Время обработки :response-time ms'
            )}`
        )
    );

    app.post(
        '/addrole',
        EndpointUtils.addRole(this, false, true),
        (req, res) => { });

    app.post(
        '/removerole',
        EndpointUtils.removeRole(this, false, true),
        (req, res) => { });
        

    app.get(
        '/@me',
        EndpointUtils.authenticate(this, false, true),
        (req, res) => {
            return res.json({ user: req.user, guilds: req.guilds });
        }
    );

    app.post('/login', async (req, res) => {
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
    app.get('/bot', async (req, res) => {
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

    app.listen(process.env.PORT || 3000, () => {
        client.log(`Сервер работает на порту ${process.env.PORT || 3000}`, {
            tags: ['HTTP'],
            color: 'green',
        });
    });

}

function _request(endpoint, token) {
    if (!token) {
        throw new Error('You must provide a valid authentication token');
    }

    return fetch(`${API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
    }).then(res => (res.ok ? res.json() : Promise.reject(res)));
}

function _refreshToken(refreshToken) {
    return this._tokenRequest({
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
    });
}

async function _tokenRequest(code) {
    const creds = btoa(`629322882882863104:${process.env.DISCORD_SECRET}`);
    const req = await fetch(`${API_URL}/oauth2/token?grant_type=authorization_code&code=${code}&redirect_uri=https://robo-hamster.ru`, {
        method: 'POST',
        headers: { Authorization: `Basic ${creds}` }
    })
    return await req.json();
}