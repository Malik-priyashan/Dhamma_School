export type YesNo = 'YES' | 'NO';

export type StudentMonitor = 'NOT_GIVEN' | 'GIVEN' | 'OTHER';

export interface Sibling {
  id?: number;
  studentId?: number;
  nameEn: string;
  nameSi?: string;
  gradeEn?: string;
  gradeSi?: string;
}

export interface StudentDTO {
  id?: number;
  fullNameWithSurnameEn: string;
  fullNameWithSurnameSi?: string;
  nameWithInitialsEn?: string;
  nameWithInitialsSi?: string;
  dob?: string;
  addressEn?: string;
  addressSi?: string;
  phone1?: string;
  phone2?: string;
  schoolEn?: string;
  schoolSi?: string;
  earlierSchool?: YesNo;
  earlierSchoolEn?: string;
  earlierSchoolSi?: string;
  reasonForLeaveEn?: string;
  reasonForLeaveSi?: string;

  fatherFullNameEn?: string;
  fatherFullNameSi?: string;
  fatherJobEn?: string;
  fatherJobSi?: string;
  fatherJobAddressEn?: string;
  fatherJobAddressSi?: string;

  motherFullNameEn?: string;
  motherFullNameSi?: string;
  motherJobEn?: string;
  motherJobSi?: string;
  motherJobAddressEn?: string;
  motherJobAddressSi?: string;

  guardianFullNameEn?: string;
  guardianFullNameSi?: string;
  guardianJobEn?: string;
  guardianJobSi?: string;
  guardianJobAddressEn?: string;
  guardianJobAddressSi?: string;

  emergencyPersonNameEn?: string;
  emergencyPersonNameSi?: string;
  emergencyPersonAddressEn?: string;
  emergencyPersonAddressSi?: string;
  emergencyNumber?: string;

  emergencyMedicineEn?: string;
  emergencyMedicineSi?: string;
  medicine?: string;

  disabilities?: YesNo;
  disabilityReasonEn?: string;
  disabilityReasonSi?: string;
  medicated?: YesNo;

  siblings?: Sibling[];

  registrationPayment?: number;
  registrationDate?: string;

  indexNo?: string;
  libraryNo?: string;
  houseEn?: string;
  houseSi?: string;
  gradeEn?: string;
  gradeSi?: string;

  studentActiveMonitor?: StudentMonitor;

  agreeToTerms?: boolean;
}
