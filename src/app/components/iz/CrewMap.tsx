import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, ChevronUp, Navigation, Check, Users, ArrowRight } from "./Icons";
import { Card, Button, IconChip, Overline } from "./ui";
import { useI18n } from "./i18n";
import { LangSwitcher } from "./LangSwitcher";
import { useStore } from "./store";
import { sendInvite } from "../../../lib/db";
import { ProfileAvatar } from "./ProfileAvatar";
import type { TabId } from "./types";

const ease = [0.16, 1, 0.3, 1] as const;
const springSheet = { type: "spring" as const, stiffness: 320, damping: 32 };

const YOU = { x: 50, y: 40 };
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const distKm = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.round(Math.hypot(a.x - b.x, a.y - b.y) * 0.18 * 10) / 10;

type Pos = { x: number; y: number };

export function CrewMap({ onNavigate }: { onNavigate: (t: TabId) => void }) {
  const { t } = useI18n();
  const { crew, addMember, removeMember, meetPoint, setMeetPoint } = useStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(true);
  const [adding, setAdding] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [name, setName] = useState("");
  const [meetMode, setMeetMode] = useState(false);
  const [rallied, setRallied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [positions, setPositions] = useState<Record<string, Pos>>({});
  const mapRef = useRef<HTMLDivElement>(null);

  const crewRef = useRef(crew);
  const rallyRef = useRef(rallied);
  const meetRef = useRef(meetPoint);
  crewRef.current = crew;
  rallyRef.current = rallied;
  meetRef.current = meetPoint;

  useEffect(() => {
    setPositions((prev) => {
      const next: Record<string, Pos> = {};
      for (const m of crew) next[m.id] = prev[m.id] ?? { x: m.x, y: m.y };
      return next;
    });
  }, [crew]);

  useEffect(() => {
    if (!rallied) return;
    const id = setInterval(() => {
      setPositions((prev) => {
        const meet = meetRef.current;
        if (!meet) return prev;
        const next: Record<string, Pos> = { ...prev };
        for (const m of crewRef.current) {
          const cur = prev[m.id] ?? { x: m.x, y: m.y };
          next[m.id] = { x: cur.x + (meet.x - cur.x) * 0.3, y: cur.y + (meet.y - cur.y) * 0.3 };
        }
        return next;
      });
    }, 900);
    return () => clearInterval(id);
  }, [rallied]);

  const posOf = (id: string): Pos => positions[id] ?? { x: 50, y: 50 };
  const active = crew.find((f) => f.id === selected) ?? null;

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 1700); };

  const everyoneArrived = useMemo(() => {
    if (!rallied || !meetPoint || crew.length === 0) return false;
    return crew.every((m) => distKm(posOf(m.id), meetPoint) < 0.4);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rallied, meetPoint, positions, crew]);

  const onMapClick = (e: React.MouseEvent) => {
    if (!meetMode || !mapRef.current) return;
    const r = mapRef.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    setMeetPoint({ x: clamp(x, 4, 96), y: clamp(y, 8, 78) });
    setMeetMode(false);
    flash(t("meet_here"));
  };

  const submitAdd = () => {
    if (!name.trim()) return;
    addMember(name); setName(""); setAdding(false);
  };

  const submitInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) return;
    try {
      await sendInvite(email);
      setInviteEmail(""); setInviting(false);
      flash(t("invite_sent"));
    } catch (e: any) {
      flash(e?.message ?? "error");
    }
  };

  const toggleRally = () => {
    if (!meetPoint) { setMeetMode(true); return; }
    setRallied((r) => !r);
  };

  // member pin: vivid accent when selected, bright neutral otherwise (reads on the dark map)
  const pinBg = (isSel: boolean) => (isSel ? "var(--iz-accent)" : "var(--iz-ink)");
  const pinFg = (isSel: boolean) => (isSel ? "var(--iz-on-accent)" : "var(--iz-bg)");

  return (
    <div ref={mapRef} onClick={onMapClick} className="relative h-full w-full overflow-hidden" style={{ cursor: meetMode ? "crosshair" : "auto" }}>
      {/* subtle map grid over the fluid backdrop */}
      <svg className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <pattern id="iz-grid" width="38" height="38" patternUnits="userSpaceOnUse">
            <path d="M38 0H0V38" fill="none" stroke="var(--iz-border)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#iz-grid)" />
      </svg>

      {/* route lines */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        {active && <line x1={YOU.x} y1={YOU.y} x2={posOf(active.id).x} y2={posOf(active.id).y} stroke="var(--iz-accent)" strokeWidth="0.5" strokeDasharray="2 2" strokeLinecap="round" opacity="0.6" />}
        {rallied && meetPoint && crew.map((m) => (
          <line key={m.id} x1={posOf(m.id).x} y1={posOf(m.id).y} x2={meetPoint.x} y2={meetPoint.y} stroke="var(--iz-accent)" strokeWidth="0.5" strokeDasharray="2 2" strokeLinecap="round" opacity="0.5" />
        ))}
      </svg>

      <div className="pointer-events-none absolute left-5 right-5 top-12 z-10 flex items-start justify-between">
        <div>
          <Overline>{t("crew_kicker")}</Overline>
          <h1 className="font-display" style={{ fontSize: 26, fontWeight: 700, color: "var(--iz-ink)" }}>{t("crew_title")}</h1>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <LangSwitcher />
          <ProfileAvatar onClick={() => onNavigate("profile")} />
        </div>
      </div>

      {/* banners */}
      <AnimatePresence>
        {meetMode && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="absolute left-1/2 top-28 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2 backdrop-blur-xl" style={{ background: "var(--iz-glass-bg-strong)", border: "1px solid var(--iz-glass-border)", color: "var(--iz-ink)" }}>
            <MapPin size={15} strokeWidth={2.2} style={{ color: "var(--iz-accent)" }} /> <span style={{ fontSize: 13, fontWeight: 600 }}>{t("meet_mode")}</span>
          </motion.div>
        )}
        {rallied && meetPoint && !meetMode && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="absolute left-1/2 top-28 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2" style={{ background: "var(--iz-accent)", color: "var(--iz-on-accent)", boxShadow: "var(--iz-glow)" }}>
            <Navigation size={14} strokeWidth={2.3} /> <span style={{ fontSize: 13, fontWeight: 600 }}>{everyoneArrived ? t("arrived") : t("rallying")}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* You marker */}
      <div className="absolute z-20 -translate-x-1/2 -translate-y-1/2" style={{ left: `${YOU.x}%`, top: `${YOU.y}%` }}>
        <span className="absolute -inset-3.5 rounded-full" style={{ background: "var(--iz-accent)", opacity: 0.16, animation: "iz-pulse-ring 2.6s ease-out infinite" }} />
        <span className="relative block h-6 w-6 rounded-full" style={{ background: "var(--iz-accent)", border: "3px solid var(--iz-surface)", boxShadow: "var(--iz-shadow-sm)" }} />
        <span className="absolute left-1/2 top-[120%] -translate-x-1/2 rounded-full px-2 py-0.5" style={{ background: "var(--iz-surface)", border: "1px solid var(--iz-border)", color: "var(--iz-ink)", fontSize: 10, fontWeight: 600 }}>{t("you")}</span>
      </div>

      {/* meet point */}
      {meetPoint && (
        <motion.div initial={{ scale: 0, y: -16 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 320, damping: 22 }} className="absolute z-20 -translate-x-1/2 -translate-y-full" style={{ left: `${meetPoint.x}%`, top: `${meetPoint.y}%` }}>
          <div className="flex items-center gap-1 rounded-full px-2.5 py-1.5" style={{ background: "var(--iz-accent)", color: "var(--iz-on-accent)", boxShadow: "var(--iz-glow)" }}>
            <MapPin size={13} strokeWidth={2.4} /> <span style={{ fontSize: 11, fontWeight: 600 }}>{t("meet_here")}</span>
          </div>
        </motion.div>
      )}

      {/* Friend pins */}
      {crew.map((f) => {
        const p = posOf(f.id);
        const isSel = selected === f.id;
        return (
          <button
            key={f.id}
            onClick={(e) => { e.stopPropagation(); if (!meetMode) setSelected(isSel ? null : f.id); }}
            className="absolute z-20 -translate-x-1/2 -translate-y-1/2 focus-visible:outline-none"
            style={{ left: `${p.x}%`, top: `${p.y}%`, transition: "left 0.9s ease-in-out, top 0.9s ease-in-out" }}
            aria-label={f.name}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: pinBg(isSel), color: pinFg(isSel), border: "2px solid var(--iz-bg)", boxShadow: isSel ? "var(--iz-glow)" : "var(--iz-shadow-md)", fontSize: 13, fontWeight: 700 }}>
              {f.initials}
            </span>
            <AnimatePresence>
              {isSel && (
                <motion.span initial={{ opacity: 0, scale: 0.7, y: 4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.7, y: 4 }} className="absolute left-1/2 top-[120%] z-30 w-max -translate-x-1/2 rounded-xl px-3 py-1.5 text-center" style={{ background: "var(--iz-surface)", border: "1px solid var(--iz-border)", boxShadow: "var(--iz-shadow-md)" }}>
                  <span className="block" style={{ fontSize: 13, fontWeight: 600, color: "var(--iz-ink)" }}>{f.name}</span>
                  <span className="block" style={{ fontSize: 11, color: "var(--iz-ink-3)" }}>{distKm(YOU, p)} {t("km_away")}</span>
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        );
      })}

      {crew.length === 0 && (
        <div className="pointer-events-none absolute left-1/2 top-[58%] z-10 w-[78%] -translate-x-1/2 -translate-y-1/2 text-center">
          <p style={{ fontSize: 15, fontWeight: 600, color: "var(--iz-ink)" }}>{t("no_crew_title")}</p>
          <p style={{ fontSize: 13, color: "var(--iz-ink-3)", marginTop: 4 }}>{t("no_crew_sub")}</p>
        </div>
      )}

      <button onClick={() => { setSelected(null); setMeetMode(false); flash(t("recenter")); }} aria-label={t("recenter")} className="absolute right-5 top-28 z-20 flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-xl focus-visible:outline-none" style={{ background: "var(--iz-glass-bg-strong)", border: "1px solid var(--iz-glass-border)", boxShadow: "var(--iz-glass-hi)", color: "var(--iz-accent)" }}>
        <Navigation size={19} strokeWidth={2.1} />
      </button>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} className="absolute bottom-[340px] left-1/2 z-40 -translate-x-1/2">
            <div className="flex items-center gap-2 rounded-full px-4 py-2.5 backdrop-blur-xl" style={{ background: "var(--iz-glass-bg-strong)", border: "1px solid var(--iz-glass-border)", color: "var(--iz-ink)" }}>
              <Check size={15} strokeWidth={2.6} style={{ color: "var(--iz-accent)" }} /> <span style={{ fontSize: 13, fontWeight: 600 }}>{toast}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* sheet */}
      <motion.div className="absolute inset-x-0 bottom-0 z-30 px-3 pb-20" animate={{ y: sheetOpen ? 0 : 250 }} transition={springSheet} onClick={(e) => e.stopPropagation()}>
        <Card className="p-5">
          <button onClick={() => setSheetOpen((o) => !o)} className="mx-auto mb-3 flex w-full justify-center focus-visible:outline-none" aria-label="Toggle">
            <span className="h-1 w-10 rounded-full" style={{ background: "var(--iz-border-strong)" }} />
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--iz-ink)" }}>{t("crew_name")}</h2>
              <p style={{ fontSize: 13, color: "var(--iz-ink-3)" }}>{crew.length} {t("members")}</p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full px-3 py-1.5" style={{ background: "var(--iz-accent-soft)", color: "var(--iz-accent)", fontSize: 12, fontWeight: 600 }}>
              <Users size={14} strokeWidth={2} /> {crew.length}
            </span>
          </div>

          <AnimatePresence mode="wait">
            {active ? (
              <motion.div key={`detail-${active.id}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-3">
                <Card inset className="flex items-center gap-3 p-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full" style={{ background: "var(--iz-accent-soft)", color: "var(--iz-accent)", border: "1px solid rgba(46,230,201,0.3)", fontSize: 14, fontWeight: 700 }}>{active.initials}</span>
                  <div className="min-w-0 flex-1">
                    <p style={{ fontSize: 15, fontWeight: 600, color: "var(--iz-ink)" }}>{active.name}</p>
                    <p style={{ fontSize: 12, color: "var(--iz-ink-3)" }}>{distKm(YOU, posOf(active.id))} {t("km_away")}</p>
                  </div>
                </Card>
                <div className="mt-2.5 flex gap-2">
                  <Button size="sm" full onClick={() => flash(`${t("ping_sent")} ${active.name}`)}>
                    <Navigation size={15} strokeWidth={2.2} /> {t("ping")}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => { removeMember(active.id); setSelected(null); }} style={{ color: "var(--iz-ink-2)" }}>
                    {t("remove_friend")}
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-3">
                {crew.length === 0 ? (
                  <Card inset className="px-4 py-5 text-center">
                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--iz-ink)" }}>{t("no_crew_title")}</p>
                    <p style={{ fontSize: 12, color: "var(--iz-ink-3)", marginTop: 4 }}>{t("no_crew_sub")}</p>
                  </Card>
                ) : (
                  <>
                    <Overline className="mb-2">{t("crew_list")}</Overline>
                    <div className="flex max-h-[136px] flex-col gap-1.5 overflow-y-auto pr-1" style={{ scrollbarWidth: "none" }}>
                      {crew.map((m) => (
                        <button key={m.id} onClick={() => { setSelected(m.id); setSheetOpen(true); }} className="flex items-center gap-3 rounded-xl px-2.5 py-2 text-left focus-visible:outline-none" style={{ background: "var(--iz-surface-2)" }}>
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: "var(--iz-accent-soft)", color: "var(--iz-accent)", border: "1px solid rgba(46,230,201,0.3)", fontSize: 12, fontWeight: 700 }}>{m.initials}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block" style={{ fontSize: 14, fontWeight: 600, color: "var(--iz-ink)" }}>{m.name}</span>
                            <span className="block" style={{ fontSize: 11, color: "var(--iz-ink-3)" }}>{distKm(YOU, posOf(m.id))} {t("km_away")}</span>
                          </span>
                          <ChevronUp size={16} strokeWidth={2} style={{ color: "var(--iz-ink-3)", transform: "rotate(90deg)" }} />
                        </button>
                      ))}
                    </div>
                  </>
                )}

                <AnimatePresence mode="wait">
                  {adding ? (
                    <motion.div key="form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-2 flex gap-2 overflow-hidden">
                      <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitAdd()} placeholder={t("friend_name")} className="flex-1 px-3.5 py-2.5 focus:outline-none" style={{ background: "var(--iz-surface-2)", border: "1px solid var(--iz-border)", borderRadius: "var(--iz-r-md)", color: "var(--iz-ink)", fontSize: 14 }} />
                      <Button size="sm" onClick={submitAdd}><Check size={17} strokeWidth={2.6} /></Button>
                    </motion.div>
                  ) : (
                    <button key="addbtn" onClick={() => setAdding(true)} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 focus-visible:outline-none" style={{ background: crew.length === 0 ? "var(--iz-accent)" : "var(--iz-glass-bg-strong)", color: crew.length === 0 ? "var(--iz-on-accent)" : "var(--iz-ink-2)", border: crew.length === 0 ? "none" : "1px solid var(--iz-glass-border)", fontSize: 13, fontWeight: 600, boxShadow: crew.length === 0 ? "var(--iz-glow)" : "none" }}>
                      <span style={{ fontSize: 17, lineHeight: 1 }}>+</span> {t("add_friend")}
                    </button>
                  )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  {inviting ? (
                    <motion.div key="invform" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-2 flex gap-2 overflow-hidden">
                      <input autoFocus type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitInvite()} placeholder={t("invitee_email")} className="flex-1 px-3.5 py-2.5 focus:outline-none" style={{ background: "var(--iz-surface-2)", border: "1px solid var(--iz-border)", borderRadius: "var(--iz-r-md)", color: "var(--iz-ink)", fontSize: 14 }} />
                      <Button size="sm" onClick={submitInvite}><Check size={17} strokeWidth={2.6} /></Button>
                    </motion.div>
                  ) : (
                    <button key="invbtn" onClick={() => setInviting(true)} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 focus-visible:outline-none" style={{ background: "var(--iz-glass-bg-strong)", color: "var(--iz-ink-2)", border: "1px solid var(--iz-glass-border)", fontSize: 13, fontWeight: 600 }}>
                      <Users size={14} strokeWidth={2.2} /> {t("invite_by_email")}
                    </button>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-4 flex gap-2">
            <Button variant="secondary" full size="sm" onClick={() => { if (meetPoint) { setMeetPoint(null); setRallied(false); } setMeetMode((m) => !m); }} className="py-3" style={{ color: meetMode ? "var(--iz-accent)" : "var(--iz-ink)" }}>
              {meetMode ? <ArrowRight size={16} strokeWidth={2.2} /> : <MapPin size={16} strokeWidth={2.2} />}
              {meetMode ? t("cancel") : t("set_meet")}
            </Button>
            <Button full size="sm" disabled={crew.length === 0} onClick={toggleRally} variant={rallied ? "secondary" : "primary"} className="py-3" style={rallied ? { color: "var(--iz-ink)" } : undefined}>
              <Navigation size={16} strokeWidth={2.2} /> {rallied ? t("stop_rally") : t("rally_crew")}
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
