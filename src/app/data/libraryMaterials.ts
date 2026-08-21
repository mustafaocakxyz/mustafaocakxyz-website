/** Admin material library — mock catalog for UI scaffolding. */

export type LibraryMaterialKind = 'playlist' | 'question_bank' | 'video_course';

export type LibraryVideoItem = {
  id: string;
  title: string;
  /** Display duration, e.g. "12:34" or "1:02:15" */
  duration: string;
};

export type LibraryEntryTone = 'default' | 'uygulama' | 'kontrol' | 'cevap';

export type LibraryTestItem = {
  id: string;
  title: string;
  /** Bold label before title, e.g. "Kazanım Testi-1". */
  prefix?: string;
  /** Starting page from the printed index, when available. */
  page?: number;
  /** Number of tests under this topic (flat index style). */
  testCount?: number;
  /** Visual tone for special index rows. */
  tone?: LibraryEntryTone;
};

export type LibraryChapter = {
  id: string;
  title: string;
  tests: LibraryTestItem[];
  /** Page range for accordion headers, e.g. "7-33". */
  pageRange?: string;
};

type LibraryMaterialBase = {
  id: string;
  name: string;
  kind: LibraryMaterialKind;
  /** Short label shown in the list (publisher, channel, etc.) */
  subtitle: string;
};

export type PlaylistMaterial = LibraryMaterialBase & {
  kind: 'playlist';
  sourceUrl?: string;
  videos: LibraryVideoItem[];
};

export type QuestionBankMaterial = LibraryMaterialBase & {
  kind: 'question_bank';
  /** flat = playlist-style list; accordion = chapter dropdowns. */
  layout?: 'flat' | 'accordion';
  chapters: LibraryChapter[];
};

export type VideoCourseMaterial = LibraryMaterialBase & {
  kind: 'video_course';
  videos: LibraryVideoItem[];
};

export type LibraryMaterial =
  | PlaylistMaterial
  | QuestionBankMaterial
  | VideoCourseMaterial;

export const LIBRARY_KIND_LABEL: Record<LibraryMaterialKind, string> = {
  playlist: 'Playlist',
  question_bank: 'Soru Bankası',
  video_course: 'Video Kurs',
};

type ChapterEntry =
  | string
  | {
      title: string;
      page?: number;
      testCount?: number;
      prefix?: string;
      tone?: LibraryEntryTone;
    };

function chapter(
  id: string,
  title: string,
  entries: ChapterEntry[],
  pageRange?: string,
): LibraryChapter {
  return {
    id,
    title,
    pageRange,
    tests: entries.map((entry, index) => {
      if (typeof entry === 'string') {
        return { id: `${id}-t${index + 1}`, title: entry };
      }
      return {
        id: `${id}-t${index + 1}`,
        title: entry.title,
        page: entry.page,
        testCount: entry.testCount,
        prefix: entry.prefix,
        tone: entry.tone,
      };
    }),
  };
}

function kt(n: number, title: string, page: number): ChapterEntry {
  return { prefix: `Kazanım Testi-${n}`, title, page };
}

function uygulama(page: number): ChapterEntry {
  return { title: 'Uygulama Testleri', page, tone: 'uygulama' };
}

function kontrol(title: string, page: number): ChapterEntry {
  return { title, page, tone: 'kontrol' };
}

function numberedTests(prefix: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => `${prefix} ${i + 1}`);
}

function mikroTopic(
  id: string,
  title: string,
  pageRange: string,
  kazanımCount: number,
  osymCount: number,
): LibraryChapter {
  return chapter(
    id,
    title,
    [
      ...numberedTests('Kazanım Testi', kazanımCount),
      ...numberedTests('ÖSYM Tarzı Test', osymCount),
    ],
    pageRange,
  );
}

