import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import styled, { css } from 'styled-components';
import {
  flushAssistantTestSave,
  loadAssistantTest,
  saveAssistantTest,
  startAssistantTest,
  submitAssistantTest,
} from '../assistantTest/applicantApi';
import {
  EXAM_SECTIONS,
  HABITS_PROFILE,
  PROGRAM_STUDENTS,
  YKS_PROFILE,
  questionsFor,
  type ProfileStat,
  type ProgramStudent,
  type SectionId,
  type StudentProfile,
} from '../assistantTest/content';
import {
  STATUS_LABEL,
  clearSession,
  loadSession,
  programRows,
  saveSession,
  sectionStatuses,
  type AssistantTestSession,
  type PlannedTask,
  type SectionStatus,
} from '../assistantTest/session';
import { TaskDurationPill } from '../components/TaskDurationPill';
import { preview as t } from '../preview/adminPreviewTheme';
import { parseTaskLabel } from '../utils/taskLabel';

type TextSectionId = 'yks' | 'habits' | 'control' | 'special';
type SaveState = 'saved' | 'saving' | 'error';

const STATUS_COLOR: Record<SectionStatus, string> = {
  untouched: t.mutedSoft,
  progress: t.warn,
  complete: t.success,
};

export function AssistantTestPage() {
  const [session, setSession] = useState<AssistantTestSession | null>(null);
  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState('');
  const [resumeKey, setResumeKey] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const sessionRef = useRef<AssistantTestSession | null>(null);
  const lastSavedAt = useRef<string | null>(null);
  const frozen = useRef(false);
  const retryTimer = useRef<number | null>(null);
  sessionRef.current = session;

  const persist = (snapshot: AssistantTestSession) => {
    void (async () => {
      const result = await saveAssistantTest(snapshot);
      const current = sessionRef.current;
      if (!current || current.updatedAt !== snapshot.updatedAt || current.submittedAt || frozen.current) {
        return;
      }
      if (!result.ok) {
        if (result.missing) {
          const remote = await loadAssistantTest(snapshot.id, snapshot.accessToken);
          if (remote.ok && remote.data.submittedAt) {
            saveSession(remote.data);
            setSession(remote.data);
            return;
          }
        }
        setSaveState('error');
        if (!result.error.includes('Bağlantı')) return;
        if (retryTimer.current !== null) window.clearTimeout(retryTimer.current);
        retryTimer.current = window.setTimeout(() => {
          retryTimer.current = null;
          const latest = sessionRef.current;
          if (
            latest &&
            latest.updatedAt === snapshot.updatedAt &&
            !latest.submittedAt &&
            !frozen.current
          ) {
            persist(snapshot);
          }
        }, 2500);
        return;
      }
      lastSavedAt.current = snapshot.updatedAt;
      setSaveState('saved');
    })();
  };

  useEffect(() => {
    return () => {
      if (retryTimer.current !== null) window.clearTimeout(retryTimer.current);
    };
  }, []);

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    const previousTitle = document.title;
    document.title = 'Asistan Değerlendirmesi';
    return () => {
      meta.remove();
      document.title = previousTitle;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setBootError('');
    const stored = loadSession();
    if (!stored) {
      setSession(null);
      setReady(true);
      return;
    }

    void (async () => {
      const remote = await loadAssistantTest(stored.id, stored.accessToken);
      if (cancelled) return;
      if (!remote.ok) {
        if (remote.missing) {
          clearSession();
          setSession(null);
        } else {
          setBootError(remote.error);
        }
        setReady(true);
        return;
      }

      const remoteSession = remote.data;
      const diverged =
        !remoteSession.submittedAt &&
        JSON.stringify(stored.answers) !== JSON.stringify(remoteSession.answers);
      const next = diverged
        ? { ...remoteSession, answers: stored.answers, updatedAt: new Date().toISOString() }
        : remoteSession;
      if (!diverged) lastSavedAt.current = next.updatedAt;
      saveSession(next);
      setSession(next);
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [resumeKey]);

  useEffect(() => {
    const current = session;
    if (!ready || !current || current.submittedAt || frozen.current) return;
    if (lastSavedAt.current === current.updatedAt) return;

    setSaveState('saving');
    if (retryTimer.current !== null) {
      window.clearTimeout(retryTimer.current);
      retryTimer.current = null;
    }
    const handle = window.setTimeout(() => {
      persist(current);
    }, 400);
    return () => window.clearTimeout(handle);
  }, [session, ready]);

  useEffect(() => {
    const flush = () => {
      const current = sessionRef.current;
      if (!current || current.submittedAt || frozen.current) return;
      if (lastSavedAt.current === current.updatedAt) return;
      saveSession(current);
      flushAssistantTestSave(current);
    };
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, []);

  useEffect(() => {
    if (!confirmOpen || submitting) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setConfirmOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirmOpen, submitting]);

  const statuses = useMemo(
    () => (session ? sectionStatuses(session.answers) : null),
    [session],
  );

  const start = async (firstName: string, lastName: string) => {
    const result = await startAssistantTest(firstName, lastName);
    if (!result.ok) return result.error;
    lastSavedAt.current = result.data.updatedAt;
    saveSession(result.data);
    setSaveState('saved');
    setSession(result.data);
    return null;
  };

  const patch = (updater: (current: AssistantTestSession) => AssistantTestSession) => {
    setSession((current) => {
      if (!current || current.submittedAt) return current;
      const next = updater(current);
      saveSession(next);
      return next;
    });
  };

  const setText = (sectionId: TextSectionId, questionId: string, value: string) => {
    patch((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      answers: {
        ...current.answers,
        [sectionId]: { ...current.answers[sectionId], [questionId]: value },
      },
    }));
  };

  const writeProgram = (studentId: string, tasks: PlannedTask[]) => {
    patch((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      answers: {
        ...current.answers,
        program: { ...current.answers.program, [studentId]: tasks },
      },
    }));
  };

  const submit = async () => {
    const current = sessionRef.current;
    if (!current || current.submittedAt || submitting) return;
    frozen.current = true;
    setSubmitting(true);
    setSubmitError('');
    const result = await submitAssistantTest(current);
    if (!result.ok) {
      if (result.missing) {
        const remote = await loadAssistantTest(current.id, current.accessToken);
        if (remote.ok && remote.data.submittedAt) {
          saveSession(remote.data);
          setSession(remote.data);
          setConfirmOpen(false);
          setSubmitting(false);
          return;
        }
      }
      frozen.current = false;
      setSubmitting(false);
      setSubmitError(result.error);
      return;
    }
    const next: AssistantTestSession = {
      ...current,
      updatedAt: result.data.submittedAt,
      submittedAt: result.data.submittedAt,
    };
    lastSavedAt.current = next.updatedAt;
    saveSession(next);
    setSession(next);
    setSubmitting(false);
    setConfirmOpen(false);
  };

  if (!ready) {
    return (
      <GateShell>
        <GateCard>
          <Eyebrow>Asistan Değerlendirmesi</Eyebrow>
          <GateTitle>Yükleniyor</GateTitle>
          <GateCopy>Kayıtlı değerlendirmen açılıyor.</GateCopy>
        </GateCard>
      </GateShell>
    );
  }

  if (bootError) {
    return (
      <GateShell>
        <GateCard>
          <Eyebrow>Asistan Değerlendirmesi</Eyebrow>
          <GateTitle>Bağlantı kurulamadı</GateTitle>
          <GateCopy>{bootError}</GateCopy>
          <SubmitButton type="button" onClick={() => setResumeKey((key) => key + 1)}>
            Tekrar dene
          </SubmitButton>
        </GateCard>
      </GateShell>
    );
  }

  if (!session) {
    return <Gate onStart={start} />;
  }

  if (session.submittedAt) {
    return <Done session={session} />;
  }

  return (
    <>
      <AssistantExamPane
        firstName={session.firstName}
        lastName={session.lastName}
        answers={session.answers}
        saveState={saveState}
        onTextChange={setText}
        onProgramChange={writeProgram}
        onRequestSubmit={() => {
          setSubmitError('');
          setConfirmOpen(true);
        }}
      />

      {confirmOpen && statuses ? (
        <ConfirmDialog
          statuses={statuses}
          pending={submitting}
          error={submitError}
          onCancel={() => {
            if (!submitting) setConfirmOpen(false);
          }}
          onConfirm={() => void submit()}
        />
      ) : null}
    </>
  );
}

export function AssistantExamPane({
  firstName,
  lastName,
  answers,
  readOnly = false,
  fill = false,
  saveState = 'saved',
  onTextChange,
  onProgramChange,
  onRequestSubmit,
}: {
  firstName: string;
  lastName: string;
  answers: AssistantTestSession['answers'];
  readOnly?: boolean;
  fill?: boolean;
  saveState?: SaveState;
  onTextChange?: (sectionId: TextSectionId, questionId: string, value: string) => void;
  onProgramChange?: (studentId: string, tasks: PlannedTask[]) => void;
  onRequestSubmit?: () => void;
}) {
  const [activeId, setActiveId] = useState<SectionId>('yks');
  const mainRef = useRef<HTMLElement>(null);
  const statuses = useMemo(() => sectionStatuses(answers), [answers]);
  const active = EXAM_SECTIONS.find((section) => section.id === activeId) ?? EXAM_SECTIONS[0];
  const completedCount = EXAM_SECTIONS.filter((section) => statuses[section.id] === 'complete').length;
  const ignoreText = () => {};
  const ignoreProgram = () => {};

  const selectSection = (sectionId: SectionId) => {
    setActiveId(sectionId);
    mainRef.current?.scrollTo({ top: 0 });
  };

  return (
    <Shell $fill={fill}>
      <TopBar>
        <TitleBlock>
          <Eyebrow>{readOnly ? 'Gönderilen değerlendirme' : 'Asistan Değerlendirmesi'}</Eyebrow>
          <Who>
            {firstName} {lastName}
            <Dot>·</Dot>
            {completedCount}/{EXAM_SECTIONS.length} bölüm tamam
          </Who>
        </TitleBlock>
        {readOnly ? null : (
          <TopActions>
            <SaveHint aria-live="polite">
              <SaveDot $state={saveState} />
              {saveState === 'saving'
                ? 'Kaydediliyor'
                : saveState === 'error'
                  ? 'Kaydedilemedi'
                  : 'Kaydedildi'}
            </SaveHint>
            <SubmitButton type="button" onClick={onRequestSubmit}>
              Bitir ve Gönder
            </SubmitButton>
          </TopActions>
        )}
      </TopBar>

      <Body>
        <Nav aria-label="Bölümler">
          <NavList>
            {EXAM_SECTIONS.map((section, index) => {
              const status = statuses[section.id];
              const selected = section.id === active.id;
              return (
                <NavButton
                  key={section.id}
                  type="button"
                  $selected={selected}
                  aria-current={selected ? 'true' : undefined}
                  onClick={() => selectSection(section.id)}
                >
                  <NavIndex>{String(index + 1).padStart(2, '0')}</NavIndex>
                  <NavCopy>
                    <NavTitle>{section.title}</NavTitle>
                    <NavStatus $status={status}>{STATUS_LABEL[status]}</NavStatus>
                  </NavCopy>
                  <StatusMark $status={status} aria-hidden="true">
                    {status === 'complete' ? <Check size={12} strokeWidth={3} /> : null}
                  </StatusMark>
                </NavButton>
              );
            })}
          </NavList>
          <Legend>
            <LegendRow>
              <StatusMark $status="untouched" />
              Boş
            </LegendRow>
            <LegendRow>
              <StatusMark $status="progress" />
              Devam ediyor
            </LegendRow>
            <LegendRow>
              <StatusMark $status="complete" />
              Tamamlandı
            </LegendRow>
          </Legend>
        </Nav>

        <Main ref={mainRef}>
          <MainInner>
            <SectionHead>
              <SectionTitle>{active.title}</SectionTitle>
              <SectionDescription>{active.description}</SectionDescription>
              {active.placeholderNote ? <Note>{active.placeholderNote}</Note> : null}
            </SectionHead>

            {active.id === 'yks' ? (
              <TextSection
                sectionId="yks"
                profile={YKS_PROFILE}
                answers={answers.yks}
                onChange={onTextChange ?? ignoreText}
                readOnly={readOnly}
              />
            ) : null}
            {active.id === 'habits' ? (
              <TextSection
                sectionId="habits"
                profile={HABITS_PROFILE}
                answers={answers.habits}
                onChange={onTextChange ?? ignoreText}
                readOnly={readOnly}
              />
            ) : null}
            {active.id === 'program' ? (
              <ProgramSection
                program={answers.program}
                onChange={onProgramChange ?? ignoreProgram}
                readOnly={readOnly}
              />
            ) : null}
            {active.id === 'control' ? (
              <TextSection
                sectionId="control"
                answers={answers.control}
                onChange={onTextChange ?? ignoreText}
                readOnly={readOnly}
                rows={5}
              />
            ) : null}
            {active.id === 'special' ? (
              <TextSection
                sectionId="special"
                answers={answers.special}
                onChange={onTextChange ?? ignoreText}
                readOnly={readOnly}
                quoted
                rows={5}
              />
            ) : null}
          </MainInner>
        </Main>
      </Body>
    </Shell>
  );
}

function Gate({ onStart }: { onStart: (firstName: string, lastName: string) => Promise<string | null> }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (pending) return;
    if (!firstName.trim() || !lastName.trim()) {
      setError('Ad ve soyad gerekli.');
      return;
    }
    setPending(true);
    setError('');
    void onStart(firstName, lastName).then((message) => {
      if (message) {
        setError(message);
        setPending(false);
      }
    });
  };

  return (
    <GateShell>
      <GateCard as="form" onSubmit={handleSubmit}>
        <Eyebrow>Asistan Değerlendirmesi</Eyebrow>
        <GateTitle>Adın ve soyadın</GateTitle>
        <GateCopy>
          Bundan sonra yanıtların bu isimle kaydedilir. Bölümler arasında istediğin zaman
          geçebilirsin. Yazdıkların otomatik kaydedilir.
        </GateCopy>
        <Field>
          <FieldLabel htmlFor="assistant-first-name">Ad</FieldLabel>
          <FieldInput
            id="assistant-first-name"
            name="given-name"
            autoComplete="given-name"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            placeholder="Adın"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="assistant-last-name">Soyad</FieldLabel>
          <FieldInput
            id="assistant-last-name"
            name="family-name"
            autoComplete="family-name"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            placeholder="Soyadın"
          />
        </Field>
        {error ? <ErrorText>{error}</ErrorText> : null}
        <SubmitButton type="submit" disabled={pending}>
          {pending ? 'Başlatılıyor' : 'Değerlendirmeye başla'}
        </SubmitButton>
      </GateCard>
    </GateShell>
  );
}

