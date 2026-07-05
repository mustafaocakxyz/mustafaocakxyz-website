import styled from 'styled-components';
import type { ProgramItem } from './types';

const Timeline = styled.ol`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
`;

const TimelineItem = styled.li`
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 0 20px;
  position: relative;
  padding-bottom: 32px;

  &:last-child {
    padding-bottom: 0;
  }

  &:not(:last-child)::before {
    content: '';
    position: absolute;
    left: 27px;
    top: 40px;
    bottom: 0;
    width: 2px;
    background: linear-gradient(
      180deg,
      rgba(244, 81, 30, 0.6) 0%,
      rgba(244, 81, 30, 0.15) 100%
    );
  }

  @media (max-width: 480px) {
    grid-template-columns: 44px 1fr;
    gap: 0 14px;
    padding-bottom: 24px;

    &:not(:last-child)::before {
      left: 21px;
      top: 36px;
    }
  }
`;

const StepNumber = styled.span`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  font-weight: 700;
  color: white;
  background: linear-gradient(135deg, #bf360c 0%, #e64a19 50%, #f57c00 100%);
  box-shadow: 0 6px 20px rgba(216, 67, 21, 0.35);
  flex-shrink: 0;

  @media (max-width: 480px) {
    width: 44px;
    height: 44px;
    font-size: 0.95rem;
  }
`;

const ItemBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 6px;
`;

const ItemText = styled.p`
  margin: 0;
  font-size: 1.15rem;
  font-weight: 600;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.95);

  @media (max-width: 768px) {
    font-size: 1.05rem;
  }
`;

const ItemSubtext = styled.p`
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.58);
`;

type ProgramItemsTimelineProps = {
  items: ProgramItem[];
};

export function ProgramItemsTimeline({ items }: ProgramItemsTimelineProps) {
  return (
    <Timeline>
      {items.map((item, index) => (
        <TimelineItem key={item.text}>
          <StepNumber>{String(index + 1).padStart(2, '0')}</StepNumber>
          <ItemBody>
            <ItemText>{item.text}</ItemText>
            <ItemSubtext>{item.subtext}</ItemSubtext>
          </ItemBody>
        </TimelineItem>
      ))}
    </Timeline>
  );
}
