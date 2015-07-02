TelegramBot = {};
TelegramBot.triggers = [];
TelegramBot.apiBase = "https://api.telegram.org/bot";
TelegramBot.token = false;
TelegramBot.init = false;

TelegramBot.checkConnections = function() {

}

TelegramBot.s = function(msg) {
	msg = msg.split(' ')
	msg[0] = msg[0].split('@')[0]
	return msg;
}

TelegramBot.addListener = function(command, callback) {
	if(typeof(command) === 'string' && typeof(callback) === 'function') {
		TelegramBot.triggers.push({
			command: command,
			callback: callback
		})
		console.log('Added command ' + command);
	}
	else {
		console.log("Error adding command " + command)
	}
}

TelegramBot.send = function(msg, chatId) {
	var token = TelegramBot.token || process.env.TELEGRAM_TOKEN;
	var base = TelegramBot.apiBase;

	try {
		HTTP.get(base + token + '/sendMessage', {
			params: {
				chat_id: chatId,
				text: msg,
				disable_web_page_preview: true
			}
		});
	}
	catch (e) {
		console.log(e)
	}
}