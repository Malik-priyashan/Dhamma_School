import { AnnouncingDTO } from "../types/types";

export function buildAnnouncingDTO(partial: Partial<AnnouncingDTO>): AnnouncingDTO {
  return {
    parentGuardianName: partial.parentGuardianName ?? '',
    fullNameWithSurname: partial.fullNameWithSurname ?? '',
    createdAt: partial.createdAt,
    ...partial,
  } as AnnouncingDTO;
}

export function normalizeDto(input: Record<string, unknown>): Record<string, unknown> {
  if (!input || typeof input !== 'object') return {} as Record<string, unknown>;
  return input as Record<string, unknown>;
}
