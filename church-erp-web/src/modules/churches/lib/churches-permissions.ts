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

export function canEditChurches(profile?: string) {
  const tokens = normalizeProfile(profile);
  return tokens.includes("ADMIN") || tokens.includes("SECRETARIA");
}

export function getChurchesAccessLabel(profile?: string) {
  return canEditChurches(profile) ? "Edicao liberada" : "Modo consulta";
}
