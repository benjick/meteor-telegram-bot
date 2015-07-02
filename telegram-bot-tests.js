// Write your tests here!
// Here is an example.

Tinytest.add('Is TelegramBot defined', function (test) {
  test.isNotUndefined(TelegramBot);
});

Tinytest.add('Is body-parser defined', function (test) {
  test.isNotUndefined(Npm.require('body-parser'));
});

Tinytest.add('Is token false', function (test) {
  test.equal(TelegramBot.token, false);
});

Tinytest.add('addListener', function (test) {
  TelegramBot.addListener('/test', function() {
  	return "test"
  })
  test.equal(TelegramBot.triggers[0].callback(), "test");
});

Tinytest.add('Is string parsed', function (test) {
  var temp = TelegramBot.parseCommandString('/test@bot test')
  test.equal(temp[0], '/test');
  test.equal(temp[1], 'test');
});

Tinytest.add('Is apiBase set correct', function (test) {
  test.equal(TelegramBot.apiBase, "https://api.telegram.org/bot");
});

Tinytest.add('will it blend', function (test) {
	HTTP.get = function(url, options) {
    test.equal(options.params.chat_id, "test");
		test.equal('https://api.telegram.org/bottest/sendMessage', url)

    return "we are testing"
	}
	TelegramBot.token = "test";
	TelegramBot.send("test", "test");
});