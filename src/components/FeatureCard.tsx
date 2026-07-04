import styled, { css } from 'styled-components';
import type { LucideIcon } from 'lucide-react';
import {
  blueGradientSoft,
  cardOverlay,
  orangeGradient,
  type ThemeColor,
} from '../styles/theme';

const baseFeatureCard = css`
  width: 100%;
  border-radius: 20px;
  padding: 30px;
  position: relative;
  overflow: hidden;
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

  @media (max-width: 768px) {
    padding: 25px;
  }

  @media (max-width: 480px) {
    padding: 20px;
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

const BlueFeatureCard = styled.div`
  ${baseFeatureCard}
  background: ${blueGradientSoft};
  box-shadow:
    0 10px 30px rgba(21, 101, 192, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
`;

const OrangeFeatureCard = styled.div`
  ${baseFeatureCard}
  background: ${orangeGradient};
  box-shadow:
    0 10px 30px rgba(216, 67, 21, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
`;

const FeatureInner = styled.div`
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 25px;
`;

const IconWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.9);
  flex-shrink: 0;

  svg {
    width: 50px;
    height: 50px;
    stroke-width: 1.5;
  }

  @media (max-width: 768px) {
    svg {
      width: 40px;
      height: 40px;
    }
  }

  @media (max-width: 480px) {
    svg {
      width: 35px;
      height: 35px;
    }
  }
`;

const FeatureText = styled.p`
  font-size: 1.1rem;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  line-height: 1.6;
  flex: 1;

  @media (max-width: 768px) {
    font-size: 1rem;
  }

  @media (max-width: 480px) {
    font-size: 0.9rem;
  }
`;

type FeatureCardProps = {
  text: string;
  icon: LucideIcon;
  theme: ThemeColor;
  animationDelay?: string;
};

export function FeatureCard({
  text,
  icon: Icon,
  theme,
  animationDelay = '0.4s',
}: FeatureCardProps) {
  const Card = theme === 'blue' ? BlueFeatureCard : OrangeFeatureCard;

  return (
    <Card style={{ animationDelay }}>
      <FeatureInner>
        <IconWrap>
          <Icon />
        </IconWrap>
        <FeatureText>{text}</FeatureText>
      </FeatureInner>
    </Card>
  );
}
