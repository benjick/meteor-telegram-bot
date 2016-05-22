Package.describe({
  name: 'benjick:telegram-bot',
  version: '1.3.0',
  summary: 'TelegramBot API wrapper',
  git: 'https://github.com/benjick/meteor-telegram-bot',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.1.0.2');
  api.use(['http', 'ecmascript@0.1.6'], 'server');
  api.addFiles(['telegram-bot.js'], 'server');
  api.export('TelegramBot', 'server');
});

Package.onTest(function(api) {
  api.use(['tinytest','benjick:telegram-bot','http'], 'server');
  api.addFiles('telegram-bot-tests.js', 'server');
});
