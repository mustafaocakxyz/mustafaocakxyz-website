import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import styled, { css } from 'styled-components';
import {
  blueButtonGradient,
  orangeButtonGradient,
  type ThemeColor,
} from '../styles/theme';

const baseButton = css`
  padding: 18px 32px;
  border: none;
  border-radius: 30px;
  color: white;
  font-weight: 400;
  font-size: 1.2rem;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease, background 0.3s ease;
  margin-top: 40px;
  font-family: 'Mont', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  animation: fadeInUp 0.8s ease-out both;
  animation-delay: 1.6s;

  &:active {
    transform: translateY(-1px) scale(1.02);
  }

  @media (max-width: 768px) {
    padding: 16px 28px;
    font-size: 1.1rem;
    margin-top: 30px;
  }

  @media (max-width: 480px) {
    padding: 14px 24px;
    font-size: 1rem;
    margin-top: 25px;
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

const BlueButton = styled.button`
  ${baseButton}
  background: ${blueButtonGradient};
  box-shadow: 0 8px 25px rgba(21, 101, 192, 0.3);

  &:hover {
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 12px 35px rgba(21, 101, 192, 0.4);
    background: linear-gradient(135deg, #1976d2 0%, #2196f3 50%, #42a5f5 100%);
  }
`;

const OrangeButton = styled.button`
  ${baseButton}
  background: ${orangeButtonGradient};
  box-shadow: 0 8px 25px rgba(216, 67, 21, 0.3);

  &:hover {
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 12px 35px rgba(216, 67, 21, 0.4);
    background: linear-gradient(135deg, #d84315 0%, #e64a19 50%, #f57c00 100%);
  }
`;

const linkStyles = css`
  display: inline-block;
  text-align: center;
  text-decoration: none;
`;

const BlueButtonLink = styled(Link)`
  ${baseButton}
  ${linkStyles}
  background: ${blueButtonGradient};
  box-shadow: 0 8px 25px rgba(21, 101, 192, 0.3);

  &:hover {
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 12px 35px rgba(21, 101, 192, 0.4);
    background: linear-gradient(135deg, #1976d2 0%, #2196f3 50%, #42a5f5 100%);
  }
`;

const OrangeButtonLink = styled(Link)`
  ${baseButton}
  ${linkStyles}
  background: ${orangeButtonGradient};
  box-shadow: 0 8px 25px rgba(216, 67, 21, 0.3);

  &:hover {
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 12px 35px rgba(216, 67, 21, 0.4);
    background: linear-gradient(135deg, #d84315 0%, #e64a19 50%, #f57c00 100%);
  }
`;

type CTAButtonProps = {
  theme: ThemeColor;
  children: ReactNode;
  onClick?: () => void;
  to?: string;
};

export function CTAButton({ theme, children, onClick, to }: CTAButtonProps) {
  if (to) {
    const LinkButton = theme === 'blue' ? BlueButtonLink : OrangeButtonLink;
    return <LinkButton to={to}>{children}</LinkButton>;
  }

  const Button = theme === 'blue' ? BlueButton : OrangeButton;
  return <Button onClick={onClick}>{children}</Button>;
}
