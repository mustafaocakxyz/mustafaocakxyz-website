import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { preview as t } from '../preview/adminPreviewTheme';

/** Student-only page chrome. Clips horizontal overflow; do not use for admin. */
export const StudentShell = styled.div`
  width: 100%;
  max-width: 100%;
  min-width: 0;
  min-height: 100vh;
  min-height: 100dvh;
  overflow-x: clip;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  background: ${t.bg};
  color: ${t.text};
  font-family: ${t.font};
  padding-left: env(safe-area-inset-left, 0px);
  padding-right: env(safe-area-inset-right, 0px);
`;

export const StudentPageBody = styled.div`
  width: 100%;
  max-width: 100%;
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 0;
  overflow-x: clip;
`;

export const StudentPageFrame = styled.div<{ $maxWidth?: string }>`
  width: 100%;
  max-width: ${({ $maxWidth }) => $maxWidth ?? '720px'};
  min-width: 0;
  box-sizing: border-box;
  padding: 12px 12px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;

  @media (min-width: 640px) {
    padding: 20px 24px 28px;
    gap: 14px;
  }
`;

export const StudentHomeTopBar = styled.header`
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas:
    'title logout'
    'nav nav';
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid ${t.border};
  background: ${t.panel};

  @media (min-width: 640px) {
    grid-template-columns: minmax(0, 1fr) auto auto;
    grid-template-areas: 'title nav logout';
    align-items: center;
    gap: 12px;
    padding: 10px 20px;
  }
`;

export const StudentHomeTitle = styled.h1`
  grid-area: title;
  margin: 0;
  min-width: 0;
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: ${t.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const StudentHomeLogout = styled.button`
  grid-area: logout;
  padding: 7px 12px;
  border-radius: 999px;
  border: 1px solid ${t.borderStrong};
  background: ${t.panel2};
  color: ${t.muted};
  font: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  justify-self: end;
  white-space: nowrap;

  &:hover {
    border-color: rgba(96, 165, 250, 0.5);
    color: ${t.text};
  }
`;

export const StudentHomeNav = styled.div`
  grid-area: nav;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  min-width: 0;
  width: 100%;

  @media (min-width: 640px) {
    display: flex;
    width: auto;
    justify-self: center;
  }
`;

export const StudentHomeNavLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding: 8px 10px;
  border-radius: 999px;
  border: 1px solid ${t.borderStrong};
  background: ${t.panel2};
  color: ${t.muted};
  font: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  text-decoration: none;
  text-align: center;
  white-space: nowrap;

  &:hover {
    border-color: rgba(96, 165, 250, 0.5);
    color: ${t.text};
  }
`;

export const StudentHomeNavLinkWide = styled(StudentHomeNavLink)`
  @media (max-width: 639px) {
    grid-column: 1 / -1;
  }
`;

export const StudentSubTopBar = styled.header`
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border-bottom: 1px solid ${t.border};
  background: ${t.panel};

  @media (min-width: 640px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
  }
`;

export const StudentSubTitle = styled.h1`
  margin: 0;
  min-width: 0;
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: ${t.text};
`;

export const StudentSubActions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  width: 100%;
  min-width: 0;

  @media (min-width: 640px) {
    display: flex;
    width: auto;
  }
`;

export const StudentSubActionsTriple = styled(StudentSubActions)`
  @media (max-width: 639px) {
    grid-template-columns: 1fr;
  }
`;

export const StudentSubLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding: 8px 10px;
  border-radius: 999px;
  border: 1px solid ${t.borderStrong};
  background: ${t.panel2};
  color: ${t.muted};
  font: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  text-decoration: none;
  text-align: center;
  white-space: nowrap;

  &:hover {
    border-color: rgba(96, 165, 250, 0.5);
    color: ${t.text};
  }
`;

export const StudentContain = styled.div`
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  -webkit-overflow-scrolling: touch;
`;

export const StudentPanelCard = styled.section`
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 12px;
  border-radius: ${t.radiusLg};
  border: 1px solid ${t.border};
  background: ${t.panel};
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;

  @media (min-width: 640px) {
    padding: 16px;
  }
`;
