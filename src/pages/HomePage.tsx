import { MessageCircle, TrendingUp } from 'lucide-react';
import { GradientTitle } from '../components/GradientTitle';
import { HomeCard } from '../components/HomeCard';
import { CardStack, HomeLayout } from '../components/PageLayout';

export function HomePage() {
  return (
    <HomeLayout>
      <GradientTitle>Hangisi için buradasın?</GradientTitle>
      <CardStack>
        <HomeCard
          to="/tek-seferlik"
          title="Tek Seferlik Görüşme"
          subtitle="Mustafa Ocak ile birebir görüşmek, program desteği almak ve sorularını sormak isteyenler için. Aylık olarak tekrarlanmaz."
          theme="blue"
          icon={MessageCircle}
        />
        <HomeCard
          to="/gelisim-programi"
          title="Gelişim Programı"
          subtitle="YKS sürecini Mustafa Ocak ile birlikte götürmek isteyenler için. Hedefinize ulaşana kadar devam eder."
          theme="orange"
          icon={TrendingUp}
          comingSoon
        />
      </CardStack>
    </HomeLayout>
  );
}
