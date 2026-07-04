import { Calendar, CheckCircle, Layers, Sparkles } from 'lucide-react';
import { DetailPage } from './DetailPage';

const features = [
  {
    text: 'Haftalık oturumlarla düzenli ilerleme sağlarsın. (placeholder)',
    icon: Layers,
  },
  {
    text: 'Kişisel hedeflerine göre yapılandırılmış bir yol haritası. (placeholder)',
    icon: Sparkles,
  },
  {
    text: 'Her aşamada ölçülebilir gelişim takibi. (placeholder)',
    icon: CheckCircle,
  },
  {
    text: 'Program süresi ve başlangıç tarihi birlikte planlanır. (placeholder)',
    icon: Calendar,
  },
];

export function GelisimProgramiPage() {
  return (
    <DetailPage
      title="Gelişim Programı"
      features={features}
      ctaLabel="Programa Başvur"
      theme="orange"
      onCtaClick={() => {
        window.alert('CTA placeholder — bağlantı buraya eklenecek.');
      }}
    />
  );
}
