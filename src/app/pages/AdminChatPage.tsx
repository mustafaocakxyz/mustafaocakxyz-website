import { Fragment, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { ArrowDownWideNarrow } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  chatAttachmentFileName,
  createChatAttachmentSignedUrl,
  ensureChatThread,
  fetchAdminChatInbox,
  fetchChatMessages,
  fetchOrgTasksForDates,
  markChatThreadRead,
  prefetchChatAttachmentUrls,
  sendChatAttachmentMessage,
  sendChatTextMessage,
  subscribeAdminChatInbox,
  subscribeChatMessages,
} from '../api/appData';
import { useAppAuth } from '../AppAuthContext';
import { preview as t } from '../preview/adminPreviewTheme';
import {
  ContentCard,
  ContentSub,
  ContentTitle,
  ErrorText,
  LoadingText,
  PreviewBody,
  PreviewFrame,
  PreviewShell,
  PreviewTopBar,
  SearchInput,
  SidebarTitle,
  StatusChip,
  TopBarActions,
  TopBarButton,
  TopBarEnd,
  TopBarTitle,
} from '../preview/AdminPreviewUi';
import type { AdminChatInboxItem, ChatMessage, ChatMessageType } from '../types';
import { getCachedChatSignedUrlSync } from '../utils/chatSignedUrlCache';
import { toDateKey } from '../utils/dates';
import { computeCompletionPercent } from '../utils/taskLabel';

const CHAT_STAGE_HEIGHT = 'calc(100dvh - 200px)';

const ChatLayout = styled.div`
  display: grid;
  grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);
  gap: 18px;
  align-items: stretch;
  height: ${CHAT_STAGE_HEIGHT};
  min-height: 420px;
  max-height: ${CHAT_STAGE_HEIGHT};
  overflow: hidden;

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
    height: auto;
    max-height: none;
    overflow: visible;
  }
`;

const ChatSidebar = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  min-height: 0;
  padding: 14px;
  border-radius: ${t.radiusLg};
  border: 1px solid ${t.border};
  background: ${t.panel};
  overflow: hidden;
  box-sizing: border-box;

  @media (max-width: 800px) {
    height: min(280px, 40vh);
  }
`;

const SearchRow = styled.div`
  display: flex;
  align-items: stretch;
  gap: 6px;
`;

const SearchField = styled(SearchInput)`
  flex: 1;
  min-width: 0;
`;

const SortToggleButton = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 38px;
  padding: 0;
  border-radius: ${t.radiusSm};
  border: 1px solid
    ${({ $active }) => ($active ? 'rgba(96, 165, 250, 0.55)' : t.border)};
  background: ${({ $active }) => ($active ? 'rgba(59, 130, 246, 0.14)' : t.panel2)};
  color: ${({ $active }) => ($active ? 'rgba(191, 219, 254, 0.98)' : t.muted)};
  cursor: pointer;
  box-shadow: ${({ $active }) =>
    $active ? '0 0 0 1px rgba(96, 165, 250, 0.2), 0 0 12px rgba(59, 130, 246, 0.18)' : 'none'};

  &:hover {
    border-color: rgba(96, 165, 250, 0.45);
    color: ${t.text};
  }
`;

const StudentList = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-right: 2px;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    width: 0;
    height: 0;
    display: none;
  }
`;

const InboxRow = styled.button<{ $selected: boolean }>`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px 10px;
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  border-radius: ${t.radiusMd};
  border: 1px solid ${({ $selected }) => ($selected ? 'rgba(96, 165, 250, 0.55)' : t.border)};
  background: ${({ $selected }) => ($selected ? 'rgba(59, 130, 246, 0.14)' : t.panel2)};
  color: inherit;
  font: inherit;
  cursor: pointer;
  box-shadow: ${({ $selected }) =>
    $selected ? '0 0 0 1px rgba(96, 165, 250, 0.2), 0 0 16px rgba(59, 130, 246, 0.22)' : 'none'};
  transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    border-color: rgba(96, 165, 250, 0.4);
  }
