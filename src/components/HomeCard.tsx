import styled, { css } from 'styled-components';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  blueGradient,
  cardOverlay,
  orangeGradient,
  type ThemeColor,
} from '../styles/theme';

const baseCard = css`
  flex: 1;
  min-width: 0;
  aspect-ratio: 5 / 4;
  border-radius: 20px;
  padding: 24px;
  position: relative;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  display: block;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  animation: fadeInUp 0.8s ease-out both;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${cardOverlay};
    border-radius: 20px;
    pointer-events: none;
  }

  &:hover {
    transform: translateY(0) scale(1.05);
    cursor: pointer;
  }

  @media (max-width: 768px) {
    flex: none;
    width: 100%;
    aspect-ratio: 1;
    padding: 18px;
    border-radius: 18px;

    &::before {
      border-radius: 18px;
    }
  }

  @media (max-width: 480px) {
    padding: 16px;
    border-radius: 16px;

    &::before {
      border-radius: 16px;
    }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(40px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const BlueCard = styled(Link)`
  ${baseCard}
  background: ${blueGradient};
  box-shadow:
    0 10px 30px rgba(21, 101, 192, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
  animation-delay: 1s;

  &:hover {
    box-shadow:
      0 15px 40px rgba(21, 101, 192, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.3),
      inset 0 -1px 0 rgba(0, 0, 0, 0.15);
  }
`;

const OrangeCard = styled(Link)`
  ${baseCard}
  background: ${orangeGradient};
  box-shadow:
    0 10px 30px rgba(216, 67, 21, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
  animation-delay: 1.4s;

  &:hover {
    box-shadow:
      0 15px 40px rgba(216, 67, 21, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.3),
      inset 0 -1px 0 rgba(0, 0, 0, 0.15);
  }
`;

const OrangeCardDisabled = styled.div`
  ${baseCard}
  background: ${orangeGradient};
  box-shadow:
    0 10px 30px rgba(216, 67, 21, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
  animation-delay: 1.4s;
  cursor: not-allowed;
  pointer-events: none;

  &:hover {
    transform: none;
  }
`;

const ComingSoonOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(20, 20, 20, 0.72);
  border-radius: 20px;
  pointer-events: none;
  overflow: hidden;

  @media (max-width: 768px) {
    border-radius: 18px;
  }

  @media (max-width: 480px) {
    border-radius: 16px;
  }
`;

const ComingSoonTape = styled.div`
  width: 100%;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    180deg,
    #bf360c 0%,
    #d84315 20%,
    #e64a19 50%,
    #f57c00 70%,
    #e64a19 85%,
    #d84315 100%
  );
  border-top: 2px solid rgba(255, 255, 255, 0.2);
  border-bottom: 2px solid rgba(0, 0, 0, 0.2);
  box-shadow:
    0 4px 16px rgba(216, 67, 21, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);

  @media (max-width: 768px) {
    padding: 14px 16px;
  }

  @media (max-width: 480px) {
    padding: 12px 14px;
  }
`;

const ComingSoonText = styled.span`
  font-size: 2rem;
  font-weight: 700;
  color: white;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);

  @media (max-width: 768px) {
    font-size: 1.75rem;
  }

  @media (max-width: 480px) {
    font-size: 1.5rem;
  }
`;

const CardInner = styled.div`
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const CardRow = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex: 1;
  height: 100%;

  @media (max-width: 768px) {
    gap: 12px;
  }
`;

const CardContent = styled.div`
  flex: 1 1 55%;
  min-height: 55%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 14px;

  @media (max-width: 768px) {
    flex: 0 0 auto;
    min-height: unset;
    gap: 10px;
  }
`;

const CardTitle = styled.h2`
  font-size: 2.25rem;
  font-weight: 700;
  color: white;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  line-height: 1.12;

  @media (max-width: 768px) {
    font-size: 1.85rem;
    line-height: 1.1;
  }

  @media (max-width: 480px) {
    font-size: 1.7rem;
  }
`;

const CardSubtitle = styled.p`
  font-size: 1.35rem;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
  line-height: 1.45;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);

  @media (max-width: 768px) {
    font-size: 1.15rem;
    line-height: 1.38;
  }

  @media (max-width: 480px) {
    font-size: 1.08rem;
    line-height: 1.35;
  }
`;

const IconWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  color: rgba(255, 255, 255, 0.8);
  flex-shrink: 0;

  svg {
    width: 56px;
    height: 56px;
    stroke-width: 1.5;
  }

  @media (max-width: 768px) {
    margin-top: auto;

    svg {
      width: 44px;
      height: 44px;
    }
  }

  @media (max-width: 480px) {
    svg {
      width: 40px;
      height: 40px;
    }
  }
`;

type HomeCardProps = {
  to: string;
  title: string;
  subtitle?: string;
  theme: ThemeColor;
  icon: LucideIcon;
  comingSoon?: boolean;
};

function CardBody({
  title,
  subtitle,
  icon: Icon,
  comingSoon,
}: Pick<HomeCardProps, 'title' | 'subtitle' | 'icon' | 'comingSoon'>) {
  return (
    <>
      <CardInner>
        <CardRow>
          <CardContent>
            <CardTitle>{title}</CardTitle>
            {subtitle && <CardSubtitle>{subtitle}</CardSubtitle>}
          </CardContent>
          <IconWrap>
            <Icon />
          </IconWrap>
        </CardRow>
      </CardInner>
      {comingSoon && (
        <ComingSoonOverlay>
          <ComingSoonTape>
            <ComingSoonText>Çok Yakında</ComingSoonText>
          </ComingSoonTape>
        </ComingSoonOverlay>
      )}
    </>
  );
}

export function HomeCard({
  to,
  title,
  subtitle,
  theme,
  icon,
  comingSoon,
}: HomeCardProps) {
  if (comingSoon && theme === 'orange') {
    return (
      <OrangeCardDisabled aria-disabled="true">
        <CardBody
          title={title}
          subtitle={subtitle}
          icon={icon}
          comingSoon={comingSoon}
        />
      </OrangeCardDisabled>
    );
  }

  const Card = theme === 'blue' ? BlueCard : OrangeCard;

  return (
    <Card to={to}>
      <CardBody title={title} subtitle={subtitle} icon={icon} />
    </Card>
  );
}
