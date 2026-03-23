function normalizeProfile(profile?: string) {
  if (!profile?.trim()) {
    return [];
  }

  return profile
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export function canEditMembers(profile?: string) {
  const tokens = normalizeProfile(profile);
  return tokens.includes("ADMIN") || tokens.includes("SECRETARIA");
}

export function getMembersAccessLabel(profile?: string) {
  return canEditMembers(profile) ? "Edicao liberada" : "Modo consulta";
}
