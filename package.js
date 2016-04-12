Package.describe({
  name: 'unglued:telegram-bot',
  version: '1.2.2',
  summary: 'TelegramBot API wrapper',
  git: 'https://github.com/zenador/meteor-telegram-bot',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.1.0.2');
  api.use(['http', 'ecmascript@0.1.6'], 'server');
  api.addFiles(['telegram-bot.js'], 'server');
  api.export('TelegramBot', 'server');
});

Package.onTest(function(api) {
  api.use(['tinytest','unglued:telegram-bot','http'], 'server');
  api.addFiles('telegram-bot-tests.js', 'server');
});
