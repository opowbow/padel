export interface RankingPreset {
  level: number;
  label: string;
  tag: string;
  badgeColor: string;
  description: string;
}

export const RANKING_PRESETS: RankingPreset[] = [
  {
    level: 1.0,
    label: 'Level 1.0 - Beginner Starter',
    tag: 'Beginner',
    badgeColor: 'bg-emerald-950 text-emerald-400 border-emerald-500/30',
    description: 'First time holding a padel racket, learning basic rules and simple forehands.',
  },
  {
    level: 2.0,
    label: 'Level 2.0 - Developing Rookie',
    tag: 'Rookie',
    badgeColor: 'bg-teal-950 text-teal-400 border-teal-500/30',
    description: 'Can sustain short baseline rallies; still hesitant when ball rebounds off back glass.',
  },
  {
    level: 2.5,
    label: 'Level 2.5 - Lower Intermediate',
    tag: 'Lower Int',
    badgeColor: 'bg-cyan-950 text-cyan-400 border-cyan-500/30',
    description: 'Reliable underhand serve; beginning to use basic bandeja and net positioning.',
  },
  {
    level: 3.0,
    label: 'Level 3.0 - Club Intermediate',
    tag: 'Intermediate',
    badgeColor: 'bg-sky-950 text-sky-400 border-sky-500/30',
    description: 'Good court awareness; consistently anticipates glass rebounds and volleys comfortably.',
  },
  {
    level: 3.5,
    label: 'Level 3.5 - Solid Intermediate',
    tag: 'Solid Int',
    badgeColor: 'bg-indigo-950 text-indigo-400 border-indigo-500/30',
    description: 'Consistent directional placement, comfortable with lobs and defensive wall returns.',
  },
  {
    level: 4.0,
    label: 'Level 4.0 - Upper Intermediate',
    tag: 'Upper Int',
    badgeColor: 'bg-purple-950 text-purple-400 border-purple-500/30',
    description: 'Fast-paced execution, accurate viboras, tactical court transitions, few unforced errors.',
  },
  {
    level: 4.5,
    label: 'Level 4.5 - Advanced Competitor',
    tag: 'Advanced',
    badgeColor: 'bg-amber-950 text-amber-400 border-amber-500/30',
    description: 'Tournament level. Powerful kick smash (x3 / por tres), aggressive chiquita, high tactical IQ.',
  },
  {
    level: 5.0,
    label: 'Level 5.0+ - Semi-Pro / Elite',
    tag: 'Elite Pro',
    badgeColor: 'bg-rose-950 text-rose-400 border-rose-500/30',
    description: 'National circuit / Premier competitive player with mastery across all offensive and defensive shots.',
  },
];

/**
 * Extracts a numeric rating score (e.g. 3.5) from either a preset or custom manual text ranking.
 * If user entered "Playtomic 3.8" or "Level 4.2", regex extracts 3.8 / 4.2.
 * If user entered purely text like "Beginner", maps to corresponding standard tier.
 */
export function parseRankingScore(text: string): number {
  if (!text) return 3.0;

  // Check for direct numeric match like 3.5 or 4.2
  const numMatch = text.match(/(\d+(\.\d+)?)/);
  if (numMatch) {
    const val = parseFloat(numMatch[1]);
    if (!isNaN(val) && val >= 1.0 && val <= 7.0) {
      return val;
    }
  }

  const lower = text.toLowerCase();
  if (lower.includes('elite') || lower.includes('pro')) return 5.0;
  if (lower.includes('advanced')) return 4.5;
  if (lower.includes('upper') || lower.includes('high')) return 4.0;
  if (lower.includes('solid') || lower.includes('medium-high')) return 3.5;
  if (lower.includes('intermediate') || lower.includes('mid')) return 3.0;
  if (lower.includes('lower') || lower.includes('novice')) return 2.5;
  if (lower.includes('beginner') || lower.includes('starter')) return 1.5;

  return 3.0; // Default club level
}

export function getRankingBadge(rankingScore: number, rankingText: string) {
  if (rankingScore >= 4.5) {
    return {
      label: rankingText || 'Advanced',
      badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
      pill: 'bg-amber-500',
    };
  }
  if (rankingScore >= 4.0) {
    return {
      label: rankingText || 'Upper Int',
      badgeColor: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
      pill: 'bg-purple-500',
    };
  }
  if (rankingScore >= 3.0) {
    return {
      label: rankingText || 'Intermediate',
      badgeColor: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
      pill: 'bg-sky-500',
    };
  }
  return {
    label: rankingText || 'Beginner',
    badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    pill: 'bg-emerald-500',
  };
}
