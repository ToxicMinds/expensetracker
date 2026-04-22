/**
 * RULES.JS
 * Smart categorization logic.
 */

function applySmartRules(text) {
  if (!text) return null;
  var t = text.toUpperCase();

  // 1. Hardcoded Smart Rules for Slovakia
  if (t.includes('ZĽAVA') || t.includes('ZLAVA') || t.includes('Z-BOTTLE') || t.includes('Z-FLASA')) {
    return 'Adjustment';
  }

  // 2. User Defined Rules
  if (typeof RULES !== 'undefined' && Array.isArray(RULES)) {
    for (var i = 0; i < RULES.length; i++) {
      if (t.indexOf(RULES[i].pattern.toUpperCase()) > -1) {
        return RULES[i].category;
      }
    }
  }
  return null;
}
