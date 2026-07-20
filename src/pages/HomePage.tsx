import { useEffect, useState } from 'react';
import { GradientTitle } from '../components/GradientTitle';
import { HomeCard } from '../components/HomeCard';
import { HomeStudentTeaser } from '../components/HomeStudentTeaser';
import { CardStack, HomeLayout } from '../components/PageLayout';
import { fetchPublicActiveStudentCount } from '../lib/fetchPublicStudentCount';

export function HomePage() {
  const [studentCount, setStudentCount] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadCount = async () => {
      try {
        const count = await fetchPublicActiveStudentCount();
        if (isMounted) setStudentCount(count);
      } catch {
        if (isMounted) setStudentCount(0);
      }
    };

    void loadCount();
    return () => {
      isMounted = false;
    };
  }, []);

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
      <HomeStudentTeaser count={studentCount} />
    </HomeLayout>
  );
}
