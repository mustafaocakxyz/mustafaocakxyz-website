/**
 * CORRECTED full script — single doPost, gelisim before tek.
 * Replace entire Apps Script project contents with this (update secrets first).
 */

const SHEET_NAME = 'Başvurular';
const SUBMIT_SECRET = 'xyzxyzxyzxyz';

const HEADERS = [
  'Timestamp', 'İsim', 'Sınıf', 'Alan', 'Hedef Bölüm', 'Hedef Derece', 'Geçmiş Dereceler',
  'TYT Türkçe', 'TYT Sosyal', 'TYT Matematik', 'TYT Geometri', 'TYT Fen',
  'AYT Bilgileri',
  'Ortalama Çalışma', 'Ortalama Ekran', 'Uyku Düzeni',
  'TYT Kaynak Türkçe', 'TYT Kaynak Sosyal', 'TYT Kaynak Matematik', 'TYT Kaynak Geometri', 'TYT Kaynak Fen',
  'AYT Kaynakları',
  'Program Tercihi', 'Zorlayan Şeyler', 'Beklentiler', 'Müsaitlik', 'Ekstra',
  'raw_json',
];

const PROGRAM_LABELS = {
  'sifirdan-program': 'Sıfırdan yeni bir program yapmak istiyorum.',
  'program-gelistir': 'Programımı onaylatmak ve geliştirmek istiyorum.',
};

const GELISIM_SHEET_NAME = 'Gelişim Başvurular';
const GELISIM_SUBMIT_SECRET = 'xyzxyzxyz';
const NOTIFY_EMAIL = 'xakademi.iletisim@gmail.com';

const GELISIM_HEADERS = [
  'Timestamp', 'İsim', 'Telefon', 'Sınıf', 'Alan', 'Hedef Bölüm', 'Hedef Derece', 'Geçmiş Dereceler',
  'TYT Türkçe', 'TYT Sosyal', 'TYT Matematik', 'TYT Geometri', 'TYT Fen',
  'AYT Bilgileri',
  'Ortalama Çalışma', 'Ortalama Ekran', 'Uyku Düzeni',
  'Neden Program', 'Engelleyen Sebepler', 'Beklentiler',
  'Alışkanlık Hazır mı?', 'Çalışma Hazır mı?',
  'Başlangıç Zamanı', 'Ekstra',
  'raw_json',
];

const YES_NO_UNSURE = {
  evet: 'Evet',
  kararsizim: 'Kararsızım',
  hayir: 'Hayır',
};

const START_TIME = {
  yarin: 'Yarın',
  'bu-hafta': 'Bu Hafta',
  'daha-sonra': 'Daha Sonra',
};

const BILGILENDIRME_SHEET_NAME = 'Gelişim Bilgilendirme';
const BILGILENDIRME_SUBMIT_SECRET = 'xyzxyz';

const BILGILENDIRME_HEADERS = [
  'Timestamp', 'İsim', 'Sınıf', 'Alan',
  'TYT Türkçe', 'TYT Sosyal', 'TYT Matematik', 'TYT Geometri', 'TYT Fen',
  'AYT Bilgileri',
  'Ortalama Çalışma', 'Ortalama Ekran', 'Uyku Düzeni',
  'TYT Kaynak Türkçe', 'TYT Kaynak Sosyal', 'TYT Kaynak Matematik', 'TYT Kaynak Geometri', 'TYT Kaynak Fen',
  'AYT Kaynakları',
  'İlk Görüşme Müsaitlik', 'Ekstra',
  'raw_json',
];

