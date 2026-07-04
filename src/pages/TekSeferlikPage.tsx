import { ClipboardList, Clock, FileText, MessageCircle } from 'lucide-react';
import { DetailPage } from './DetailPage';

const features = [
  {
    text: 'Mustafa Ocak ile online birebir görüşme yaparsın',
    icon: Clock,
  },
  {
    text: 'Sıfırdan YKS programını hazırlarız veya programını geliştiririz',
    icon: ClipboardList,
  },
  {
    text: 'Bütün sorularını sorar ve cevaplarını öğrenirsin',
    icon: MessageCircle,
  },
  {
    text: 'Görüşme sonrası programını ve sana özel notları PDF olarak alırsın',
    icon: FileText,
  },
];

export function TekSeferlikPage() {
  return (
    <DetailPage
      title="Tek Seferlik Görüşme"
      features={features}
      ctaLabel="Ödeme Yap ve Başvur"
      ctaTo="/tek-seferlik/odeme"
      theme="blue"
    />
  );
}
