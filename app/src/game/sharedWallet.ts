const GOLD_KEY = 'terrakand_gold';

export function getSharedGold(): number {
  try {
    const raw = localStorage.getItem(GOLD_KEY);
    if (raw) return Math.max(0, parseInt(raw, 10) || 0);
  } catch {
    // ignore
  }
  return 75; // default starting gold
}

export function addSharedGold(amount: number): number {
  const next = Math.max(0, getSharedGold() + amount);
  localStorage.setItem(GOLD_KEY, String(next));
  return next;
}

export function setSharedGold(amount: number): number {
  const next = Math.max(0, amount);
  localStorage.setItem(GOLD_KEY, String(next));
  return next;
}