function Done({ session }: { session: AssistantTestSession }) {
  const submitted = session.submittedAt
    ? new Date(session.submittedAt).toLocaleString('tr-TR', {
        dateStyle: 'long',
        timeStyle: 'short',
      })
    : '';

  return (
    <GateShell>
      <GateCard>
        <DoneMark>
          <Check size={22} strokeWidth={2.5} />
        </DoneMark>
        <GateTitle>Yanıtların alındı</GateTitle>
        <GateCopy>
          {session.firstName} {session.lastName}, değerlendirmeyi {submitted} gönderdin. Yanıtların
          kaydedildi.
        </GateCopy>
      </GateCard>
    </GateShell>
  );
}

function TextSection({
  sectionId,
  profile,
  answers,
  onChange,
  readOnly = false,
  quoted = false,
  rows = 7,
}: {
  sectionId: TextSectionId;
  profile?: StudentProfile;
  answers: Record<string, string>;
  onChange: (sectionId: TextSectionId, questionId: string, value: string) => void;
  readOnly?: boolean;
  quoted?: boolean;
  rows?: number;
}) {
  const questions = questionsFor(sectionId);

  return (
    <QuestionStack>
      {profile ? <ProfileCard profile={profile} /> : null}
      {questions.map((question, index) => (
        <QuestionCard key={question.id}>
          <QuestionIndex>Soru {index + 1}</QuestionIndex>
          {quoted ? (
            <Quote>
              <QuoteLabel>Öğrenci</QuoteLabel>
              <QuoteText>{question.prompt}</QuoteText>
            </Quote>
          ) : (
            <QuestionPrompt>{question.prompt}</QuestionPrompt>
          )}
          <FieldLabel htmlFor={`${sectionId}-${question.id}`}>
            {quoted ? 'Cevabın' : 'Yanıtın'}
          </FieldLabel>
          <AnswerInput
            id={`${sectionId}-${question.id}`}
            rows={rows}
            value={answers[question.id] ?? ''}
            placeholder={readOnly ? '' : quoted ? 'Cevabını yaz' : 'Yanıtını yaz'}
            readOnly={readOnly}
            onChange={(event) => onChange(sectionId, question.id, event.target.value)}
          />
        </QuestionCard>
      ))}
    </QuestionStack>
  );
}

