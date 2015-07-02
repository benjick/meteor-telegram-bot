var bodyParser = Npm.require('body-parser'); 
Picker.middleware(bodyParser.urlencoded({ extended: false }));
Picker.middleware(bodyParser.json());

Picker.route('/incomingTelegram', function(params, req, res, next) {
	if(req.body.message) {
		var chatId = req.body.message.chat.id;
		var from = req.body.message.from.username;
		if(msg = req.body.message.text) {
			msg = TelegramBot.s(msg)
			var obj = _.find(TelegramBot.triggers, function(obj) { return obj.command == msg[0] })
			if(obj) {
				TelegramBot.send(obj.callback(msg, from), chatId)
			}
		}
	}
	res.end("thanks");
});