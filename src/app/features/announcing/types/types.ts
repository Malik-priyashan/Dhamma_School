export interface AnnouncingDTO {
  id?: string;
  parentGuardianName: string; // single name field for mother/father/guardian
  parentGuardianAddress?: string;

  fullNameWithSurname: string;
  dob?: string;
  address?: string;
  phoneMobile?: string;
  phoneLandline?: string;
  school?: string;
  agreed?: boolean;

  createdAt?: string;
  specialTalents?: Record<string, {
    inDhammaSchool?: string;
    inSchool?: string;
    other?: string;
  }>;
}

export type StepProps = {
  data: AnnouncingDTO;
  onChange: <K extends keyof AnnouncingDTO>(k: K, v: AnnouncingDTO[K]) => void;
};
