/**
 * Subscription Renewal Notification Scheduler for POS
 * Rules:
 * - 10 days left: Show notification once a day
 * - 5 days left: Show notification once a day
 * - 3 days left and onwards (<= 3 days, including expired): Show notification up to 3 times a day
 */

const STORAGE_KEY_PREFIX = "retrod:pos_subscription_renewal_notice:";

export interface SubscriptionRenewalNotice {
  daysLeft: number;
  expiryDateStr: string;
  isExpired: boolean;
  shouldNotify: boolean;
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
}

export function checkSubscriptionRenewalNotice(
  expiryDateStr?: string | null,
  nowDate: Date = new Date()
): SubscriptionRenewalNotice | null {
  if (!expiryDateStr) return null;

  const cleanStr = expiryDateStr.trim().split("T")[0];
  const [y, m, d] = cleanStr.split("-").map(Number);
  if (!y || !m || !d) return null;

  const expiryDate = new Date(y, m - 1, d, 23, 59, 59, 999);
  const diffMs = expiryDate.getTime() - nowDate.getTime();
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const isExpired = daysLeft <= 0;

  let maxNotificationsPerDay = 0;
  let severity: "info" | "warning" | "critical" = "info";
  let title = "";
  let message = "";

  if (isExpired) {
    maxNotificationsPerDay = 3;
    severity = "critical";
    title = "Subscription Expired";
    message = `Your Retrod POS subscription expired on ${cleanStr}. Please renew your plan immediately to maintain uninterrupted access.`;
  } else if (daysLeft <= 3) {
    maxNotificationsPerDay = 3;
    severity = "critical";
    title = daysLeft === 1 ? "POS Subscription Expires Tomorrow!" : `POS Subscription Expires in ${daysLeft} Days!`;
    message = `Action required: Your Retrod subscription ends on ${cleanStr}. Please renew today to prevent billing and order disruption.`;
  } else if (daysLeft === 5) {
    maxNotificationsPerDay = 1;
    severity = "warning";
    title = "Subscription Renewal Due in 5 Days";
    message = `Reminder: Your Retrod subscription will expire on ${cleanStr}. Renew early to keep services running smoothly.`;
  } else if (daysLeft === 10) {
    maxNotificationsPerDay = 1;
    severity = "info";
    title = "Subscription Renewal Due in 10 Days";
    message = `Heads up: Your Retrod subscription renewal is coming up on ${cleanStr}.`;
  } else {
    return null;
  }

  const todayKey = `${STORAGE_KEY_PREFIX}${nowDate.toISOString().split("T")[0]}`;
  let countToday = 0;
  try {
    const raw = localStorage.getItem(todayKey);
    countToday = raw ? parseInt(raw, 10) || 0 : 0;
  } catch {}

  const shouldNotify = countToday < maxNotificationsPerDay;

  return {
    daysLeft,
    expiryDateStr: cleanStr,
    isExpired,
    shouldNotify,
    title,
    message,
    severity,
  };
}

export function recordSubscriptionNoticeShown(nowDate: Date = new Date()): void {
  const todayKey = `${STORAGE_KEY_PREFIX}${nowDate.toISOString().split("T")[0]}`;
  try {
    const raw = localStorage.getItem(todayKey);
    const countToday = raw ? parseInt(raw, 10) || 0 : 0;
    localStorage.setItem(todayKey, String(countToday + 1));
  } catch {}
}