/** BilgiSarmal TYT Matematik — transcribed from index photos (no page numbers, no question counts). */
const BILGISARMAL_TYT_MATEMATIK_CHAPTERS: LibraryChapter[] = [
  chapter('bs-1', '1. BÖLÜM - GERÇEK SAYILAR', [
    'Kazanım Testi - 1',
    'Kazanım Testi - 2',
    'Kazanım Testi - 3',
    'Kazanım Testi - 4',
    'Kazanım Testi - 5',
    'Kazanım Testi - 6',
    'Kazanım Testi - 7',
    'Kazanım Testi - 8',
    'Kazanım Testi - 9',
    'ÖSYM TİPİ - 1',
    'ÖSYM TİPİ - 2',
    'ÖSYM TİPİ - 3',
    'ÖSYM TİPİ - 4',
    'ÖSYM TİPİ - 5',
    'ÖSYM TİPİ - 6',
    'ÖSYM TİPİ - 7',
    'ÖSYM TİPİ - 8',
    'Yıldızlar Yarışıyor',
  ]),
  chapter('bs-2', '2. BÖLÜM - BÖLÜNEBİLME', [
    'Kazanım Testi - 1',
    'Kazanım Testi - 2',
    'ÖSYM TİPİ - 1',
    'ÖSYM TİPİ - 2',
    'ÖSYM TİPİ - 3',
    'Yıldızlar Yarışıyor',
    'Sarmal Test - 1',
  ]),
  chapter('bs-3', '3. BÖLÜM - EBOB - EKOK', [
    'Kazanım Testi - 1',
    'Kazanım Testi - 2',
    'Kazanım Testi - 3',
    'ÖSYM TİPİ - 1',
    'ÖSYM TİPİ - 2',
    'Yıldızlar Yarışıyor',
  ]),
  chapter('bs-4', '4. BÖLÜM - RASYONEL SAYILAR', [
    'Kazanım Testi - 1',
    'Kazanım Testi - 2',
    'ÖSYM TİPİ - 1',
    'ÖSYM TİPİ - 2',
    'ÖSYM TİPİ - 3',
    'ÖSYM TİPİ - 4',
    'ÖSYM TİPİ - 5',
    'Yıldızlar Yarışıyor',
    'Sarmal Test - 2',
  ]),
  chapter('bs-5', '5. BÖLÜM - BİRİNCİ DERECEDEN DENKLEMLER', [
    'Kazanım Testi - 1',
    'Kazanım Testi - 2',
    'ÖSYM TİPİ - 1',
    'ÖSYM TİPİ - 2',
    'ÖSYM TİPİ - 3',
    'Yıldızlar Yarışıyor',
  ]),
  chapter('bs-6', '6. BÖLÜM - BİRİNCİ DERECEDEN EŞİTSİZLİKLER', [
    'Kazanım Testi - 1',
    'Kazanım Testi - 2',
    'ÖSYM TİPİ - 1',
    'ÖSYM TİPİ - 2',
    'ÖSYM TİPİ - 3',
    'Yıldızlar Yarışıyor',
    'Sarmal Test - 3',
  ]),
  chapter('bs-7', '7. BÖLÜM - MUTLAK DEĞER', [
    'Kazanım Testi - 1',
    'Kazanım Testi - 2',
    'Kazanım Testi - 3',
    'ÖSYM TİPİ - 1',
    'ÖSYM TİPİ - 2',
    'ÖSYM TİPİ - 3',
    'Yıldızlar Yarışıyor',
  ]),
  chapter('bs-8', '8. BÖLÜM - ÜSLÜ SAYILAR', [
    'Kazanım Testi - 1',
    'Kazanım Testi - 2',
    'Kazanım Testi - 3',
    'Kazanım Testi - 4',
    'ÖSYM TİPİ - 1',
    'ÖSYM TİPİ - 2',
    'ÖSYM TİPİ - 3',
    'ÖSYM TİPİ - 4',
    'Sarmal Test - 4',
  ]),
  chapter('bs-9', '9. BÖLÜM - KÖKLÜ SAYILAR', [
    'Kazanım Testi - 1',
    'Kazanım Testi - 2',
    'Kazanım Testi - 3',
    'ÖSYM TİPİ - 1',
    'ÖSYM TİPİ - 2',
    'ÖSYM TİPİ - 3',
    'ÖSYM TİPİ - 4',
    'Yıldızlar Yarışıyor',
  ]),
  chapter('bs-10', '10. BÖLÜM - ORAN ORANTI', [
    'Kazanım Testi - 1',
    'Kazanım Testi - 2',
    'ÖSYM TİPİ - 1',
    'ÖSYM TİPİ - 2',
    'ÖSYM TİPİ - 3',
    'ÖSYM TİPİ - 4',
    'Yıldızlar Yarışıyor',
    'Sarmal Test - 5',
  ]),
  chapter('bs-11', '11. BÖLÜM - SAYI VE KESİR PROBLEMLERİ', [
    'Kazanım Testi - 1',
    'Kazanım Testi - 2',
    'Kazanım Testi - 3',
    'Kazanım Testi - 4',
    'ÖSYM TİPİ - 1',
    'ÖSYM TİPİ - 2',
    'ÖSYM TİPİ - 3',
    'ÖSYM TİPİ - 4',
    'ÖSYM TİPİ - 5',
    'Yıldızlar Yarışıyor - 1',
    'Yıldızlar Yarışıyor - 2',
    'Yıldızlar Yarışıyor - 3',
  ]),
  chapter('bs-12', '12. BÖLÜM - YAŞ PROBLEMLERİ', [
    'Kazanım Testi',
    'ÖSYM TİPİ - 1',
    'ÖSYM TİPİ - 2',
    'Yıldızlar Yarışıyor',
    'Sarmal Test - 6',
  ]),
  chapter('bs-13', '13. BÖLÜM - YÜZDE, KÂR - ZARAR PROBLEMLERİ', [
    'Kazanım Testi - 1',
    'Kazanım Testi - 2',
    'ÖSYM TİPİ - 1',
    'ÖSYM TİPİ - 2',
    'ÖSYM TİPİ - 3',
    'Yıldızlar Yarışıyor',
  ]),
  chapter('bs-14', '14. BÖLÜM - KARIŞIM PROBLEMLERİ', [
    'Kazanım Testi',
    'ÖSYM TİPİ',
    'Yıldızlar Yarışıyor',
    'Sarmal Test - 7',
  ]),
  chapter('bs-15', '15. BÖLÜM - İŞÇİ PROBLEMLERİ', [
    'Kazanım Testi',
    'ÖSYM TİPİ',
    'Yıldızlar Yarışıyor',
  ]),
  chapter('bs-16', '16. BÖLÜM - HAREKET PROBLEMLERİ', [
    'Kazanım Testi - 1',
    'ÖSYM TİPİ - 1',
    'ÖSYM TİPİ - 2',
    'ÖSYM TİPİ - 3',
    'Yıldızlar Yarışıyor',
    'Sarmal Test - 8',
  ]),
  chapter('bs-17', '17. BÖLÜM - VERİ VE GRAFİKLER', [
    'Kazanım Testi - 1',
    'Kazanım Testi - 2',
    'ÖSYM TİPİ - 1',
    'ÖSYM TİPİ - 2',
    'Yıldızlar Yarışıyor',
  ]),
  chapter('bs-18', '18. BÖLÜM - MANTIK', [
    'Kazanım Testi',
    'ÖSYM TİPİ - 1',
    'ÖSYM TİPİ - 2',
    'Yıldızlar Yarışıyor',
    'Sarmal Test - 9',
  ]),
  chapter('bs-19', '19. BÖLÜM - KÜMELER', [
    'Kazanım Testi - 1',
    'Kazanım Testi - 2',
    'ÖSYM TİPİ - 1',
    'ÖSYM TİPİ - 2',
    'ÖSYM TİPİ - 3',
    'Yıldızlar Yarışıyor',
  ]),
  chapter('bs-20', '20. BÖLÜM - FONKSİYONLAR', [
    'Kazanım Testi - 1',
    'Kazanım Testi - 2',
    'Kazanım Testi - 3',
    'ÖSYM TİPİ - 1',
    'ÖSYM TİPİ - 2',
    'ÖSYM TİPİ - 3',
    'ÖSYM TİPİ - 4',
    'Yıldızlar Yarışıyor',
    'Sarmal Test - 10',
  ]),
  chapter('bs-21', '21. BÖLÜM - ÇARPANLARA AYIRMA', [
    'Kazanım Testi - 1',
    'Kazanım Testi - 2',
    'ÖSYM TİPİ - 1',
    'ÖSYM TİPİ - 2',
    'Yıldızlar Yarışıyor',
  ]),
  chapter('bs-22', '22. BÖLÜM - POLİNOMLAR', [
    'Kazanım Testi',
    'ÖSYM TİPİ',
    'Yıldızlar Yarışıyor',
    'Sarmal Test - 11',
  ]),
  chapter('bs-23', '23. BÖLÜM - İKİNCİ DERECEDEN DENKLEMLER', [
    'Kazanım Testi',
    'ÖSYM TİPİ - 1',
    'ÖSYM TİPİ - 2',
    'Yıldızlar Yarışıyor',
  ]),
  chapter('bs-24', '24. BÖLÜM - SAYMA VE OLASILIK', [
    'Kazanım Testi - 1',
    'Kazanım Testi - 2',
    'Kazanım Testi - 3',
    'ÖSYM TİPİ - 1',
    'ÖSYM TİPİ - 2',
    'ÖSYM TİPİ - 3',
    'Yıldızlar Yarışıyor',
    'Sarmal Test - 12',
  ]),
];

