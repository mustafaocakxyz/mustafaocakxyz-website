import { Link, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { GradientTitle } from '../../components/GradientTitle';
import { DEMO_STUDENTS } from '../../data/demoStudentShowcase';
import { pageBackground } from '../../styles/theme';

const Shell = styled.div`
  min-height: 100vh;
  background: ${pageBackground};
  padding: 40px 20px 80px;
  font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: rgba(255, 255, 255, 0.9);
`;

const Wrap = styled.div`
  max-width: 560px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 22px;
`;

const Back = styled(Link)`
  color: rgba(255, 171, 145, 0.95);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  width: fit-content;
`;

const StudentTitle = styled(GradientTitle)`
  && {
    margin-bottom: 8px;
  }

  @media (max-width: 768px) {
    && {
      margin-bottom: 6px;
    }
  }
`;

const Days = styled.p`
  margin: 0;
  text-align: center;
  color: #ff8a65;
  font-size: 1.35rem;
  font-weight: 600;

  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`;

const Panel = styled.section`
  padding: 20px;
  border-radius: 18px;
  border: 1px solid rgba(255, 138, 101, 0.35);
  background: linear-gradient(
    145deg,
    rgba(191, 54, 12, 0.4) 0%,
    rgba(230, 74, 25, 0.26) 50%,
    rgba(244, 81, 30, 0.16) 100%
  );
  box-shadow:
    0 10px 28px rgba(191, 54, 12, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const FeaturedPanel = styled(Panel)`
  align-items: center;
  text-align: center;
`;

const PanelTitle = styled.h2`
  margin: 0;
  font-size: 0.9rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(255, 204, 188, 0.8);
`;

const Line = styled.p`
  margin: 0;
  font-size: 1.08rem;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.88);

  strong {
    color: rgba(255, 255, 255, 0.98);
  }
`;

const Task = styled.p`
  margin: 0;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.18);
  border: 1px solid rgba(255, 171, 145, 0.22);
  font-size: 1.02rem;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.9);
`;

const PillRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
`;

const SoftPill = styled.span`
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 0.95rem;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
`;

const Missing = styled.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.55);
`;

export function DemoStudentDetailPage() {
  const { studentId } = useParams();
  const student = DEMO_STUDENTS.find((entry) => entry.id === studentId);

  if (!student) {
    return (
      <Shell>
        <Wrap>
          <Back to="/demo/ogrenciler/liste">← Listeye dön</Back>
          <Missing>Öğrenci bulunamadı.</Missing>
        </Wrap>
      </Shell>
    );
  }

  return (
    <Shell>
      <Wrap>
        <Back to="/demo/ogrenciler/liste">← Listeye dön</Back>
        <StudentTitle $detail>{student.shortName}</StudentTitle>
        <Days>{student.daysInProgram} gündür programda</Days>

        <FeaturedPanel>
          <PanelTitle>Kayda değer başarı</PanelTitle>
          <PillRow>
            <SoftPill>{student.highlight}</SoftPill>
          </PillRow>
        </FeaturedPanel>

        <Panel>
          <PanelTitle>İstatistikler</PanelTitle>
          <Line>
            <strong>Ort. çalışma:</strong> {student.avgStudyHours}
          </Line>
          <Line>
            <strong>Ort. ekran:</strong> {student.avgScreenTime}
          </Line>
          <Line>
            <strong>Uyku:</strong> {student.sleepSchedule}
          </Line>
          {student.netChanges?.length ? (
            <PillRow style={{ justifyContent: 'flex-start' }}>
              {student.netChanges.map((change) => (
                <SoftPill key={change.label}>
                  {change.label} {change.from} → {change.to}
                </SoftPill>
              ))}
            </PillRow>
          ) : (
            <SoftPill>Net dönüşümü için henüz erken</SoftPill>
          )}
        </Panel>

        <Panel>
          <PanelTitle>Bugünkü program</PanelTitle>
          {student.todayTasks.map((task) => (
            <Task key={task}>{task}</Task>
          ))}
        </Panel>
      </Wrap>
    </Shell>
  );
}
