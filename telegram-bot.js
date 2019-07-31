/* globals TelegramBot */
TelegramBot = {}; // eslint-disable-line no-native-reassign
TelegramBot.triggers = {};
TelegramBot.conversations = {};
TelegramBot.callbacks = {};
TelegramBot.catchAllText = {
  enabled: false,
  callback: (username, message) => console.log(`Default catchAll Method. Received: ${message}`),
};
TelegramBot.apiBase = 'https://api.telegram.org/bot';
TelegramBot.token = false;
TelegramBot.init = false;
TelegramBot.getUpdatesOffset = 0;
TelegramBot.interval = false;

TelegramBot.parseCommandString = string => {
  // splits string into an array
  // and removes the @botname from the command
  // then returns the array
  const msg = string.split(' ');
  msg[0] = msg[0].split('@')[0];
  return msg;
};

TelegramBot.poll = () => {
  const result = TelegramBot.method('getUpdates', {
    offset: TelegramBot.getUpdatesOffset + 1,
  });

  // Additional check for duplicate poll data
  // Also skips the call to parsePollResults if there were no results
  if (result && result.result.length > 0 &&
    TelegramBot.getUpdatesOffset !== _.last(result.result).update_id) {
    TelegramBot.parsePollResult(result.result);
  }
};

TelegramBot.start = () => {
  TelegramBot.poll();
  TelegramBot.interval = Meteor.setInterval(TelegramBot.poll, 1000);
};

TelegramBot.stop = () => {
  Meteor.clearInterval(TelegramBot.interval);
};

TelegramBot.parsePollResult = data => {
  data.map(item => {
    TelegramBot.getUpdatesOffset = item.update_id;

    const message = item.message;

    if (message) {
      const keys = Object.keys(message);

      if (keys[keys.length - 1] === 'entities') {
        keys.pop();
      }

      const type = keys.pop();
      const fromUsername = item.message.from.username;
      const chatId = message.chat.id;
      let isConversation = false;

      if (typeof(TelegramBot.conversations[chatId]) !== 'undefined') {
        const obj = _.find(TelegramBot.conversations[chatId], o => o.username === fromUsername);

        if (obj) {
          isConversation = true;
          obj.callback(fromUsername, message.text, chatId);
        }
      }

      if (!isConversation) {
        if (type === 'text' && typeof(TelegramBot.triggers.text) !== 'undefined') {
          const msg = TelegramBot.parseCommandString(item.message.text);
          const obj = _.find(TelegramBot.triggers.text, o => o.command === msg[0]);

          if (obj) {
            TelegramBot.send(obj.callback(msg, fromUsername, message), chatId);
          } else if (TelegramBot.catchAllText.enabled) {
            TelegramBot.catchAllText.callback(fromUsername, message);
          }
        } else if (typeof(TelegramBot.triggers[type]) !== 'undefined') {
          TelegramBot.triggers[type].map(trigger => {
            trigger.callback('N/A', fromUsername, message);
          });
        }
      }
    } else if (item.callback_query) {
      const callbackQuery = item.callback_query;

      const chatId = callbackQuery.message.chat.id;
      const messageId = callbackQuery.message.message_id;

      const callback = TelegramBot.callbacks[chatId][messageId];

      if (callback) {
        callback(callbackQuery.data);

        delete TelegramBot.callbacks[chatId][messageId];
      }
    }
  });
};

TelegramBot.requestUrl = method => {
  const token = TelegramBot.token || process.env.TELEGRAM_TOKEN;
  return `${TelegramBot.apiBase}${token}/${method}`;
};

TelegramBot.addListener = (command, callback, type = 'text') => {
  if (typeof(command) === 'string' && typeof(callback) === 'function') {
    if (typeof(TelegramBot.triggers[type]) === 'undefined') {
      TelegramBot.triggers[type] = [];
    }

    TelegramBot.triggers[type].push({
      command,
      callback,
    });
    console.log(`Added command: ${command}`);
  } else {
    console.log(`Error adding command: ${command}`);
  }
};

TelegramBot.startConversation = (username, chatId, callback, oldInitVars) => {
  if (typeof(username) === 'string' && typeof(callback) === 'function') {
    if (typeof(TelegramBot.conversations[chatId]) === 'undefined') {
      TelegramBot.conversations[chatId] = [];
    }

    let initVars = {};
    if (typeof(oldInitVars) === 'object') {
      initVars = oldInitVars;
    }

    TelegramBot.conversations[chatId].push(_.defaults(initVars, { username, callback }));

    console.log(`Started conversation in Chat ID (${chatId}) with ${username}`);
  } else {
    console.log(`Error starting conversation in Chat ID (${chatId}) with ${username}`);
  }
};

TelegramBot.endConversation = (username, chatId) => {
  if (typeof(TelegramBot.conversations[chatId]) !== 'undefined') {
    const obj = _.find(TelegramBot.conversations[chatId], o => o.username === username);

    if (obj) {
      TelegramBot.conversations[chatId] = _.reject(TelegramBot.conversations[chatId],
          o => o.username === username);

      if (_.isEmpty(TelegramBot.conversations[chatId])) {
        TelegramBot.conversations = _.omit(TelegramBot.conversations, chatId);
      }
      const length = Object.keys(TelegramBot.conversations).length;
      console.log(
        `Conversation ended with ${username} in Chat ID(${chatId}).
        ${length} chats with active conversations remaining.`);

      return true;
    }
  }
  console.log(`There was no conversation with ${username} in Chat ID(${chatId}).`);
  return false;
};

TelegramBot.setCatchAllText = (enabled, callback) => {
  TelegramBot.catchAllText.enabled = enabled;

  if (enabled) {
    console.log('Registered catch-all for texts');
    TelegramBot.catchAllText.callback = callback;
  } else {
    console.log('De-registered catch-all for texts');
  }
};

TelegramBot.method = (method, params = {}) => {
  try {
    const url = TelegramBot.requestUrl(method);
    const res = HTTP.get(url, { params });

    if (res.data) {
      return res.data;
    }
    throw new Error('No data');
  } catch (error) {
    console.log(`Error in polling: ${error}`);
    return false;
  }
};

TelegramBot.send = (msg, chatId, markdown, replyMarkup, replyCallback) => {
  if (!msg) {
    return false;
  }

  const sendMessageObject = {
    chat_id: chatId,
    text: msg,
  };

  if (markdown) {
    sendMessageObject.parse_mode = 'Markdown';
  }

  if (replyMarkup) {
    sendMessageObject.reply_markup = JSON.stringify(replyMarkup);
  }

  const res = TelegramBot.method('sendMessage', sendMessageObject);

  if (res && replyMarkup && replyCallback) {
    if (!TelegramBot.callbacks[chatId]) {
      TelegramBot.callbacks[chatId] = {};
    }

    TelegramBot.callbacks[chatId][res.result.message_id] = replyCallback;
  }

  return res;
};
