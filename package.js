Package.describe({
  name: 'dcsan:telegram-bot',
  version: '0.0.1',
  summary: 'TelegramBot API wrapper - FORK',
  git: 'https://github.com/dcsan/meteor-telegram-bot',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.1.0.2');
  api.use(['http'], 'server');
  api.addFiles(['telegram-bot.js'], 'server');
  api.export('TelegramBot', 'server');
});

Package.onTest(function(api) {
  api.use(['tinytest','benjick:telegram-bot','http'], 'server');
  api.addFiles('telegram-bot-tests.js', 'server');
});
