import styled from 'styled-components';
import { pageBackground } from '../../styles/theme';

export const AppShell = styled.div`
  min-height: 100vh;
  min-height: 100dvh;
  background: ${pageBackground};
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 20px 48px;
  font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

  @media (max-width: 768px) {
    padding: 24px 16px 40px;
  }
`;

export const AppContent = styled.div`
  width: 100%;
  max-width: 1080px;
  display: flex;
  flex-direction: column;
  gap: 28px;
`;

export const AppCard = styled.section`
  border-radius: 20px;
  border: 1px solid rgba(66, 165, 245, 0.25);
  background: rgba(255, 255, 255, 0.06);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media (max-width: 768px) {
    padding: 20px 16px;
  }
`;

export const AppCardTitle = styled.h2`
  margin: 0;
  font-size: 1.15rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.92);
`;

export const BlueTitle = styled.h1`
  margin: 0;
  font-size: 1.85rem;
  font-weight: 700;
  background: linear-gradient(135deg, #64b5f6 0%, #42a5f5 40%, #2196f3 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.2;

  @media (max-width: 768px) {
    font-size: 1.55rem;
  }
`;

export const AppSubtitle = styled.p`
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.55);
`;

export const TwoColumnGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

export const AdminContent = styled.div`
  width: 100%;
  max-width: 1280px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

export const AdminDashboardGrid = styled.div`
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 20px;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

export const StudentSidebar = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border-radius: 20px;
  border: 1px solid rgba(66, 165, 245, 0.25);
  background: rgba(255, 255, 255, 0.06);
`;

export const SidebarTitle = styled.h2`
  margin: 0 0 8px;
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.45);
`;

export const StudentListButton = styled.button<{ $selected: boolean }>`
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid
    ${({ $selected }) =>
      $selected ? 'rgba(66, 165, 245, 0.65)' : 'rgba(66, 165, 245, 0.18)'};
  background: ${({ $selected }) =>
    $selected ? 'rgba(33, 150, 243, 0.22)' : 'rgba(255, 255, 255, 0.04)'};
  color: ${({ $selected }) =>
    $selected ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.75)'};
  font-size: 0.92rem;
  font-weight: ${({ $selected }) => ($selected ? 600 : 500)};
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;

  &:hover {
    border-color: rgba(66, 165, 245, 0.45);
    background: rgba(255, 255, 255, 0.08);
  }
`;

export const StudentDetailTitle = styled.h2`
  margin: 0;
  font-size: 1.45rem;
  font-weight: 700;
  background: linear-gradient(135deg, #64b5f6 0%, #42a5f5 40%, #2196f3 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.2;
`;

export const AdminMainPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
`;
