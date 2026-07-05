import styled, { css } from 'styled-components';
import { Link } from 'react-router-dom';
import {
  blueButtonGradient,
  orangeButtonGradient,
  type ThemeColor,
} from '../styles/theme';

export type PaymentTheme = ThemeColor;

const paymentThemeStyles = {
  blue: {
    subtitleGradient: `linear-gradient(135deg, #64b5f6 0%, #42a5f5 40%, #2196f3 100%)`,
    subtitleShadow: '0 0 24px rgba(33, 150, 243, 0.25)',
    surfaceBackground: `linear-gradient(
      135deg,
      rgba(21, 101, 192, 0.25) 0%,
      rgba(25, 118, 210, 0.15) 100%
    )`,
    surfaceBorder: 'rgba(66, 165, 245, 0.25)',
    buttonGradient: blueButtonGradient,
    buttonShadow: '0 8px 25px rgba(21, 101, 192, 0.3)',
    buttonShadowHover: '0 12px 35px rgba(21, 101, 192, 0.4)',
  },
  orange: {
    subtitleGradient: `linear-gradient(135deg, #ffab91 0%, #ff8a65 40%, #f4511e 100%)`,
    subtitleShadow: '0 0 24px rgba(244, 81, 30, 0.25)',
    surfaceBackground: `linear-gradient(
      135deg,
      rgba(191, 54, 12, 0.25) 0%,
      rgba(230, 74, 25, 0.15) 100%
    )`,
    surfaceBorder: 'rgba(255, 138, 101, 0.25)',
    buttonGradient: orangeButtonGradient,
    buttonShadow: '0 8px 25px rgba(216, 67, 21, 0.3)',
    buttonShadowHover: '0 12px 35px rgba(216, 67, 21, 0.4)',
  },
} as const;

function getPaymentTheme(theme: PaymentTheme = 'blue') {
  return paymentThemeStyles[theme];
}

const fadeInUp = css`
  animation: fadeInUp 0.8s ease-out both;

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
`;

export const PaymentContent = styled.div`
  width: 100%;
  max-width: 640px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const ProductSubtitle = styled.h2<{ $theme?: PaymentTheme }>`
  font-size: 1.6rem;
  font-weight: 700;
  text-align: center;
  margin: -20px 0 12px;
  background: ${({ $theme = 'blue' }) => getPaymentTheme($theme).subtitleGradient};
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: ${({ $theme = 'blue' }) => getPaymentTheme($theme).subtitleShadow};
  ${fadeInUp}
  animation-delay: 0.35s;

  @media (max-width: 768px) {
    font-size: 1.35rem;
    margin-top: -12px;
  }
`;

export const SurfaceCard = styled.div<{ $delay?: string; $theme?: PaymentTheme }>`
  width: 100%;
  padding: 24px 28px;
  border-radius: 20px;
  background: ${({ $theme = 'blue' }) => getPaymentTheme($theme).surfaceBackground};
  border: 1px solid ${({ $theme = 'blue' }) => getPaymentTheme($theme).surfaceBorder};
  color: rgba(255, 255, 255, 0.9);
  ${fadeInUp}
  animation-delay: ${({ $delay }) => $delay ?? '0.4s'};

  @media (max-width: 768px) {
    padding: 20px;
  }
`;

export const PaymentOptionCard = styled(SurfaceCard)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }
`;

export const PaymentOptionLabel = styled.div`
  font-size: 1.2rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1.3;

  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
`;

const actionButtonStyles = css<{ $theme?: PaymentTheme }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 22px;
  border-radius: 30px;
  background: ${({ $theme = 'blue' }) => getPaymentTheme($theme).buttonGradient};
  color: white;
  text-decoration: none;
  font-size: 1rem;
  font-weight: 500;
  font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: ${({ $theme = 'blue' }) => getPaymentTheme($theme).buttonShadow};
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ $theme = 'blue' }) => getPaymentTheme($theme).buttonShadowHover};
  }

  @media (max-width: 600px) {
    width: 100%;
  }
`;

export const PaymentActionLink = styled.a<{ $theme?: PaymentTheme }>`
  ${actionButtonStyles}
`;

export const PaymentActionRouterLink = styled(Link)<{ $theme?: PaymentTheme }>`
  ${actionButtonStyles}
`;

export const InfoBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const InfoRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const InfoLabel = styled.span`
  font-size: 0.9rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.65);
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

export const InfoValue = styled.span`
  font-size: 1.15rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1.4;
  word-break: break-word;
`;

export const WarningText = styled.p`
  margin: 0;
  font-size: 1rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.88);
`;

export const BackLink = styled(Link)<{ $theme?: PaymentTheme }>`
  margin-top: 12px;
  padding: 14px 24px;
  border-radius: 30px;
  background: ${({ $theme = 'blue' }) => getPaymentTheme($theme).buttonGradient};
  color: white;
  text-decoration: none;
  font-size: 1rem;
  align-self: center;
  box-shadow: ${({ $theme = 'blue' }) => getPaymentTheme($theme).buttonShadow};
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  ${fadeInUp}
  animation-delay: 0.8s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ $theme = 'blue' }) => getPaymentTheme($theme).buttonShadowHover};
  }
`;
