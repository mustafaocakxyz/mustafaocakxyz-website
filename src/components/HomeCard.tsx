import styled, { css } from 'styled-components';
import { Link } from 'react-router-dom';
import {
  blueButtonGradient,
  orangeButtonGradient,
  type ThemeColor,
} from '../styles/theme';

const themeStyles = {
  blue: {
    surfaceBackground: `linear-gradient(
      135deg,
      rgba(21, 101, 192, 0.25) 0%,
      rgba(25, 118, 210, 0.15) 100%
    )`,
    surfaceBorder: 'rgba(66, 165, 245, 0.25)',
    priceGradient: `linear-gradient(135deg, #64b5f6 0%, #42a5f5 40%, #2196f3 100%)`,
    buttonGradient: blueButtonGradient,
    buttonShadow: '0 8px 25px rgba(21, 101, 192, 0.3)',
    buttonShadowHover: '0 12px 35px rgba(21, 101, 192, 0.4)',
  },
  orange: {
    surfaceBackground: `linear-gradient(
      135deg,
      rgba(191, 54, 12, 0.25) 0%,
      rgba(230, 74, 25, 0.15) 100%
    )`,
    surfaceBorder: 'rgba(255, 138, 101, 0.25)',
    priceGradient: `linear-gradient(135deg, #ffab91 0%, #ff8a65 40%, #f4511e 100%)`,
    buttonGradient: orangeButtonGradient,
    buttonShadow: '0 8px 25px rgba(216, 67, 21, 0.3)',
    buttonShadowHover: '0 12px 35px rgba(216, 67, 21, 0.4)',
  },
} as const;

const fadeInUp = css`
  animation: fadeInUp 0.8s ease-out both;

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

const Card = styled.div<{ $theme: ThemeColor; $delay: string }>`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 28px;
  border-radius: 20px;
  background: ${({ $theme }) => themeStyles[$theme].surfaceBackground};
  border: 1px solid ${({ $theme }) => themeStyles[$theme].surfaceBorder};
  ${fadeInUp}
  animation-delay: ${({ $delay }) => $delay};

  @media (max-width: 768px) {
    flex: none;
    width: 100%;
    padding: 22px;
  }
`;

const CardTitle = styled.h2`
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1.2;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const CardPrice = styled.p<{ $theme: ThemeColor }>`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.3;
  background: ${({ $theme }) => themeStyles[$theme].priceGradient};
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  @media (max-width: 768px) {
    font-size: 1.15rem;
  }
`;

const CardDescription = styled.p`
  margin: 0;
  flex: 1;
  font-size: 1.05rem;
  font-weight: 400;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.75);

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const CardCta = styled(Link)<{ $theme: ThemeColor }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  align-self: flex-start;
  margin-top: 8px;
  padding: 12px 22px;
  border-radius: 30px;
  background: ${({ $theme }) => themeStyles[$theme].buttonGradient};
  color: white;
  text-decoration: none;
  font-size: 1rem;
  font-weight: 500;
  font-family: inherit;
  box-shadow: ${({ $theme }) => themeStyles[$theme].buttonShadow};
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ $theme }) => themeStyles[$theme].buttonShadowHover};
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;

type HomeCardProps = {
  to: string;
  title: string;
  price: string;
  description: string;
  ctaLabel?: string;
  theme: ThemeColor;
  delay?: string;
};

export function HomeCard({
  to,
  title,
  price,
  description,
  ctaLabel = 'Detayları Gör',
  theme,
  delay = '0.6s',
}: HomeCardProps) {
  return (
    <Card $theme={theme} $delay={delay}>
      <CardTitle>{title}</CardTitle>
      <CardPrice $theme={theme}>{price}</CardPrice>
      <CardDescription>{description}</CardDescription>
      <CardCta $theme={theme} to={to}>
        {ctaLabel}
      </CardCta>
    </Card>
  );
}
