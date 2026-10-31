import styled from 'styled-components';
import { CTAButton } from '../CTAButton';
import { ProgramItemsGrid } from './ProgramItemsGrid';
import { ProgramItemsIconBordered } from './ProgramItemsIconBordered';
import { ProgramItemsTimeline } from './ProgramItemsTimeline';
import { LandingSection, SectionTitle } from './LandingLayout';
import type { ProgramSectionConfig } from '../../data/gelisimProgramiContent';

const SectionCtaWrap = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 8px;
`;

type ProgramSectionProps = {
  section: ProgramSectionConfig;
  applicationsOpen?: boolean;
};

export function ProgramSection({
  section,
  applicationsOpen = true,
}: ProgramSectionProps) {
  return (
    <LandingSection>
      <SectionTitle>{section.title}</SectionTitle>
      {section.variant === 'icon-bordered' && (
        <ProgramItemsIconBordered items={section.items} />
      )}
      {section.variant === 'grid' && <ProgramItemsGrid items={section.items} />}
      {section.variant === 'timeline' && (
        <ProgramItemsTimeline items={section.items} />
      )}
      {section.ctaAfter && (
        <SectionCtaWrap>
          <CTAButton
            theme="blue"
            to={applicationsOpen ? section.ctaAfter.to : undefined}
            disabled={!applicationsOpen}
            immediate
          >
            {applicationsOpen ? section.ctaAfter.label : 'Kontenjan Dolu'}
          </CTAButton>
        </SectionCtaWrap>
      )}
    </LandingSection>
  );
}
