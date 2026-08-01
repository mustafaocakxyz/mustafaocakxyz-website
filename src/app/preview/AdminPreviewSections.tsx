import styled from 'styled-components';
import { preview as t } from './adminPreviewTheme';
import {
  ContentSub,
  ContentTitle,
  MutedNote,
  PlaceholderGrid,
  PlaceholderTile,
  ProgressFill,
  ProgressTrack,
} from './AdminPreviewUi';

const FieldStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const FieldLabel = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  color: ${t.muted};
  text-transform: uppercase;
  letter-spacing: 0.03em;
`;

const FieldBox = styled.div`
  padding: 12px 14px;
  border-radius: ${t.radiusSm};
  border: 1px solid ${t.border};
  background: ${t.panel2};
  color: ${t.text};
  font-size: 0.92rem;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0;
  line-height: 1.45;
`;

const Tag = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  background: rgba(59, 130, 246, 0.16);
  color: rgba(191, 219, 254, 0.95);
  width: fit-content;
`;

const Table = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 1.4fr 0.7fr 0.7fr 0.8fr;
  gap: 8px;
  align-items: center;
  padding: 12px;
  border-radius: ${t.radiusSm};
  border: 1px solid ${t.border};
  background: ${t.panel2};
  font-size: 0.84rem;

  @media (max-width: 700px) {
    grid-template-columns: 1fr 1fr;
  }
`;

export function KonuMateryalSection({ studentName }: { studentName: string }) {
  const topics = [
    { name: 'TYT Paragraf', mastery: 72, material: 'Limit Yayınları', wrong: 18 },
    { name: 'TYT Problemler', mastery: 41, material: '345 Branş', wrong: 34 },
    { name: 'AYT Türev', mastery: 58, material: 'Orjinal', wrong: 22 },
    { name: 'AYT Organik', mastery: 29, material: 'Aydın', wrong: 41 },
  ];

  return (
    <>
      <div>
        <ContentTitle>Konu & materyal takibi</ContentTitle>
        <ContentSub style={{ marginTop: 4 }}>
          {studentName} için önizleme — henüz canlı veriye bağlı değil.
        </ContentSub>
      </div>
      <MutedNote>FEATURE_PLAN Phase 3 placeholder. Rastgele örnek içerik.</MutedNote>
      <PlaceholderGrid>
        {topics.map((topic) => (
          <PlaceholderTile key={topic.name}>
            <Tag>{topic.material}</Tag>
            <strong style={{ fontSize: '0.95rem' }}>{topic.name}</strong>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: t.muted }}>İlerleme</span>
              <span style={{ fontWeight: 800 }}>%{topic.mastery}</span>
            </div>
            <ProgressTrack>
              <ProgressFill $pct={topic.mastery} />
            </ProgressTrack>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: t.muted }}>Yanlış oranı</span>
              <span style={{ fontWeight: 800, color: t.danger }}>%{topic.wrong}</span>
            </div>
          </PlaceholderTile>
        ))}
      </PlaceholderGrid>
    </>
  );
}

export function DenemeSection({ studentName }: { studentName: string }) {
  const rows = [
    { name: 'TYT Branş #12', net: '78.5', rank: '12.400', delta: '+3.2' },
    { name: 'AYT EA Deneme', net: '52.25', rank: '18.100', delta: '-1.0' },
    { name: 'TYT Genel #44', net: '81.0', rank: '9.850', delta: '+5.5' },
  ];

  return (
    <>
      <div>
        <ContentTitle>Deneme takibi</ContentTitle>
        <ContentSub style={{ marginTop: 4 }}>
          {studentName} için önizleme — henüz canlı veriye bağlı değil.
        </ContentSub>
      </div>
      <MutedNote>FEATURE_PLAN Phase 4 placeholder. Örnek deneme satırları.</MutedNote>
      <PlaceholderGrid>
        <PlaceholderTile>
          <ContentSub>Son TYT net</ContentSub>
          <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>81.0</span>
          <Tag>+5.5 ivme</Tag>
        </PlaceholderTile>
        <PlaceholderTile>
          <ContentSub>Hedef aralık</ContentSub>
          <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>İlk 10k</span>
          <Tag>Sözel / EA</Tag>
        </PlaceholderTile>
      </PlaceholderGrid>
      <Table>
        {rows.map((row) => (
          <TableRow key={row.name}>
            <strong>{row.name}</strong>
            <span>{row.net} net</span>
            <span style={{ color: t.muted }}>{row.rank}</span>
            <span
              style={{
                color: row.delta.startsWith('+') ? t.success : t.danger,
                fontWeight: 800,
              }}
            >
              {row.delta}
            </span>
          </TableRow>
        ))}
      </Table>
    </>
  );
}

const COACH_FIELDS = [
  { key: 'baslangic', label: 'Başlangıç durumu', value: 'TYT temeli zayıf, paragraf güçlü.' },
  { key: 'guncel', label: 'Güncel durum', value: 'Düzenli tempo; matematik ivmesi yavaş.' },
  { key: 'biten', label: 'Geçmişte bitirilen dersler', value: 'TYT Türkçe konu seti, temel geometri.' },
  { key: 'odak', label: 'Güncel çalışma odağı', value: 'Problemler + AYT türev giriş.' },
  { key: 'sonraki', label: 'Bir sonraki çalışma adımı', value: 'Yanlış defteri + 2 branş deneme.' },
  { key: 'tarih', label: 'Güncelleme tarihi', value: '2026-07-28' },
] as const;

export function CoachNotesSection({ studentName }: { studentName: string }) {
  return (
    <FieldStack>
      <div>
        <ContentTitle>Notlar</ContentTitle>
        <ContentSub style={{ marginTop: 4 }}>
          {studentName} — Phase 2 önizlemesi (kayıt yok, örnek alanlar).
        </ContentSub>
      </div>
      {COACH_FIELDS.map((field) => (
        <FieldLabel key={field.key}>
          {field.label}
          <FieldBox>{field.value}</FieldBox>
        </FieldLabel>
      ))}
      <FieldLabel>
        Notlar
        <FieldBox>Motivasyon iyi; aile ile tempo konuşulacak.</FieldBox>
      </FieldLabel>
    </FieldStack>
  );
}
