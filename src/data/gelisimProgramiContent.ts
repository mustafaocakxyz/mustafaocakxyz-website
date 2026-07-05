import {
  BarChart3,
  Bell,
  Bot,
  CalendarDays,
  CalendarClock,
  GraduationCap,
  Map,
  Repeat,
  Video,
} from 'lucide-react';
import type { ProgramIconItem, ProgramItem } from '../components/gelisim/types';

export type SectionCta = {
  label: string;
  to: string;
};

type SectionBase = {
  title: string;
  ctaAfter?: SectionCta;
};

export type ProgramSectionConfig =
  | (SectionBase & { variant: 'icon-bordered'; items: ProgramIconItem[] })
  | (SectionBase & { variant: 'grid'; items: ProgramItem[] })
  | (SectionBase & { variant: 'timeline'; items: ProgramItem[] });

export const GELISIM_BASVURU_FORM_PATH = '/gelisim-programi/basvuru';
export const GELISIM_BASVURU_INTRO_PATH = '/gelisim-programi/basvuru-bilgi';

export const GELISIM_SECTION_CTA: SectionCta = {
  label: 'Programa Başvur',
  to: GELISIM_BASVURU_INTRO_PATH,
};

export const GELISIM_PROGRAM_SECTIONS: ProgramSectionConfig[] = [
  {
    variant: 'icon-bordered',
    title: "Gelişim Programı'nda neler var?",
    items: [
      {
        icon: Map,
        text: 'İlk görüşmede 12 aylık yol haritan hazır',
        subtext: 'Hedefimiz ve yönümüz belli',
      },
      {
        icon: CalendarDays,
        text: 'Önümüzdeki 14 gün her zaman belli',
        subtext: 'Hiçbir zaman ‘Bugün ne çalışacaktım?’ belirsizliği yaşanmayacak',
      },
      {
        icon: BarChart3,
        text: 'Günlük / Haftalık / Aylık gelişim raporları',
        subtext: 'Sürecini her detayıyla ve sürekli takip edeceğiz',
      },
      {
        icon: Video,
        text: 'Stratejik görüşmeler',
        subtext: 'Haftalık değil, gerekli ve değerli olduğunda',
      },
      {
        icon: GraduationCap,
        text: 'X Akademi ekosistemine erişim',
        subtext: 'Kurslar, kamplar, ödüllü yarışmalar ve soru-cevap yayınları',
      },
    ],
    ctaAfter: GELISIM_SECTION_CTA,
  },
  {
    variant: 'grid',
    title: 'Kimler için uygun?',
    items: [
      { text: 'Programı uygulamaya hazır öğrenciler ✅', subtext: '' },
      { text: 'Düzenli çalışma disiplini isteyen öğrenciler ✅', subtext: '' },
      { text: 'Gerçekten yorulmak ve gelişmek isteyen öğrenciler ✅', subtext: '' },
    ],
  },
  {
    variant: 'timeline',
    title: 'Süreç nasıl işliyor?',
    items: [
      {
        text: 'Başvuru Yap',
        subtext: 'Sürece adım atıyorsun...',
      },
      {
        text: 'Başvuru Değerlendirmesi',
        subtext: 'Bu sürecin sana uygun olup olmadığını analiz ediyoruz.',
      },
      {
        text: 'Ödeme',
        subtext: 'Başvurun kabul edilirse ilk ay için ödeme yaparsın.',
      },
      {
        text: 'İlk Görüşme',
        subtext: 'Tanışıyoruz ve 12 aylık yol haritanı hazırlıyoruz.',
      },
      {
        text: 'Süreç Başlıyor',
        subtext: 'Günlük ve haftalık düzenli takip sürecini başlatıyoruz.',
      },
    ],
    ctaAfter: GELISIM_SECTION_CTA,
  },
  {
    variant: 'icon-bordered',
    title: 'Sistemimiz Neden Farklı?',
    items: [
      {
        icon: Bell,
        text: 'Sistemli İletişim',
        subtext:
          'WhatsApp’tan rastgele mesajlaşmak yerine düzenli bildirimler kullanıyoruz. Asıl odağımız derste kalıyor ve hiçbir soru cevapsız kalmıyor ve hiçbir önemli bilgi kaybolmuyor.',
      },
      {
        icon: CalendarClock,
        text: 'Gerektiğinde Görüşme ✅',
        subtext: 'Takvimin belli vakitlerinde değil, karar verilmesi gerektiğinde görüşüyoruz.',
      },
      {
        icon: Repeat,
        text: 'İstikrarlı Çalışma ✅',
        subtext:
          'Başarı sürekli plan yaparak değil var olan planı uygulayarak elde edilir. Bu yüzden orijinal programımıza sadık kalıyoruz. Eksiklikleri ve problemleri daha fazla çalışarak telafi ediyoruz.',
      },
      {
        icon: Bot,
        text: 'Teknoloji ✅',
        subtext:
          'Her öğrenci için ayrı bir yazılım ve yapay zeka altyapısı kullanıyoruz ve süreç boyunca bu altyapılardan faydalanıyoruz.',
      },
    ],
    ctaAfter: GELISIM_SECTION_CTA,
  },
];
