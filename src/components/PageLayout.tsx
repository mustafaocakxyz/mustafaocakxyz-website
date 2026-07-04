import styled from 'styled-components';
import { pageBackground } from '../styles/theme';

export const HomeLayout = styled.div`
  min-height: 100vh;
  background: ${pageBackground};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  font-family: 'Mont', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  gap: 60px;

  @media (max-width: 768px) {
    gap: 36px;
    padding: 16px;
  }
`;

export const DetailLayout = styled.div`
  min-height: 100vh;
  background: ${pageBackground};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  font-family: 'Mont', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
`;

export const CardStack = styled.div`
  width: 100%;
  max-width: 960px;
  display: flex;
  flex-direction: row;
  gap: 24px;
  align-items: stretch;

  @media (max-width: 768px) {
    flex-direction: column;
    max-width: 300px;
    gap: 16px;
  }
`;

export const FeatureList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 30px;
  width: 100%;
  max-width: 800px;
`;
