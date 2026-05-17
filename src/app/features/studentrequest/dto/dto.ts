import { StudentRequest } from "../types/types";

// Normalize server response to frontend-friendly StudentRequest shape
export function normalizeStudentRequest(input: Record<string, unknown>): StudentRequest {
  return {
    id: String(input['id'] ?? input['requestId'] ?? ''),
    fullNameWithSurname: (input['fullNameWithSurname'] as string) ?? (input['fullName'] as string) ?? '',
    nameWithInitials: input['nameWithInitials'] as string | undefined,
    dob: input['dob'] as string | undefined,
    grade: input['grade'] as string | undefined,
    address: input['address'] as string | undefined,
    phone: (input['phoneMobile'] as string) ?? (input['phone'] as string) ?? undefined,
    status: (input['status'] as string) ?? undefined,
    createdAt: input['createdAt'] as string | undefined,
    ...input,
  } as StudentRequest;
}

export function normalizeStudentRequests(input: unknown): StudentRequest[] {
  if (!Array.isArray(input)) return [];
  return input.map((i) => normalizeStudentRequest(i as Record<string, unknown>));
}
