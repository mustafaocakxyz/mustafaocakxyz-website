import styled, { css } from 'styled-components';
import { titleGradient } from '../styles/theme';

const fadeInDown = css`
  animation: fadeInDown 0.8s ease-out both;
  animation-delay: 0.2s;

  @keyframes fadeInDown {
    from {
      opacity: 0;
      transform: translateY(-40px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export const GradientTitle = styled.h1<{ $detail?: boolean }>`
  font-size: ${({ $detail }) => ($detail ? '4rem' : '5rem')};
  font-weight: 700;
  background: ${titleGradient};
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-align: center;
  margin: 0;
  text-shadow: 0 0 30px rgba(192, 192, 192, 0.3);
  line-height: 1.05;
  ${fadeInDown}

  ${({ $detail }) =>
    $detail &&
    css`
      margin-bottom: 60px;

      @media (max-width: 768px) {
        margin-bottom: 40px;
      }

      @media (max-width: 480px) {
        margin-bottom: 30px;
      }
    `}

  @media (max-width: 768px) {
    font-size: ${({ $detail }) => ($detail ? '2.5rem' : '3.25rem')};
  }

  @media (max-width: 480px) {
    font-size: ${({ $detail }) => ($detail ? '2rem' : '2.75rem')};
  }
`;
