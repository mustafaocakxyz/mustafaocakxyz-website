import styled from 'styled-components';
import type { ProgramIconItem } from './types';

const List = styled.ol`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const BorderedItem = styled.li`
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 0 20px;
  padding: 22px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 138, 101, 0.18);

  @media (max-width: 480px) {
    grid-template-columns: 44px 1fr;
    gap: 0 14px;
    padding: 18px;
  }
`;

const IconCircle = styled.span`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  background: linear-gradient(135deg, #bf360c 0%, #e64a19 50%, #f57c00 100%);
  box-shadow: 0 6px 20px rgba(216, 67, 21, 0.35);
  flex-shrink: 0;
  align-self: start;

  svg {
    width: 26px;
    height: 26px;
    stroke-width: 1.75;
  }

  @media (max-width: 480px) {
    width: 44px;
    height: 44px;

    svg {
      width: 22px;
      height: 22px;
    }
  }
`;

const ItemBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 4px;
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

type ProgramItemsIconBorderedProps = {
  items: ProgramIconItem[];
};

export function ProgramItemsIconBordered({ items }: ProgramItemsIconBorderedProps) {
  return (
    <List>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <BorderedItem key={item.text}>
            <IconCircle>
              <Icon />
            </IconCircle>
            <ItemBody>
              <ItemText>{item.text}</ItemText>
              <ItemSubtext>{item.subtext}</ItemSubtext>
            </ItemBody>
          </BorderedItem>
        );
      })}
    </List>
  );
}
