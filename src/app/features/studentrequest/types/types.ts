export interface StudentRequest {
  id: string;
  studentId?: string;
  fullNameWithSurname?: string;
  nameWithInitials?: string;
  dob?: string;
  grade?: string;
  address?: string;
  phone?: string;
  phone1?: string;
  phone2?: string;
  school?: string;
  earlierSchool?: boolean | string;
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
  disabilities?: boolean | string;
  disabilityReason?: string;
  medicated?: boolean | string;
  medicine?: string;
  siblings?: Array<{ id?: string; name: string; grade?: string }>;
  status?: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  studentImage?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export type StudentRequestsResult = StudentRequest[];
