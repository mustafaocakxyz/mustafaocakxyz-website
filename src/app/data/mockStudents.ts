import {
  createMockStudentStore,
  type DailySubmission,
  type StudentTask,
} from './mockStudentData';
import { toDateKey } from '../utils/dates';

export type StudentRecord = {
  id: string;
  name: string;
  tasksByDate: Record<string, StudentTask[]>;
  submissionsByDate: Record<string, DailySubmission>;
};

function withStudentStore(
  id: string,
  name: string,
  options?: {
    taskTemplates?: string[];
    todaySubmission?: DailySubmission;
  },
): StudentRecord {
  const store = createMockStudentStore({
    studentId: id,
    taskTemplates: options?.taskTemplates,
  });

  if (options?.todaySubmission) {
    store.submissionsByDate[toDateKey(new Date())] = options.todaySubmission;
  }

  return {
    id,
    name,
    tasksByDate: store.tasksByDate,
    submissionsByDate: store.submissionsByDate,
  };
}

export function createMockStudents(): StudentRecord[] {
  return [
    withStudentStore('student-1', 'Ayşe Yılmaz', {
      todaySubmission: {
        uyumaSaati: '23:30',
        uyanmaSaati: '07:00',
        gunlukCalismaSaat: 5,
        ekranSuresiSaat: 1.5,
        notlar: 'Fizik tekrarında integral konusuna odaklandım.',
      },
    }),
    withStudentStore('student-2', 'Mehmet Kaya', {
      taskTemplates: [
        'TYT matematik denemesi',
        'Edebiyat konu tekrarı',
        'Geometri soru çözümü',
      ],
      todaySubmission: {
        uyumaSaati: '00:00',
        uyanmaSaati: '06:30',
        gunlukCalismaSaat: 4,
        ekranSuresiSaat: 2,
        notlar: 'Deneme sonrası yanlış analizi yaptım.',
      },
    }),
    withStudentStore('student-3', 'Zeynep Demir', {
      taskTemplates: ['Kimya mol hesabı', 'Biyoloji tekrar', 'Paragraf 40 soru'],
    }),
    withStudentStore('student-4', 'Can Öztürk', {
      taskTemplates: ['İngilizce kelime', 'Tarih konu özeti', 'Fizik soru bankası'],
      todaySubmission: {
        uyumaSaati: '23:00',
        uyanmaSaati: '07:30',
        gunlukCalismaSaat: 6,
        ekranSuresiSaat: 0.5,
        notlar: '',
      },
    }),
  ];
}
