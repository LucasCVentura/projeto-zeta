// Fonte única de normalização de telefone brasileiro.
//
// A regra é sempre por TAMANHO, nunca por prefixo "55": DDD 55 (Santa Maria/RS)
// é real e colide com o código do país. Um `startsWith("55")` ingênuo ou arranca
// o DDD junto do DDI, ou deixa de pôr o DDI num número local — os dois erros já
// aconteceram em produção.
//
// Formatos aceitos:
//   10 dígitos → DDD + fixo          (ex: 1132210708)
//   11 dígitos → DDD + celular       (ex: 11947070812)
//   12/13 dígitos começando com 55   → os mesmos, já com DDI

const COUNTRY_CODE = "55"

export function onlyDigits(value: string): string {
  return (value ?? "").replace(/\D/g, "")
}

/** Número local (10 ou 11 dígitos, sem DDI). `null` se não der pra interpretar. */
export function toLocalDigits(value: string): string | null {
  const digits = onlyDigits(value)
  if (digits.length === 10 || digits.length === 11) return digits
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith(COUNTRY_CODE)) {
    return digits.slice(2)
  }
  return null
}

/** Destino pro WhatsApp/Gupshup: DDI + DDD + número. `null` se inválido. */
export function toWhatsAppDestination(value: string): string | null {
  const local = toLocalDigits(value)
  return local ? `${COUNTRY_CODE}${local}` : null
}

/**
 * Formas plausíveis do mesmo número, pra casar contra telefone salvo em
 * qualquer formato — o painel salva local (`11947070812`), mas import de CSV
 * e o webhook trazem com DDI (`5511947070812`).
 */
export function phoneMatchCandidates(value: string): string[] {
  const local = toLocalDigits(value)
  if (!local) {
    const digits = onlyDigits(value)
    return digits ? [digits] : []
  }
  return [local, `${COUNTRY_CODE}${local}`]
}

/**
 * Exibição: `(XX) XXXXX-XXXX`. Devolve a entrada intacta se não der pra
 * interpretar, pra nunca mostrar um número mutilado na tela.
 */
export function formatPhoneDisplay(value: string): string {
  const local = toLocalDigits(value)
  if (!local) return value
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`
  return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`
}

/**
 * Mask de digitação: `(XX) XXXXX-XXXX`.
 *
 * Tira o DDI *antes* de truncar — colar um número que já vem com +55 costumava
 * empurrar o código do país pra posição do DDD e descartar os últimos dígitos
 * em silêncio (o número virava um "DDD 55" que não existe).
 */
export function maskPhoneInput(value: string): string {
  // Durante a digitação o valor ainda não é interpretável (1, 2, 3… dígitos),
  // então cai no corte simples até formar um número reconhecível.
  const digits = toLocalDigits(value) ?? onlyDigits(value).slice(0, 11)
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim()
  }
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim()
}
