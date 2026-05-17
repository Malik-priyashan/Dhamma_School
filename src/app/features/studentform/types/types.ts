export type YesNo = 'YES' | 'NO';

export type StudentMonitor = 'NOT_GIVEN' | 'GIVEN' | 'OTHER';

export interface Sibling {
  id?: string;
  studentId?: string;
  name: string;
  grade?: string;
}

export interface StudentDTO {
  id?: string;
  fullNameWithSurname: string;
  nameWithInitials?: string;
  dob?: string;
  address?: string;
  phone1?: string;
  phone2?: string;
  school?: string;
  earlierSchool?: YesNo;
  earlierSchoolReason?: string;
  reasonForLeave?: string;

  fatherFullName?: string;
  fatherJob?: string;
  fatherJobAddress?: string;

  motherFullName?: string;
  motherJob?: string;
  motherJobAddress?: string;

  guardianFullName?: string;
  guardianJob?: string;
  guardianJobAddress?: string;

  emergencyPersonName?: string;
  emergencyPersonAddress?: string;
  emergencyNumber?: string;

  disabilities?: YesNo;
  disabilityReason?: string;
  medicated?: YesNo;
  medicine?: string;

  registrationPayment?: number;
  registrationDate?: string;

  indexNo?: string;
  libraryNo?: string;
  house?: string;
  grade?: string;

  studentActiveMonitor?: StudentMonitor;

  siblings?: Sibling[];
  createdAt?: string;

  studentImage?: File | string | null;

  agreeToTerms?: boolean;
}

export type StepProps = {
  data: StudentDTO;
  onChange: <K extends keyof StudentDTO>(k: K, v: StudentDTO[K]) => void;
};