function ProfileCard({ profile }: { profile: StudentProfile }) {
  return (
    <Profile>
      <ProfileName>{profile.name}</ProfileName>
      {profile.summary ? <ProfileSummary>{profile.summary}</ProfileSummary> : null}
      <StatGrid>
        {profile.stats.map((stat) => (
          <Stat key={stat.label} stat={stat} />
        ))}
      </StatGrid>
    </Profile>
  );
}

function Stat({ stat }: { stat: ProfileStat }) {
  return (
    <StatCell>
      <StatLabel>{stat.label}</StatLabel>
      <StatValue>{stat.value}</StatValue>
    </StatCell>
  );
}

function splitCommaList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function DetailList({ items }: { items: string[] }) {
  return (
    <ItemList>
      {items.map((item) => (
        <Item key={item}>{item}</Item>
      ))}
    </ItemList>
  );
}

function ProgramSection({
  program,
  onChange,
  readOnly = false,
}: {
  program: Record<string, PlannedTask[]>;
  onChange: (studentId: string, tasks: PlannedTask[]) => void;
  readOnly?: boolean;
}) {
  return (
    <QuestionStack>
      {PROGRAM_STUDENTS.map((student) => (
        <ProgramStudentCard
          key={student.id}
          student={student}
          tasks={programRows(program[student.id])}
          onChange={(tasks) => onChange(student.id, tasks)}
          readOnly={readOnly}
        />
      ))}
    </QuestionStack>
  );
}

