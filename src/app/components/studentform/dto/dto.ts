import { StudentDTO } from "../types/types";

export function buildStudentDTO(partial: Partial<StudentDTO>): StudentDTO {
  return {
    fullNameWithSurnameEn: partial.fullNameWithSurnameEn ?? '',
    fullNameWithSurnameSi: partial.fullNameWithSurnameSi ?? '',
    ...partial,
  } as StudentDTO;
}
