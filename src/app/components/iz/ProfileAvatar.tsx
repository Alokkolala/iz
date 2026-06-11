import { useStore } from "./store";

interface Props {
  onClick: () => void;
}

export function ProfileAvatar({ onClick }: Props) {
  const { name, initialsOf } = useStore();
  return (
    <button
      onClick={onClick}
      aria-label="Open profile"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full focus-visible:outline-none"
      style={{
        background: "var(--iz-accent-soft)",
        color: "var(--iz-accent)",
        border: "1px solid var(--iz-glass-border)",
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      {name ? initialsOf(name) : "IZ"}
    </button>
  );
}