function DayTaskEditor({
  studentName,
  dayTitle,
  tasks,
  onChange,
  readOnly = false,
}: {
  studentName: string;
  dayTitle: string;
  tasks: PlannedTask[];
  onChange: (tasks: PlannedTask[]) => void;
  readOnly?: boolean;
}) {
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');

  const add = () => {
    const label = draft.trim();
    if (!label) return;
    onChange([...tasks, { id: crypto.randomUUID(), label }]);
    setDraft('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingLabel('');
  };

  const saveEdit = () => {
    const label = editingLabel.trim();
    if (!editingId || !label) return;
    onChange(tasks.map((task) => (task.id === editingId ? { ...task, label } : task)));
    cancelEdit();
  };

  const remove = (taskId: string) => {
    onChange(tasks.filter((task) => task.id !== taskId));
    if (editingId === taskId) cancelEdit();
  };

  return (
    <>
      {tasks.length === 0 ? <EmptyTasks>Bu gün için görev yok.</EmptyTasks> : null}
      <TaskEditor>
        {tasks.map((task) => {
          const parsed = parseTaskLabel(task.label);
          const editing = editingId === task.id;
          return (
            <SavedTask key={task.id}>
              {editing ? (
                <TaskInput
                  aria-label={`${studentName} ${dayTitle} görevini düzenle`}
                  value={editingLabel}
                  autoFocus
                  onChange={(event) => setEditingLabel(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') saveEdit();
                    if (event.key === 'Escape') cancelEdit();
                  }}
                />
              ) : (
                <SavedLabel>{parsed.label}</SavedLabel>
              )}
              {!editing && parsed.durationLabel ? (
                <TaskDurationPill>{parsed.durationLabel}</TaskDurationPill>
              ) : null}
              {editing ? (
                <>
                  <IconButton type="button" aria-label="Kaydet" onClick={saveEdit}>
                    <Check size={15} />
                  </IconButton>
                  <IconButton type="button" aria-label="İptal" onClick={cancelEdit}>
                    <X size={15} />
                  </IconButton>
                </>
              ) : readOnly ? null : (
                <>
                  <IconButton
                    type="button"
                    aria-label="Düzenle"
                    onClick={() => {
                      setEditingId(task.id);
                      setEditingLabel(task.label);
                    }}
                  >
                    <Pencil size={15} />
                  </IconButton>
                  <IconButton type="button" aria-label="Sil" $danger onClick={() => remove(task.id)}>
                    <Trash2 size={15} />
                  </IconButton>
                </>
              )}
            </SavedTask>
          );
        })}
      </TaskEditor>
      {readOnly ? null : (
      <AddRow>
        <AddInput
          aria-label={`${studentName} ${dayTitle} yeni görev`}
          placeholder="Örn. TYT Mat | Soru Çözümü | 2 saat"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') add();
          }}
        />
        <AddButton type="button" onClick={add}>
          <Plus size={16} />
          Ekle
        </AddButton>
      </AddRow>
      )}
    </>
  );
}

