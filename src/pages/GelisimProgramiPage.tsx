import { LandingBackButton } from '../components/gelisim/LandingBackButton';
import { ProgramSection } from '../components/gelisim/ProgramSection';
import { LandingContent, LandingLayout } from '../components/gelisim/LandingLayout';
import { GELISIM_PROGRAM_SECTIONS } from '../data/gelisimProgramiContent';

export function GelisimProgramiPage() {
  return (
    <LandingLayout>
      <LandingContent>
        <LandingBackButton />

        {GELISIM_PROGRAM_SECTIONS.map((section) => (
          <ProgramSection key={section.title} section={section} />
        ))}
      </LandingContent>
    </LandingLayout>
  );
}
