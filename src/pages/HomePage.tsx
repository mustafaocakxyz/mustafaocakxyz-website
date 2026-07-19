import { GradientTitle } from '../components/GradientTitle';
import { HomeCard } from '../components/HomeCard';
import { CardStack, HomeLayout } from '../components/PageLayout';

export function HomePage() {
  return (
    <HomeLayout>
      <GradientTitle>Hoş geldin</GradientTitle>
      <CardStack>
        <HomeCard
          to="/gelisim-programi"
          title="YKS & Maarif Koçluk"
          price="5900₺ / ay"
          description="Sürecini Mustafa Ocak ile birlikte götürmek isteyenler için. Aylık olarak tekrarlanır."
          theme="orange"
          delay="0.6s"
        />
        {/* Hidden for now — restore when Tek Seferlik is offered again:
        <HomeCard
          to="/tek-seferlik"
          title="Tek Seferlik Görüşme"
          price="2900₺ / tek seferlik"
          description="Mustafa Ocak ile birebir görüşmek, program desteği almak ve sorularını sormak isteyenler için. Aylık olarak tekrarlanmaz."
          theme="blue"
          delay="0.85s"
        />
        */}
      </CardStack>
    </HomeLayout>
  );
}
