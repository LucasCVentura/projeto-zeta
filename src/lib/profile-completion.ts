import type { User } from "@/db/schema"

export type ProfileMissingField = "cpf" | "phone" | "birthDate" | "professionalDocument"

const FIELD_LABELS: Record<ProfileMissingField, string> = {
  cpf: "CPF",
  phone: "Telefone",
  birthDate: "Data de nascimento",
  professionalDocument: "Documento profissional",
}

export function getMissingProfileFields(
  user: Pick<User, "cpf" | "phone" | "birthDate" | "professionalDocument" | "profession">
): ProfileMissingField[] {
  const missing: ProfileMissingField[] = []
  if (!user.cpf) missing.push("cpf")
  if (!user.phone) missing.push("phone")
  if (!user.birthDate) missing.push("birthDate")
  if (user.profession !== "outro" && !user.professionalDocument) missing.push("professionalDocument")
  return missing
}

export function missingProfileFieldLabels(fields: ProfileMissingField[]): string[] {
  return fields.map((f) => FIELD_LABELS[f])
}
