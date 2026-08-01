import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  chatAttachmentFileName,
  createChatAttachmentSignedUrl,
  ensureChatThread,
  fetchChatMessages,
  prefetchChatAttachmentUrls,
  sendChatAttachmentMessage,
  sendChatTextMessage,
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
  PreviewShell,
  PreviewTopBar,
  TopBarActions,
  TopBarButton,
  TopBarEnd,
  TopBarTitle,
} from '../preview/AdminPreviewUi';
import type { ChatMessage } from '../types';
import { getCachedChatSignedUrlSync } from '../utils/chatSignedUrlCache';

const CHAT_STAGE_HEIGHT = 'calc(100dvh - 180px)';

const StudentChatBody = styled.div`
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 0;
`;

const StudentChatFrame = styled.div`
  width: 100%;
  max-width: 720px;
  box-sizing: border-box;
  padding: 16px 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-height: 0;

  @media (min-width: 640px) {
    padding: 20px 24px 28px;
  }
`;

const ChatPanel = styled(ContentCard)`
  height: ${CHAT_STAGE_HEIGHT};
  min-height: 420px;
  max-height: ${CHAT_STAGE_HEIGHT};
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
  box-sizing: border-box;
`;

const ChatPanelHead = styled.div`
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
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
  border: 1px solid ${({ $mine }) => ($mine ? t.accentBorder : t.border)};
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

function formatAudioMs(ms: number): string {
  const totalSec = Math.max(0, Math.round(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, '0')}`;
}

function StudentVoicePlayer({ url }: { url: string }) {
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
    return <StudentVoicePlayer url={url} />;
  }

  return (
    <AttachmentLink href={url} target="_blank" rel="noopener noreferrer">
      📄 {fileName}
    </AttachmentLink>
  );
}

export function StudentChatPage() {
  const { user, isLoading } = useAppAuth();
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [chatLoading, setChatLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const docInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaChunksRef = useRef<BlobPart[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'student') return;

    let mounted = true;
    let unsubscribe = () => {};

    setChatLoading(true);
    setError('');
    setMessages([]);
    setThreadId(null);

    void (async () => {
      try {
        const thread = await ensureChatThread(user.id);
        if (!mounted) return;
        setThreadId(thread.id);
        const rows = await fetchChatMessages(thread.id);
        if (!mounted) return;
        setMessages(rows);
        void prefetchChatAttachmentUrls(rows.map((row) => row.attachmentPath));
        unsubscribe = subscribeChatMessages(thread.id, (message) => {
          setMessages((current) => {
            if (current.some((entry) => entry.id === message.id)) return current;
            return [...current, message];
          });
          if (message.attachmentPath) {
            void prefetchChatAttachmentUrls([message.attachmentPath]);
          }
        });
      } catch {
        if (mounted) setError('Sohbet yüklenemedi.');
      } finally {
        if (mounted) setChatLoading(false);
      }
    })();

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, chatLoading]);

  if (isLoading) {
    return (
      <PreviewShell>
        <StudentChatBody>
          <StudentChatFrame>
            <LoadingText>Yükleniyor...</LoadingText>
          </StudentChatFrame>
        </StudentChatBody>
      </PreviewShell>
    );
  }

  if (!user) return <Navigate to="/app" replace />;
  if (user.role !== 'student') return <Navigate to="/app/admin" replace />;

  const appendMessage = (message: ChatMessage) => {
    setMessages((current) => {
      if (current.some((entry) => entry.id === message.id)) return current;
      return [...current, message];
    });
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
          <TopBarButton as={Link} to="/app/student">
            ← Panele dön
          </TopBarButton>
        </TopBarActions>
        <TopBarEnd />
      </PreviewTopBar>

      <StudentChatBody>
        <StudentChatFrame>
          <ContentSub>Koçunla birebir mesajlaş. Metin, görsel, belge ve ses desteklenir.</ContentSub>
          {error ? <ErrorText>{error}</ErrorText> : null}

          <ChatPanel>
            <ChatPanelHead>
              <ContentTitle>Koç</ContentTitle>
              {chatLoading ? <LoadingText>Sohbet yükleniyor...</LoadingText> : null}
            </ChatPanelHead>
            <MessageList ref={listRef}>
              {!chatLoading && messages.length === 0 ? (
                <EmptyChat>Henüz mesaj yok. İlk mesajı sen yazabilirsin.</EmptyChat>
              ) : null}
              {messages.map((message) => {
                const mine = message.senderId === user.id;
                return (
                  <Bubble key={message.id} $mine={mine}>
                    <MessageAttachment message={message} />
                    {message.body ? message.body : null}
                    <Meta>{formatClock(message.createdAt)}</Meta>
                  </Bubble>
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
                    onChange={(event) => void handleFile(event.target.files?.[0], 'image')}
                  />
                </AttachButton>
                <AttachButton>
                  Belge
                  <input
                    ref={docInputRef}
                    type="file"
                    accept=".pdf,.txt,.doc,.docx,application/pdf,text/plain"
                    disabled={!threadId || sending || recording}
                    onChange={(event) => void handleFile(event.target.files?.[0], 'document')}
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
        </StudentChatFrame>
      </StudentChatBody>
    </PreviewShell>
  );
}
