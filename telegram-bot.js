TelegramBot = {};
TelegramBot.triggers = {};
TelegramBot.conversations = {};
TelegramBot.callbacks = {};
TelegramBot.catchAllText = {
	enabled: false,
	callback: (username, message) => console.log('Default catchAll Method. Received: ' + message)
};
TelegramBot.apiBase = "https://api.telegram.org/bot";
TelegramBot.token = false;
TelegramBot.init = false;
TelegramBot.getUpdatesOffset = 0;
TelegramBot.interval = false;

TelegramBot.parseCommandString = msg => {
	// splits string into an array
	// and removes the @botname from the command
	// then returns the array
	msg = msg.split(' ');
	msg[0] = msg[0].split('@')[0];
	return msg;
}

TelegramBot.poll = () => {
	const result = TelegramBot.method('getUpdates', {
		offset: TelegramBot.getUpdatesOffset + 1,
	});
	
	// Additional check for duplicate poll data
	// Also skips the call to parsePollResults if there were no results
	if (result && result.result.length > 0 && TelegramBot.getUpdatesOffset !==  _.last(result.result).update_id)
		TelegramBot.parsePollResult(result.result);
}

TelegramBot.start = () => {
	TelegramBot.poll();
	TelegramBot.interval = Meteor.setInterval(TelegramBot.poll, 1000);
}

TelegramBot.stop = () => {
	Meteor.clearInterval(TelegramBot.interval);
}

TelegramBot.parsePollResult = data => {
	data.map(item => {
		TelegramBot.getUpdatesOffset = item.update_id;

		const message = item.message;

		if (message) {
			const keys = Object.keys(message);
			
			if (keys[keys.length - 1] === "entities")
				keys.pop();
			
			const type = keys.pop();
			const fromUsername = typeof(item.message.from.username) === 'undefined' ? item.message.from.first_name : item.message.from.username;
			const chatId = message.chat.id;
			let isConversation = false;
			
			if (typeof(TelegramBot.conversations[chatId]) !== 'undefined') {
				const obj = _.find(TelegramBot.conversations[chatId], obj => obj.username === fromUsername);
				
				if (obj) {
					isConversation = true;
					obj.callback(fromUsername, message.text, chatId);
				}
			}
			
			if (!isConversation) {
				if (type === 'text' && typeof(TelegramBot.triggers.text) !== 'undefined') {
					const msg = TelegramBot.parseCommandString(item.message.text);
					const obj = _.find(TelegramBot.triggers.text, obj => obj.command == msg[0]);
					
					if(obj) {
						TelegramBot.send(obj.callback(msg, fromUsername, message), chatId);
					} else if (TelegramBot.catchAllText.enabled) {
						TelegramBot.catchAllText.callback(fromUsername, message);
					}
				} else if (typeof(TelegramBot.triggers[type]) !== 'undefined') {
					TelegramBot.triggers[type].map(trigger => {
						trigger.callback('N/A', fromUsername, message);
					});
				}
			}
		} else if (item.callback_query) {
			const callback_query = item.callback_query;

			const chatId = callback_query.message.chat.id;
			const messageId = callback_query.message.message_id;

			const callback = TelegramBot.callbacks[chatId][messageId];

			if (callback) {
				callback(callback_query.data);

				delete TelegramBot.callbacks[chatId][messageId];
			}
		}
	});
}

TelegramBot.requestUrl = method => {
	const token = TelegramBot.token || process.env.TELEGRAM_TOKEN;
	return TelegramBot.apiBase + token + '/' + method;
}

TelegramBot.addListener = (command, callback, type = 'text') => {
	if (typeof(command) === 'string' && typeof(callback) === 'function') {
		if (typeof(TelegramBot.triggers[type]) === 'undefined') {
			TelegramBot.triggers[type] = [];
		}

		TelegramBot.triggers[type].push({
			command,
			callback
		});

		console.log('Added command: ' + command);
	}
	else {
		console.log('Error adding command: ' + command);
	}
}

TelegramBot.startConversation = (username, chat_id, callback, init_vars) => {
	if (typeof(username) === 'string' && typeof(callback) === 'function') {
		if (typeof(TelegramBot.conversations[chat_id]) === 'undefined') {
			TelegramBot.conversations[chat_id] = [];
		}

		if (typeof(init_vars) !== 'object') {
			init_vars = {};
		}

		TelegramBot.conversations[chat_id].push(_.defaults(init_vars, { username, callback }));
		
		console.log('Started conversation in Chat ID (' + chat_id + ') with ' + username);
	} else {
		console.log('Error starting conversation in Chat ID (' + chat_id + ') with ' +  username);
	}
	//console.log('startConversation: Now we have ' + Object.keys(TelegramBot.conversations).length + ' chats with active conversations.');
}

TelegramBot.endConversation = (username, chat_id) => {
	if (typeof(TelegramBot.conversations[chat_id]) !== 'undefined') {
		const obj = _.find(TelegramBot.conversations[chat_id], obj => obj.username == username);
		
		if (obj) {
			TelegramBot.conversations[chat_id] = _.reject(TelegramBot.conversations[chat_id], obj => obj.username == username);
			
			if (_.isEmpty(TelegramBot.conversations[chat_id])) {
				TelegramBot.conversations = _.omit(TelegramBot.conversations, chat_id);
			}
			
			console.log('Conversation ended with ' +  username + ' in Chat ID(' + chat_id + '). ' + Object.keys(TelegramBot.conversations).length + ' chats with active conversations remaining.');
			
			return true;
		}
	}
	console.log('There was no conversation with ' +  username + ' in Chat ID(' + chat_id + ').');
	//console.log('endConversation: Now we have ' + Object.keys(TelegramBot.conversations).length + ' chats with active conversations.');
}

TelegramBot.setCatchAllText = (enabled, callback) => {
	TelegramBot.catchAllText.enabled = enabled;

	if (enabled) {
		console.log('Registered catch-all for texts');
		TelegramBot.catchAllText.callback = callback;
	} else {
		console.log('De-registered catch-all for texts');
	}
};

TelegramBot.method = (method, params = {}) => {
	try {
		const url = TelegramBot.requestUrl(method);
		const res = HTTP.get(url, { params });
		
		if (res.data) {
			return res.data;
		}
	} catch (e) {
		console.log('Error in polling: ' + e);
		return false;
	}
}

TelegramBot.send = (msg, chatId, markdown, reply_markup, replyCallback) => {
	if (!msg) {
		return false;
	}

	const sendMessageObject = {
		chat_id: chatId,
		text: msg
	};

	if (markdown)
		sendMessageObject.parse_mode = 'Markdown';

	if (reply_markup)
		sendMessageObject.reply_markup = JSON.stringify(reply_markup);

	const res = TelegramBot.method('sendMessage', sendMessageObject);

	if (res && reply_markup && replyCallback) {
		if (!TelegramBot.callbacks[chatId])
			TelegramBot.callbacks[chatId] = {};

		TelegramBot.callbacks[chatId][res.result.message_id] = replyCallback;
	}

	return res;
}
