import { Link } from 'react-router-dom';
import styled from 'styled-components';

const TeaserCard = styled.div`
  width: 100%;
  max-width: 960px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 22px;
  border-radius: 18px;
  border: 1px solid rgba(255, 138, 101, 0.25);
  background: linear-gradient(
    135deg,
    rgba(191, 54, 12, 0.25) 0%,
    rgba(230, 74, 25, 0.15) 100%
  );
  animation: fadeInUp 0.8s ease-out both;
  animation-delay: 0.45s;

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: stretch;
    max-width: 420px;
  }
`;

const TeaserLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;

  @media (max-width: 600px) {
    justify-content: center;
  }
`;

const LiveDotWrap = styled.span`
  position: relative;
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const LiveDotCore = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #66bb6a;
  box-shadow: 0 0 10px rgba(102, 187, 106, 0.7);
  z-index: 1;
`;

const LiveDotPulse = styled.span`
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(102, 187, 106, 0.45);
  animation: liveBreath 1.8s ease-in-out infinite;

  @keyframes liveBreath {
    0%,
    100% {
      transform: scale(0.85);
      opacity: 0.7;
    }
    50% {
      transform: scale(2.1);
      opacity: 0;
    }
  }
`;

const TeaserCount = styled.span`
  font-size: 1.25rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1.3;
`;

const OrangeButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 20px;
  border-radius: 30px;
  background: linear-gradient(135deg, #bf360c 0%, #d84315 50%, #e64a19 100%);
  color: white;
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  box-shadow: 0 8px 25px rgba(216, 67, 21, 0.3);
  white-space: nowrap;

  @media (max-width: 600px) {
    width: 100%;
  }
`;

type HomeStudentTeaserProps = {
  count: number | null;
  detailsTo?: string;
};

export function HomeStudentTeaser({
  count,
  detailsTo = '/ogrenciler',
}: HomeStudentTeaserProps) {
  const label =
    count === null
      ? '… öğrenci koçluk alıyor'
      : `${count} öğrenci koçluk alıyor`;

  return (
    <TeaserCard>
      <TeaserLeft>
        <LiveDotWrap aria-hidden>
          <LiveDotPulse />
          <LiveDotCore />
        </LiveDotWrap>
        <TeaserCount>{label}</TeaserCount>
      </TeaserLeft>
      <OrangeButton to={detailsTo}>Detaylarını Gör</OrangeButton>
    </TeaserCard>
  );
}
