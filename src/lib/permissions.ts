import type { OrgRole } from "@/db/schema"

// Todas as ações possíveis no sistema
export type Action =
  // Organização
  | "org:update"
  | "org:delete"
  | "org:invite"
  | "org:remove_member"
  // Clientes
  | "clients:create"
  | "clients:read"
  | "clients:update"
  | "clients:delete"
  // Agenda
  | "schedule:create"
  | "schedule:read"
  | "schedule:update"
  | "schedule:delete"
  // Prontuários
  | "records:create"
  | "records:read"
  | "records:update"
  | "records:delete"
  // Financeiro
  | "financial:read"
  | "financial:write"
  // Equipe
  | "team:read"
  | "team:manage"

// Mapa de permissões por role
const rolePermissions: Record<OrgRole, Action[]> = {
  owner: [
    "org:update",
    "org:delete",
    "org:invite",
    "org:remove_member",
    "clients:create",
    "clients:read",
    "clients:update",
    "clients:delete",
    "schedule:create",
    "schedule:read",
    "schedule:update",
    "schedule:delete",
    "records:create",
    "records:read",
    "records:update",
    "records:delete",
    "financial:read",
    "financial:write",
    "team:read",
    "team:manage",
  ],
  professional: [
    "clients:create",
    "clients:read",
    "clients:update",
    "schedule:create",
    "schedule:read",
    "schedule:update",
    "records:create",
    "records:read",
    "records:update",
    "financial:read",
    "team:read",
  ],
  receptionist: [
    "clients:create",
    "clients:read",
    "clients:update",
    "schedule:create",
    "schedule:read",
    "schedule:update",
    "schedule:delete",
    "team:read",
  ],
  financial: [
    "financial:read",
    "financial:write",
    "clients:read",
    "schedule:read",
    "team:read",
  ],
}

export function can(role: OrgRole, action: Action): boolean {
  return rolePermissions[role]?.includes(action) ?? false
}

export function canAll(role: OrgRole, actions: Action[]): boolean {
  return actions.every((a) => can(role, a))
}

export function canAny(role: OrgRole, actions: Action[]): boolean {
  return actions.some((a) => can(role, a))
}

// Helper para uso em Server Components/Actions — busca o role do usuário na org
export function getRolePermissions(role: OrgRole): Action[] {
  return rolePermissions[role] ?? []
}