`;

const InboxMain = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const InboxTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const InboxNameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
`;

const InboxName = styled.span<{ $unread: boolean }>`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: ${({ $unread }) => ($unread ? 800 : 700)};
  font-size: 0.92rem;
  line-height: 1.3;
  color: ${t.text};
`;

const CompactStatusChip = styled(StatusChip)`
  flex-shrink: 0;
  padding: 2px 7px;
  font-size: 0.68rem;
`;

const InboxTime = styled.span<{ $unread: boolean }>`
  flex-shrink: 0;
  font-size: 0.72rem;
  font-weight: ${({ $unread }) => ($unread ? 700 : 500)};
  color: ${({ $unread }) => ($unread ? 'rgba(134, 239, 172, 0.95)' : t.mutedSoft)};
`;

const InboxBottom = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const InboxPreview = styled.span<{ $unread: boolean }>`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.78rem;
  line-height: 1.35;
  font-weight: ${({ $unread }) => ($unread ? 600 : 400)};
  color: ${({ $unread }) => ($unread ? t.text : t.muted)};
`;

const UnreadBadge = styled.span`
  flex-shrink: 0;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #25d366;
  color: #052e16;
  font-size: 0.7rem;
  font-weight: 800;
  line-height: 1;
`;

const ChatPanel = styled(ContentCard)`
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
  box-sizing: border-box;

  @media (max-width: 800px) {
    height: min(640px, calc(100dvh - 120px));
  }
`;

const ChatPanelHead = styled.div`
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const ChatPanelTitleRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
`;

const MessageList = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 8px 4px;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    width: 0;
    height: 0;
    display: none;
  }
`;

const DayDivider = styled.div`
  display: flex;
  align-items: center;
  align-self: stretch;
  gap: 12px;
  margin: 6px 0 2px;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(148, 163, 184, 0.22);
  }
`;

const DayDividerLabel = styled.span`
  flex-shrink: 0;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid ${t.border};
  background: rgba(15, 23, 42, 0.55);
  color: ${t.mutedSoft};
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  white-space: nowrap;
`;

const EmptyListHint = styled.p`
  margin: 8px 4px;
  font-size: 0.82rem;
  color: ${t.muted};
`;

const ComposerWrap = styled.div`
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Bubble = styled.div<{ $mine: boolean }>`
  align-self: ${({ $mine }) => ($mine ? 'flex-end' : 'flex-start')};
  max-width: min(80%, 480px);
  padding: 10px 14px;
  border-radius: ${t.radiusMd};
  border: 1px solid
    ${({ $mine }) => ($mine ? t.accentBorder : t.border)};
  background: ${({ $mine }) => ($mine ? t.accentSoft : t.panel2)};
  color: ${t.text};
  font-size: 0.92rem;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
`;

const Meta = styled.span`
  display: block;
  margin-top: 4px;
  font-size: 0.72rem;
  color: ${t.mutedSoft};
`;

const AttachmentImage = styled.img`
  display: block;
  max-width: 260px;
  max-height: 200px;
  border-radius: ${t.radiusSm};
  margin-bottom: 6px;
  cursor: pointer;
`;

const AttachmentLink = styled.a`
  display: inline-block;
  margin-bottom: 6px;
  color: rgba(191, 219, 254, 0.98);
  font-weight: 700;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const AttachRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const VoicePlayerRow = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
  min-width: 180px;
  padding: 8px 12px 8px 8px;
  border-radius: 999px;
  border: 1px solid ${t.borderStrong};
  background: ${t.panel2};
  color: ${t.text};
  font-family: inherit;
  cursor: pointer;
  text-align: left;

  &:hover {
    border-color: ${t.accentBorder};
  }
`;

const VoicePlayIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  background: linear-gradient(135deg, ${t.accent} 0%, #9d174d 100%);
  color: #fff;
  font-size: 0.85rem;
  flex-shrink: 0;
`;

const VoiceMeta = styled.span`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const VoiceTitle = styled.span`
  font-size: 0.84rem;
  font-weight: 700;
  color: ${t.text};
`;

const VoiceDuration = styled.span`
  font-size: 0.75rem;
  color: ${t.muted};
`;

const AttachButton = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid ${t.borderStrong};
  background: ${t.panel2};
  color: ${t.muted};
  font-size: 0.82rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;

  input {
    display: none;
  }

  &:hover {
    border-color: rgba(96, 165, 250, 0.5);
    color: ${t.text};
  }
`;

const VoiceButton = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid
    ${({ $active }) => ($active ? 'rgba(248, 113, 113, 0.7)' : t.borderStrong)};
  background: ${({ $active }) => ($active ? t.dangerSoft : t.panel2)};
  color: ${({ $active }) => ($active ? t.danger : t.muted)};
  font-size: 0.82rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Composer = styled.form`
  display: flex;
  gap: 10px;
  align-items: flex-end;
`;

const ComposerInput = styled.textarea`
  flex: 1;
  min-height: 48px;
  max-height: 120px;
  padding: 12px 14px;
  border-radius: ${t.radiusSm};
  border: 1px solid ${t.border};
  background: ${t.panel2};
  color: ${t.text};
  font-size: 0.92rem;
  font-family: inherit;
  resize: vertical;
  outline: none;

  &:focus {
    border-color: ${t.accentBorder};
  }

  &:disabled {
    opacity: 0.55;
  }
`;

const SendButton = styled.button`
  padding: 12px 18px;
  border-radius: 999px;
  border: 1px solid ${t.accentBorder};
  background: linear-gradient(135deg, ${t.accent} 0%, #9d174d 100%);
  color: white;
  font-weight: 800;
  font-family: inherit;
  cursor: pointer;
  box-shadow: 0 0 16px rgba(199, 44, 121, 0.28);

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

const EmptyChat = styled.p`
  margin: auto;
  color: ${t.mutedSoft};
  text-align: center;
`;

function formatClock(iso: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function messageDateKey(iso: string): string {
  return toDateKey(new Date(iso));
}

function formatChatDayLabel(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startMsg = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.round((startToday.getTime() - startMsg.getTime()) / 86400000);
  if (dayDiff === 0) return 'Bugün';
  if (dayDiff === 1) return 'Dün';
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: startMsg.getFullYear() === startToday.getFullYear() ? undefined : 'numeric',
  }).format(date);
}

type CompletionTone = 'ok' | 'warn' | 'bad' | 'muted';

function completionTone(percent: number | null): CompletionTone {
  if (percent === null) return 'muted';
  if (percent >= 100) return 'ok';
  if (percent >= 50) return 'warn';
  return 'bad';
}

function formatCompletionLabel(percent: number | null | undefined): string {
  if (percent === null || percent === undefined) return '—';
  return `${percent}%`;
}

function formatInboxTime(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startMsg = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.round((startToday.getTime() - startMsg.getTime()) / 86400000);
  if (dayDiff === 0) {
    return new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' }).format(date);
  }
  if (dayDiff === 1) return 'Dün';
  if (dayDiff < 7) {
    return new Intl.DateTimeFormat('tr-TR', { weekday: 'short' }).format(date);
  }
  return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' }).format(date);
}

function previewLabel(
  item: Pick<AdminChatInboxItem, 'lastMessagePreview' | 'lastMessageType' | 'lastSenderId'>,
  currentUserId: string,
): string {
  const raw = (item.lastMessagePreview ?? '').trim();
  if (!raw && !item.lastMessageType) return 'Henüz mesaj yok';
  const body =
    raw ||
    (item.lastMessageType === 'image'
      ? 'Fotoğraf'
      : item.lastMessageType === 'document'
        ? 'Belge'
        : item.lastMessageType === 'voice'
          ? 'Sesli mesaj'
          : item.lastMessageType === 'system'
            ? 'Sistem'
            : '');
  if (item.lastSenderId === currentUserId) return `Sen: ${body}`;
  return body;
}

function sortInbox(items: AdminChatInboxItem[]): AdminChatInboxItem[] {
  return [...items].sort((a, b) => {
    if (a.lastMessageAt && b.lastMessageAt) {
      if (a.lastMessageAt !== b.lastMessageAt) {
        return a.lastMessageAt < b.lastMessageAt ? 1 : -1;
      }
    } else if (a.lastMessageAt) {
      return -1;
    } else if (b.lastMessageAt) {
      return 1;
    }
    return a.studentName.localeCompare(b.studentName, 'tr');
  });
}

function completionSortKey(percent: number | null): number {
  if (percent === null) return -1;
  return percent;
}

function sortInboxByCompletion(
  items: AdminChatInboxItem[],
  todayPercentByStudent: Record<string, number | null>,
): AdminChatInboxItem[] {
  return [...items].sort((a, b) => {
    const keyDiff =
      completionSortKey(todayPercentByStudent[a.studentId] ?? null) -
      completionSortKey(todayPercentByStudent[b.studentId] ?? null);
    if (keyDiff !== 0) return keyDiff;
    return a.studentName.localeCompare(b.studentName, 'tr');
  });
}

function inboxPreviewFromMessage(
  message: ChatMessage,
  currentUserId: string,
): Pick<
  AdminChatInboxItem,
  'lastMessageAt' | 'lastMessagePreview' | 'lastMessageType' | 'lastSenderId'
> {
  const type: ChatMessageType = message.messageType;
  let preview = (message.body ?? '').trim();
  if (!preview) {
    if (type === 'image') preview = 'Fotoğraf';
    else if (type === 'document') preview = 'Belge';
    else if (type === 'voice') preview = 'Sesli mesaj';
    else if (type === 'system') preview = 'Sistem';
  } else if (preview.length > 120) {
    preview = preview.slice(0, 120);
  }
  return {
    lastMessageAt: message.createdAt,
    lastMessagePreview: preview,
    lastMessageType: type,
    lastSenderId: message.senderId ?? currentUserId,
  };
}

function formatAudioMs(ms: number): string {
  const totalSec = Math.max(0, Math.round(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, '0')}`;
}

function AdminVoicePlayer({ url }: { url: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [positionMs, setPositionMs] = useState(0);

  useEffect(() => {
    const audio = new Audio(url);
    audio.preload = 'metadata';
    audioRef.current = audio;

    const onLoaded = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDurationMs(audio.duration * 1000);
      }
    };
    const onTimeUpdate = () => setPositionMs(audio.currentTime * 1000);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      setPlaying(false);
      setPositionMs(0);
      audio.currentTime = 0;
    };

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('durationchange', onLoaded);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('durationchange', onLoaded);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audioRef.current = null;
    };
  }, [url]);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      if (audio.paused) {
        await audio.play();
      } else {
        audio.pause();
      }
    } catch {
      setPlaying(false);
    }
  };

  const durationLabel =
    durationMs != null
      ? `${formatAudioMs(positionMs)} / ${formatAudioMs(durationMs)}`
      : playing
        ? 'Oynatılıyor…'
        : 'Süre yükleniyor…';

  return (
    <VoicePlayerRow type="button" onClick={() => void toggle()}>
      <VoicePlayIcon aria-hidden>{playing ? '⏸' : '▶'}</VoicePlayIcon>
      <VoiceMeta>
        <VoiceTitle>Sesli mesaj</VoiceTitle>
        <VoiceDuration>{durationLabel}</VoiceDuration>
      </VoiceMeta>
    </VoicePlayerRow>
  );
}

function MessageAttachment({ message }: { message: ChatMessage }) {
  const [url, setUrl] = useState<string | null>(() =>
    message.attachmentPath ? getCachedChatSignedUrlSync(message.attachmentPath) : null,
  );

  useEffect(() => {
    if (!message.attachmentPath) return;
    const cached = getCachedChatSignedUrlSync(message.attachmentPath);
    if (cached) {
      setUrl(cached);
      return;
    }
    let mounted = true;
    void createChatAttachmentSignedUrl(message.attachmentPath)
      .then((signed) => {
        if (mounted) setUrl(signed);
      })
      .catch(() => {
        if (mounted) setUrl(null);
      });
    return () => {
      mounted = false;
    };
  }, [message.attachmentPath]);

  if (!message.attachmentPath) return null;
  if (!url) return <Meta>Ek yükleniyor…</Meta>;

  const fileName = chatAttachmentFileName(message.attachmentPath);

  if (message.messageType === 'image') {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        <AttachmentImage src={url} alt={fileName} loading="lazy" decoding="async" />
      </a>
    );
  }

  if (message.messageType === 'voice') {
    return <AdminVoicePlayer url={url} />;
  }

  return (
    <AttachmentLink href={url} target="_blank" rel="noopener noreferrer">
      📄 {fileName}
    </AttachmentLink>
  );
}

export function AdminChatPage() {
  const { user, isLoading } = useAppAuth();
  const [inbox, setInbox] = useState<AdminChatInboxItem[]>([]);
  const [studentQuery, setStudentQuery] = useState('');
  const [sortByCompletion, setSortByCompletion] = useState(false);
  const [todayPercentByStudent, setTodayPercentByStudent] = useState<Record<string, number | null>>(
    {},
  );
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [pageLoading, setPageLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const docInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaChunksRef = useRef<BlobPart[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const selectedStudentIdRef = useRef<string | null>(null);

  const todayKey = useMemo(() => toDateKey(new Date()), []);

  const filteredInbox = useMemo(() => {
    const q = studentQuery.trim().toLocaleLowerCase('tr');
    const items = q
      ? inbox.filter((item) => item.studentName.toLocaleLowerCase('tr').includes(q))
      : inbox;
    if (sortByCompletion) {
      return sortInboxByCompletion(items, todayPercentByStudent);
    }
    return items;
  }, [inbox, studentQuery, sortByCompletion, todayPercentByStudent]);

  useEffect(() => {
    selectedStudentIdRef.current = selectedStudentId;
  }, [selectedStudentId]);

  const patchInboxFromThread = (
    thread: {
      id: string;
      studentId: string;
      lastMessageAt: string | null;
      lastMessagePreview: string | null;
      lastMessageType: ChatMessageType | null;
      lastSenderId: string | null;
      adminUnreadCount: number;
    },
  ) => {
    setInbox((current) =>
      sortInbox(
        current.map((item) =>
          item.studentId === thread.studentId
            ? {
                ...item,
                threadId: thread.id,
                lastMessageAt: thread.lastMessageAt,
                lastMessagePreview: thread.lastMessagePreview,
                lastMessageType: thread.lastMessageType,
                lastSenderId: thread.lastSenderId,
                unreadCount:
                  selectedStudentIdRef.current === thread.studentId ? 0 : thread.adminUnreadCount,
              }
            : item,
        ),
      ),
    );
  };

  const patchInboxFromMessage = (message: ChatMessage, studentId: string, asRead: boolean) => {
    const preview = inboxPreviewFromMessage(message, user?.id ?? '');
    setInbox((current) =>
      sortInbox(
        current.map((item) => {
          if (item.studentId !== studentId) return item;
          return {
            ...item,
            threadId: message.threadId,
            ...preview,
            unreadCount: asRead ? 0 : item.unreadCount,
          };
        }),
      ),
    );
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    let mounted = true;
    setPageLoading(true);
    void (async () => {
      try {
        const [rows, orgTasks] = await Promise.all([
          fetchAdminChatInbox(),
          fetchOrgTasksForDates([todayKey]),
        ]);
        if (!mounted) return;
        setInbox(rows);
        const percents: Record<string, number | null> = {};
        for (const item of rows) {
          const todayTasks = orgTasks[item.studentId]?.[todayKey] ?? [];
          percents[item.studentId] =
            todayTasks.length === 0 ? null : (computeCompletionPercent(todayTasks) ?? 0);
        }
        setTodayPercentByStudent(percents);
      } catch {
        if (mounted) setError('Öğrenciler yüklenemedi.');
      } finally {
        if (mounted) setPageLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user, todayKey]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    return subscribeAdminChatInbox(user.organizationId, (thread) => {
      patchInboxFromThread(thread);
    });
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== 'admin' || !selectedStudentId) return;

    let mounted = true;
    let unsubscribe = () => {};

    setChatLoading(true);
    setError('');
    setMessages([]);
    setThreadId(null);

    void (async () => {
      try {
        const thread = await ensureChatThread(selectedStudentId);
        if (!mounted) return;
        setThreadId(thread.id);
        const rows = await fetchChatMessages(thread.id);
        if (!mounted) return;
        setMessages(rows);
        void prefetchChatAttachmentUrls(rows.map((row) => row.attachmentPath));

        try {
          const read = await markChatThreadRead(thread.id);
          if (mounted) patchInboxFromThread(read);
        } catch {
          setInbox((current) =>
            sortInbox(
              current.map((item) =>
                item.studentId === selectedStudentId ? { ...item, unreadCount: 0 } : item,
              ),
            ),
          );
        }

        unsubscribe = subscribeChatMessages(thread.id, (message) => {
          setMessages((current) => {
            if (current.some((entry) => entry.id === message.id)) return current;
            return [...current, message];
          });
          if (message.attachmentPath) {
            void prefetchChatAttachmentUrls([message.attachmentPath]);
          }
          if (selectedStudentIdRef.current === selectedStudentId) {
            patchInboxFromMessage(message, selectedStudentId, true);
            void markChatThreadRead(thread.id).then((read) => patchInboxFromThread(read));
          }
        });
      } catch {
        if (mounted) setError('Sohbet yüklenemedi. SQL migration çalıştırıldı mı?');
      } finally {
        if (mounted) setChatLoading(false);
      }
    })();

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [user, selectedStudentId]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, chatLoading]);

  if (isLoading) {
    return (
      <PreviewShell>
        <PreviewBody>
          <PreviewFrame>
            <LoadingText>Yükleniyor...</LoadingText>
          </PreviewFrame>
        </PreviewBody>
      </PreviewShell>
    );
  }

  if (!user) return <Navigate to="/app" replace />;
  if (user.role !== 'admin') return <Navigate to="/app/student" replace />;

  const selectedStudent = inbox.find((s) => s.studentId === selectedStudentId) ?? null;
  const selectedTodayPercent = selectedStudentId
    ? (todayPercentByStudent[selectedStudentId] ?? null)
    : null;

  const appendMessage = (message: ChatMessage) => {
    setMessages((current) => {
      if (current.some((entry) => entry.id === message.id)) return current;
      return [...current, message];
    });
    if (selectedStudentId) {
      patchInboxFromMessage(message, selectedStudentId, true);
    }
  };

  const handleSend = async (event: FormEvent) => {
    event.preventDefault();
    if (!threadId || !draft.trim() || sending) return;
    setSending(true);
    setError('');
    const text = draft;
    setDraft('');
    try {
      appendMessage(await sendChatTextMessage(threadId, user.id, text));
    } catch {
      setDraft(text);
      setError('Mesaj gönderilemedi.');
    } finally {
      setSending(false);
    }
  };

  const handleFile = async (file: File | undefined, messageType: 'image' | 'document') => {
    if (!file || !threadId || sending || recording) return;
    setSending(true);
    setError('');
    try {
      appendMessage(
        await sendChatAttachmentMessage({
          threadId,
          senderId: user.id,
          messageType,
          fileName: file.name,
          contentType: file.type || (messageType === 'image' ? 'image/jpeg' : 'application/pdf'),
          data: file,
          caption: draft.trim() || undefined,
        }),
      );
      setDraft('');
    } catch {
      setError(messageType === 'image' ? 'Görsel gönderilemedi.' : 'Belge gönderilemedi.');
    } finally {
      setSending(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
      if (docInputRef.current) docInputRef.current.value = '';
    }
  };

  const stopMediaTracks = () => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    mediaRecorderRef.current = null;
    mediaChunksRef.current = [];
  };

  const handleToggleVoice = async () => {
    if (!threadId || sending) return;

    if (!recording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        mediaChunksRef.current = [];
        const mimeType = MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/mp4')
            ? 'audio/mp4'
            : '';
        const recorder = mimeType
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) mediaChunksRef.current.push(event.data);
        };
        recorder.start();
        setRecording(true);
        setError('');
      } catch {
        setError('Mikrofon izni gerekli veya kayıt başlatılamadı.');
        stopMediaTracks();
      }
      return;
    }

    const recorder = mediaRecorderRef.current;
    if (!recorder) {
      setRecording(false);
      stopMediaTracks();
      return;
    }

    setRecording(false);
    setSending(true);
    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        recorder.onstop = () => {
          resolve(new Blob(mediaChunksRef.current, { type: recorder.mimeType || 'audio/webm' }));
        };
        recorder.onerror = () => reject(new Error('record failed'));
        recorder.stop();
      });
      stopMediaTracks();
      const contentType = blob.type || 'audio/webm';
      const ext = contentType.includes('mp4') ? 'm4a' : 'webm';
      appendMessage(
        await sendChatAttachmentMessage({
          threadId,
          senderId: user.id,
          messageType: 'voice',
          fileName: `voice-${Date.now()}.${ext}`,
          contentType,
          data: blob,
        }),
      );
    } catch {
      setError('Sesli mesaj gönderilemedi.');
      stopMediaTracks();
    } finally {
      setSending(false);
    }
  };

  return (
    <PreviewShell>
      <PreviewTopBar>
        <TopBarTitle>Sohbet</TopBarTitle>
        <TopBarActions>
          <TopBarButton as={Link} to="/app/admin">
            ← Admin paneline dön
          </TopBarButton>
        </TopBarActions>
        <TopBarEnd />
      </PreviewTopBar>

      <PreviewBody>
        <PreviewFrame>
          <ContentSub>
            Öğrencilerle birebir mesajlaş. Metin, görsel, belge ve ses desteklenir.
          </ContentSub>

          {error ? <ErrorText>{error}</ErrorText> : null}
          {pageLoading ? <LoadingText>Yükleniyor...</LoadingText> : null}

          <ChatLayout>
            <ChatSidebar>
              <SidebarTitle>Öğrenciler</SidebarTitle>
              <SearchRow>
                <SearchField
                  value={studentQuery}
                  onChange={(event) => setStudentQuery(event.target.value)}
                  placeholder="Öğrenci ara…"
                  aria-label="Öğrenci ara"
                />
                <SortToggleButton
                  type="button"
                  $active={sortByCompletion}
                  title={
                    sortByCompletion
                      ? 'Son mesaja göre sırala'
                      : 'Bugünkü tamamlamaya göre sırala (en düşük üstte)'
                  }
                  aria-label={
                    sortByCompletion
                      ? 'Son mesaja göre sırala'
                      : 'Bugünkü tamamlamaya göre sırala'
                  }
                  aria-pressed={sortByCompletion}
                  onClick={() => setSortByCompletion((current) => !current)}
                >
                  <ArrowDownWideNarrow size={16} strokeWidth={2.4} />
                </SortToggleButton>
              </SearchRow>
              <StudentList>
                {filteredInbox.map((item) => {
                  const unread = item.unreadCount > 0;
                  const todayPercent = todayPercentByStudent[item.studentId] ?? null;
                  return (
                    <InboxRow
                      key={item.studentId}
                      type="button"
                      $selected={item.studentId === selectedStudentId}
                      onClick={() => setSelectedStudentId(item.studentId)}
                    >
                      <InboxMain>
                        <InboxTop>
                          <InboxNameRow>
                            <InboxName $unread={unread}>{item.studentName}</InboxName>
                            <CompactStatusChip $tone={completionTone(todayPercent)}>
                              {formatCompletionLabel(todayPercent)}
                            </CompactStatusChip>
                          </InboxNameRow>
                          <InboxTime $unread={unread}>{formatInboxTime(item.lastMessageAt)}</InboxTime>
                        </InboxTop>
                        <InboxBottom>
                          <InboxPreview $unread={unread}>
                            {previewLabel(item, user.id)}
                          </InboxPreview>
                          {unread ? (
                            <UnreadBadge>
                              {item.unreadCount > 99 ? '99+' : item.unreadCount}
                            </UnreadBadge>
                          ) : null}
                        </InboxBottom>
                      </InboxMain>
                    </InboxRow>
                  );
                })}
                {!pageLoading && filteredInbox.length === 0 ? (
                  <EmptyListHint>
                    {studentQuery.trim() ? 'Eşleşen öğrenci yok.' : 'Öğrenci yok.'}
                  </EmptyListHint>
                ) : null}
              </StudentList>
            </ChatSidebar>

            <ChatPanel>
              <ChatPanelHead>
                <ChatPanelTitleRow>
                  <ContentTitle style={{ margin: 0 }}>
                    {selectedStudent?.studentName ?? 'Öğrenci seç'}
                  </ContentTitle>
                  {selectedStudent ? (
                    <StatusChip $tone={completionTone(selectedTodayPercent)}>
                      Bugün {formatCompletionLabel(selectedTodayPercent)}
                    </StatusChip>
                  ) : null}
                </ChatPanelTitleRow>
                {chatLoading ? <LoadingText>Sohbet yükleniyor...</LoadingText> : null}
              </ChatPanelHead>
              <MessageList ref={listRef}>
                {!chatLoading && messages.length === 0 ? (
                  <EmptyChat>Henüz mesaj yok. İlk mesajı sen yazabilirsin.</EmptyChat>
                ) : null}
                {messages.map((message, index) => {
                  const mine = message.senderId === user.id;
                  const prev = messages[index - 1];
                  const showDayDivider =
                    !prev || messageDateKey(prev.createdAt) !== messageDateKey(message.createdAt);
                  return (
                    <Fragment key={message.id}>
                      {showDayDivider ? (
                        <DayDivider>
                          <DayDividerLabel>{formatChatDayLabel(message.createdAt)}</DayDividerLabel>
                        </DayDivider>
                      ) : null}
                      <Bubble $mine={mine}>
                        <MessageAttachment message={message} />
                        {message.body ? message.body : null}
                        <Meta>{formatClock(message.createdAt)}</Meta>
                      </Bubble>
                    </Fragment>
                  );
                })}
              </MessageList>
              <ComposerWrap>
                <AttachRow>
                  <AttachButton>
                    Görsel
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      disabled={!threadId || sending || recording}
                      onChange={(event) =>
                        void handleFile(event.target.files?.[0], 'image')
                      }
                    />
                  </AttachButton>
                  <AttachButton>
                    Belge
                    <input
                      ref={docInputRef}
                      type="file"
                      accept=".pdf,.txt,.doc,.docx,application/pdf,text/plain"
                      disabled={!threadId || sending || recording}
                      onChange={(event) =>
                        void handleFile(event.target.files?.[0], 'document')
                      }
                    />
                  </AttachButton>
                  <VoiceButton
                    type="button"
                    $active={recording}
                    disabled={!threadId || sending}
                    onClick={() => void handleToggleVoice()}
                  >
                    {recording ? 'Durdur & gönder' : 'Ses'}
                  </VoiceButton>
                </AttachRow>
                <Composer onSubmit={(event) => void handleSend(event)}>
                  <ComposerInput
                    value={draft}
                    placeholder="Mesaj yaz..."
                    disabled={!threadId || sending}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        void handleSend(event as unknown as FormEvent);
                      }
                    }}
                  />
                  <SendButton type="submit" disabled={!threadId || sending || !draft.trim()}>
                    Gönder
                  </SendButton>
                </Composer>
              </ComposerWrap>
            </ChatPanel>
          </ChatLayout>
        </PreviewFrame>
      </PreviewBody>
    </PreviewShell>
  );
}
