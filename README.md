Adds an easy to use Telegram Bot API wrapper.

## Installation

    meteor add benjick:telegram-bot

## Usage

First of all, follow the instructions at [https://core.telegram.org/bots](https://core.telegram.org/bots) go get your authkey.

Now you can either set the environment variable `TELEGRAM_TOKEN` to your token or you can run `TelegramBot.token = 'MY_TOKEN_HERE'` on startup.

Now you can add listeners and listen for incoming webHooks.

### API

#### TelegramBot.addListener(command, callback, type = text)

Add a command which should be listened for by the server. If this command is found the callback will be called. The callback takes three arguments:

 * command - the command parsed to an array (see Telegram.parseCommandString)
 * username - username of the sender as a string
 * original - the original object sent from Telegram

See examples below

If you set type to anything else than `'text'` (default value) in type `command` has no effect and that function will run every time you get something with that type (for example `document` (getting files) or `voice` (voice recordings)).

#### TelegramBot.start();

Starts polling the Telegram-servers

#### TelegramBot.stop();

Stops polling

#### TelegramBot.poll();

Does the actual request to Telegrams server with the method `getUpdates` and sets the offset so we can mark the messages as read

#### TelegramBot.parsePollResult(data);

Parses the result from the polling and executes callbacks from `addListener`

#### TelegramBot.requestUrl(method);

Creates an URL which is GETable with baseUrl + token + method

#### TelegramBot.method(method, object);

Call a Telegram Bot API method. Full spec at [https://core.telegram.org/bots/api#available-methods](https://core.telegram.org/bots/api#available-methods)

Check if the auth token is correct:

    TelegramBot.method(getMe)

#### TelegramBot.send(message, chatId);

Shorthand for `TelegramBot.method('sendMessage', { chat_id: chatId, text: message })`.

#### TelegramBot.triggers = []

Array containing all the added listeners and their callbacks

#### TelegramBot.parseCommandString(msg)

Takes the incoming message, strips the *@botname* out if any (used in channels with multiple bots) and returns an array where every key represents a command or argument.

For example:
```js
var msg = "/test@thisbot is fun";
msg = TelegramBot.parseCommandString(msg);
console.log(msg); // [ '/test', 'is', 'fun' ]
```

This means you can get the arguments in a nice way. This is done when a webHook is received.

#### TelegramBot.startConversation(username, chat_id, callback, init_vars)

Starts a conversation with a specific user in a specific chat. `callback` method is called whenever the user replies to this conversation. The callback method takes 3 parameters: `username`, `message`, `chat_id`.

The `init_vars` argument is to allow you to use custom variables in your conversation,illustrated below with `stage`, `first_message`, and `second_message`.

For example:
```js
TelegramBot.startConversation(username, chat_id, function(username, message, chat_id) {
    var obj = _.find(TelegramBot.conversations[chat_id], obj => obj.username == username);
    console.log('Conversation Status: ' + obj);
    switch(obj.stage) {
        case 0:
            TelegramBot.send('You have first responded with: ' + message + '\nWhat else do you want to say?', chat_id);
            obj.first_message = message;
            obj.stage++;
            break;

        case 1:
            TelegramBot.send('You then said: ' + message, chat_id);
            obj.second_message = message;
            TelegramBot.endConversation(username, chat_id);
            break;
    }
}, {stage: 0, first_message: "", second_message: ""} );
```

> A full example of conversation handling is given below in the Examples section.

#### TelegramBot.endConversation(username, chat_id)

Used to end a conversation session.

### A few examples

```js
if(Meteor.isServer) {
	Meteor.startup(function() {
	// set our token
	TelegramBot.token = '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11';
	TelegramBot.start(); // start the bot
	// add a listener for '/test'
	TelegramBot.addListener('/test', function(command) {
		// command will contain the entire command in an array where command[0] is the command.
		// In this case '/test'. Each argument will follow.
		if(!command[1]) { // if no arguments
			return false
			// if you return false the bot wont answer
		}
		// command[1] will be the first argument, command[2] the second etc
		// below the bot will reply with 'test: hi' if you sent him /test hi
		return "test: " + command[1]
		});
	});
}
```

```js
// You can also get the username via the second argument
TelegramBot.addListener('/hi', function(command, username) {
	return "hi @" + username
})
```

Listing all commands:

```js
TelegramBot.addListener('/help', function(command) {
	var msg = "I have the following commands loaded:\n";
	TelegramBot.triggers.text.forEach(function (post) {
	msg = msg + "- " + post.command + "\n";
	});
	return msg;
});
```

Example using other types than the default

```js
TelegramBot.addListener('incoming_document', function(c, u, o) {
	TelegramBot.send('Got a file with ID ' + o.document.file_id, o.chat.id);
	var file = TelegramBot.method('getFile', {
		file_id: o.document.file_id
	}).result.file_path;
	// Don't do this in production because it will expose your Telegram Bot's API key
	TelegramBot.send('Download the file at https://api.telegram.org/file/bot' + TelegramBot.token + '/' + file, o.chat.id);
}, 'document');
```

#### Overriding listeners

You can do what you want in the callback for the listener really. For example call another method instead of sendMessage

```js
TelegramBot.addListener('/geo', function(command, username, original) {
	TelegramBot.method('sendLocation',{
		chat_id: original.chat.id,
		latitude: 59.329323,
		longitude: 18.068581
	});
});
```

#### Conversations

You can monitor all incoming chat messages from a user using conversations.

Below is a basic example showing how a Bot can ask for 2 responses and print them out.
The conversation is initiated by the user using `/start`.

```js
TelegramBot.addListener('/start', function(command, username, messageraw) {
    TelegramBot.startConversation(username, messageraw.chat.id, function(username, message, chat_id) {
        var obj = _.find(TelegramBot.conversations[chat_id], obj => obj.username == username);
        console.log('Conversation Status: ' + obj);
        switch(obj.stage) {
            case 0:
                TelegramBot.send('You have first responded with: ' + message + '\nWhat else do you want to say?', chat_id);
                obj.first_message = message;
                obj.stage++;
                break;

            case 1:
                TelegramBot.send('You then said: ' + message + '\nReply to repeat what you said', chat_id);
                obj.second_message = message;
                break;

            case 2:
                TelegramBot.send("1. " + obj.first_message + "\n2. " + obj.second_message);
                TelegramBot.endConversation(username, chat_id);
                break;
        }
    }, {stage: 0, first_message: "", second_message: ""} );
});
```
