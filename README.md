Adds an easy to use Telegram Bot API wrapper.

## Installation

    meteor add benjick:telegram-bot

## Usage

First of all, follow the instructions at [https://core.telegram.org/bots](https://core.telegram.org/bots) go get your authkey.

Now you can either set the environment variable `TELEGRAM_TOKEN` to your token or you can run `TelegramBot.token = 'MY_TOKEN_HERE'` on startup.

Now you can add listeners and listen for incoming webHooks.

### API

#### TelegramBot.addListener(command, callback)

Add a command which should be listened for by the server. If this command is found the callback will be called. The callback takes three arguments:

 * command - the command parsed to an array (see Telegram.parseCommandString)
 * username - username of the sender as a string
 * original - the original object sent from Telegram

See examples below

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
var msg = "/test@thisbot is fun"
msg = TelegramBot.parseCommandString(msg);
console.log(msg) // [ '/test', 'is', 'fun' ]
```

This means you can get the arguments in a nice way. This is done when a webHook is recieved.

### A few examples

```js
if (Meteor.isServer) {
  Meteor.startup(function () {
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
    })
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
  TelegramBot.triggers.forEach(function (post) {
    msg = msg + "- " + post.command + "\n"
  });
  return msg
})
```

#### Overriding listeners

You can do what you want in the callback for the listener really. For example call another method instead of sendMessage

```js
TelegramBot.addListener('/geo', function(command, username, original) {
  TelegramBot.method('sendLocation',{
    chat_id: original.chat.id,
    latitude: 59.329323,
    longitude: 18.068581
  })
})
```