function doGet() {
  return jsonResponse({ ok: true, message: 'Başvuru endpoint is alive' });
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ ok: false, error: 'Empty request body' });
    }

    var data = JSON.parse(e.postData.contents);
    var formType = data.formType || 'tek-seferlik';

    if (formType === 'gelisim') {
      if (data.secret !== GELISIM_SUBMIT_SECRET) {
        return jsonResponse({ ok: false, error: 'Unauthorized' });
      }
      var isim = String(data.isim || '').trim();
      var telefon = String(data.telefon || '').trim();
      if (!isim || !telefon) {
        return jsonResponse({
          ok: false,
          error: 'İsim ve telefon numarası zorunludur.',
        });
      }
      appendGelisimRow(data);
      try {
        notifyGelisimBasvuru(data);
      } catch (mailErr) {
        // Sheet write already succeeded — don't fail the applicant submit
        Logger.log('notifyGelisimBasvuru failed: ' + mailErr);
      }
      return jsonResponse({ ok: true });
    }

    if (formType === 'gelisim-bilgilendirme') {
      if (data.secret !== BILGILENDIRME_SUBMIT_SECRET) {
        return jsonResponse({ ok: false, error: 'Unauthorized' });
      }
      appendBilgilendirmeRow(data);
      return jsonResponse({ ok: true });
    }

    if (SUBMIT_SECRET && data.secret !== SUBMIT_SECRET) {
      return jsonResponse({ ok: false, error: 'Unauthorized' });
    }
    appendRow(buildRow(data));
    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function buildRow(data) {
  var aytInfo = summarizePrefixedFields(data, 'ayt-', ['ayt-kaynak-']);
  var aytKaynak = summarizePrefixedFields(data, 'ayt-kaynak-');

  var programKey = data['program-tercihi'] || '';
  var programLabel = PROGRAM_LABELS[programKey] || programKey;

  return [
    new Date(),
    data.isim || '',
    data.sinif || '',
    data.alan || '',
    data['hedef-bolum'] || '',
    data['hedef-derece'] || '',
    data['gecmis-dereceler'] || '',
    data['tyt-turkce'] || '',
    data['tyt-sosyal'] || '',
    data['tyt-matematik'] || '',
    data['tyt-geometri'] || '',
    data['tyt-fen'] || '',
    aytInfo,
    data['ortalama-calisma'] || '',
    data['ortalama-ekran'] || '',
    data['uyku-duzeni'] || '',
    data['tyt-kaynak-Türkçe'] || '',
    data['tyt-kaynak-Sosyal'] || '',
    data['tyt-kaynak-Matematik'] || '',
    data['tyt-kaynak-Geometri'] || '',
    data['tyt-kaynak-Fen'] || '',
    aytKaynak,
    programLabel,
    data['zorlayan-seyler'] || '',
    data['beklentiler'] || '',
    data.musaitlik || '',
    data.ekstra || '',
    JSON.stringify(data),
  ];
}

function appendGelisimRow(data) {
  var aytInfo = summarizePrefixedFields(data, 'ayt-', []);

  var row = [
    new Date(),
    data.isim || '',
    data.telefon || '',
    data.sinif || '',
    data.alan || '',
    data['hedef-bolum'] || '',
    data['hedef-derece'] || '',
    data['gecmis-dereceler'] || '',
    data['tyt-turkce'] || '',
    data['tyt-sosyal'] || '',
    data['tyt-matematik'] || '',
    data['tyt-geometri'] || '',
    data['tyt-fen'] || '',
    aytInfo,
    data['ortalama-calisma'] || '',
    data['ortalama-ekran'] || '',
    data['uyku-duzeni'] || '',
    data['neden-program'] || '',
    data['engelleyen-sebepler'] || '',
    data['beklentiler'] || '',
    YES_NO_UNSURE[data['alisverkanlik-hazir']] || data['alisverkanlik-hazir'] || '',
    YES_NO_UNSURE[data['calisma-hazir']] || data['calisma-hazir'] || '',
    START_TIME[data['baslangic-zamani']] || data['baslangic-zamani'] || '',
    data.ekstra || '',
    JSON.stringify(data),
  ];

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(GELISIM_SHEET_NAME);
  if (!sheet) throw new Error('Sheet not found: ' + GELISIM_SHEET_NAME);
  if (sheet.getLastRow() === 0) sheet.appendRow(GELISIM_HEADERS);
  sheet.appendRow(row);
}

