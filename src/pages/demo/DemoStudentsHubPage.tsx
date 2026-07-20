import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { GradientTitle } from '../../components/GradientTitle';
import { pageBackground } from '../../styles/theme';

const Shell = styled.div`
  min-height: 100vh;
  background: ${pageBackground};
  padding: 48px 20px 80px;
  font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
`;

const Wrap = styled.div`
  max-width: 560px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Intro = styled.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.55;
  font-size: 0.98rem;
`;

const LinkCard = styled(Link)`
  display: block;
  padding: 18px 20px;
  border-radius: 16px;
  border: 1px solid rgba(255, 138, 101, 0.28);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.92);
  text-decoration: none;
  font-weight: 600;

  span {
    display: block;
    margin-top: 6px;
    font-size: 0.88rem;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.55);
  }

  &:hover {
    border-color: rgba(255, 138, 101, 0.5);
  }
`;

export function DemoStudentsHubPage() {
  return (
    <Shell>
      <Wrap>
        <GradientTitle $detail>Demo: Öğrenci vitrini</GradientTitle>
        <Intro>
          Gizli tasarım demosu. Ana sitede link yok — URL ile aç. Mock veri kullanır;
          gerçek Supabase bağlantısı sonra gelecek.
        </Intro>
        <LinkCard to="/demo/ogrenciler/liste">
          Yaklaşım karşılaştırması
          <span>Teaser + genişleyen kartlar + ayrı detay sayfası</span>
        </LinkCard>
      </Wrap>
    </Shell>
  );
}