/** 345 TYT Matematik SB (ÜçDörtBeş) — transcribed from index photos with page numbers. */
const UC_DORT_BES_TYT_MATEMATIK_CHAPTERS: LibraryChapter[] = [
  chapter('345-01', 'BÖLÜM 01', [
    { title: 'Gerçek Sayılar - 1', page: 6 },
    { title: 'Gerçek Sayılar - 2', page: 30 },
    { title: 'Faktöriyel Kavramı', page: 46 },
    { title: 'Basamak Kavramı', page: 50 },
  ]),
  chapter('345-02', 'BÖLÜM 02', [
    { title: 'Görsel Zeka', page: 58 },
    { title: 'Sayısal - Sözel Mantık', page: 68 },
    { title: 'Örüntülü Sayı Grupları', page: 74 },
  ]),
  chapter('345-03', 'BÖLÜM 03', [
    { title: 'I ve II Bilinmeyenli Denklemler', page: 86 },
    { title: 'I ve II Bilinmeyenli Eşitsizlikler', page: 96 },
  ]),
  chapter('345-04', 'BÖLÜM 04', [{ title: 'Mutlak Değer', page: 112 }]),
  chapter('345-05', 'BÖLÜM 05', [
    { title: 'Üslü Sayılar', page: 128 },
    { title: 'Köklü Sayılar', page: 148 },
  ]),
  chapter('345-06', 'BÖLÜM 06', [
    { title: 'Tanım ve Formül Kullanabilme', page: 170 },
    { title: 'Oran - Orantı', page: 174 },
    { title: 'Çarpanlara Ayırma', page: 188 },
  ]),
  chapter('345-07', 'BÖLÜM 07', [
    { title: 'Sayı Problemleri', page: 204 },
    { title: 'Kesir Problemleri', page: 236 },
    { title: 'Yaş Problemleri', page: 250 },
  ]),
  chapter('345-08', 'BÖLÜM 08', [
    { title: 'Yüzde Problemleri', page: 266 },
    { title: 'Karışım Problemleri', page: 284 },
  ]),
  chapter('345-09', 'BÖLÜM 09', [
    { title: 'Hız Problemleri', page: 296 },
    { title: 'Grafik Yorumlama', page: 312 },
    { title: 'Emek Problemleri', page: 320 },
  ]),
  chapter('345-10', 'BÖLÜM 10', [
    { title: 'Asal Çarpanlar', page: 328 },
    { title: 'Bölme - Bölünebilme', page: 334 },
    { title: 'EBOB - EKOK', page: 344 },
  ]),
  chapter('345-11', 'BÖLÜM 11', [
    { title: 'Mantık', page: 354 },
    { title: 'Kümeler - Kartezyen Çarpım', page: 366 },
  ]),
  chapter('345-12', 'BÖLÜM 12', [{ title: 'Fonksiyonlar', page: 382 }]),
  chapter('345-13', 'BÖLÜM 13', [{ title: 'Sayma - Olasılık', page: 402 }]),
];

