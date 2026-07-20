export type DemoNetChange = {
  label: string;
  from: number;
  to: number;
};

export type DemoStudentShowcase = {
  id: string;
  shortName: string;
  daysInProgram: number;
  avgStudyHours: string;
  avgScreenTime: string;
  sleepSchedule: string;
  highlight: string;
  todayTasks: string[];
  netChanges?: DemoNetChange[];
};

export const DEMO_STUDENT_COUNT = 4;

export const DEMO_STUDENTS: DemoStudentShowcase[] = [
  {
    id: '1',
    shortName: 'Ayşe Y.',
    daysInProgram: 48,
    avgStudyHours: '5.2 saat',
    avgScreenTime: '1.4 saat',
    sleepSchedule: '23:30 – 07:00',
    highlight: 'TYT 42 → 61',
    todayTasks: [
      'TYT Matematik: problem seti (40 soru)',
      'Paragraf: 3 set zamanlı çalışma',
      'Deneme yanlış analizi (fizik)',
      'Kelime tekrarı (25 kelime)',
    ],
    netChanges: [
      { label: 'TYT', from: 42, to: 61 },
      { label: 'AYT Mat', from: 4, to: 18 },
    ],
  },
  {
    id: '2',
    shortName: 'Mehmet K.',
    daysInProgram: 22,
    avgStudyHours: '4.1 saat',
    avgScreenTime: '2.0 saat',
    sleepSchedule: '00:15 – 07:30',
    highlight: '22 gündür aktif',
    todayTasks: [
      'Geometri: üçgen konu özeti',
      'TYT Fen: 30 soru',
      'Edebiyat: şiir notları',
    ],
  },
  {
    id: '3',
    shortName: 'Zeynep D.',
    daysInProgram: 71,
    avgStudyHours: '6.0 saat',
    avgScreenTime: '0.9 saat',
    sleepSchedule: '23:00 – 06:45',
    highlight: 'AYT Mat 0 → 16',
    todayTasks: [
      'AYT Matematik: integral seti',
      'Kimya: mol hesabı',
      'Deneme analizi (AYT)',
      'Uyku / ekran kontrol kaydı',
    ],
    netChanges: [
      { label: 'AYT Mat', from: 0, to: 16 },
      { label: 'TYT', from: 55, to: 72 },
    ],
  },
  {
    id: '4',
    shortName: 'Can Ö.',
    daysInProgram: 8,
    avgStudyHours: '3.5 saat',
    avgScreenTime: '2.5 saat',
    sleepSchedule: '01:00 – 08:00',
    highlight: '8 gündür çalışıyor',
    todayTasks: [
      'Program alıştırması: günlük form',
      'TYT Türkçe paragraf',
      'Matematik temel tekrar',
    ],
  },
];
