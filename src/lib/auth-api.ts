// Contratos de autenticação/usuários do backend Node (ProjetoZup-main).
// Mantemos os tipos próximos aos do back e mapeamos para o modelo do front.

import { api, tokens } from "@/lib/api";
import type { AppRole, OrganRole } from "@/hooks/useAuth";

export type BackendRole = "citizen" | "agent" | "admin";

export interface BackendUser {
  id: number;
  name: string;
  email: string;
  cpf?: string;
  role: BackendRole;
  avatar_url?: string | null;
  neighborhood_id?: number | null;
  // serão preenchidos quando o back ganhar os campos (Prioridade 3+):
  organ?: OrganRole | null;
  phone?: string | null;
  cep?: string | null;
}

export interface BackendSession {
  access_token: string;
  refresh_token: string;
  user: BackendUser;
}

function normalizeSession(raw: any): BackendSession {
  if (raw?.session) return raw.session as BackendSession;
  return raw as BackendSession;
}

// Backend (MVP): citizen | agent | admin
// Front (ZUP):  cidadao | prefeitura | agua_saneamento | energia_luz | admin
// 'agent' sem campo `organ` é tratado como prefeitura por padrão.
export function mapRoles(user: BackendUser): { roles: AppRole[]; organ: OrganRole | null } {
  if (!user) return { roles: [], organ: null };
  if (user.role === "admin") return { roles: ["admin"], organ: user.organ ?? null };
  if (user.role === "agent") {
    const organ: OrganRole = (user.organ as OrganRole) ?? "prefeitura";
    return { roles: [organ], organ };
  }
  return { roles: ["cidadao"], organ: null };
}

export async function loginWithCpf(cpf: string, password: string): Promise<BackendSession> {
  const cpfDigits = cpf.replace(/\D/g, "");
  const raw = await api.post("/auth/login", { cpf: cpfDigits, password }, { auth: false });
  const session = normalizeSession(raw);
  tokens.set(session.access_token, session.refresh_token);
  return session;
}

export interface RegisterPayload {
  name: string;
  email: string;
  cpf: string;
  password: string;
  phone?: string;
  cep?: string;
  two_factor_email_enabled?: boolean;
  neighborhood_id?: number | null;
}

export async function registerUser(payload: RegisterPayload): Promise<BackendUser> {
  const body: any = {
    name: payload.name.trim(),
    email: payload.email.trim().toLowerCase(),
    cpf: payload.cpf.replace(/\D/g, ""),
    password: payload.password,
  };
  if (payload.phone) body.phone = payload.phone.replace(/\D/g, "");
  if (payload.cep) body.cep = payload.cep.replace(/\D/g, "");
  if (payload.two_factor_email_enabled !== undefined) body.two_factor_email_enabled = payload.two_factor_email_enabled;
  if (payload.neighborhood_id != null) body.neighborhood_id = payload.neighborhood_id;
  return api.post<BackendUser>("/auth/register", body, { auth: false });
}

export async function fetchMe(): Promise<BackendUser> {
  return api.get<BackendUser>("/users/me");
}

export async function updateMe(patch: Partial<BackendUser> & { password?: string }): Promise<BackendUser> {
  return api.patch<BackendUser>("/users/me", patch);
}

export async function listUsers(): Promise<BackendUser[]> {
  return api.get<BackendUser[]>("/users");
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post("/auth/forgot-password", { email: email.trim().toLowerCase() }, { auth: false });
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await api.post("/auth/reset-password", { token, password }, { auth: false });
}

export function logout() {
  tokens.clear();
}