/** Acil TYT Matematik SB — flat topic index with page numbers (Bölüm headers omitted in UI). */
const ACIL_TYT_MATEMATIK_CHAPTERS: LibraryChapter[] = [
  chapter('acil-tyt-mat', 'İçindekiler', [
    { title: 'Tam Sayılar - Harfli İfadeler', page: 6 },
    { title: 'Tek - Çift Sayılar', page: 14 },
    { title: 'Ardışık Sayılar', page: 18 },
    { title: 'Asal Sayılar', page: 22 },
    { title: 'Faktöriyel', page: 26 },
    { title: 'Basamak Kavramı En Büyük En Küçük Değer Bulma', page: 30 },
    { title: 'Bölme - Bölünebilme', page: 36 },
    { title: 'EBOB - EKOK', page: 44 },
    { title: 'Periyodik Problemler', page: 52 },
    { title: 'Rasyonel Sayılar', page: 58 },
    { title: 'Birinci Dereceden Denklemler', page: 70 },
    { title: 'Basit Eşitsizlik', page: 82 },
    { title: 'Mutlak Değer', page: 92 },
    { title: 'Üslü Sayılar', page: 102 },
    { title: 'Köklü Sayılar', page: 112 },
    { title: 'Çarpanlara Ayırma', page: 123 },
    { title: 'Oran - Orantı', page: 135 },
    { title: 'Sayı Problemleri', page: 148 },
    { title: 'Kesir Problemleri', page: 160 },
    { title: 'Yaş Problemleri', page: 166 },
    { title: 'İşçi Problemleri', page: 176 },
    { title: 'Hız Problemleri', page: 184 },
    { title: 'Yüzde Problemleri', page: 192 },
    { title: 'Kâr - Zarar Problemleri', page: 198 },
    { title: 'Bilinçli Tüketim Aritmetiği', page: 202 },
    { title: 'Karışım Problemleri', page: 206 },
    { title: 'Sayısal - Sözel Mantık', page: 212 },
    { title: 'Mantık', page: 219 },
    { title: 'Kümeler', page: 225 },
    { title: 'Fonksiyonlar', page: 240 },
    { title: 'Polinomlar', page: 263 },
    { title: 'Permütasyon', page: 278 },
    { title: 'Kombinasyon', page: 286 },
    { title: 'Binom Açılımı', page: 294 },
    { title: 'Olasılık', page: 298 },
    { title: 'Veri - Grafik', page: 309 },
  ]),
];

/** Orijinal TYT Matematik — flat topic list with test counts (Bölüm headers omitted). */
const ORIJINAL_TYT_MATEMATIK_CHAPTERS: LibraryChapter[] = [
  chapter('orj-tyt-mat', 'İçindekiler', [
    { title: 'Temel Kavramlar', page: 12, testCount: 8 },
    { title: 'Tek ve Çift Sayılar', page: 26, testCount: 3 },
    { title: 'Basamak Kavramı', page: 32, testCount: 3 },
    { title: 'Özel Sayı Tanımlama', page: 38, testCount: 1 },
    { title: 'Ardışık Sayılar', page: 40, testCount: 4 },
    { title: 'Faktöriyel - Asal ve Aralarında Asal Sayılar', page: 46, testCount: 3 },
    { title: 'Bölme ve Bölünebilme', page: 52, testCount: 6 },
    { title: 'EBOB-EKOK', page: 62, testCount: 5 },
    { title: 'Rasyonel Sayılar', page: 70, testCount: 7 },
    { title: "ÖSYM'de Çıkmış Sorular", page: 84 },
    { title: 'Birinci Dereceden Denklem ve Eşitsizlikler', page: 92, testCount: 6 },
    { title: 'Basit Eşitsizlikler', page: 102, testCount: 6 },
    { title: 'Mutlak Değer', page: 112, testCount: 7 },
    { title: 'Üslü Sayılar', page: 124, testCount: 8 },
    { title: 'Köklü Sayılar', page: 138, testCount: 9 },
    { title: 'Çarpanlara Ayırma', page: 154, testCount: 6 },
    { title: "ÖSYM'de Çıkmış Sorular", page: 166 },
    { title: 'Oran - Orantı', page: 172, testCount: 7 },
    { title: 'Sayı Problemleri', page: 184, testCount: 8 },
    { title: 'Kesir Problemleri', page: 200, testCount: 4 },
    { title: 'Yaş Problemleri', page: 206, testCount: 3 },
    { title: 'İşçi Problemleri', page: 212, testCount: 4 },
    { title: 'Hareket Problemleri', page: 218, testCount: 7 },
    { title: "ÖSYM'de Çıkmış Sorular", page: 231 },
    { title: 'Yüzde - Kâr - Zarar Problemleri', page: 240, testCount: 7 },
    { title: 'Karışım Problemleri', page: 252, testCount: 4 },
    { title: 'Grafik Problemleri', page: 258, testCount: 2 },
    { title: 'Periyodik Durumlar', page: 262, testCount: 4 },
    { title: 'Sayısal ve Sözel Mantık Problemleri', page: 266, testCount: 5 },
    { title: 'Problem Denemeleri', page: 275, testCount: 6 },
    { title: "ÖSYM'de Çıkmış Sorular", page: 289 },
    { title: 'Permütasyon', page: 296, testCount: 5 },
    { title: 'Kombinasyon', page: 304, testCount: 4 },
    { title: 'Binom', page: 312, testCount: 2 },
    { title: 'Olasılık', page: 316, testCount: 5 },
    { title: 'İstatistik', page: 328, testCount: 4 },
    { title: "ÖSYM'de Çıkmış Sorular", page: 334 },
    { title: 'Mantık', page: 340, testCount: 5 },
    { title: 'Kümeler ve Kartezyen Çarpım', page: 350, testCount: 7 },
    { title: 'Fonksiyon', page: 364, testCount: 9 },
    { title: 'Polinomlar', page: 384, testCount: 3 },
    { title: '2. Dereceden Denklemler', page: 392, testCount: 4 },
    { title: "ÖSYM'de Çıkmış Sorular", page: 399 },
  ]),
];

