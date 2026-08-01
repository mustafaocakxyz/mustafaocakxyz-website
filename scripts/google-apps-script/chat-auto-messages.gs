/**
 * Chat auto-messages — 12:30, 16:45, 21:00 Europe/Istanbul
 *
 * SETUP:
 * 1. Run scripts/supabase/018_push_and_auto_messages.sql in Supabase.
 * 2. Same Apps Script project as digest (Script properties already have
 *    SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).
 * 3. Paste this file, set project timezone to Europe/Istanbul.
 * 4. Run setupAutoMessageTriggers() once.
 * 5. Optional test: runAutoMessagesForSlot('midday') etc.
 *
 * DISABLE / RE-ENABLE:
 * - Set AUTO_MESSAGES_ENABLED = false to stop sending (triggers may still fire).
 * - Optionally run clearAutoMessageTriggers() so timers don't fire at all.
 * - To bring back: set true, Save, then run setupAutoMessageTriggers() if cleared.
 */

/** Set true to turn scheduled auto-messages back on. */
var AUTO_MESSAGES_ENABLED = false;

function runAutoMessagesForSlot(slot) {
  if (!AUTO_MESSAGES_ENABLED) {
    Logger.log('Auto-messages disabled (AUTO_MESSAGES_ENABLED=false). Slot=' + slot);
    return { sent: [], skipped: [], disabled: true };
  }

  var props = PropertiesService.getScriptProperties();
  var supabaseUrl = String(props.getProperty('SUPABASE_URL') || '').replace(/\/$/, '');
  var serviceKey = props.getProperty('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  var response = UrlFetchApp.fetch(supabaseUrl + '/rest/v1/rpc/run_chat_auto_messages', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      apikey: serviceKey,
      Authorization: 'Bearer ' + serviceKey,
    },
    payload: JSON.stringify({ p_slot: slot }),
    muteHttpExceptions: true,
  });

  var code = response.getResponseCode();
  var text = response.getContentText();
  if (code < 200 || code >= 300) {
    throw new Error('run_chat_auto_messages failed (' + code + '): ' + text);
  }

  var result = JSON.parse(text);
  sendExpoPushesForAutoMessages(result);
  Logger.log('Auto-messages ' + slot + ': sent=' + ((result.sent || []).length) +
    ' skipped=' + ((result.skipped || []).length));
  return result;
}

function runAutoMessagesMidday() {
  return runAutoMessagesForSlot('midday');
}

function runAutoMessagesAfternoon() {
  return runAutoMessagesForSlot('afternoon');
}

function runAutoMessagesEvening() {
  return runAutoMessagesForSlot('evening');
}

function sendExpoPushesForAutoMessages(result) {
  var sent = result.sent || [];
  var messages = [];
  for (var i = 0; i < sent.length; i++) {
    var row = sent[i];
    var tokens = row.tokens || [];
    for (var t = 0; t < tokens.length; t++) {
      var token = tokens[t];
      if (!token || String(token).indexOf('ExponentPushToken') !== 0) continue;
      messages.push({
        to: token,
        title: 'Gelişim',
        body: 'Yeni bir mesajın var.',
        sound: 'default',
        data: { type: 'chat', studentId: row.studentId },
      });
    }
  }
  if (messages.length === 0) return;

  // Expo accepts batches up to 100
  for (var start = 0; start < messages.length; start += 100) {
    var chunk = messages.slice(start, start + 100);
    UrlFetchApp.fetch('https://exp.host/--/api/v2/push/send', {
      method: 'post',
      contentType: 'application/json',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      payload: JSON.stringify(chunk),
      muteHttpExceptions: true,
    });
  }
}

/**
 * Triggers near 12:30, 16:45, 21:00.
 * Apps Script only supports hourly atHour — we use 12, 16, 21 and the RPC
 * is idempotent per day+slot. For closer timing, use multiple near-hour runs
 * or Cloud Scheduler. Default: atHour(12), atHour(16), atHour(21).
 *
 * NOTE: atHour(16) runs sometime 16:00–16:59; atHour(21) in 21:00–21:59.
 * If you need exact :30 / :45, use Google Cloud Scheduler hitting an HTTPS
 * deploy of this script, or Supabase pg_cron.
 */
function setupAutoMessageTriggers() {
  clearAutoMessageTriggers();

  ScriptApp.newTrigger('runAutoMessagesMidday')
    .timeBased()
    .atHour(12)
    .nearMinute(30)
    .everyDays(1)
    .create();

  ScriptApp.newTrigger('runAutoMessagesAfternoon')
    .timeBased()
    .atHour(16)
    .nearMinute(45)
    .everyDays(1)
    .create();

  ScriptApp.newTrigger('runAutoMessagesEvening')
    .timeBased()
    .atHour(21)
    .nearMinute(0)
    .everyDays(1)
    .create();

  Logger.log('Auto-message triggers created (project TZ should be Europe/Istanbul).');
}

function clearAutoMessageTriggers() {
  var names = {
    runAutoMessagesMidday: true,
    runAutoMessagesAfternoon: true,
    runAutoMessagesEvening: true,
  };
  var handlers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < handlers.length; i++) {
    if (names[handlers[i].getHandlerFunction()]) {
      ScriptApp.deleteTrigger(handlers[i]);
    }
  }
  Logger.log('Auto-message triggers cleared.');
}
