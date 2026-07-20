import { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { GradientTitle } from '../../components/GradientTitle';
import { DEMO_STUDENT_COUNT, DEMO_STUDENTS } from '../../data/demoStudentShowcase';
import { pageBackground } from '../../styles/theme';

type ExpandMode = 'none' | 'program' | 'stats';

const Shell = styled.div`
  min-height: 100vh;
  background: ${pageBackground};
  padding: 40px 20px 80px;
  font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: rgba(255, 255, 255, 0.9);
`;

const Wrap = styled.div`
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 28px;
`;

const Note = styled.p`
  margin: 0;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px dashed rgba(255, 138, 101, 0.35);
  background: rgba(191, 54, 12, 0.12);
  font-size: 0.88rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.65);
`;

const Back = styled(Link)`
  color: rgba(255, 171, 145, 0.95);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  width: fit-content;

  &:hover {
    color: #ffccbc;
  }
`;

const SectionLabel = styled.h2`
  margin: 8px 0 0;
  font-size: 0.82rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.45);
`;

const TeaserCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 22px;
  border-radius: 18px;
  border: 1px solid rgba(255, 138, 101, 0.25);
  background: linear-gradient(
    135deg,
    rgba(191, 54, 12, 0.25) 0%,
    rgba(230, 74, 25, 0.15) 100%
  );

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }
`;

const TeaserLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;

  @media (max-width: 600px) {
    justify-content: center;
  }
`;

const LiveDotWrap = styled.span`
  position: relative;
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const LiveDotCore = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #66bb6a;
  box-shadow: 0 0 10px rgba(102, 187, 106, 0.7);
  z-index: 1;
`;

const LiveDotPulse = styled.span`
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(102, 187, 106, 0.45);
  animation: liveBreath 1.8s ease-in-out infinite;

  @keyframes liveBreath {
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

const TeaserCount = styled.span`
  font-size: 1.25rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1.3;
`;

const OrangeButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 20px;
  border-radius: 30px;
  background: linear-gradient(135deg, #bf360c 0%, #d84315 50%, #e64a19 100%);
  color: white;
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  box-shadow: 0 8px 25px rgba(216, 67, 21, 0.3);
  white-space: nowrap;

  @media (max-width: 600px) {
    width: 100%;
  }
`;

const CardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const StudentCard = styled.article`
  padding: 18px 18px 16px;
  border-radius: 18px;
  border: 1px solid rgba(255, 138, 101, 0.22);
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const CardTop = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
`;

const Name = styled.h3`
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
`;

const Days = styled.span`
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  white-space: nowrap;
`;

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const Pill = styled.span<{ $accent?: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  border: 1px solid
    ${({ $accent }) =>
      $accent ? 'rgba(255, 171, 145, 0.45)' : 'rgba(255, 255, 255, 0.14)'};
  background: ${({ $accent }) =>
    $accent ? 'rgba(244, 81, 30, 0.18)' : 'rgba(255, 255, 255, 0.05)'};
  color: ${({ $accent }) =>
    $accent ? 'rgba(255, 204, 188, 0.98)' : 'rgba(255, 255, 255, 0.72)'};
`;

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const GhostButton = styled.button<{ $active?: boolean }>`
  padding: 9px 14px;
  border-radius: 999px;
  border: 1px solid
    ${({ $active }) =>
      $active ? 'rgba(255, 138, 101, 0.55)' : 'rgba(255, 138, 101, 0.28)'};
  background: ${({ $active }) =>
    $active ? 'rgba(244, 81, 30, 0.2)' : 'rgba(255, 255, 255, 0.04)'};
  color: rgba(255, 255, 255, 0.88);
  font-size: 0.82rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;

  &:hover {
    border-color: rgba(255, 138, 101, 0.5);
  }
`;

const ExpandPanel = styled.div`
  margin-top: 4px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ExpandTitle = styled.p`
  margin: 0;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.45);
`;

const TaskItem = styled.p`
  margin: 0;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 0.9rem;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.82);
`;

const StatLine = styled.p`
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.75);

  strong {
    color: rgba(255, 255, 255, 0.92);
    font-weight: 600;
  }
`;

const AltCard = styled(Link)`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  border-radius: 18px;
  border: 1px solid rgba(255, 138, 101, 0.35);
  background: linear-gradient(
    145deg,
    rgba(191, 54, 12, 0.42) 0%,
    rgba(230, 74, 25, 0.28) 45%,
    rgba(244, 81, 30, 0.18) 100%
  );
  box-shadow:
    0 10px 28px rgba(191, 54, 12, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(255, 171, 145, 0.55);
    box-shadow:
      0 14px 34px rgba(191, 54, 12, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.12);
  }
`;

const AltDays = styled.span`
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(255, 204, 188, 0.85);
  white-space: nowrap;
`;

const HighlightPill = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.88);
`;

const SoftPill = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.88);
`;