/** MikroOrijinal TYT Matematik — topic accordion; tests expand under each topic. */
const MIKROORIJINAL_TYT_MATEMATIK_CHAPTERS: LibraryChapter[] = [
  mikroTopic('mo-1', 'TEMEL KAVRAMLAR 1', '7-33', 5, 5),
  mikroTopic('mo-2', 'TEMEL KAVRAMLAR 2', '34-64', 6, 6),
  mikroTopic('mo-3', 'BÖLME BÖLÜNEBİLME', '65-81', 3, 3),
  mikroTopic('mo-4', 'EBOB - EKOK', '82-90', 2, 1),
  mikroTopic('mo-5', 'RASYONEL SAYILAR', '91-106', 2, 3),
  mikroTopic('mo-6', 'BİRİNCİ DERECEDEN BİR BİLİNMEYENLİ DENKLEMLER', '109-122', 2, 3),
  mikroTopic('mo-7', 'BASİT EŞİTSİZLİKLER', '123-131', 1, 2),
  mikroTopic('mo-8', 'MUTLAK DEĞER', '132-146', 3, 2),
  mikroTopic('mo-9', 'ÜSLÜ SAYILAR', '147-162', 3, 3),
  mikroTopic('mo-10', 'KÖKLÜ SAYILAR', '163-178', 3, 3),
  mikroTopic('mo-11', 'ÇARPANLARA AYIRMA', '179-192', 4, 1),
  mikroTopic('mo-12', 'ORAN - ORANTI', '195-208', 2, 3),
  mikroTopic('mo-13', 'SAYI PROBLEMLERİ', '209-226', 2, 3),
  mikroTopic('mo-14', 'KESİR PROBLEMLERİ', '227-233', 1, 1),
  mikroTopic('mo-15', 'YAŞ PROBLEMLERİ', '234-240', 1, 1),
  mikroTopic('mo-16', 'YÜZDE PROBLEMLERİ', '241-246', 1, 2),
  mikroTopic('mo-17', 'KÂR-ZARAR PROBLEMLERİ', '247-252', 1, 1),
  mikroTopic('mo-18', 'KARIŞIM PROBLEMLERİ', '253-258', 1, 1),
  mikroTopic('mo-19', 'İŞÇİ PROBLEMLERİ', '259-265', 1, 1),
  mikroTopic('mo-20', 'HIZ PROBLEMLERİ', '266-278', 2, 2),
  mikroTopic('mo-21', 'GRAFİK PROBLEMLERİ', '279-283', 1, 1),
  chapter('mo-22', 'RUTİN OLMAYAN PROBLEMLER', numberedTests('ÖSYM Tarzı Test', 2), '284-290'),
  mikroTopic('mo-23', 'KÜMELER', '293-309', 4, 1),
  mikroTopic('mo-24', 'MANTIK', '310-324', 2, 2),
  mikroTopic('mo-25', 'VERİ-İSTATİSTİK', '325-334', 3, 1),
  mikroTopic('mo-26', 'SAYMA OLASILIK', '337-358', 6, 1),
  mikroTopic('mo-27', 'FONKSİYON', '359-380', 4, 2),
  mikroTopic('mo-28', 'POLİNOM', '381-399', 3, 1),
];

