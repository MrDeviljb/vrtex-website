export interface ScoringRuleConfig {
  placement: Record<string, number>;
  kill: number;
}

export const DEFAULT_SCORING_RULE: ScoringRuleConfig = {
  placement: {
    "1": 10,
    "2": 6,
    "3": 5,
    "4": 4,
    "5": 3,
    "6": 2,
    "7": 1,
    "8": 1,
    "9": 0,
    "10": 0,
  },
  kill: 1,
};

export function parseScoringRules(jsonStr?: string | null): ScoringRuleConfig {
  if (!jsonStr) return DEFAULT_SCORING_RULE;
  try {
    const parsed = JSON.parse(jsonStr);
    return {
      placement: parsed.placement || DEFAULT_SCORING_RULE.placement,
      kill: typeof parsed.kill === "number" ? parsed.kill : DEFAULT_SCORING_RULE.kill,
    };
  } catch {
    return DEFAULT_SCORING_RULE;
  }
}

export function calculatePoints(
  placement: number,
  kills: number,
  rules: ScoringRuleConfig
): { placementPoints: number; killPoints: number; totalPoints: number } {
  const placementPoints = rules.placement[String(placement)] ?? 0;
  const killPoints = Math.max(0, kills) * (rules.kill ?? 1);
  const totalPoints = placementPoints + killPoints;

  return {
    placementPoints,
    killPoints,
    totalPoints,
  };
}
