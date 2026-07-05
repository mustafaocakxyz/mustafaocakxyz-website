import styled from 'styled-components';
import type { ProgramItem } from './types';

const Grid = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const GridItem = styled.li`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 22px 22px 22px 26px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 138, 101, 0.18);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: linear-gradient(180deg, #f57c00 0%, #e64a19 50%, #bf360c 100%);
  }
`;

const ItemText = styled.p`
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.95);
`;

const ItemSubtext = styled.p`
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.55);
`;

type ProgramItemsGridProps = {
  items: ProgramItem[];
};

export function ProgramItemsGrid({ items }: ProgramItemsGridProps) {
  return (
    <Grid>
      {items.map((item) => (
        <GridItem key={item.text}>
          <ItemText>{item.text}</ItemText>
          {item.subtext ? <ItemSubtext>{item.subtext}</ItemSubtext> : null}
        </GridItem>
      ))}
    </Grid>
  );
}
