import styled, { css } from 'styled-components';
import { formatDayPill } from '../utils/dates';
import { preview as t } from './adminPreviewTheme';

export const PreviewShell = styled.div`
  width: 100%;
  max-width: 100%;
  min-width: 0;
  min-height: 100vh;
  min-height: 100dvh;
  overflow-x: clip;
  background: ${t.bg};
  color: ${t.text};
  font-family: ${t.font};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: stretch;
`;

export const PreviewTopBar = styled.header`
  width: 100%;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
  min-height: 72px;
  padding: 16px 48px;
  border-bottom: 1px solid ${t.border};
  background: ${t.panel};

  @media (max-width: 1100px) {
    padding: 14px 32px;
  }

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    min-height: 0;
    padding: 14px 16px;
    justify-items: stretch;
  }
`;

export const TopBarTitle = styled.h1`
  margin: 0;
  font-size: 1.2rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: ${t.text};
  justify-self: start;
`;

export const TopBarActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
`;

export const TopBarButton = styled.button`
  padding: 9px 15px;
  border-radius: 999px;
  border: 1px solid ${t.borderStrong};
  background: ${t.panel2};
  color: ${t.muted};
  font: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;

  &:hover {
    border-color: rgba(96, 165, 250, 0.5);
    color: ${t.text};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/** Orange CTA for chat entry in the top bar. */
export const ChatGlowButton = styled(TopBarButton)`
  border-color: rgba(234, 88, 12, 0.65);
  background: #ea580c;
  color: #fff7ed;
  font-weight: 800;
  box-shadow: none;

  &:hover {
    border-color: rgba(251, 146, 60, 0.85);
    background: #f97316;
    color: #ffffff;
  }
`;

export const TopBarEnd = styled.div`
  justify-self: end;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;

  @media (max-width: 900px) {
    justify-self: stretch;
    justify-content: flex-start;
  }
`;

export const EarningsBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 9px 14px;
  border-radius: 999px;
  border: 1px solid rgba(52, 211, 153, 0.35);
  background: rgba(16, 185, 129, 0.12);
`;

export const LiveDotWrap = styled.span`
  position: relative;
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

export const LiveDotCore = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #34d399;
  box-shadow: 0 0 10px rgba(52, 211, 153, 0.7);
  z-index: 1;
`;

export const LiveDotPulse = styled.span`
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(52, 211, 153, 0.45);
  animation: previewEarningsBreath 1.8s ease-in-out infinite;

  @keyframes previewEarningsBreath {
    0%,
    100% {
      transform: scale(0.85);
      opacity: 0.7;
    }
    50% {
      transform: scale(2.1);
      opacity: 0;
    }
  }
`;

export const EarningsAmount = styled.span`
  font-size: 1.02rem;
  font-weight: 800;
  color: rgba(167, 243, 208, 0.98);
  letter-spacing: 0.01em;
  white-space: nowrap;
`;

export const PreviewBody = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
  --preview-frame-max: 1180px;
  --preview-shift: 70px;
  --preview-frame-left: max(
    32px,
    calc((100% - var(--preview-frame-max)) / 2 - var(--preview-shift))
  );
`;

export const PreviewFrame = styled.div`
  width: 100%;
  max-width: var(--preview-frame-max);
  margin-left: var(--preview-frame-left);
  box-sizing: border-box;
  padding: 22px 48px 56px;
  display: flex;
  flex-direction: column;
  gap: 18px;

  @media (max-width: 1100px) {
    padding: 20px 32px 48px;
  }

  @media (max-width: 768px) {
    padding: 16px 16px 40px;
  }
`;

export const PreviewBanner = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 14px;
  border-radius: ${t.radiusMd};
  border: 1px dashed ${t.accentBorder};
  background: ${t.accentSoft};
  color: ${t.muted};
  font-size: 0.85rem;
`;

export const PreviewLink = styled.a`
  color: ${t.text};
  font-weight: 700;
  text-decoration: none;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid ${t.borderStrong};
  background: ${t.panel2};

  &:hover {
    border-color: ${t.accentBorder};
  }
`;

export const TopBar = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  border-radius: ${t.radiusLg};
  border: 1px solid ${t.border};
  background: ${t.panel};
`;

export const BrandBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

export const BrandTitle = styled.h1`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: ${t.text};
`;

export const BrandSub = styled.p`
  margin: 0;
  font-size: 0.82rem;
  color: ${t.muted};
`;

export const TopActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
`;

export const GhostButton = styled.button`
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid ${t.borderStrong};
  background: transparent;
  color: ${t.muted};
  font: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    color: ${t.text};
    border-color: ${t.accentBorder};
  }
