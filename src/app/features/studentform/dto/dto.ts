import { StudentDTO } from "../types/types";

export function buildStudentDTO(partial: Partial<StudentDTO>): StudentDTO {
  return {
    fullNameWithSurname: partial.fullNameWithSurname ?? '',
    agreeToTerms: partial.agreeToTerms ?? false,
    ...partial,
  } as StudentDTO;
}
// Minimal normalizer: input is already expected to match current DTO schema.
export function normalizeDto(input: Record<string, unknown>): Record<string, unknown> {
  if (!input || typeof input !== 'object') return {} as Record<string, unknown>;
  const out: Record<string, unknown> = { ...input };

  // Map common frontend keys to backend-friendly names so backend accepts payloads
  // without requiring strict frontend field names.
  if (input['phone1'] && !('phoneLandline' in out)) out['phoneLandline'] = input['phone1'];
  if (input['phone2'] && !('phoneMobile' in out)) out['phoneMobile'] = input['phone2'];

  if (input['guardianFullName'] && !('guardianName' in out)) out['guardianName'] = input['guardianFullName'];
  if (input['guardianJobAddress'] && !('guardianAddress' in out)) out['guardianAddress'] = input['guardianJobAddress'];

  // Ensure boolean fields are real booleans
  if ('agreeToTerms' in out) out['agreeToTerms'] = Boolean(out['agreeToTerms']);

  if ('earlierSchool' in out) {
    out['earlierSchool'] = out['earlierSchool'] === 'YES' || out['earlierSchool'] === true;
  }
  
  if ('disabilities' in out) {
    if (out['disabilities'] === 'YES') out['disabilities'] = true;
    else if (out['disabilities'] === 'NO') out['disabilities'] = false;
  }

  if ('medicated' in out) {
    if (out['medicated'] === 'YES') out['medicated'] = true;
    else if (out['medicated'] === 'NO') out['medicated'] = false;
  }

  // Ensure numeric fields if empty are undefined/null so backend validation doesn't crash on ""
  if (out['registrationPayment'] === "") delete out['registrationPayment'];
  else if (out['registrationPayment'] !== undefined && out['registrationPayment'] !== null) {
    out['registrationPayment'] = Number(out['registrationPayment']);
  }

  // Ensure studentImage is a string URL or deleted if it's still a File object
  if (out['studentImage'] && typeof out['studentImage'] !== 'string') {
    delete out['studentImage'];
  }

  // Clean empty dates or strings
  Object.keys(out).forEach(key => {
    if (out[key] === "") {
      delete out[key];
    }
  });

  return out;
}
