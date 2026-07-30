// Partner-referral trial extension. Kept deliberately tiny (one cookie, no
// DB column) — see the "toda feature grande nova entra aqui" note on
// organizations in schema.ts for why this doesn't get its own schema field.
export const REFERRAL_COOKIE = "kira_ref"
export const REFERRAL_COOKIE_MAX_AGE = 60 * 24 * 60 * 60 // 60 days

export const MANUAL_NF_REF = "manual-nf"
export const DEFAULT_TRIAL_DAYS = 7
export const MANUAL_NF_TRIAL_DAYS = 30

export function trialDaysFor(ref: string | undefined) {
  return ref === MANUAL_NF_REF ? MANUAL_NF_TRIAL_DAYS : DEFAULT_TRIAL_DAYS
}

export function trialEndsAtFor(ref: string | undefined) {
  return new Date(Date.now() + trialDaysFor(ref) * 24 * 60 * 60 * 1000)
}
