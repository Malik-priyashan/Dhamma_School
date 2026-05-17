export type LibraryStatement = 'very_good' | 'good' | 'normal' | 'weak' | '';

export type LibraryStatusLiteral = 'VERY_GOOD' | 'GOOD' | 'NORMAL' | 'WEAK' | null;

export interface PrefectFormData {
  // fields matching the updated PrefectBoard model
  fullName: string;
  address?: string | null;
  grade?: string | null;

  entranceDay?: string | null; // ISO date string
  entranceNo?: string | null;

  firstTermPlace?: string | null;
  firstTermMarks?: number | null;
  secondTermPlace?: string | null;
  secondTermMarks?: number | null;
  thirdTermPlace?: string | null;
  thirdTermMarks?: number | null;

  absentDaysCount?: number | null;

  isPrefect?: 'YES' | 'NO' | boolean;
  isPrefectYears?: number[];
  isClassLeader?: 'YES' | 'NO' | boolean;
  isClassLeaderYears?: number[];
  participateForCompetitions?: 'YES' | 'NO' | boolean;
  participateForCompetitionsYears?: number[];
  isInAnnouncingClub?: 'YES' | 'NO' | boolean;
  isInAnnouncingClubYears?: number[];
  isOnStage?: 'YES' | 'NO' | boolean;
  isOnStageYears?: number[];
  participateToKatina?: 'YES' | 'NO' | boolean;
  participateToKatinaYears?: number[];

  poyaDayCount?: number | null;
  teachersConfirmFile?: string | null;
  teacherConfirmation?: File | string | null;

  studentAgreement?: boolean;

  parentsName?: string | null;
  parentsAgreement?: boolean;

  libraryStatus?: LibraryStatusLiteral;
  libraryStatusConfirmationFile?: File | string | null;
  teachersAgreementFileUpload?: File | string | null;

  teachersAgreement?: boolean;
  teachersAgreementFile?: string | null;

  regNo?: string | null;
  marks?: number | null;
  status?: string | null;
  date?: string | null;

  createdAt?: string | null;
  specialNote?: string | null;

  // allow additional arbitrary fields (e.g., temporary UI-only inputs)
  [key: string]: unknown;
}

export type StepProps = {
  data: PrefectFormData;
  onChange: (key: keyof PrefectFormData | string, value: unknown) => void;
};

export type UsePrefectFormInitial = Partial<PrefectFormData>;
