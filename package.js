Package.describe({
  name: 'benjick:telegram-bot',
  version: '0.1.0',
  summary: 'TelegramBot API wrapper',
  git: 'https://github.com/benjick/meteor-telegram-api',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.1.0.2');
  api.use(['meteorhacks:picker', 'http'], 'server');
  Npm.depends({"body-parser": "1.13.1"})
  api.addFiles(['routes.js', 'telegram-bot.js'], 'server');
  api.export('TelegramBot', 'server');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('benjick:telegram-bot');
  api.addFiles('telegram-bot-tests.js');
});