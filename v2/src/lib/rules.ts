export interface SmartRule {
  id: string;
  pattern: string;
  category: string;
}

/**
 * Applies smart categorization rules to a given text (e.g., merchant name or item name).
 * @param text The text to analyze.
 * @param userRules Optional array of user-defined rules.
 * @returns The suggested category or null if no rule matches.
 */
export function applySmartRules(text: string, userRules: SmartRule[] = []): string | null {
  if (!text) return null;
  const t = text.toUpperCase();

  // 1. Hardcoded Smart Rules for Slovakia (Global context)
  if (
    t.includes('ZĽAVA') || 
    t.includes('ZLAVA') || 
    t.includes('Z-BOTTLE') || 
    t.includes('Z-FLASA') ||
    t.includes('VRATNA FLASA')
  ) {
    return 'Adjustment';
  }

  // 2. User Defined Rules
  for (const rule of userRules) {
    if (t.includes(rule.pattern.toUpperCase())) {
      return rule.category;
    }
  }

  return null;
}
