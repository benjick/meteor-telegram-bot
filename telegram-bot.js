TelegramBot = {};
TelegramBot.triggers = [];
TelegramBot.apiBase = "https://api.telegram.org/bot";
TelegramBot.token = false;
TelegramBot.init = false;

TelegramBot.parseCommandString = function(msg) {
	// splits string into an array 
	// and removes the @botname from the command
	// then returns the array
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

TelegramBot.method = function(method, object) {
	var object = object || {};
	var token = TelegramBot.token || process.env.TELEGRAM_TOKEN;

	try {
		var res = HTTP.get(TelegramBot.apiBase + token + '/' + method, {
			params: object
		});
		return res.data
	}
	catch (e) {
		console.log(e)
	}
}

TelegramBot.send = function(msg, chatId) {
	if(!msg) {
		return false;
	}

	TelegramBot.method('sendMessage', {
		chat_id: chatId,
		text: msg
	})
}