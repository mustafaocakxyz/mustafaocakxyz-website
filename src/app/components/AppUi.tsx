import styled, { css } from 'styled-components';
import { blueButtonGradient } from '../../styles/theme';
import { formatDayPill } from '../utils/dates';

type DaySliderProps = {
  days: Date[];
  selectedIndex: number;
  onSelect: (index: number) => void;
};

const SliderRow = styled.div`
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: thin;
  scrollbar-color: rgba(66, 165, 245, 0.4) transparent;

  &::-webkit-scrollbar {
    height: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(66, 165, 245, 0.35);
    border-radius: 999px;
  }
`;

const DayPill = styled.button<{ $selected: boolean; $isToday: boolean }>`
  flex: 0 0 auto;
  min-width: 88px;
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid rgba(66, 165, 245, 0.25);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.82rem;
  font-weight: 500;
  font-family: inherit;
  line-height: 1.3;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease,
    box-shadow 0.2s ease;

  ${({ $isToday, $selected }) =>
    $isToday &&
    !$selected &&
    css`
      border-color: rgba(66, 165, 245, 0.45);
    `}

  ${({ $selected }) =>
    $selected &&
    css`
      border-color: rgba(66, 165, 245, 0.7);
      background: rgba(33, 150, 243, 0.22);
      color: rgba(255, 255, 255, 0.95);
      box-shadow: 0 6px 20px rgba(21, 101, 192, 0.25);
    `}

  &:hover {
    border-color: rgba(66, 165, 245, 0.55);
    background: rgba(255, 255, 255, 0.08);
  }
`;

export function DaySlider({ days, selectedIndex, onSelect }: DaySliderProps) {
  return (
    <SliderRow>
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
    </SliderRow>
  );
}

export const PrimaryButton = styled.button`
  width: 100%;
  padding: 16px 20px;
  border: none;
  border-radius: 30px;
  background: ${blueButtonGradient};
  color: white;
  font-size: 1rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  box-shadow: 0 8px 25px rgba(21, 101, 192, 0.3);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 12px 35px rgba(21, 101, 192, 0.4);
  }

  &:active {
    transform: scale(0.98);
  }
`;

export const TextButton = styled.button`
  align-self: flex-start;
  padding: 8px 0;
  border: none;
  background: transparent;
  color: rgba(100, 181, 246, 0.9);
  font-size: 0.9rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;

  &:hover {
    color: rgba(144, 202, 249, 1);
  }
`;