`;

export const AccentButton = styled.button`
  flex-shrink: 0;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid rgba(96, 165, 250, 0.5);
  background: rgba(59, 130, 246, 0.16);
  color: rgba(191, 219, 254, 0.98);
  font: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    border-color: rgba(96, 165, 250, 0.7);
    background: rgba(59, 130, 246, 0.22);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 1000px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const KpiCard = styled.section`
  padding: 14px 16px;
  border-radius: ${t.radiusMd};
  border: 1px solid ${t.border};
  background: ${t.panel};
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
`;

export const KpiLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${t.muted};
`;

export const KpiValue = styled.span`
  font-size: 1.55rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: ${t.text};
  line-height: 1.1;
`;

export const KpiHint = styled.span`
  font-size: 0.78rem;
  color: ${t.mutedSoft};
`;

export const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 18px;
  align-items: start;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

export const Sidebar = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border-radius: ${t.radiusLg};
  border: 1px solid ${t.border};
  background: ${t.panel};
  position: sticky;
  top: 12px;
  height: calc((100dvh - 100px) * 0.95);
  max-height: calc((100dvh - 100px) * 0.95);
  overflow: hidden;
  box-sizing: border-box;

  @media (max-width: 960px) {
    position: static;
    height: auto;
    max-height: none;
  }
`;

export const StudentListScroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-right: 2px;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    width: 0;
    height: 0;
    display: none;
  }

  @media (max-width: 960px) {
    flex: none;
    max-height: min(320px, 45vh);
  }
`;

export const FilterRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
`;

export const FilterChip = styled.button<{ $active: boolean }>`
  width: 100%;
  padding: 6px 8px;
  border-radius: 999px;
  border: 1px solid ${t.border};
  background: ${t.panel2};
  color: ${t.muted};
  font: inherit;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;

  ${({ $active }) =>
    $active &&
    css`
      border-color: rgba(96, 165, 250, 0.5);
      background: rgba(59, 130, 246, 0.16);
      color: rgba(191, 219, 254, 0.98);
    `}

  &:hover {
    border-color: ${t.borderStrong};
    color: ${t.text};
  }
`;

export const SidebarHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

export const SidebarTitle = styled.h2`
  margin: 0;
  font-size: 0.9rem;
  font-weight: 800;
  color: ${t.text};
`;

export const CountBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  padding: 3px 8px;
  border-radius: 999px;
  background: ${t.successSoft};
  color: ${t.success};
  font-size: 0.75rem;
  font-weight: 800;
`;

export const SearchInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border-radius: ${t.radiusSm};
  border: 1px solid ${t.border};
  background: ${t.panel2};
  color: ${t.text};
  font: inherit;
  font-size: 0.85rem;

  &::placeholder {
    color: ${t.mutedSoft};
  }

  &:focus {
    outline: none;
    border-color: ${t.accentBorder};
  }
`;

