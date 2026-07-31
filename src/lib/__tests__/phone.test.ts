import { describe, it, expect } from "vitest"
import {
  onlyDigits,
  toLocalDigits,
  toWhatsAppDestination,
  phoneMatchCandidates,
  maskPhoneInput,
  formatPhoneDisplay,
} from "../phone"

describe("onlyDigits", () => {
  it("tira máscara e espaços", () => {
    expect(onlyDigits("(11) 94707-0812")).toBe("11947070812")
    expect(onlyDigits("+55 11 94707-0812")).toBe("5511947070812")
  })

  it("aguenta string vazia", () => {
    expect(onlyDigits("")).toBe("")
  })
})

describe("toLocalDigits", () => {
  it("mantém número local de 10 e 11 dígitos", () => {
    expect(toLocalDigits("(11) 3221-0708")).toBe("1132210708")
    expect(toLocalDigits("(11) 94707-0812")).toBe("11947070812")
  })

  it("tira o DDI quando vem com 12 ou 13 dígitos", () => {
    expect(toLocalDigits("551132210708")).toBe("1132210708")
    expect(toLocalDigits("+55 11 94707-0812")).toBe("11947070812")
  })

  // DDD 55 (Santa Maria/RS) colide com o código do país — decidir por prefixo
  // em vez de tamanho arrancava o DDD junto.
  it("preserva DDD 55 legítimo", () => {
    expect(toLocalDigits("(55) 99147-0708")).toBe("55991470708")
    expect(toLocalDigits("(55) 3221-0708")).toBe("5532210708")
  })

  it("tira o DDI de um DDD 55 que já veio completo", () => {
    expect(toLocalDigits("5555991470708")).toBe("55991470708")
  })

  it("devolve null pra tamanho fora do padrão", () => {
    expect(toLocalDigits("")).toBeNull()
    expect(toLocalDigits("119470")).toBeNull()
    expect(toLocalDigits("11947070812345")).toBeNull()
  })

  it("devolve null pra 12/13 dígitos que não começam com 55", () => {
    expect(toLocalDigits("119470708123")).toBeNull()
  })
})

describe("toWhatsAppDestination", () => {
  it("monta DDI + local", () => {
    expect(toWhatsAppDestination("(11) 94707-0812")).toBe("5511947070812")
    expect(toWhatsAppDestination("(11) 3221-0708")).toBe("551132210708")
  })

  it("não duplica o DDI de quem já veio completo", () => {
    expect(toWhatsAppDestination("5511947070812")).toBe("5511947070812")
  })

  it("põe o DDI num DDD 55 legítimo, sem confundir com o código do país", () => {
    expect(toWhatsAppDestination("(55) 99147-0708")).toBe("5555991470708")
    expect(toWhatsAppDestination("5555991470708")).toBe("5555991470708")
  })

  it("devolve null pra número inválido", () => {
    expect(toWhatsAppDestination("123")).toBeNull()
  })
})

describe("phoneMatchCandidates", () => {
  it("gera as duas formas pra casar com telefone salvo em qualquer formato", () => {
    expect(phoneMatchCandidates("5511947070812")).toEqual(["11947070812", "5511947070812"])
    expect(phoneMatchCandidates("(11) 94707-0812")).toEqual(["11947070812", "5511947070812"])
  })

  it("casa o source do webhook com o telefone salvo local", () => {
    // O webhook manda sempre com DDI; o painel salva sem.
    const salvo = onlyDigits("(11) 98385-4128")
    expect(phoneMatchCandidates("5511983854128")).toContain(salvo)
  })

  it("cobre DDD 55 legítimo", () => {
    expect(phoneMatchCandidates("5555991470708")).toEqual(["55991470708", "5555991470708"])
  })

  it("cai pros dígitos crus quando não dá pra interpretar", () => {
    expect(phoneMatchCandidates("123")).toEqual(["123"])
    expect(phoneMatchCandidates("")).toEqual([])
  })
})

describe("formatPhoneDisplay", () => {
  it("formata celular e fixo, com ou sem DDI", () => {
    expect(formatPhoneDisplay("11947070812")).toBe("(11) 94707-0812")
    expect(formatPhoneDisplay("5511947070812")).toBe("(11) 94707-0812")
    expect(formatPhoneDisplay("1132210708")).toBe("(11) 3221-0708")
  })

  it("não mutila DDD 55 legítimo", () => {
    expect(formatPhoneDisplay("55991470708")).toBe("(55) 99147-0708")
    expect(formatPhoneDisplay("5555991470708")).toBe("(55) 99147-0708")
    expect(formatPhoneDisplay("5532210708")).toBe("(55) 3221-0708")
  })

  it("devolve a entrada intacta quando não dá pra interpretar", () => {
    expect(formatPhoneDisplay("sem telefone")).toBe("sem telefone")
    expect(formatPhoneDisplay("123")).toBe("123")
  })
})

describe("maskPhoneInput", () => {
  it("formata celular e fixo", () => {
    expect(maskPhoneInput("11947070812")).toBe("(11) 94707-0812")
    expect(maskPhoneInput("1132210708")).toBe("(11) 3221-0708")
  })

  // Regressão: colar com +55 empurrava o código do país pro lugar do DDD e
  // descartava os últimos dígitos — o número da cliente ficava destruído.
  it("não perde dígito quando o número é colado com +55", () => {
    expect(maskPhoneInput("+55 11 94707-0812")).toBe("(11) 94707-0812")
    expect(maskPhoneInput("5511947070812")).toBe("(11) 94707-0812")
    expect(maskPhoneInput("+55 (11) 3221-0708")).toBe("(11) 3221-0708")
  })

  it("preserva DDD 55 legítimo digitado sem DDI", () => {
    expect(maskPhoneInput("55991470708")).toBe("(55) 99147-0708")
  })

  it("preserva DDD 55 legítimo colado com DDI", () => {
    expect(maskPhoneInput("5555991470708")).toBe("(55) 99147-0708")
  })

  it("acompanha a digitação progressiva", () => {
    expect(maskPhoneInput("1")).toBe("1")
    expect(maskPhoneInput("11")).toBe("11")
    expect(maskPhoneInput("119")).toBe("119")
    expect(maskPhoneInput("11947")).toBe("11947")
    expect(maskPhoneInput("119470")).toBe("(11) 9470-")
    expect(maskPhoneInput("1194707081")).toBe("(11) 9470-7081")
    expect(maskPhoneInput("11947070812")).toBe("(11) 94707-0812")
  })

  it("ignora o excesso quando passa do tamanho de um número válido", () => {
    expect(maskPhoneInput("11947070812999")).toBe("(11) 94707-0812")
  })

  it("aguenta entrada vazia", () => {
    expect(maskPhoneInput("")).toBe("")
  })
})
