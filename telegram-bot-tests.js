/* globals TelegramBot */

Tinytest.add('Is TelegramBot defined', test => {
  test.isNotUndefined(TelegramBot);
});

Tinytest.add('Is body-parser defined', test => {
  test.isNotUndefined(Npm.require('body-parser'));
});

Tinytest.add('Is token false', test => {
  test.equal(TelegramBot.token, false);
});

Tinytest.add('addListener', test => {
  TelegramBot.addListener('/test', () => 'test');
  test.equal(TelegramBot.triggers[0].callback(), 'test');
});

Tinytest.add('Is string parsed', test => {
  const temp = TelegramBot.parseCommandString('/test@bot test');
  test.equal(temp[0], '/test');
  test.equal(temp[1], 'test');
});

Tinytest.add('Is apiBase set correct', test => {
  test.equal(TelegramBot.apiBase, 'https://api.telegram.org/bot');
});

Tinytest.add('will it blend', test => {
  HTTP.get = (url, options) => {
    test.equal(options.params.chat_id, 'test');
    test.equal('https://api.telegram.org/bottest/sendMessage', url);
    return 'we are testing';
  };
  TelegramBot.token = 'test';
  TelegramBot.send('test', 'test');
  TelegramBot.token = false;
});
