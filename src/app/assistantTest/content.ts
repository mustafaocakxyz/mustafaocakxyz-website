export type SectionId = 'yks' | 'habits' | 'program' | 'control' | 'special';

export type ProfileStat = {
  label: string;
  value: string;
};

export type StudentProfile = {
  name: string;
  summary: string;
  stats: ProfileStat[];
};

export type PromptQuestion = {
  id: string;
  prompt: string;
};

export type SampleTask = {
  label: string;
  duration?: string;
};

export type SampleDay = {
  title: string;
  tasks: SampleTask[];
};

export type ProgramStudent = {
  id: string;
  name: string;
  profile?: string;
  stage?: string;
  materials?: string;
  routines?: string;
  averageStudy?: string;
  /** Day the applicant writes. Defaults to "3. gün". */
  nextDayTitle?: string;
  note?: string;
  days: SampleDay[];
};

export type ExamSection = {
  id: SectionId;
  title: string;
  description: string;
  placeholderNote?: string;
};

export const EXAM_SECTIONS: ExamSection[] = [
  {
    id: 'yks',
    title: 'YKS Stratejileri',
    description:
      'Aşağıdaki öğrencinin net aralığına göre, her ders için sene boyunca ne yapması gerektiğini yaz.',
  },
  {
    id: 'habits',
    title: 'Alışkanlıklar',
    description:
      'Aşağıdaki öğrencinin alışkanlıklarına göre, her başlık için nasıl bir yöntem uygulayacağını yaz.',
  },
  {
    id: 'program',
    title: 'Günlük Program Hazırlama',
    description:
      'İki öğrencinin profilini ve son iki gününü incele. Üçüncü günün görevlerini sen yaz.',
  },
  {
    id: 'control',
    title: 'Kontrol Mesajları',
    description: 'Her senaryo için öğrenciye atacağın mesajı yaz.',
  },
  {
    id: 'special',
    title: 'Özel Mesajlar',
    description:
      'Öğrencinin aşağıdaki mesajları yazdığını düşün ve ona vereceğin cevaplarla yanıtla.',
  },
];

export const YKS_PROFILE: StudentProfile = {
  name: 'Elif Arslan',
  summary: 'Mezun · Sayısal · Hedef ilk 10.000',
  stats: [
    { label: 'TYT Türkçe', value: '25, dil bilgisi eksik' },
    { label: 'TYT Sosyal', value: '10' },
    { label: 'TYT Matematik', value: '12–15' },
    { label: 'TYT Fen', value: '7' },
    { label: 'Geometri', value: '3–4' },
    { label: 'AYT Kimya', value: '1–2' },
  ],
};

export const YKS_QUESTIONS: PromptQuestion[] = [
  { id: 'tyt-turkce', prompt: 'Bu öğrenci sene boyunca TYT Türkçe adına ne yapmalı?' },
  { id: 'tyt-sosyal', prompt: 'Bu öğrenci sene boyunca TYT Sosyal adına ne yapmalı?' },
  { id: 'tyt-matematik', prompt: 'Bu öğrenci sene boyunca TYT Matematik adına ne yapmalı?' },
  { id: 'tyt-fen', prompt: 'Bu öğrenci sene boyunca TYT Fen adına ne yapmalı?' },
  { id: 'geometri', prompt: 'Bu öğrenci sene boyunca Geometri adına ne yapmalı?' },
  { id: 'ayt-kimya', prompt: 'Bu öğrenci sene boyunca AYT Kimya adına ne yapmalı?' },
];

export const HABITS_PROFILE: StudentProfile = {
  name: 'Kerem Yıldız',
  summary: '',
  stats: [
    {
      label: 'Ders',
      value: 'Ortalama 1.5–2 saat çalışıyor',
    },
    {
      label: 'Ekran',
      value: '6 saat ve üzeri. Oyun oynuyor ve sosyal medya kullanıyor.',
    },
    {
      label: 'Uyku',
      value: 'Çoğu gece 01.30’dan sonra yatıyor, sabah 10.00 civarı kalkıyor.',
    },
  ],
};

export const HABIT_QUESTIONS: PromptQuestion[] = [
  {
    id: 'study-time',
    prompt: 'Bu öğrencinin ders çalışma süresini artırmak adına nasıl bir yöntem uygulardın?',
  },
  {
    id: 'screen-time',
    prompt: 'Bu öğrencinin ekran süresini azaltmak adına nasıl bir yöntem uygulardın?',
  },
  {
    id: 'sleep',
    prompt: 'Bu öğrencinin uykusunu düzene sokmak adına nasıl bir yöntem uygulardın?',
  },
];