/** 3D TYT Matematik — flat topic list with page numbers (Bölüm headers omitted). */
const UC_D_TYT_MATEMATIK_CHAPTERS: LibraryChapter[] = [
  chapter('3d-tyt-mat', 'İçindekiler', [
    { title: 'Temel Kavramlar', page: 7 },
    { title: 'Tek - Çift Sayılar ve İşaret İncelemesi', page: 15 },
    { title: 'Ardışık Sayılar', page: 19 },
    { title: 'Faktöriyel', page: 23 },
    { title: 'Bire Bir ÖSYM', page: 27 },
    { title: 'Sayı Basamakları', page: 31 },
    { title: 'Asal ve Aralarında Asal Sayılar', page: 35 },
    { title: 'Asal Çarpanlara Ayırma ve Bölen Sayısı', page: 39 },
    { title: 'Bölme ve Bölünebilme Kuralları', page: 41 },
    { title: 'EBOB - EKOK', page: 49 },
    { title: 'Rasyonel Sayılar', page: 57 },
    { title: 'Bire Bir ÖSYM', page: 65 },
    { title: 'Birinci Dereceden Denklemler', page: 69 },
    { title: 'Birinci Dereceden Eşitsizlikler', page: 75 },
    { title: 'Mutlak Değer', page: 85 },
    { title: 'Üslü Sayılar', page: 93 },
    { title: 'Köklü Sayılar', page: 103 },
    { title: 'Çarpanlara Ayırma', page: 113 },
    { title: 'Bire Bir ÖSYM', page: 121 },
    { title: 'TÜMEVARIM - I', page: 127 },
    { title: 'Oran - Orantı', page: 135 },
    { title: 'Sayı - Kesir Problemleri', page: 143 },
    { title: 'Yaş Problemleri', page: 157 },
    { title: 'İşçi Problemleri', page: 161 },
    { title: 'Bire Bir ÖSYM', page: 165 },
    { title: 'Hız - Hareket Problemleri', page: 171 },
    { title: 'Yüzde Problemleri', page: 181 },
    { title: 'Karışım Problemleri', page: 191 },
    { title: 'Sayısal Mantık Problemleri', page: 195 },
    { title: 'Bire Bir ÖSYM', page: 203 },
    { title: 'TÜMEVARIM - II', page: 207 },
    { title: 'Kümeler', page: 215 },
    { title: 'Bire Bir ÖSYM', page: 225 },
    { title: 'Fonksiyonlar', page: 227 },
    { title: 'Bire Bir ÖSYM', page: 253 },
    { title: 'Merkezi Eğilim ve Yayılım Ölçüleri, Grafik Türleri', page: 255 },
    { title: 'Sayma, Permütasyon', page: 263 },
    { title: 'Kombinasyon', page: 275 },
    { title: 'Binom Açılımı', page: 283 },
    { title: 'Olasılık', page: 287 },
    { title: 'Bire Bir ÖSYM', page: 297 },
    { title: 'TÜMEVARIM - III', page: 301 },
    { title: 'İkinci Dereceden Denklemler', page: 311 },
    { title: 'Bire Bir ÖSYM', page: 325 },
    { title: 'Polinomlar', page: 327 },
    { title: 'Bire Bir ÖSYM', page: 339 },
    { title: 'Mantık', page: 341 },
    { title: 'Bire Bir ÖSYM', page: 347 },
    { title: 'TÜMEVARIM - IV', page: 349 },
  ]),
];

