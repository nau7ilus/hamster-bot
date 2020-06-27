/**
 * Ивент ловит все пакеты
 * В данном случае используется для прослушки событий на 
 * добавление/снятие реакций со всех сообщения
 * Так как обычный ивент тригерит только сообщения в кеше
 */

// Получаем пакет
module.exports = async (client, packet) => {
    // Фильтруем пакеты только с добавлением/сниятием реакций
    if (!['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'].includes(packet.t)) return;

    // Получаем канал, в котором зафиксировано действие
    const channel = client.channels.cache.get(packet.d.channel_id);
    // Если ЛС, то выходим
    if (!channel || channel.type == "dm") return;
    // Если сообщение есть в кеше, выходим
    if (channel.messages.cache.has(packet.d.message_id)) return;

    // Находим сообщение в найденом канале
    const message = await channel.messages.fetch(packet.d.message_id);

    // У эмодзи есть идентификаторы name:id, так что мы должны это учитывать
    const emoji = packet.d.emoji.id ?
        `${packet.d.emoji.name}:${packet.d.emoji.id}` :
        packet.d.emoji.name;

    // Находим реакцию на сообщении по эмодзи
    const reaction = message.reactions.cache.get(emoji);
    if (!reaction) return;

    // Проверяем тип перед отправкой ивента
    if (packet.t === 'MESSAGE_REACTION_ADD') {
        client.emit('messageReactionAdd', reaction, client.users.cache.get(packet.d.user_id));
    }
    if (packet.t === 'MESSAGE_REACTION_REMOVE') {
        client.emit('messageReactionRemove', reaction, client.users.cache.get(packet.d.user_id));
    }
}