export const StudentCardButton = styled.button<{ $selected: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
  text-align: left;
  padding: 11px 12px;
  border-radius: ${t.radiusMd};
  border: 2px solid ${t.border};
  background: ${t.panel2};
  color: inherit;
  font: inherit;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;

  ${({ $selected }) =>
    $selected &&
    css`
      border-color: rgba(96, 165, 250, 0.55);
      background: rgba(59, 130, 246, 0.14);
      box-shadow:
        0 0 0 1px rgba(96, 165, 250, 0.2),
        0 0 20px rgba(59, 130, 246, 0.28);
    `}

  &:hover {
    border-color: ${t.borderStrong};
    background: rgba(30, 41, 59, 0.92);
  }

  ${({ $selected }) =>
    $selected &&
    css`
      &:hover {
        border-color: rgba(96, 165, 250, 0.55);
        background: rgba(59, 130, 246, 0.14);
      }
    `}
`;

export const StudentName = styled.span`
  width: 100%;
  font-weight: 800;
  font-size: 0.92rem;
  line-height: 1.3;
  color: ${t.text};
`;

export const PillRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  width: 100%;
`;

export const StatusChip = styled.span<{ $tone?: 'ok' | 'bad' | 'warn' | 'muted'; $ready?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 9px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;

  ${({ $ready }) =>
    $ready === true &&
    css`
      color: ${t.success};
      background: ${t.successSoft};
      border: 1px solid rgba(52, 211, 153, 0.35);
    `}

  ${({ $ready }) =>
    $ready === false &&
    css`
      color: ${t.danger};
      background: ${t.dangerSoft};
      border: 1px solid rgba(248, 113, 113, 0.35);
    `}

  ${({ $tone, $ready }) => {
    if ($ready !== undefined) return '';
    if ($tone === 'ok')
      return css`
        color: ${t.success};
        background: ${t.successSoft};
        border: 1px solid rgba(52, 211, 153, 0.35);
      `;
    if ($tone === 'bad')
      return css`
        color: ${t.danger};
        background: ${t.dangerSoft};
        border: 1px solid rgba(248, 113, 113, 0.35);
      `;
    if ($tone === 'warn')
      return css`
        color: ${t.warn};
        background: ${t.warnSoft};
        border: 1px solid rgba(251, 191, 36, 0.35);
      `;
    return css`
      color: ${t.muted};
      background: rgba(148, 163, 184, 0.12);
      border: 1px solid ${t.border};
    `;
  }}
`;

export const MeetingAlertPill = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 24px;
  border-radius: 999px;
  border: 1px solid rgba(251, 146, 60, 0.45);
  background: rgba(249, 115, 22, 0.18);
  color: rgba(254, 215, 170, 0.98);
`;

export const Avatar = styled.div<{ $tone?: string }>`
  width: 40px;
  height: 40px;
  border-radius: 14px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.95rem;
  color: white;
  background: ${({ $tone }) => $tone ?? t.accent};
`;

export const MainPanel = styled.section`
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
`;

export const IdentityCard = styled.div`
  padding: 16px 18px;
  border-radius: ${t.radiusLg};
  border: 1px solid ${t.border};
  background: ${t.panel};
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

export const IdentityTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

export const IdentityLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
`;

export const IdentityTitle = styled.h2`
  margin: 0;
  font-size: 1.2rem;
  font-weight: 800;
`;

export const IdentitySub = styled.p`
  margin: 2px 0 0;
  font-size: 0.82rem;
  color: ${t.muted};
`;

export const IdentityNav = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
`;

export const IdentityNavButton = styled.button<{ $active: boolean }>`
  padding: 10px 8px;
  border-radius: ${t.radiusSm};
  border: 1px solid ${t.border};
  background: ${t.panel2};
  color: ${t.muted};
  font: inherit;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  text-align: center;
  transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;

  ${({ $active }) =>
    $active &&
    css`
      border-color: rgba(96, 165, 250, 0.5);
      background: rgba(59, 130, 246, 0.16);
      color: rgba(191, 219, 254, 0.98);
    `}

  &:hover {
    border-color: ${t.borderStrong};
    color: ${t.text};
  }
`;

export const DaySliderPanel = styled.div`
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 12px;
  border-radius: ${t.radiusLg};
  border: 1px solid ${t.border};
  background: ${t.panel};
`;

export const DaySliderRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8px;
  min-width: 0;
  width: 100%;

  @media (max-width: 560px) {
    display: flex;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scrollbar-width: none;
    -ms-overflow-style: none;
    padding-bottom: 2px;
    -webkit-overflow-scrolling: touch;

    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

export const DayPill = styled.button<{ $selected: boolean; $isToday: boolean }>`
  width: 100%;
  min-width: 0;
  padding: 10px 6px;
  border-radius: 999px;
  border: 1px solid ${t.border};
  background: ${t.panel2};
  color: ${t.muted};
  font: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 560px) {
    flex: 0 0 auto;
    width: auto;
    min-width: 76px;
    padding: 10px 12px;
  }

  ${({ $isToday, $selected }) =>
    $isToday &&
    !$selected &&
    css`
      border-color: ${t.borderStrong};
      color: ${t.text};
    `}

  ${({ $selected }) =>
    $selected &&
    css`
      border-color: rgba(96, 165, 250, 0.55);
      background: rgba(59, 130, 246, 0.16);
      color: ${t.text};
      box-shadow: 0 0 0 1px rgba(96, 165, 250, 0.18);
    `}
`;

export function PreviewDaySlider({
  days,
  selectedIndex,
  onSelect,
}: {
  days: Date[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <DaySliderPanel>
      <DaySliderRow>
        {days.map((day, index) => (
          <DayPill
            key={day.toISOString()}
            type="button"
            $selected={index === selectedIndex}
            $isToday={index === 1}
            onClick={() => onSelect(index)}
          >
            {formatDayPill(day)}
          </DayPill>
        ))}
      </DaySliderRow>
    </DaySliderPanel>
  );
}

export const SectionPillRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 10px;
  border-radius: ${t.radiusLg};
  border: 1px solid ${t.border};
  background: ${t.panel};
`;

export const SectionPill = styled.button<{ $active: boolean }>`
  width: 100%;
  padding: 14px 16px;
  border-radius: ${t.radiusMd};
  border: 1px solid ${t.border};
  background: ${t.panel2};
  color: ${t.muted};
  font: inherit;
  font-size: 0.95rem;
  font-weight: 800;
  cursor: pointer;
  text-align: center;
  transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;

  ${({ $active }) =>
    $active &&
    css`
      border-color: rgba(96, 165, 250, 0.55);
      background: rgba(59, 130, 246, 0.16);
      color: ${t.text};
      box-shadow: 0 0 0 1px rgba(96, 165, 250, 0.18);
    `}

  &:hover {
    border-color: ${t.borderStrong};
    color: ${t.text};
  }
`;

export const ContentCard = styled.section`
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 16px;
  border-radius: ${t.radiusLg};
  border: 1px solid ${t.border};
  background: ${t.panel};
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-x: clip;
`;

export const SectionStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
`;

export const NestedCard = styled.section`
  padding: 16px;
  border-radius: ${t.radiusLg};
  border: 1px solid ${t.border};
  background: ${t.panel};
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
`;

export const ContentTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
  color: ${t.text};
`;

export const ContentSub = styled.p`
  margin: 0;
  font-size: 0.82rem;
  color: ${t.muted};
`;

export const EmptyState = styled.div`
  padding: 28px 16px;
  text-align: center;
  color: ${t.muted};
  border-radius: ${t.radiusMd};
  border: 1px dashed ${t.borderStrong};
  background: ${t.panel2};
  font-size: 0.9rem;
`;

export const PlaceholderGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;

export const PlaceholderTile = styled.div`
  padding: 14px;
  border-radius: ${t.radiusMd};
  border: 1px solid ${t.border};
  background: ${t.panel2};
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const ProgressTrack = styled.div`
  height: 8px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.18);
  overflow: hidden;
`;

export const ProgressFill = styled.div<{ $pct: number; $color?: string }>`
  height: 100%;
  width: ${({ $pct }) => `${Math.max(0, Math.min(100, $pct))}%`};
  border-radius: 999px;
  background: ${({ $color }) => $color ?? t.accent};
`;

export const MutedNote = styled.p`
  margin: 0;
  font-size: 0.78rem;
  color: ${t.mutedSoft};
`;

export const ErrorText = styled.p`
  margin: 0;
  color: ${t.danger};
  font-size: 0.88rem;
`;

export const LoadingText = styled.p`
  margin: 0;
  color: ${t.muted};
`;
