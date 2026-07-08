export type TextField = {
  id: string;
  type: 'text';
  label: string;
  placeholder?: string;
};

export type TextareaField = {
  id: string;
  type: 'textarea';
  label: string;
  placeholder?: string;
  size?: 'medium' | 'long';
};

export type SelectField = {
  id: string;
  type: 'select';
  label: string;
  options: string[];
  placeholder?: string;
};

export type ChoiceField = {
  id: string;
  type: 'choice';
  label: string;
  options: { value: string; label: string }[];
  layout?: 'stack' | 'row-2' | 'row-3';
};

export type FormField = TextField | TextareaField | SelectField | ChoiceField;

export type StandardFormStep = {
  variant?: 'standard';
  title: string;
  description?: string;
  fields: FormField[];
};

export type AytFormStep = {
  variant: 'ayt';
  title: string;
  description?: string;
};

export type TytKaynaklarFormStep = {
  variant: 'tyt-kaynaklar';
  title: string;
  description?: string;
};

export type AytKaynaklarFormStep = {
  variant: 'ayt-kaynaklar';
  title: string;
  description?: string;
};

export type FormStep =
  | StandardFormStep
  | AytFormStep
  | TytKaynaklarFormStep
  | AytKaynaklarFormStep;

export function isStandardStep(step: FormStep): step is StandardFormStep {
  return step.variant === undefined || step.variant === 'standard';
}

export const ONBOARDING_FORM_STEPS: FormStep[] = [
  {
    title: '#1 - Kişisel Bilgiler',
    fields: [
      { id: 'isim', type: 'text', label: 'İsim' },
      { id: 'sinif', type: 'text', label: 'Sınıf' },
      {
        id: 'alan',
        type: 'select',
        label: 'Alan',
        placeholder: 'Seçiniz',
        options: ['SAY', 'EA', 'SÖZ', 'DİL'],
      },
      { id: 'hedef-bolum', type: 'text', label: 'Hedef Bölüm' },
      { id: 'hedef-derece', type: 'text', label: 'Hedef Derece' },
      {
        id: 'gecmis-dereceler',
        type: 'text',
        label: '(Mezun ise) Geçmiş Dereceler',
      },
    ],
  },
  {
    title: '#2 - TYT Bilgileri',
    fields: [
      {
        id: 'tyt-turkce',
        type: 'text',
        label: 'TYT Türkçe Netiniz / Durumunuz',
        placeholder: '30 üstü, dil bilgisi yok vb.',
      },
      {
        id: 'tyt-sosyal',
        type: 'text',
        label: 'TYT Sosyal Netiniz / Durumunuz',
        placeholder: '10 civarı, coğrafya eksik vb.',
      },
      {
        id: 'tyt-matematik',
        type: 'text',
        label: 'TYT Matematik Netiniz / Durumunuz',
        placeholder: '15 civarı, temelim var ama problemlerde sıkıntı yaşıyorum vb.',
      },
      {
        id: 'tyt-geometri',
        type: 'text',
        label: 'TYT Geometri Netiniz / Durumunuz',
        placeholder: 'sıfırım veya 3 - 4 net yapabiliyorum vb.',
      },
      {
        id: 'tyt-fen',
        type: 'text',
        label: 'TYT Fen Netiniz / Durumunuz',
        placeholder: 'kimya 5+ geliyor ama fizik ve biyoloji sıfır vb.',
      },
    ],
  },
  {
    variant: 'ayt',
    title: '#3 - AYT Bilgileri',
  },
  {
    title: '#4 - Alışkanlıklar',
    fields: [
      {
        id: 'ortalama-calisma',
        type: 'text',
        label: 'Ortalama Çalışma',
        placeholder: '3 saat, çok değişiyor, bilmiyorum vb.',
      },
      {
        id: 'ortalama-ekran',
        type: 'text',
        label: 'Ortalama Ekran Süresi',
        placeholder: '4+ saat, çok değişiyor, bilmiyorum vb.',
      },
      {
        id: 'uyku-duzeni',
        type: 'text',
        label: 'Uyku Düzeni',
        placeholder: "genellikle 23.00 öncesi uyuyup 08.00'den erken kalkıyorum vb.",
      },
    ],
  },
  {
    variant: 'tyt-kaynaklar',
    title: '#5 - TYT Kaynakları',
  },
  {
    variant: 'ayt-kaynaklar',
    title: '#6 - AYT Kaynakları',
  },
  {
    title: '#7 - Gelmeden Önce',
    fields: [
      {
        id: 'program-tercihi',
        type: 'choice',
        label: 'Hangisi sana uygun?',
        options: [
          {
            value: 'sifirdan-program',
            label: 'Sıfırdan yeni bir program yapmak istiyorum.',
          },
          {
            value: 'program-gelistir',
            label: 'Programımı onaylatmak ve geliştirmek istiyorum.',
          },
        ],
      },
      {
        id: 'zorlayan-seyler',
        type: 'textarea',
        label: 'Şu anda seni zorlayan / engelleyen şeyler neler?',
        placeholder:
          'Anlamadığın veya zorlandığın konular, istikrarsızlık, telefon bağımlılığı vb.',
        size: 'long',
      },
      {
        id: 'beklentiler',
        type: 'textarea',
        label: 'Bu görüşmeden beklentilerin neler?',
        placeholder: 'Bir şeyler yaz...',
        size: 'long',
      },
    ],
  },
  {
    title: '#8 - Son Olarak',
    fields: [
      {
        id: 'musaitlik',
        type: 'textarea',
        label:
          'Önümüzdeki günlerde görüşme için müsaitliğin nasıl? Lütfen detaylı ve net cevap ver:',
        placeholder:
          "Pazartesi salı tüm gün müsaitim, çarşamba saat 18.00'den sonra olabilir vb.",
        size: 'medium',
      },
      {
        id: 'ekstra',
        type: 'textarea',
        label: 'Söylemek istediğin ekstra bir şey var mı?',
        placeholder: 'Bir şeyler yaz...',
        size: 'long',
      },
    ],
  },
];
