const { DateTime } = require('luxon');

module.exports = class Logger {
    static logComments = true;

    static colors = {
        red: '#b52825',
        orange: '#e76a1f',
        gold: '#deae17',
        yellow: '#eeee23',
        green: '#3ecc2d',
        teal: '#11cc93',
        blue: '#2582ff',
        indigo: '#524cd9',
        violet: '#7d31cc',
        magenta: '#b154cf',
        pink: '#d070a0',
        brown: '#502f1e',
        black: '#000000',
        grey: '#6e6f77',
        white: '#ffffff',
        default: '#cccccc'
    };

    static types = {
        error: 'red',
        warn: 'yellow',
        info: 'blue',
        event: '#43804e',
        log: 'default',
        test: 'white',
        comment: 'grey'
    };

    static log(message, type = 'log', color = 'log') {
        this.process(message, color, type);
    }

    static error(message, typeToShow = 'error') {
        this.process(message, 'error', typeToShow);
    }

    static warn(message, typeToShow = 'warn') {
        this.process(message, 'warn', typeToShow);
    }

    static info(message, typeToShow = 'info') {
        this.process(message, 'info', typeToShow);
    }

    static test(message, typeToShow = 'test') {
        this.process(message, 'test', typeToShow);
    }

    static comment(message, typeToShow = 'comment') {
        if (this.logComments) {
            this.process(message, 'comment', typeToShow);
        }
    }

    static event(message, typeToShow = 'event') {
        this.process(message, 'event', typeToShow);
    }

    static process(text, type = 'test', message = type) {
        text = text.replace(/(?<![;\d])\d+(\.\d+)?(?!;|\d)/g, match => {
            if (text.indexOf(';224;238;38m') !== -1 && text.indexOf(';224;238;38m') < text.indexOf(match)) {
                return match;
            } else {
                return this.setColor('yellow') + match + this.setColor(type);
            }
        });
        text = text.replace(/\x2b+/gi, this.setColor(type));
        type = this.types[type] ? this.types[type] : type;
        text = `${this.setColor('#847270')}[${DateTime.local().toFormat('D HH:mm:ss.u')}]${this.setColor(type)}[${message.toUpperCase()}] ${text.toString() + this.setColor()}`;
        console.log(text);
    }

    static setColor(color = 'default', text = '', colorAfter = '') {
        if (color = this.colors[this.types[color]] || this.colors[color] || this.types[color] && this.types[color].match(/#[0-9|a-f]{6}/i)[0] || color && color.match(/#[0-9|a-f]{6}/i)[0]) {
            color = '\x1b[38;2;' + color.substring(1, 7).match(/.{2}/g).map(n => parseInt(n, 16)).join(';') + 'm';
        } else {
            throw new Error('Ожидается тип лога или его цвет сообщения');
        }
        if (colorAfter) {
            if (colorAfter = this.colors[this.types[colorAfter]]
                || this.colors[colorAfter]
                || this.types[colorAfter]
                && this.types[colorAfter].match(/#[0-9|a-f]{6}/i)[0]
                || colorAfter.match(/#[0-9|a-f]{6}/i)[0]) {
                colorAfter = '\x1b[38;2;' + colorAfter.substring(1, 7).match(/.{2}/g).map(n => parseInt(n, 16)).join(';') + 'm';
            } else {
                throw new Error('Ожидается тип лога или его цвет сообщения');
            }
        }
        return text ? color + text + (colorAfter ? colorAfter : '\x2b') : color;
    }
};