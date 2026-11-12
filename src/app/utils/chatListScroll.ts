import { useCallback, useEffect, useRef, type RefObject, type UIEvent } from 'react';

/** Keep a chat transcript pinned to the latest message unless the user scrolls up. */
export function useChatListStickToBottom(
  listRef: RefObject<HTMLDivElement | null>,
  snapKey: string | number | boolean,
) {
  const stickToBottomRef = useRef(true);
  const readyForOlderRef = useRef(false);

  const resetStick = useCallback(() => {
    stickToBottomRef.current = true;
    readyForOlderRef.current = false;
  }, []);

  const snapToBottom = useCallback(() => {
    const el = listRef.current;
    if (!el || !stickToBottomRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [listRef]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const snap = () => snapToBottom();
    snap();
    let readyTimer = 0;
    const frame = requestAnimationFrame(() => {
      snap();
      readyTimer = window.setTimeout(() => {
        snap();
        readyForOlderRef.current = true;
      }, 300);
    });
    const onLoad = () => snap();
    el.addEventListener('load', onLoad, true);
    const observer = new MutationObserver(snap);
    observer.observe(el, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(readyTimer);
      el.removeEventListener('load', onLoad, true);
      observer.disconnect();
    };
  }, [listRef, snapKey, snapToBottom]);

  const onScroll = useCallback(
    (event: UIEvent<HTMLDivElement>, loadOlder: () => void) => {
      const el = event.currentTarget;
      stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 96;
      if (!readyForOlderRef.current) return;
      if (el.scrollTop < 80 && el.scrollHeight > el.clientHeight + 40) {
        loadOlder();
      }
    },
    [],
  );

  return { stickToBottomRef, resetStick, onScroll };
}
