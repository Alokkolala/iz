import { useState } from "react";
import { motion } from "motion/react";
import { MapPin, Camera, Footprints, Camera as Cam, Check } from "./Icons";
import { Card, Button, IconChip, Overline } from "./ui";
import { useI18n } from "./i18n";
import { LangSwitcher } from "./LangSwitcher";
import { useStore, relativeTime } from "./store";
import { useAuth } from "../../../lib/AuthProvider";

const ease = [0.16, 1, 0.3, 1] as const;

export function ProfileMini() {
  const { t } = useI18n();
  const { name, setName, initialsOf, traces, shots, spots } = useStore();
  const { user, signOut } = useAuth();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  const saveName = () => { setName(draft.trim()); setEditing(false); };

  const stats = [
    { label: t("traces"), value: String(traces.length), Icon: Footprints },
    { label: t("shots"), value: String(shots), Icon: Camera },
    { label: t("spots"), value: String(spots), Icon: MapPin },
  ];
  const allBadges = [
    { name: t("badge_creator"), Icon: Cam, earned: shots >= 3 },
  ];
  const badges = allBadges.filter((b) => b.earned);

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

      {/* Sign out */}
      <Button
        variant="ghost"
        onClick={signOut}
        className="mt-2 w-full"
        style={{ color: "var(--iz-ink-3)" }}
      >
        {t("sign_out")}
      </Button>
    </div>
  );
}
