import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { GradientTitle } from '../components/GradientTitle';
import {
  fetchShowcaseStudents,
  type ShowcaseStudent,
} from '../lib/fetchPublicStudentShowcase';
import { pageBackground } from '../styles/theme';

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

const CardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const StudentCard = styled(Link)`
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

const CardTop = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
`;

const Name = styled.h2`
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
`;

const Days = styled.span`
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(255, 204, 188, 0.85);
  white-space: nowrap;
`;

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
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

const CardHint = styled.span`
  font-size: 0.85rem;
  color: rgba(255, 224, 178, 0.95);
  font-weight: 600;
`;

const StatusText = styled.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.95rem;
`;

export function OgrencilerPage() {
  const [students, setStudents] = useState<ShowcaseStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const rows = await fetchShowcaseStudents();
        if (!isMounted) return;
        setStudents(rows);
      } catch {
        if (isMounted) setError('Öğrenci listesi yüklenemedi.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Shell>
      <Wrap>
        <Back to="/">← Ana sayfa</Back>
        <GradientTitle $detail>Öğrenciler nasıl ilerliyor?</GradientTitle>

        {isLoading ? <StatusText>Yükleniyor...</StatusText> : null}
        {error ? <StatusText>{error}</StatusText> : null}
        {!isLoading && !error && students.length === 0 ? (
          <StatusText>Henüz vitrinde öğrenci yok.</StatusText>
        ) : null}

        <CardList>
          {students.map((student) => (
            <StudentCard key={student.id} to={`/ogrenciler/${student.id}`}>
              <CardTop>
                <Name>{student.shortName}</Name>
                <Days>{student.daysInProgram} gündür çalışıyor</Days>
              </CardTop>
              {student.highlight ? (
                <MetaRow>
                  <SoftPill>{student.highlight}</SoftPill>
                </MetaRow>
              ) : null}
              <CardHint>Öğrenci detayına git →</CardHint>
            </StudentCard>
          ))}
        </CardList>
      </Wrap>
    </Shell>
  );
}
