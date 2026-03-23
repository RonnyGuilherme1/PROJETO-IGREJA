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

export function canEditTreasury(profile?: string) {
  const tokens = normalizeProfile(profile);
  return tokens.includes("ADMIN") || tokens.includes("TESOUREIRO");
}

export function getTreasuryAccessLabel(profile?: string) {
  return canEditTreasury(profile) ? "Edicao liberada" : "Modo consulta";
}
