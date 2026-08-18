import styled from 'styled-components';
import { pageBackground } from '../../styles/theme';

export const LandingLayout = styled.div`
  min-height: 100vh;
  background: ${pageBackground};
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 20px 80px;
  font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

  @media (max-width: 768px) {
    padding: 32px 16px 64px;
  }
`;

export const LandingContent = styled.div`
  width: 100%;
  max-width: 960px;
  display: flex;
  flex-direction: column;
  gap: 64px;

  @media (max-width: 768px) {
    gap: 48px;
  }
`;

export const LandingSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 28px;
`;

export const SectionTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, #64b5f6 0%, #42a5f5 40%, #2196f3 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.2;

  @media (max-width: 768px) {
    font-size: 1.65rem;
  }
`;
