TelegramBot = {};
TelegramBot.triggers = [];
TelegramBot.apiBase = "https://api.telegram.org/bot";
TelegramBot.token = false;
TelegramBot.init = false;
TelegramBot.getUpdatesOffset = 0;
TelegramBot.interval = false;

TelegramBot.parseCommandString = function(msg) {
	// splits string into an array
	// and removes the @botname from the command
	// then returns the array
	msg = msg.split(' ')
	msg[0] = msg[0].split('@')[0]
	return msg;
}

TelegramBot.poll = function() {
	var result = TelegramBot.method("getUpdates", {
		offset: TelegramBot.getUpdatesOffset + 1
	});
	TelegramBot.parsePollResult(result.result);
}

TelegramBot.start = function() {
	TelegramBot.poll();
	TelegramBot.interval = Meteor.setInterval(function() {
		TelegramBot.poll();
	}, 1000);
}

TelegramBot.stop = function() {
	Meteor.clearInterval(TelegramBot.interval);
}

TelegramBot.parsePollResult = function(data) {
	data.map(function(item) {
		TelegramBot.getUpdatesOffset = item.update_id;
		var chatId = item.message.chat.id;
		var from = item.message.from.username;
		if(msg = item.message.text) {
			msg = TelegramBot.parseCommandString(msg)
			var obj = _.find(TelegramBot.triggers, function(obj) {
				return obj.command == msg[0]
			})
			if(obj) {
				TelegramBot.send(obj.callback(msg, from, item.message), chatId)
			} else {
				if(typeof(TelegramBot.catchAll) === 'function') {
					TelegramBot.catchAll(item);
				}
			}
		}
	});
}

TelegramBot.requestUrl = function(method) {
	var token = TelegramBot.token || process.env.TELEGRAM_TOKEN;
	return TelegramBot.apiBase + token + '/' + method
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

	try {
		var res = HTTP.get(TelegramBot.requestUrl(method), {
			params: object
		});
		if(res.data) {
			return res.data
		}
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

