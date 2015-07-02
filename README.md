Adds an easy to use Telegram Bot API wrapper.

### Installation

    meteor add benjick:telegram-bot

### Usage

First of all, follow the instructions at [https://core.telegram.org/bots](https://core.telegram.org/bots) go get your authkey.

Then set your webHookUrl to `https://yourmeteorsite.com/incomingTelegram` with

    https://api.telegram.org/bot123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11/setWebhook?url=https://yourmeteorsite.com/incomingTelegram

Where `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11` is the token you got from BotFather. The request has to be over https (self-signed doesn't work for now, but the free cert from Cloudflare works)

Now you can either set the environment variable `TELEGRAM_TOKEN` to your token or you can run `TelegramBot.token = 'MY_TOKEN_HERE'` on startup.

Now you can add listeners and listen for incoming webHooks.

#### A few examples

```js
if (Meteor.isServer) {
  Meteor.startup(function () {
    // set our token
    TelegramBot.token = '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11';
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

#### Overriding listerner

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