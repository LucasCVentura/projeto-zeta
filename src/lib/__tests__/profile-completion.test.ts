import { describe, it, expect } from "vitest"
import { getMissingProfileFields, missingProfileFieldLabels } from "../profile-completion"

const baseUser = {
  cpf: "12345678900",
  phone: "11999999999",
  birthDate: "1990-01-01",
  professionalDocument: "12345",
  profession: "esteticista" as const,
}

describe("getMissingProfileFields", () => {
  it("returns empty array when all fields are filled", () => {
    expect(getMissingProfileFields(baseUser)).toEqual([])
  })

  it("flags missing cpf", () => {
    expect(getMissingProfileFields({ ...baseUser, cpf: null })).toEqual(["cpf"])
  })

  it("flags missing phone", () => {
    expect(getMissingProfileFields({ ...baseUser, phone: null })).toEqual(["phone"])
  })

  it("flags missing birthDate", () => {
    expect(getMissingProfileFields({ ...baseUser, birthDate: null })).toEqual(["birthDate"])
  })

  it("flags missing professionalDocument when profession is not 'outro'", () => {
    expect(getMissingProfileFields({ ...baseUser, professionalDocument: null })).toEqual(["professionalDocument"])
  })

  it("does not flag missing professionalDocument when profession is 'outro'", () => {
    expect(getMissingProfileFields({ ...baseUser, professionalDocument: null, profession: "outro" })).toEqual([])
  })

  it("flags multiple missing fields together, in order", () => {
    expect(
      getMissingProfileFields({ cpf: null, phone: null, birthDate: null, professionalDocument: null, profession: "biomedico" })
    ).toEqual(["cpf", "phone", "birthDate", "professionalDocument"])
  })
})

describe("missingProfileFieldLabels", () => {
  it("maps field keys to their Portuguese labels", () => {
    expect(missingProfileFieldLabels(["cpf", "phone", "birthDate", "professionalDocument"])).toEqual([
      "CPF", "Telefone", "Data de nascimento", "Documento profissional",
    ])
  })

  it("returns empty array for empty input", () => {
    expect(missingProfileFieldLabels([])).toEqual([])
  })
})
