import { GradientTitle } from '../components/GradientTitle';
import { HomeCard } from '../components/HomeCard';
import { HomeStudentTeaser } from '../components/HomeStudentTeaser';
import { CardStack, HomeLayout } from '../components/PageLayout';
import { useGelisimCapacity } from '../lib/gelisimCapacity';

export function HomePage() {
  const { studentCount, isFull, pillLabel } = useGelisimCapacity();

  return (
    <HomeLayout>
      <GradientTitle>Hoş geldin</GradientTitle>
      <CardStack>
        <HomeCard
          to="/gelisim-programi"
          title="YKS & Maarif Koçluk"
          price="6900₺ / ay"
          description="Sürecini Mustafa Ocak ile birlikte götürmek isteyenler için."
          capacityPill={pillLabel}
          capacityFull={isFull}
          theme="blue"
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
      <HomeStudentTeaser count={studentCount} />
    </HomeLayout>
  );
}
