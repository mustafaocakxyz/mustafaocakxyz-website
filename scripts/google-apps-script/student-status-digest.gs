/**
 * Student status digest emails — 12:00, 17:00, 21:00 Europe/Istanbul
 *
 * SETUP (one-time):
 * 1. In the SAME Google Apps Script project as basvuru (or a new one bound to any Drive file):
 *    Paste this file as a new script file, e.g. "student-status-digest".
 * 2. Project Settings → Script properties → Add:
 *      SUPABASE_URL          = https://cngmoqwmxucrtqryrtat.supabase.co
 *      SUPABASE_SERVICE_ROLE_KEY = (Supabase → Project Settings → API → service_role secret)
 * 3. Run SQL: scripts/supabase/005_status_digest.sql in Supabase SQL Editor.
 * 4. In Apps Script: run setupDigestTriggers() once (authorize when prompted).
 * 5. Optional: run sendStudentStatusDigest() once to test.
 *
 * Emails go to NOTIFY_EMAIL below via Gmail of the Google account that owns this script.
 */

const DIGEST_NOTIFY_EMAIL = 'xakademi.iletisim@gmail.com';

function sendStudentStatusDigest() {
  var props = PropertiesService.getScriptProperties();
  var supabaseUrl = String(props.getProperty('SUPABASE_URL') || '').replace(/\/$/, '');
  var serviceKey = props.getProperty('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      'Missing Script Properties: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY',
    );
  }

  var response = UrlFetchApp.fetch(supabaseUrl + '/rest/v1/rpc/admin_student_status_digest', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      apikey: serviceKey,
      Authorization: 'Bearer ' + serviceKey,
    },
    payload: '{}',
    muteHttpExceptions: true,
  });

  var code = response.getResponseCode();
  var text = response.getContentText();
  if (code < 200 || code >= 300) {
    throw new Error('Supabase digest failed (' + code + '): ' + text);
  }

  var digest = JSON.parse(text);
  var mail = buildDigestEmail(digest);

  MailApp.sendEmail({
    to: DIGEST_NOTIFY_EMAIL,
    subject: mail.subject,
    body: mail.body,
  });
}

function buildDigestEmail(digest) {
  var students = digest.students || [];
  var generatedAt = digest.generatedAt || '';
  var today = digest.today || '';
  var tomorrow = digest.tomorrow || '';

  var lines = [
    'Öğrenci durumu özeti',
    'Zaman: ' + generatedAt + ' (Europe/Istanbul)',
    'Bugün: ' + today + '  |  Yarın: ' + tomorrow,
    '',
  ];

  if (students.length === 0) {
    lines.push('Aktif öğrenci yok.');
  } else {
    for (var i = 0; i < students.length; i++) {
      var s = students[i];
      var todayInfo = s.today || {};
      var percentLabel =
        todayInfo.percent === null || todayInfo.percent === undefined
          ? '— (görev yok)'
          : '%' + todayInfo.percent +
            ' (' + (todayInfo.completed || 0) + '/' + (todayInfo.total || 0) + ')';
      var tomorrowLabel = s.tomorrowReady ? '✅ hazır' : '❌ yok';

      lines.push(
        (s.displayName || s.loginUsername || 'Öğrenci') +
          '  |  Bugün: ' +
          percentLabel +
          '  |  Yarın: ' +
          tomorrowLabel,
      );
    }
  }

  var hourLabel = '';
  try {
    hourLabel =
      ' — ' +
      Utilities.formatDate(
        new Date(),
        'Europe/Istanbul',
        'HH:mm',
      );
  } catch (e) {
    hourLabel = '';
  }

  return {
    subject: 'Öğrenci durumu' + hourLabel + ' (' + today + ')',
    body: lines.join('\n'),
  };
}

/**
 * Creates/replaces time-based triggers for 12:00, 17:00, 21:00 Istanbul.
 * Apps Script triggers use the script owner's timezone — set project timezone
 * to Europe/Istanbul: Project Settings → Time zone.
 */
function setupDigestTriggers() {
  var handlers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < handlers.length; i++) {
    if (handlers[i].getHandlerFunction() === 'sendStudentStatusDigest') {
      ScriptApp.deleteTrigger(handlers[i]);
    }
  }

  var hours = [12, 17, 21];
  for (var h = 0; h < hours.length; h++) {
    ScriptApp.newTrigger('sendStudentStatusDigest')
      .timeBased()
      .atHour(hours[h])
      .everyDays(1)
      .create();
  }

  Logger.log('Digest triggers set for hours: ' + hours.join(', '));
}

function clearDigestTriggers() {
  var handlers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < handlers.length; i++) {
    if (handlers[i].getHandlerFunction() === 'sendStudentStatusDigest') {
      ScriptApp.deleteTrigger(handlers[i]);
    }
  }
  Logger.log('Digest triggers cleared.');
}
