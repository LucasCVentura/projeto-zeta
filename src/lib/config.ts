export const PLAN_PRICE_BRL = "R$49,90"
export const PLAN_NAME = "Kira Pro"

/**
 * Preço do plano em centavos — fonte única pro cálculo de MRR no /admin.
 * Antes o valor vivia cravado no meio da action, então um reajuste faria o
 * MRR mentir em silêncio. Mantenha em sincronia com PLAN_PRICE_BRL acima.
 */
export const PLAN_PRICE_CENTS = 4990

/** Taxa da Stripe por cobrança: percentual + fixo em centavos. */
export const STRIPE_FEE_PERCENT = 0.0399
export const STRIPE_FEE_FIXED_CENTS = 39

/** Quanto sobra de uma mensalidade depois da Stripe. */
export function netPerSubscriptionCents(): number {
  return PLAN_PRICE_CENTS - Math.round(PLAN_PRICE_CENTS * STRIPE_FEE_PERCENT) - STRIPE_FEE_FIXED_CENTS
}