/** Toprak TYT Matematik — accordion chapters with index-style test rows + pages. */
const TOPRAK_TYT_MATEMATIK_CHAPTERS: LibraryChapter[] = [
  chapter('toprak-1', 'Bölüm 1: Sayılar', [
    kt(1, 'Sayı Kümeleri', 10),
    kt(2, 'Doğal Sayılar ve Tam Sayılar', 12),
    kt(3, 'Ardışık ve Tek-Çift Sayılar', 14),
    kt(4, 'Basamak Kavramı', 16),
    kt(5, 'Asal Sayılar', 18),
    kt(6, 'Faktöriyel', 20),
    kt(7, 'Tam Sayılarda Bölme', 22),
    kt(8, 'Bölünebilme Kuralları', 24),
    uygulama(26),
  ]),
  chapter('toprak-2', 'Bölüm 2: EBOB-EKOK', [
    kt(1, 'EBOB - EKOK Kavramları', 52),
    kt(2, 'EBOB - EKOK Özellikleri', 54),
    uygulama(56),
  ]),
  chapter('toprak-3', 'Bölüm 3: Rasyonel Sayılar', [
    kt(1, 'Rasyonel Sayılarda Dört İşlem', 64),
    kt(2, 'Sıralama ve Ondalık Sayılar', 66),
    uygulama(68),
  ]),
  chapter('toprak-4', 'Bölüm 4: Basit Eşitsizlikler', [
    kt(1, 'Basit Eşitsizliklerle İlgili Temel Kavramlar', 76),
    kt(2, 'Basit Eşitsizliklerde Çözüm Kümesi', 78),
    uygulama(80),
  ]),
  chapter('toprak-5', 'Bölüm 5: Kontrol Grubu-1', [
    kontrol('1-4. Bölümlerin Kontrol Testleri', 86),
  ]),
  chapter('toprak-6', 'Bölüm 6: Mutlak Değer', [
    kt(1, 'Mutlak Değer Kavramı', 94),
    kt(2, 'Mutlak Değer Özellikleri', 96),
    kt(3, 'Mutlak Değerli Denklem ve Eşitsizlikler', 98),
    uygulama(100),
  ]),
  chapter('toprak-7', 'Bölüm 7: Birinci Dereceden Denklemler', [
    kt(1, 'Birinci Dereceden Denklemler', 108),
    kt(2, 'Birinci Dereceden Denklemlerin Özellikleri', 110),
    uygulama(112),
  ]),
  chapter('toprak-8', 'Bölüm 8: Üslü Sayılar', [
    kt(1, 'Tam Sayılarda Kuvvet Kavramı', 118),
    kt(2, 'Üslü Denklemler', 120),
    kt(3, 'Üslü Sayıların Özellikleri', 122),
    uygulama(124),
  ]),
  chapter('toprak-9', 'Bölüm 9: Köklü Sayılar', [
    kt(1, 'Köklü Sayı Kavramı', 136),
    kt(2, 'Eşlenik ve İç İçe Kökler', 138),
    kt(3, 'Sıralama ve Denklem Çözümü', 140),
    uygulama(142),
  ]),
  chapter('toprak-10', 'Bölüm 10: Çarpanlara Ayırma', [
    kt(1, 'İki Kare Farkı ve Tamkare', 154),
    kt(2, 'Küp Toplamı ve Farkı', 156),
    uygulama(158),
  ]),
  chapter('toprak-11', 'Bölüm 11: Kontrol Grubu-2', [
    kontrol('6-10. Bölümlerin Kontrol Testleri', 168),
  ]),
  chapter('toprak-12', 'Bölüm 12: Oran Orantı', [
    kt(1, 'Orantının Özellikleri', 176),
    kt(2, 'Ters ve Doğru Orantı', 178),
    kt(3, 'Orantı Problemleri', 180),
    uygulama(182),
  ]),
  chapter('toprak-13', 'Bölüm 13: Problemler', [
    kt(1, 'Sayı Problemleri-I', 192),
    kt(2, 'Sayı Problemleri-II', 194),
    kt(3, 'Sayı Problemleri-III', 196),
    kt(4, 'Sayı Problemleri-IV', 198),
    kt(5, 'Sayı Problemleri-V', 200),
    kt(6, 'Yaş Problemleri-I', 202),
    kt(7, 'Yaş Problemleri-II', 204),
    kt(8, 'Yüzde Problemleri-I', 206),
    kt(9, 'Yüzde Problemleri-II', 208),
    kt(10, 'Yüzde Problemleri-III', 210),
    kt(11, 'Karışım Problemleri', 212),
    kt(12, 'Hareket Problemleri-I', 214),
    kt(13, 'Hareket Problemleri-II', 216),
    kt(14, 'Hareket Problemleri-III', 218),
    kt(15, 'Grafik Problemleri', 220),
    kt(16, 'Periyodik Problemler-I', 222),
    kt(17, 'Periyodik Problemler-II', 224),
    kt(18, 'Sayısal Mantık Problemleri', 226),
    uygulama(228),
  ]),
  chapter('toprak-14', 'Bölüm 14: Mantık', [
    kt(1, 'Önermenin Tanımı ve Özellikleri', 260),
    kt(2, '"ve", "veya", "ya da" Bağlaçları', 262),
    kt(3, '"ise", "ancak ve ancak" Bağlaçları', 264),
    kt(4, 'Niceleyiciler', 266),
    uygulama(268),
  ]),
  chapter('toprak-15', 'Bölüm 15: Kümeler', [
    kt(1, 'Alt Küme', 274),
    kt(2, 'Kümelerde İşlemler', 276),
    kt(3, 'Kartezyen Çarpım', 278),
    kt(4, 'Küme Problemleri', 280),
    uygulama(282),
  ]),
  chapter('toprak-16', 'Bölüm 16: Kontrol Grubu-3', [
    kontrol('12-15. Bölümlerin Kontrol Testleri', 294),
  ]),
  chapter('toprak-17', 'Bölüm 17: Fonksiyonlar', [
    kt(1, 'Fonksiyon Kavramı', 302),
    kt(2, 'Fonksiyon Türleri-I', 304),
    kt(3, 'Fonksiyon Türleri-II', 306),
    kt(4, 'Ters Fonksiyon', 308),
    kt(5, 'Bileşke Fonksiyon', 310),
    kt(6, 'Fonksiyon Grafikleri', 312),
    uygulama(314),
  ]),
  chapter('toprak-18', 'Bölüm 18: Veri-Sayma ve Olasılık', [
    kt(1, 'Sayma Yöntemleri', 328),
    kt(2, 'Permütasyon', 330),
    kt(3, 'Tekrarlı Permütasyon', 332),
    kt(4, 'Kombinasyon', 334),
    kt(5, 'Kombinasyon Özellikleri', 336),
    kt(6, 'Kombinasyon-Şekil İlişkisi', 338),
    kt(7, 'Binom', 340),
    kt(8, 'Olasılıkta Temel Kavramlar', 342),
    kt(9, 'Olasılık-I', 344),
    kt(10, 'Olasılık-II', 346),
    kt(11, 'Olasılık-III', 348),
    kt(12, 'İstatistik', 350),
    uygulama(352),
  ]),
  chapter('toprak-19', 'Bölüm 19: Polinomlar', [
    kt(1, 'Polinomun Derecesi', 364),
    kt(2, 'Polinomlarda İşlemler', 366),
    kt(3, 'Kalan Bulma', 368),
    kt(4, 'Sabit Terim ve Katsayılar Toplamı', 370),
    uygulama(372),
  ]),
  chapter('toprak-20', 'Bölüm 20: İkinci Dereceden Denklemler', [
    kt(1, 'İkinci Dereceden Denklem Kavramı', 378),
    kt(2, 'İkinci Dereceden Denklem Çözümü', 380),
    kt(3, 'Kök-Katsayı Bağıntıları-I', 382),
    kt(4, 'Kök-Katsayı İlişkisi-II', 384),
    kt(5, 'Karmaşık Sayılar', 386),
    uygulama(388),
  ]),
  chapter('toprak-21', 'Bölüm 21: Kontrol Grubu-4', [
    kontrol('17-20. Bölümlerin Kontrol Testleri', 392),
    { title: 'Cevap Anahtarı', page: 399, tone: 'cevap' },
  ]),
];

