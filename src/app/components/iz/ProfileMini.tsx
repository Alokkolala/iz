import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { MapPin, Camera, Footprints, Camera as Cam, Check, Users, Navigation, Activity } from "./Icons";
import { Card, Button, IconChip, Overline } from "./ui";
import { useI18n } from "./i18n";
import { LangSwitcher } from "./LangSwitcher";
import { useStore, relativeTime } from "./store";
import { useAuth } from "../../../lib/AuthProvider";
import {
  fetchProfile,
  updateProfileName,
  listIncomingInvites,
  respondInvite,
  deleteAccount,
  type CrewInvite,
} from "../../../lib/db";

const ease = [0.16, 1, 0.3, 1] as const;

export function ProfileMini({ onOpenAkimat }: { onOpenAkimat?: () => void } = {}) {
  const { t } = useI18n();
  const { name, setName, initialsOf, traces, shots, spots } = useStore();
  const { user, signOut, updatePassword } = useAuth();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  // Hydrate name from DB on mount; persist on save.
  useEffect(() => {
    let cancelled = false;
    if (!user) return;
    fetchProfile(user.id).then((p) => {
      if (!cancelled && p?.name && !name) {
        setName(p.name);
        setDraft(p.name);
      }
    }).catch(() => { /* ignore — keep localStorage value */ });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const saveName = async () => {
    const v = draft.trim();
    setName(v);
    setEditing(false);
    if (user) updateProfileName(user.id, v).catch(console.error);
  };

  const stats = [
    { label: t("traces"), value: String(traces.length), Icon: Footprints },
    { label: t("shots"), value: String(shots), Icon: Camera },
    { label: t("spots"), value: String(spots), Icon: MapPin },
  ];
  const allBadges = [
    { name: t("badge_creator"), Icon: Cam, earned: shots >= 3 },
  ];
  const badges = allBadges.filter((b) => b.earned);

  // ---- Pending invites ----
  const [invites, setInvites] = useState<CrewInvite[]>([]);
  useEffect(() => {
    if (!user?.email) return;
    listIncomingInvites(user.email).then(setInvites).catch(console.error);
  }, [user?.email]);
  const handleInvite = async (id: string, status: "accepted" | "declined") => {
    await respondInvite(id, status);
    setInvites((xs) => xs.filter((i) => i.id !== id));
  };

  // ---- Password change ----
  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwBusy, setPwBusy] = useState(false);
  const submitPw = async () => {
    if (pw.length < 6) { setPwMsg(t("pw_too_short")); return; }
    setPwBusy(true); setPwMsg(null);
    const { error } = await updatePassword(pw);
    setPwBusy(false);
    if (error) { setPwMsg(error); return; }
    setPw(""); setPwOpen(false); setPwMsg(t("pw_changed"));
    setTimeout(() => setPwMsg(null), 2200);
  };

  // ---- Delete account ----
  const [delConfirm, setDelConfirm] = useState(false);
  const [delBusy, setDelBusy] = useState(false);
  const [delErr, setDelErr] = useState<string | null>(null);
  const doDelete = async () => {
    setDelBusy(true); setDelErr(null);
    try { await deleteAccount(); }
    catch (e: any) { setDelErr(e?.message ?? "failed"); setDelBusy(false); }
  };

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto px-5 pb-28 pt-12">
      <div className="flex items-start justify-between">
        <div>
          <Overline>{t("profile_kicker")}</Overline>
          <h1 className="font-display" style={{ fontSize: 27, fontWeight: 700, color: "var(--iz-ink)" }}>{t("profile_title")}</h1>
        </div>
        <LangSwitcher />
      </div>

      {/* Identity */}
      <Card className="flex items-center gap-4 p-5">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full" style={{ background: "var(--iz-accent-soft)", color: "var(--iz-accent)", fontSize: 22, fontWeight: 700 }}>
          {name ? initialsOf(name) : "IZ"}
        </span>
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="flex gap-2">
              <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveName()} placeholder={t("your_name")} className="min-w-0 flex-1 px-3 py-2 focus:outline-none" style={{ background: "var(--iz-surface-2)", border: "1px solid var(--iz-border)", borderRadius: "var(--iz-r-md)", color: "var(--iz-ink)", fontSize: 15, fontWeight: 600 }} />
              <Button size="sm" onClick={saveName}><Check size={17} strokeWidth={2.6} /></Button>
            </div>
          ) : (
            <button onClick={() => { setDraft(name); setEditing(true); }} className="block text-left focus-visible:outline-none">
              <p style={{ fontSize: 19, fontWeight: 700, color: "var(--iz-ink)" }}>{name || t("tap_to_name")}</p>
              <p style={{ fontSize: 13, color: "var(--iz-ink-3)" }}>{t("explorer")}</p>
              {user?.email && (
                <p className="truncate" style={{ fontSize: 12, color: "var(--iz-ink-3)", marginTop: 2 }}>
                  {user.email}
                </p>
              )}
            </button>
          )}
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.4, ease }}>
            <Card className="flex flex-col items-center gap-2 p-3.5">
              <IconChip size={36}><s.Icon size={18} strokeWidth={2} /></IconChip>
              <p style={{ fontSize: 20, fontWeight: 700, color: "var(--iz-ink)", lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: 11, color: "var(--iz-ink-3)" }}>{s.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Pending invites */}
      {invites.length > 0 && (
        <div>
          <Overline className="mb-3">{t("pending_invites")}</Overline>
          <Card className="divide-y divide-[var(--iz-border)] px-4">
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 py-3">
                <IconChip size={36}><Users size={17} strokeWidth={2} /></IconChip>
                <div className="min-w-0 flex-1">
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--iz-ink)" }}>{t("invite_to_crew")}</p>
                  <p className="truncate" style={{ fontSize: 12, color: "var(--iz-ink-3)" }}>
                    {relativeTime(new Date(inv.created_at).getTime(), t("just_now"))}
                  </p>
                </div>
                <Button size="sm" onClick={() => handleInvite(inv.id, "accepted")}>{t("accept")}</Button>
                <Button size="sm" variant="ghost" onClick={() => handleInvite(inv.id, "declined")} style={{ color: "var(--iz-ink-3)" }}>{t("decline")}</Button>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* Earned badges */}
      <div>
        <Overline className="mb-3">{t("earned_badges")}</Overline>
        {badges.length === 0 ? (
          <Card inset className="px-4 py-4"><p style={{ fontSize: 13, color: "var(--iz-ink-3)" }}>{t("tap_progress")}</p></Card>
        ) : (
          <div className="flex flex-wrap gap-2">
            {badges.map((b) => (
              <span key={b.name} className="flex items-center gap-1.5 rounded-full px-3 py-2" style={{ background: "var(--iz-accent-soft)", color: "var(--iz-accent)", fontSize: 12, fontWeight: 600 }}>
                <b.Icon size={15} strokeWidth={2} /> {b.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Recent traces */}
      <div>
        <Overline className="mb-3">{t("recent_traces")}</Overline>
        {traces.length === 0 ? (
          <Card inset className="px-4 py-4"><p style={{ fontSize: 13, color: "var(--iz-ink-3)" }}>{t("empty_traces")}</p></Card>
        ) : (
          <Card className="divide-y divide-[var(--iz-border)] px-4">
            {traces.slice(0, 6).map((tr) => (
              <div key={tr.id} className="flex items-center gap-3 py-3">
                <IconChip size={36}><Footprints size={17} strokeWidth={2} /></IconChip>
                <div className="min-w-0 flex-1">
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--iz-ink)" }}>{tr.place}</p>
                  <p style={{ fontSize: 12, color: "var(--iz-ink-3)" }}>{relativeTime(tr.time, t("just_now"))}</p>
                </div>
              </div>
            ))}
          </Card>
        )}
      </div>

      {/* Akimat tourism analytics */}
      <div>
        <Overline className="mb-3">{t("akimat_kicker")}</Overline>
        <Card className="flex items-center gap-3 p-4" onClick={() => onOpenAkimat?.()}>
          <IconChip size={40} tone="accent"><Activity size={18} strokeWidth={2.2} /></IconChip>
          <div className="min-w-0 flex-1">
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--iz-ink)" }}>{t("akimat_open")}</p>
            <p className="truncate" style={{ fontSize: 12, color: "var(--iz-ink-3)" }}>{t("akimat_subtitle")}</p>
          </div>
        </Card>
      </div>

      {/* Security */}
      <div>
        <Overline className="mb-3">{t("security")}</Overline>
        {pwOpen ? (
          <Card className="space-y-2 p-4">
            <input
              type="password"
              autoFocus
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder={t("new_password")}
              autoComplete="new-password"
              minLength={6}
              className="w-full px-3 py-2 focus:outline-none"
              style={{ background: "var(--iz-surface-2)", border: "1px solid var(--iz-border)", borderRadius: "var(--iz-r-md)", color: "var(--iz-ink)", fontSize: 14 }}
            />
            {pwMsg && <p style={{ fontSize: 12, color: "var(--iz-ink-3)" }}>{pwMsg}</p>}
            <div className="flex gap-2">
              <Button size="sm" onClick={submitPw} disabled={pwBusy}>{pwBusy ? "…" : t("save")}</Button>
              <Button size="sm" variant="ghost" onClick={() => { setPwOpen(false); setPw(""); setPwMsg(null); }} style={{ color: "var(--iz-ink-3)" }}>{t("cancel")}</Button>
            </div>
          </Card>
        ) : (
          <>
            <Button variant="secondary" full onClick={() => setPwOpen(true)}>{t("change_password")}</Button>
            {pwMsg && !pwOpen && <p className="mt-2 text-center" style={{ fontSize: 12, color: "var(--iz-accent)" }}>{pwMsg}</p>}
          </>
        )}
      </div>

      {/* Danger zone */}
      <div>
        <Overline className="mb-3">{t("danger_zone")}</Overline>
        {delConfirm ? (
          <Card className="space-y-3 p-4" style={{ borderColor: "rgba(255,90,90,0.4)" }}>
            <p style={{ fontSize: 13, color: "var(--iz-ink-2)" }}>{t("delete_warning")}</p>
            {delErr && <p style={{ fontSize: 12, color: "#ff7a7a" }}>{delErr}</p>}
            <div className="flex gap-2">
              <Button size="sm" onClick={doDelete} disabled={delBusy} style={{ background: "#c43a3a", color: "white" }}>
                {delBusy ? "…" : t("delete_confirm")}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setDelConfirm(false); setDelErr(null); }} style={{ color: "var(--iz-ink-3)" }}>{t("cancel")}</Button>
            </div>
          </Card>
        ) : (
          <Button variant="ghost" full onClick={() => setDelConfirm(true)} style={{ color: "#ff7a7a" }}>
            {t("delete_account")}
          </Button>
        )}
      </div>

      <Button variant="ghost" full onClick={signOut} className="mt-2" style={{ color: "var(--iz-ink-3)" }}>
        <Navigation size={15} strokeWidth={2.2} /> {t("sign_out")}
      </Button>
    </div>
  );
}