function ProgramStudentCard({
  student,
  tasks,
  onChange,
  readOnly = false,
}: {
  student: ProgramStudent;
  tasks: PlannedTask[];
  onChange: (tasks: PlannedTask[]) => void;
  readOnly?: boolean;
}) {
  const nextDayTitle = student.nextDayTitle ?? '3. gün';

  return (
    <StudentCard>
      <ProfileName>{student.name}</ProfileName>
      {student.note ? <Note>{student.note}</Note> : null}
      <MetaGrid>
        {student.profile ? (
          <Meta>
            <StatLabel>Profil</StatLabel>
            <StatValue>{student.profile}</StatValue>
          </Meta>
        ) : null}
        {student.stage ? (
          <Meta>
            <StatLabel>Program aşaması</StatLabel>
            <StatValue>{student.stage}</StatValue>
          </Meta>
        ) : null}
        {student.materials ? (
          <Meta>
            <StatLabel>Materyaller</StatLabel>
            <DetailList items={splitCommaList(student.materials)} />
          </Meta>
        ) : null}
        {student.routines ? (
          <Meta>
            <StatLabel>Rutinler</StatLabel>
            <DetailList items={splitCommaList(student.routines)} />
          </Meta>
        ) : null}
        {student.averageStudy ? (
          <Meta>
            <StatLabel>Ortalama çalışma</StatLabel>
            <StatValue>{student.averageStudy}</StatValue>
          </Meta>
        ) : null}
      </MetaGrid>

      <DayGrid>
        {student.days.map((day) => (
          <DayCard key={day.title}>
            <DayTitle>{day.title}</DayTitle>
            <DayHint>Verilen gün</DayHint>
            <GivenList>
              {day.tasks.map((task) => (
                <GivenTask key={`${day.title}-${task.label}`}>
                  <span>{task.label}</span>
                  {task.duration ? <TaskDuration>{task.duration}</TaskDuration> : null}
                </GivenTask>
              ))}
            </GivenList>
          </DayCard>
        ))}
      </DayGrid>

      <EditorCard>
        <EditorHead>
          <div>
            <DayTitle>{nextDayTitle}</DayTitle>
            <DayHint>Sen dolduracaksın</DayHint>
          </div>
          <WrittenCount>{tasks.length} görev</WrittenCount>
        </EditorHead>
        <DayTaskEditor
          studentName={student.name}
          dayTitle={nextDayTitle}
          tasks={tasks}
          onChange={onChange}
          readOnly={readOnly}
        />
      </EditorCard>
    </StudentCard>
  );
}

