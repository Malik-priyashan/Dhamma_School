export interface MarkDTO {
  id?: number | string;
  studentId: number | string;
  academicYear: string;
  teacherName: string;
  grade: string | number;
  firstTerm?: number;
  secondTerm?: number;
  thirdTerm?: number;
}
