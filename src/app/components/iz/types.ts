export type TabId = "pulse" | "crew" | "lens" | "profile";

export type PlanAction = {
  kind: "plan";
  mood: string | null;
  origin: { lat: number; lon: number };
  blocks: { label: "sight" | "food" | "view"; items: any[] }[];
};