function ConfirmDialog({
  statuses,
  pending,
  error,
  onCancel,
  onConfirm,
}: {
  statuses: Record<SectionId, SectionStatus>;
  pending: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const incomplete = EXAM_SECTIONS.filter((section) => statuses[section.id] !== 'complete');

  return (
    <Backdrop onMouseDown={onCancel}>
      <Dialog role="dialog" aria-modal="true" aria-labelledby="submit-title" onMouseDown={(event) => event.stopPropagation()}>
        <DialogTitle id="submit-title">Değerlendirmeyi gönder</DialogTitle>
        <DialogCopy>
          Gönderdikten sonra yanıtlar kilitlenir. Bölümlerin durumu:
        </DialogCopy>
        <StatusList>
          {EXAM_SECTIONS.map((section) => (
            <StatusLine key={section.id}>
              <StatusMark $status={statuses[section.id]}>
                {statuses[section.id] === 'complete' ? <Check size={12} strokeWidth={3} /> : null}
              </StatusMark>
              <span>{section.title}</span>
              <StatusWord $status={statuses[section.id]}>{STATUS_LABEL[statuses[section.id]]}</StatusWord>
            </StatusLine>
          ))}
        </StatusList>
        {incomplete.length > 0 ? (
          <Warn>
            {incomplete.length} bölüm henüz tamamlanmadı. Yine de gönderebilirsin.
          </Warn>
        ) : (
          <Ready>Tüm bölümler tamam.</Ready>
        )}
        {error ? <ErrorText>{error}</ErrorText> : null}
        <DialogActions>
          <GhostButton type="button" onClick={onCancel} disabled={pending}>
            Vazgeç
          </GhostButton>
          <SubmitButton type="button" onClick={onConfirm} disabled={pending}>
            {pending ? 'Gönderiliyor' : 'Bitir ve Gönder'}
          </SubmitButton>
        </DialogActions>
      </Dialog>
    </Backdrop>
  );
}

const Shell = styled.div<{ $fill?: boolean }>`
  height: ${({ $fill }) => ($fill ? '100%' : '100vh')};
  height: ${({ $fill }) => ($fill ? '100%' : '100dvh')};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: ${t.bg};
  color: ${t.text};
  font-family: ${t.font};
`;

const TopBar = styled.header`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 28px;
  border-bottom: 1px solid ${t.border};
  background: ${t.panel};

  @media (max-width: 720px) {
    flex-direction: column;
    align-items: stretch;
    padding: 14px 16px;
  }
`;

const TitleBlock = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Eyebrow = styled.p`
  margin: 0;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${t.muted};
`;

const Who = styled.p`
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: -0.02em;
`;

const Dot = styled.span`
  margin: 0 8px;
  color: ${t.mutedSoft};
  font-weight: 600;
`;

const TopActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;

  @media (max-width: 720px) {
    justify-content: space-between;
  }
`;

const SaveHint = styled.p`
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  font-weight: 700;
  color: ${t.muted};
`;

const SaveDot = styled.span<{ $state: SaveState }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $state }) =>
    $state === 'saving' ? t.warn : $state === 'error' ? t.danger : t.success};
  box-shadow: 0 0 8px
    ${({ $state }) =>
      $state === 'saving'
        ? 'rgba(251, 191, 36, 0.7)'
        : $state === 'error'
          ? 'rgba(248, 113, 113, 0.7)'
          : 'rgba(52, 211, 153, 0.7)'};
`;

const SubmitButton = styled.button`
  border: none;
  border-radius: 999px;
  padding: 12px 18px;
  background: #2563eb;
  color: white;
  font: inherit;
  font-size: 0.92rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 8px 22px rgba(37, 99, 235, 0.28);

  &:hover:not(:disabled) {
    background: #1d4ed8;
  }

  &:disabled {
    opacity: 0.7;
    cursor: default;
  }
`;

const Body = styled.div`
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
    grid-template-rows: auto minmax(0, 1fr);
  }
`;

const Nav = styled.nav`
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  border-right: 1px solid ${t.border};
  background: rgba(15, 23, 42, 0.72);

  @media (max-width: 860px) {
    border-right: none;
    border-bottom: 1px solid ${t.border};
    padding: 10px 12px;
    gap: 8px;
  }
`;

const NavList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  @media (max-width: 860px) {
    flex-direction: row;
    overflow-x: auto;
    padding-bottom: 2px;
  }
`;

const NavButton = styled.button<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  text-align: left;
  padding: 12px;
  border-radius: ${t.radiusMd};
  border: 1px solid ${({ $selected }) => ($selected ? 'rgba(96, 165, 250, 0.55)' : t.border)};
  background: ${({ $selected }) => ($selected ? 'rgba(59, 130, 246, 0.16)' : t.panel)};
  color: ${t.text};
  font: inherit;
  cursor: pointer;

  &:hover {
    border-color: rgba(96, 165, 250, 0.45);
  }

  @media (max-width: 860px) {
    width: auto;
    min-width: 210px;
  }
`;

const NavIndex = styled.span`
  font-size: 0.75rem;
  font-weight: 800;
  color: ${t.mutedSoft};
`;

const NavCopy = styled.span`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const NavTitle = styled.span`
  font-size: 0.88rem;
  font-weight: 800;
  line-height: 1.3;
`;

const NavStatus = styled.span<{ $status: SectionStatus }>`
  font-size: 0.72rem;
  font-weight: 700;
  color: ${({ $status }) => STATUS_COLOR[$status]};
`;

const StatusMark = styled.span<{ $status: SectionStatus }>`
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #052e1f;
  border: 1.5px solid ${({ $status }) => STATUS_COLOR[$status]};
  background: ${({ $status }) =>
    $status === 'untouched' ? 'transparent' : STATUS_COLOR[$status]};
`;

const Legend = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 4px 0;
  font-size: 0.75rem;
  font-weight: 700;
  color: ${t.muted};

  @media (max-width: 860px) {
    display: none;
  }
`;

const LegendRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Main = styled.main`
  min-height: 0;
  overflow: auto;
  padding: 28px 32px 64px;

  @media (max-width: 720px) {
    padding: 18px 16px 48px;
  }
`;

const MainInner = styled.div`
  width: 100%;
  max-width: 820px;
  display: flex;
  flex-direction: column;
  gap: 22px;
`;

const SectionHead = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SectionTitle = styled.h1`
  margin: 0;
  font-size: 1.7rem;
  font-weight: 800;
  letter-spacing: -0.03em;
`;

const SectionDescription = styled.p`
  margin: 0;
  font-size: 1rem;
  line-height: 1.5;
  color: ${t.muted};
`;

const Note = styled.p`
  margin: 4px 0 0;
  padding: 10px 12px;
  border-radius: ${t.radiusSm};
  border: 1px solid rgba(251, 191, 36, 0.28);
  background: ${t.warnSoft};
  color: #fde68a;
  font-size: 0.82rem;
  font-weight: 700;
`;

const QuestionStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Profile = styled.section`
  padding: 18px;
  border-radius: ${t.radiusLg};
  border: 1px solid ${t.border};
  background: ${t.panel};
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ProfileName = styled.h2`
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
`;

const ProfileSummary = styled.p`
  margin: -6px 0 0;
  color: ${t.muted};
  font-size: 0.9rem;
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const StatCell = styled.div`
  padding: 12px;
  border-radius: ${t.radiusSm};
  background: ${t.panel2};
  border: 1px solid ${t.border};
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const StatLabel = styled.span`
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${t.muted};
`;

const StatValue = styled.span`
  font-size: 0.92rem;
  line-height: 1.45;
  color: ${t.text};
`;

const QuestionCard = styled.section`
  padding: 18px;
  border-radius: ${t.radiusLg};
  border: 1px solid ${t.border};
  background: ${t.panel};
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const QuestionIndex = styled.span`
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${t.mutedSoft};
`;

const QuestionPrompt = styled.p`
  margin: 0;
  font-size: 1.02rem;
  font-weight: 700;
  line-height: 1.45;
`;

const Quote = styled.blockquote`
  margin: 0;
  padding: 12px 14px;
  border-radius: ${t.radiusSm};
  border-left: 3px solid rgba(96, 165, 250, 0.8);
  background: ${t.panel2};
`;

const QuoteLabel = styled.span`
  display: block;
  margin-bottom: 4px;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${t.muted};
`;

const QuoteText = styled.p`
  margin: 0;
  font-size: 0.98rem;
  line-height: 1.5;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FieldLabel = styled.label`
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: ${t.muted};
`;

const fieldChrome = css`
  width: 100%;
  box-sizing: border-box;
  border-radius: ${t.radiusSm};
  border: 1px solid ${t.border};
  background: ${t.panel2};
  color: ${t.text};
  font: inherit;
  font-size: 0.95rem;
  line-height: 1.5;
  outline: none;

  &:focus {
    border-color: rgba(96, 165, 250, 0.55);
  }

  &::placeholder {
    color: ${t.mutedSoft};
  }
`;

const FieldInput = styled.input`
  ${fieldChrome}
  padding: 12px 14px;
`;

const AnswerInput = styled.textarea`
  ${fieldChrome}
  min-height: 140px;
  padding: 12px 14px;
  resize: vertical;
`;

const StudentCard = styled.section`
  padding: 18px;
  border-radius: ${t.radiusLg};
  border: 1px solid ${t.border};
  background: ${t.panel};
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const MetaGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ItemList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Item = styled.li`
  position: relative;
  padding-left: 14px;
  font-size: 0.92rem;
  line-height: 1.45;
  color: ${t.text};

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0.55em;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: rgba(147, 197, 253, 0.9);
  }
`;

const Meta = styled.div`
  padding: 12px;
  border-radius: ${t.radiusSm};
  background: ${t.panel2};
  border: 1px solid ${t.border};
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const DayGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const DayCard = styled.div`
  padding: 14px;
  border-radius: ${t.radiusMd};
  border: 1px solid ${t.border};
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const DayTitle = styled.h3`
  margin: 0;
  font-size: 0.95rem;
  font-weight: 800;
`;

const DayHint = styled.p`
  margin: 0;
  font-size: 0.75rem;
  font-weight: 700;
  color: ${t.mutedSoft};
`;

const GivenList = styled.ul`
  margin: 4px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const GivenTask = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-radius: ${t.radiusSm};
  background: ${t.panel2};
  border: 1px solid ${t.border};
  font-size: 0.9rem;
  line-height: 1.4;
`;

const TaskDuration = styled.span`
  flex-shrink: 0;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.16);
  color: rgba(191, 219, 254, 0.98);
  font-size: 0.75rem;
  font-weight: 800;
  white-space: nowrap;
`;

const EditorCard = styled.div`
  padding: 14px;
  border-radius: ${t.radiusMd};
  border: 1px solid rgba(96, 165, 250, 0.4);
  background: rgba(37, 99, 235, 0.08);
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const EditorHead = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

const WrittenCount = styled.span`
  font-size: 0.78rem;
  font-weight: 800;
  color: rgba(191, 219, 254, 0.95);
`;

const EmptyTasks = styled.p`
  margin: 0;
  font-size: 0.88rem;
  color: ${t.mutedSoft};
`;

const TaskEditor = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SavedTask = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: ${t.radiusMd};
  border: 1px solid ${t.border};
  background: ${t.panel2};
`;

const SavedLabel = styled.span`
  flex: 1;
  min-width: 0;
  font-size: 0.92rem;
  line-height: 1.4;
`;

const TaskInput = styled.input`
  ${fieldChrome}
  flex: 1;
  min-width: 0;
  padding: 8px 10px;
  background: ${t.panel};
`;

const IconButton = styled.button<{ $danger?: boolean }>`
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: 1px solid ${({ $danger }) => ($danger ? 'rgba(248, 113, 113, 0.35)' : t.borderStrong)};
  background: ${t.panel};
  color: ${({ $danger }) => ($danger ? '#fca5a5' : 'rgba(191, 219, 254, 0.95)')};
  cursor: pointer;

  &:hover {
    background: ${({ $danger }) => ($danger ? t.dangerSoft : 'rgba(59, 130, 246, 0.16)')};
  }
`;

const AddRow = styled.div`
  display: flex;
  gap: 8px;
`;

const AddInput = styled.input`
  ${fieldChrome}
  flex: 1;
  min-width: 0;
  padding: 12px 14px;
  background: rgba(15, 23, 42, 0.35);
`;

const AddButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  border: none;
  border-radius: ${t.radiusSm};
  background: #2563eb;
  color: white;
  font: inherit;
  font-size: 0.88rem;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background: #1d4ed8;
  }