export const PROGRAM_STUDENTS: ProgramStudent[] = [
  {
    id: 'goksu',
    name: 'Hayriye Göksu Tekbir',
    stage: 'TYT Geometri çalışması',
    materials:
      'Bıyıklı Matematik - Geometri Oynatma Listesi, Acil Geometrinin İlacı, BilgiSarmal Geometri Soru Bankası',
    routines: 'TYT Matematik Soru Bankası Turlama Rutini, Paragraf Rutini',
    averageStudy: '5–7 saat',
    nextDayTitle: '1 Ekim',
    days: [
      {
        title: '29 Eylül',
        tasks: [
          { label: 'Bıyıklı | Paralelkenar 1 - 5 | İzle + FEYNMAN', duration: '2.5 saat' },
          { label: 'Acil Geo İlacı | Paralelkenar | Sayfa 117 - 129 | Çöz', duration: '3 saat' },
          { label: 'Rutin | TYT Matematik Soru Bankası Turlama', duration: '1 saat' },
          { label: 'Hız ve Renk Paragraf | Hız Testi 32 | Çöz', duration: '30 dak' },
        ],
      },
      {
        title: '30 Eylül',
        tasks: [
          { label: 'BilgiSarmal Geometri | Paralelkenar | 1 - 7. Testler | Çöz', duration: '3.5 saat' },
          { label: 'Rutin | TYT Matematik Soru Bankası Turlama', duration: '1 saat' },
          { label: 'Hız ve Renk Paragraf | Hız Testi 33 | Çöz', duration: '30 dak' },
        ],
      },
    ],
  },
  {
    id: 'omer',
    name: 'Ömer Faruk Demirbaş',
    stage: 'AYT Fizik çalışması',
    materials: 'X Akademi AYT Fizik Kursu, 345 AYT Fizik Soru Bankası',
    routines: 'TYT Matematik Branş Denemesi, AYT Matematik Branş Denemesi, Paragraf Rutini',
    averageStudy: '7–9 saat',
    nextDayTitle: '6 Ekim',
    days: [
      {
        title: '4 Ekim',
        tasks: [
          {
            label: 'X Akademi | AYT Fizik Kursu | 12 - Basit Harmonik Hareket | İzle + FEYNMAN',
            duration: '45 dak',
          },
          {
            label: '345 AYT Fizik | Basit Harmonik Hareket | 280 - 302 | Çöz',
            duration: '4 saat',
          },
          { label: '345 | TYT Matematik Branş Denemesi | Çöz + Analiz', duration: '2.5 saat' },
          { label: '0 Risk Paragraf | Rutin', duration: '30 dak' },
        ],
      },
      {
        title: '5 Ekim',
        tasks: [
          {
            label: 'X Akademi | AYT Fizik Kursu | 13 - Dalgalar | İzle + FEYNMAN',
            duration: '45 dak',
          },
          { label: '345 AYT Fizik | Dalga Mekaniği | 302 - 326 | Çöz', duration: '4 saat' },
          { label: 'BilgiSarmal AYT Matematik Branş Denemesi | Çöz + Analiz', duration: '2.5 saat' },
          { label: '0 Risk Paragraf | Rutin', duration: '30 dak' },
        ],
      },
    ],
  },
];

export const CONTROL_QUESTIONS: PromptQuestion[] = [
  {
    id: 'noon-zero',
    prompt:
      'Saat 13.00 ve öğrencin görevlerinde hiç ilerleme kat etmemiş, %0’da görünüyor. Ona atacağın mesaj:',
  },
  {
    id: 'evening-twenty',
    prompt:
      'Saat 18.00 ve öğrencin o günlük görevlerinde %20’de görünüyor. Ona atacağın mesaj:',
  },
  {
    id: 'afternoon-eighty',
    prompt: 'Saat 17.00 ve öğrencin görevlerinde %80’de görünüyor. Ona atacağın mesaj:',
  },
  {
    id: 'evening-done',
    prompt: 'Saat 18.00 ve öğrencin görevlerini %100 tamamlamış. Ona atacağın mesaj:',
  },
];

export const SPECIAL_QUESTIONS: PromptQuestion[] = [
  {
    id: 'sick',
    prompt:
      'Hocam bugün biraz hasta hissediyorum ve çalışamayacağım, programı kaydırsanız olur mu?',
  },
  {
    id: 'absolute-value',
    prompt:
      'Hocam mutlak değeri kesinlikle anlayamıyorum ve sorular da epey yavaş gidiyor, ÇOK SIKILDIM help',
  },
  {
    id: 'source-change',
    prompt:
      "Hocam siz bana Acil ve BilgiSarmal'dan görev yazdınız ama ben arkadaşımla konuştum EyüpB'den çözüyorum şu an",
  },
  {
    id: 'cinema',
    prompt:
      'Hocam bugün arkadaşlar sinemaya çağırdı o yüzden görevler yarına kaldı programı kaydırırsınız',
  },
  {
    id: 'family',
    prompt:
      'Hocam bugün ailemle çok kötü kavga ettim beni baskılayıp duruyorlar artık ne yapacağımı bilmiyorum',
  },
];

export function questionsFor(sectionId: SectionId): PromptQuestion[] {
  if (sectionId === 'yks') return YKS_QUESTIONS;
  if (sectionId === 'habits') return HABIT_QUESTIONS;
  if (sectionId === 'control') return CONTROL_QUESTIONS;
  if (sectionId === 'special') return SPECIAL_QUESTIONS;
  return [];
}
