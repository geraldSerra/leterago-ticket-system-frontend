import { Fragment, useEffect, useRef, useState, useCallback } from "react";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { api, type ServerComment } from "../../api/client";
import { useCurrentUser } from "../../store/hooks";
import { getInitials } from "../../lib/initials";

const AVATAR_COLORS = [
  "bg-[#0047AC]", "bg-emerald-500", "bg-violet-500",
  "bg-amber-500", "bg-rose-500", "bg-cyan-600", "bg-slate-500",
];

function avatarColor(userId: string): string {
  const hash = userId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" });
}

function dateSeparatorLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const same = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (same(d, today)) return "Hoy";
  if (same(d, yesterday)) return "Ayer";
  return d.toLocaleDateString("es-EC", { day: "numeric", month: "long", year: "numeric" });
}

function isSameDay(a: string, b: string): boolean {
  const da = new Date(a), db = new Date(b);
  return da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate();
}

function Avatar({ name, userId, size = "md" }: { name: string; userId: string; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "w-7 h-7 text-[10px]" : "w-8 h-8 text-xs";
  return (
    <div className={`${cls} rounded-full flex items-center justify-center text-white font-bold shrink-0 ${avatarColor(userId)}`}>
      {getInitials(name)}
    </div>
  );
}

export default function TicketComments({ ticketId }: { ticketId: string }) {
  const currentUser = useCurrentUser();
  const [comments, setComments] = useState<ServerComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.listComments(currentUser.id, ticketId);
      setComments(data);
    } finally {
      setLoading(false);
    }
  }, [currentUser.id, ticketId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const autoResize = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  };

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const comment = await api.createComment(currentUser.id, ticketId, body);
      setComments((prev) => [...prev, comment]);
      setText("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-300 flex flex-col">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-gray-100">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
          <MessageSquare size={12} />
          Comentarios
          {comments.length > 0 && (
            <span className="text-[10px] font-semibold text-gray-400 normal-case tracking-normal">
              ({comments.length})
            </span>
          )}
        </p>
      </div>

      {/* Messages */}
      <div className="px-4 py-2 flex flex-col gap-1">
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-4">
            <Loader2 size={16} className="animate-spin text-gray-300" />
          </div>
        ) : comments.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-4 gap-1.5 text-gray-300">
            <MessageSquare size={20} strokeWidth={1.5} />
            <p className="text-xs">Sin comentarios aún</p>
          </div>
        ) : (
          <>
            {comments.map((comment, idx) => {
              const isOwn = comment.userId === currentUser.id;
              const prev = comments[idx - 1];
              const next = comments[idx + 1];

              const showDateSep = !prev || !isSameDay(prev.createdAt, comment.createdAt);
              const isFirstInGroup = !prev || prev.userId !== comment.userId || showDateSep;
              const isLastInGroup = !next || next.userId !== comment.userId || !isSameDay(comment.createdAt, next.createdAt);

              return (
                <Fragment key={comment.id}>
                  {showDateSep && (
                    <div className="flex items-center gap-3 my-3">
                      <div className="flex-1 h-px bg-gray-100" />
                      <span className="text-[11px] text-gray-400 font-medium shrink-0">
                        {dateSeparatorLabel(comment.createdAt)}
                      </span>
                      <div className="flex-1 h-px bg-gray-100" />
                    </div>
                  )}

                  <div className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"} ${isLastInGroup ? "mb-2" : "mb-0.5"}`}>
                    {/* Avatar placeholder to maintain alignment */}
                    <div className="w-8 shrink-0">
                      {!isOwn && isLastInGroup && (
                        <Avatar name={comment.user.name} userId={comment.userId} />
                      )}
                    </div>

                    <div className={`flex flex-col max-w-[72%] ${isOwn ? "items-end" : "items-start"}`}>
                      {/* Name above first bubble in group */}
                      {!isOwn && isFirstInGroup && (
                        <span className="text-[11px] font-semibold text-gray-500 ml-1 mb-0.5">
                          {comment.user.name}
                        </span>
                      )}

                      <div
                        className={`px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words
                          ${isOwn
                            ? "bg-[#0047AC] text-white rounded-2xl rounded-br-sm"
                            : "bg-gray-100 text-gray-800 rounded-2xl rounded-bl-sm"
                          }`}
                      >
                        {comment.body}
                      </div>

                      {/* Time below last bubble in group */}
                      {isLastInGroup && (
                        <span className={`text-[10px] text-gray-400 mt-0.5 ${isOwn ? "mr-1" : "ml-1"}`}>
                          {formatTime(comment.createdAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </Fragment>
              );
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 px-4 py-3">
        <div className="flex items-end gap-2.5">
          <Avatar name={currentUser.name} userId={currentUser.id} size="sm" />
          <div className="flex-1 flex items-end gap-2 bg-gray-50 border border-gray-300 rounded-2xl px-3.5 py-2 focus-within:border-[#0047AC] transition-colors">
            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={(e) => { setText(e.target.value); autoResize(); }}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un comentario…"
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none resize-none leading-relaxed"
              style={{ height: "auto" }}
            />
            <button
              onClick={send}
              disabled={!text.trim() || sending}
              className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors
                disabled:text-gray-300 enabled:text-[#0047AC] enabled:hover:bg-blue-50"
            >
              {sending
                ? <Loader2 size={15} className="animate-spin" />
                : <Send size={15} />
              }
            </button>
          </div>
        </div>
        <p className="text-[10px] text-gray-300 mt-1.5 ml-10">Enter para enviar · Shift+Enter para nueva línea</p>
      </div>
    </div>
  );
}