const AltHint = styled.span`
  font-size: 0.85rem;
  color: rgba(255, 224, 178, 0.95);
  font-weight: 600;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  margin: 8px 0;
`;

function ExpandableStudentCard({
  student,
}: {
  student: (typeof DEMO_STUDENTS)[number];
}) {
  const [mode, setMode] = useState<ExpandMode>('none');

  const toggle = (next: ExpandMode) => {
    setMode((current) => (current === next ? 'none' : next));
  };

  return (
    <StudentCard>
      <CardTop>
        <Name>{student.shortName}</Name>
        <Days>{student.daysInProgram} gündür çalışıyor</Days>
      </CardTop>

      <MetaRow>
        <Pill $accent>{student.highlight}</Pill>
        <Pill>Çalışma {student.avgStudyHours}</Pill>
      </MetaRow>

      <ActionRow>
        <GhostButton
          type="button"
          $active={mode === 'program'}
          onClick={() => toggle('program')}
        >
          Günlük Programı Gör
        </GhostButton>
        <GhostButton
          type="button"
          $active={mode === 'stats'}
          onClick={() => toggle('stats')}
        >
          İstatistikleri Gör
        </GhostButton>
      </ActionRow>

      {mode === 'program' ? (
        <ExpandPanel>
          <ExpandTitle>Bugünkü program</ExpandTitle>
          {student.todayTasks.map((task) => (
            <TaskItem key={task}>{task}</TaskItem>
          ))}
        </ExpandPanel>
      ) : null}

      {mode === 'stats' ? (
        <ExpandPanel>
          <ExpandTitle>İstatistikler</ExpandTitle>
          <StatLine>
            <strong>Ort. çalışma:</strong> {student.avgStudyHours}
          </StatLine>
          <StatLine>
            <strong>Ort. ekran:</strong> {student.avgScreenTime}
          </StatLine>
          <StatLine>
            <strong>Uyku:</strong> {student.sleepSchedule}
          </StatLine>
          {student.netChanges?.length ? (
            <MetaRow style={{ marginTop: 4 }}>
              {student.netChanges.map((change) => (
                <Pill $accent key={change.label}>
                  {change.label} {change.from} → {change.to}
                </Pill>
              ))}
            </MetaRow>
          ) : (
            <StatLine>Net dönüşümü için henüz erken (≈2 ay sonra).</StatLine>
          )}
        </ExpandPanel>
      ) : null}
    </StudentCard>
  );
}

export function DemoStudentsShowcasePage() {
  return (
    <Shell>
      <Wrap>
        <Back to="/demo/ogrenciler">← Demo hub</Back>
        <GradientTitle $detail>Öğrenciler nasıl ilerliyor?</GradientTitle>
        <Note>
          Gizli demo — mock data. Aşağıda iki yaklaşımı yan yana görebilirsin:
          (1) genişleyen özet kartlar, (2) özet kart → ayrı detay sayfası.
        </Note>

        <SectionLabel>Homepage teaser (örnek)</SectionLabel>
        <TeaserCard>
          <TeaserLeft>
            <LiveDotWrap aria-hidden>
              <LiveDotPulse />
              <LiveDotCore />
            </LiveDotWrap>
            <TeaserCount>{DEMO_STUDENT_COUNT} öğrenci koçluk alıyor</TeaserCount>
          </TeaserLeft>
          <OrangeButton to="/demo/ogrenciler/liste">Detaylarını Gör</OrangeButton>
        </TeaserCard>

        <Divider />

        <SectionLabel>Yaklaşım A — özet kart + yerinde genişletme</SectionLabel>
        <CardList>
          {DEMO_STUDENTS.map((student) => (
            <ExpandableStudentCard key={student.id} student={student} />
          ))}
        </CardList>

        <Divider />

        <SectionLabel>Yaklaşım B — özet kart → ayrı sayfa (mobil için genelde daha iyi)</SectionLabel>
        <CardList>
          {DEMO_STUDENTS.map((student) => (
            <AltCard key={student.id} to={`/demo/ogrenciler/${student.id}`}>
              <CardTop>
                <Name>{student.shortName}</Name>
                <AltDays>{student.daysInProgram} gündür çalışıyor</AltDays>
              </CardTop>
              <MetaRow>
                <HighlightPill>{student.highlight}</HighlightPill>
                <SoftPill>Çalışma {student.avgStudyHours}</SoftPill>
              </MetaRow>
              <AltHint>Öğrenci detayına git →</AltHint>
            </AltCard>
          ))}
        </CardList>
      </Wrap>
    </Shell>
  );
}
