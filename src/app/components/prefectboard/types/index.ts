export type LibraryStatement = 'very_good' | 'good' | 'normal' | 'weak' | '';

export interface PrefectFormData {
  // locale fields
  fullNameEn?: string;
  fullNameSi?: string;
  addressEn?: string;
  addressSi?: string;
  gradeEntranceDayEn?: string;
  gradeEntranceDaySi?: string;
  entranceNoEn?: string;
  entranceNoSi?: string;

  grade?: string;
  gradeEn?: string;
  gradeSi?: string;

  // term marks / places (locale aware where applicable)
  firstTermMarks?: string;
  firstTermPlaceEn?: string;
  firstTermPlaceSi?: string;
  secondTermMarks?: string;
  secondTermPlaceEn?: string;
  secondTermPlaceSi?: string;
  thirdTermMarks?: string;
  thirdTermPlaceEn?: string;
  thirdTermPlaceSi?: string;

  // Absent days count for the past year
  absentDaysCount?: number | string;
  // Poya days attended this year
  poyaThisYear?: number | string;
  // legacy/backwards-compatibility: previous name used in some places
  poyaCount?: number | string;

  // yes/no + years (comma-separated strings)
  wasPrefectBefore?: 'yes' | 'no';
  wasPrefectYears?: string;
  wasClassLeaderBefore?: 'yes' | 'no';
  wasClassLeaderYears?: string;
  participatedInCompetitions?: 'yes' | 'no';
  participatedCompetitionsYears?: string;
  isAnnouncingMember?: 'yes' | 'no';
  announcingYears?: string;
  performedOnUdaHamuwa?: 'yes' | 'no';
  udaHamuwaYears?: string;
  attendedKatinaFestival?: 'yes' | 'no';
  katinaYears?: string;

  // file / confirmation
  teacherConfirmation?: File | string | null;

  // agreements
  studentAgreement?: boolean;
  parentFullName?: string;
  parentAgreement?: boolean;

  // step 4
  libraryStatement?: LibraryStatement;
  parentFullNameEn?: string;
  parentFullNameSi?: string;

  specialNote?: string;
  specialNoteEn?: string;
  specialNoteSi?: string;

  // allow additional arbitrary fields
  [key: string]: unknown;
}

export type StepProps = {
  data: PrefectFormData;
  onChange: (key: keyof PrefectFormData | string, value: unknown) => void;
};

export type UsePrefectFormInitial = Partial<PrefectFormData>;