`;

const GateShell = styled.div`
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  background: ${t.bg};
  color: ${t.text};
  font-family: ${t.font};
`;

const GateCard = styled.section`
  width: 100%;
  max-width: 460px;
  padding: 28px 24px;
  border-radius: ${t.radiusLg};
  border: 1px solid ${t.border};
  background: ${t.panel};
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const GateTitle = styled.h1`
  margin: 0;
  font-size: 1.8rem;
  font-weight: 800;
  letter-spacing: -0.03em;
`;

const GateCopy = styled.p`
  margin: 0;
  color: ${t.muted};
  font-size: 0.95rem;
  line-height: 1.55;
`;

const ErrorText = styled.p`
  margin: 0;
  color: ${t.danger};
  font-size: 0.88rem;
  font-weight: 700;
`;

const DoneMark = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: ${t.successSoft};
  color: ${t.success};
`;

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(2, 6, 23, 0.72);
`;

const Dialog = styled.div`
  width: 100%;
  max-width: 460px;
  padding: 22px;
  border-radius: ${t.radiusLg};
  border: 1px solid ${t.borderStrong};
  background: ${t.panel};
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
`;

const DialogTitle = styled.h2`
  margin: 0;
  font-size: 1.2rem;
  font-weight: 800;
`;

const DialogCopy = styled.p`
  margin: 0;
  color: ${t.muted};
  font-size: 0.92rem;
  line-height: 1.5;
`;

const StatusList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const StatusLine = styled.li`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
  font-weight: 700;
`;

const StatusWord = styled.span<{ $status: SectionStatus }>`
  margin-left: auto;
  font-size: 0.75rem;
  color: ${({ $status }) => STATUS_COLOR[$status]};
`;

const Warn = styled.p`
  margin: 0;
  padding: 10px 12px;
  border-radius: ${t.radiusSm};
  background: ${t.warnSoft};
  color: #fde68a;
  font-size: 0.84rem;
  font-weight: 700;
`;

const Ready = styled.p`
  margin: 0;
  padding: 10px 12px;
  border-radius: ${t.radiusSm};
  background: ${t.successSoft};
  color: #a7f3d0;
  font-size: 0.84rem;
  font-weight: 700;
`;

const DialogActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const GhostButton = styled.button`
  border-radius: 999px;
  border: 1px solid ${t.borderStrong};
  background: transparent;
  color: ${t.muted};
  font: inherit;
  font-size: 0.88rem;
  font-weight: 800;
  padding: 11px 16px;
  cursor: pointer;

  &:hover:not(:disabled) {
    color: ${t.text};
  }

  &:disabled {
    opacity: 0.7;
    cursor: default;
  }
`;
