export interface StudentProfile {
  nrollno: string;
  stname: string;
  byoa: number;
  yoa: number;
  prgcode: string;
  prgname: string;
  icode: string;
  iname: string;
}

// Each row in stresult is an array matching the header columns.
// Indices: 0=Sem, 1=PaperCode, 2=SubjectName, 3=Internal, 4=External, 5=Total, 6=Status, 7=ExamMonthYear, 8=DeclaredDate
export type ResultRow = [number | string, string, string, string, string, string, string, string, string];

export interface PortalResultResponse {
  report: string;
  stprofile: StudentProfile;
  header: string[];
  stresult: ResultRow[];
}

export type ApiError =
  | { error: 'INVALID_INPUT' }
  | { error: 'INVALID_CREDENTIALS' }
  | { error: 'SESSION_EXPIRED' }
  | { error: 'PORTAL_UNREACHABLE' }
  | { error: 'PORTAL_ERROR' }
  | { error: 'RATE_LIMITED' };