/** Temporary mock materials — replace with real data later. */
export const MOCK_LIBRARY_MATERIALS: LibraryMaterial[] = [
  {
    id: 'mock-playlist-tyt-mat',
    name: '9 Saatte TYT Matematik',
    kind: 'playlist',
    subtitle: 'YouTube · X Akademi',
    sourceUrl: 'https://www.youtube.com/playlist?list=EXAMPLE',
    videos: [
      { id: 'v1', title: 'Rasyonel Sayılar ve Oranlama', duration: '28:14' },
      { id: 'v2', title: 'Basamak Kavramı', duration: '22:41' },
      { id: 'v3', title: 'Tek ve Çift Sayılar', duration: '18:05' },
      { id: 'v4', title: 'Bölme Bölünebilme', duration: '31:22' },
      { id: 'v5', title: 'Faktöriyel & Asal Sayılar & Ardışık Sayılar', duration: '35:48' },
      { id: 'v6', title: 'Denklem Kurma ve Çözme', duration: '26:10' },
      { id: 'v7', title: 'Mutlak Değer', duration: '24:33' },
      { id: 'v8', title: 'Üslü Sayılar', duration: '29:57' },
      { id: 'v9', title: 'Köklü Sayılar', duration: '27:16' },
      { id: 'v10', title: 'Sayı Problemleri', duration: '41:02' },
      { id: 'v11', title: 'Oran Orantı, Yüzde ve Karışım Problemleri', duration: '38:45' },
      { id: 'v12', title: 'Hız & Hareket Problemleri', duration: '33:19' },
    ],
  },
  {
    id: 'bilgisarmal-tyt-matematik',
    name: 'BilgiSarmal TYT Matematik',
    kind: 'question_bank',
    subtitle: 'Soru Bankası · Bilgi Sarmal',
    chapters: BILGISARMAL_TYT_MATEMATIK_CHAPTERS,
  },
  {
    id: '345-tyt-matematik-sb',
    name: '345 TYT Matematik SB',
    kind: 'question_bank',
    layout: 'flat',
    subtitle: 'Soru Bankası · ÜçDörtBeş',
    chapters: UC_DORT_BES_TYT_MATEMATIK_CHAPTERS,
  },
  {
    id: 'acil-tyt-matematik-sb',
    name: 'Acil TYT Matematik SB',
    kind: 'question_bank',
    layout: 'flat',
    subtitle: 'Soru Bankası · Acil Yayınları',
    chapters: ACIL_TYT_MATEMATIK_CHAPTERS,
  },
  {
    id: 'mikroorijinal-tyt-matematik',
    name: 'MikroOrijinal TYT Matematik',
    kind: 'question_bank',
    layout: 'accordion',
    subtitle: 'Soru Bankası · Mikro',
    chapters: MIKROORIJINAL_TYT_MATEMATIK_CHAPTERS,
  },
  {
    id: 'orijinal-tyt-matematik',
    name: 'Orijinal TYT Matematik',
    kind: 'question_bank',
    layout: 'flat',
    subtitle: 'Soru Bankası · Orijinal',
    chapters: ORIJINAL_TYT_MATEMATIK_CHAPTERS,
  },
  {
    id: '3d-tyt-matematik',
    name: '3D TYT Matematik',
    kind: 'question_bank',
    layout: 'flat',
    subtitle: 'Soru Bankası · 3D',
    chapters: UC_D_TYT_MATEMATIK_CHAPTERS,
  },
  {
    id: 'toprak-tyt-matematik',
    name: 'Toprak TYT Matematik',
    kind: 'question_bank',
    layout: 'accordion',
    subtitle: 'Soru Bankası · Toprak',
    chapters: TOPRAK_TYT_MATEMATIK_CHAPTERS,
  },
];

export function isFlatQuestionBank(
  material: Extract<LibraryMaterial, { kind: 'question_bank' }>,
): boolean {
  return material.layout === 'flat';
}

export function questionBankEntryNoun(
  material: Extract<LibraryMaterial, { kind: 'question_bank' }>,
): 'test' | 'konu' {
  return isFlatQuestionBank(material) ? 'konu' : 'test';
}

export function flatEntryRightLabel(entry: {
  page?: number;
  testCount?: number;
}): string {
  if (entry.testCount != null) return `${entry.testCount} test`;
  if (entry.page != null) return `s.${entry.page}`;
  return '';
}

export function materialItemCount(material: LibraryMaterial): number {
  if (material.kind === 'question_bank') {
    return material.chapters.reduce((sum, ch) => sum + ch.tests.length, 0);
  }
  return material.videos.length;
}

export function materialItemCountLabel(material: LibraryMaterial): string {
  const n = materialItemCount(material);
  if (material.kind === 'question_bank') {
    const noun = questionBankEntryNoun(material);
    if (noun === 'konu') return `${n} konu`;
    return `${material.chapters.length} bölüm · ${n} ${noun}`;
  }
  return `${n} video`;
}