function notifyGelisimBasvuru(data) {
  var isim = data.isim || 'İsimsiz';
  var telefon = data.telefon || '-';
  var sinif = data.sinif || '-';
  var alan = data.alan || '-';
  var hedef = data['hedef-bolum'] || '-';
  var baslangic =
    START_TIME[data['baslangic-zamani']] || data['baslangic-zamani'] || '-';

  var subject = 'Yeni Gelişim Programı başvurusu: ' + isim;
  var body = [
    'Yeni bir Gelişim Programı başvurusu geldi.',
    '',
    'İsim: ' + isim,
    'Telefon: ' + telefon,
    'Sınıf: ' + sinif,
    'Alan: ' + alan,
    'Hedef bölüm: ' + hedef,
    'Başlangıç: ' + baslangic,
    '',
    'Detaylar Google Sheet’te: Gelişim Başvurular',
  ].join('\n');

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: subject,
    body: body,
  });
}

function summarizePrefixedFields(data, prefix, excludePrefixes) {
  excludePrefixes = excludePrefixes || [];

  var lines = Object.keys(data)
    .filter(function (key) {
      if (!key.startsWith(prefix)) return false;
      for (var i = 0; i < excludePrefixes.length; i++) {
        if (key.startsWith(excludePrefixes[i])) return false;
      }
      return String(data[key] || '').trim() !== '';
    })
    .sort()
    .map(function (key) {
      var branch = key.slice(prefix.length).replace(/-/g, ' ');
      return branch + ': ' + data[key];
    });

  return lines.join('\n');
}

function appendRow(row) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    throw new Error('Sheet not found: ' + SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
  }

  sheet.appendRow(row);
}

function appendBilgilendirmeRow(data) {
  var aytInfo = summarizePrefixedFields(data, 'ayt-', ['ayt-kaynak-']);
  var aytKaynak = summarizePrefixedFields(data, 'ayt-kaynak-');

  var musaitlikKey = data['ilk-gorusme-musaitlik'] || '';
  var musaitlikLabel =
    musaitlikKey === 'musaitim' ? 'Müsaitim' :
    musaitlikKey === 'degilim' ? 'Değilim' :
    musaitlikKey;

  var row = [
    new Date(),
    data.isim || '',
    data.sinif || '',
    data.alan || '',
    data['tyt-turkce'] || '',
    data['tyt-sosyal'] || '',
    data['tyt-matematik'] || '',
    data['tyt-geometri'] || '',
    data['tyt-fen'] || '',
    aytInfo,
    data['ortalama-calisma'] || '',
    data['ortalama-ekran'] || '',
    data['uyku-duzeni'] || '',
    data['tyt-kaynak-Türkçe'] || '',
    data['tyt-kaynak-Sosyal'] || '',
    data['tyt-kaynak-Matematik'] || '',
    data['tyt-kaynak-Geometri'] || '',
    data['tyt-kaynak-Fen'] || '',
    aytKaynak,
    musaitlikLabel,
    data.ekstra || '',
    JSON.stringify(data),
  ];

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(BILGILENDIRME_SHEET_NAME);
  if (!sheet) throw new Error('Sheet not found: ' + BILGILENDIRME_SHEET_NAME);
  if (sheet.getLastRow() === 0) sheet.appendRow(BILGILENDIRME_HEADERS);
  sheet.appendRow(row);
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function testGelisimSubmit() {
  doPost({
    postData: {
      contents: JSON.stringify({
        formType: 'gelisim',
        secret: GELISIM_SUBMIT_SECRET,
        isim: 'Test Öğrenci',
        telefon: '0555 123 4567',
        alan: 'SAY',
        'ayt-Matematik': '28 net',
      }),
    },
  });
}

/** Run this once from the editor to grant MailApp permission, then redeploy. */
function authorizeMailApp() {
  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: 'Apps Script mail yetkisi test',
    body: 'MailApp yetkisi başarılı. Bu testi silebilirsin.',
  });
}
