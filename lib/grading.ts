import type { ResultRow } from '../types/result';
import { PAPER_CREDITS, type PaperMeta } from './credits';

export type { PaperMeta };

// IPU 10-point grading scale (exact boundaries as per university regulations)
export function marksToGrade(total: number): { grade: string; points: number } {
  if (total >= 90) return { grade: 'O',  points: 10 };
  if (total >= 75) return { grade: 'A+', points: 9 };
  if (total >= 65) return { grade: 'A',  points: 8 };
  if (total >= 55) return { grade: 'B+', points: 7 };
  if (total >= 50) return { grade: 'B',  points: 6 };
  if (total >= 45) return { grade: 'C',  points: 5 };
  if (total >= 40) return { grade: 'P',  points: 4 };
  return { grade: 'F', points: 0 };
}

export interface GradedPaper {
  semester: number;
  paperCode: string;
  subjectName: string;
  total: number;
  grade: string;
  gradePoints: number;
  credits: number;
  includedInGpa: boolean;
  declaredDate: string;
}

export interface SemesterAnalysis {
  semester: number;
  rows: ResultRow[];
  graded: GradedPaper[];
  sgpa: number | null;
  totalCredits: number;
  earnedCredits: number;
  unmappedPapers: string[];
}

// Alias kept so SemesterTable's import doesn't need updating
export type SemesterGPA = SemesterAnalysis;

export interface ResultsAnalysis {
  semesters: SemesterAnalysis[];
  cgpa: number | null;
  totalCredits: number;
  earnedCredits: number;
}

// De-duplicate by `${semester}:${paperCode}`, keeping the row with the latest declaredDate.
// This handles supplementary exam attempts — only the best/latest result is counted.
export function deduplicateRows(rows: ResultRow[]): ResultRow[] {
  const seen = new Map<string, ResultRow>();
  for (const row of rows) {
    const key = `${row[0]}:${row[1]}`;
    const existing = seen.get(key);
    if (!existing || String(row[8]) > String(existing[8])) {
      seen.set(key, row);
    }
  }
  return Array.from(seen.values());
}

// Grade raw rows using an explicit credits dict.
// Accepting the dict as a parameter keeps this function pure and directly testable.
export function gradeRows(
  rows: ResultRow[],
  credits: Record<string, PaperMeta>,
): { graded: GradedPaper[]; unmappedPapers: string[] } {
  const graded: GradedPaper[] = [];
  const unmapped = new Set<string>();

  for (const row of rows) {
    const paperCode = String(row[1]);
    const totalStr = String(row[5]);
    const total = Number(totalStr);

    if (isNaN(total) || totalStr === '-') continue; // non-numeric total: skip

    const meta = credits[paperCode];
    if (!meta) {
      unmapped.add(paperCode);
      continue;
    }
    if (meta.isAudit) continue; // audit courses excluded from GPA

    const { grade, points } = marksToGrade(total);
    graded.push({
      semester: Number(row[0]),
      paperCode,
      subjectName: String(row[2]),
      total,
      grade,
      gradePoints: points,
      credits: meta.credits,
      includedInGpa: true,
      declaredDate: String(row[8]),
    });
  }

  return { graded, unmappedPapers: Array.from(unmapped) };
}

// SGPA = Σ(credits × gradePoints) / Σ(credits)  for a single semester
export function calculateSGPA(graded: GradedPaper[]): number | null {
  const included = graded.filter(r => r.includedInGpa);
  if (included.length === 0) return null;
  const numerator   = included.reduce((s, r) => s + r.credits * r.gradePoints, 0);
  const denominator = included.reduce((s, r) => s + r.credits, 0);
  return +(numerator / denominator).toFixed(2);
}

// CGPA = same formula summed across ALL papers from ALL semesters.
// This is NOT the average of SGPAs — semesters with more credits weigh more.
export function calculateCGPA(allGraded: GradedPaper[]): number | null {
  const included = allGraded.filter(r => r.includedInGpa);
  if (included.length === 0) return null;
  const numerator   = included.reduce((s, r) => s + r.credits * r.gradePoints, 0);
  const denominator = included.reduce((s, r) => s + r.credits, 0);
  return +(numerator / denominator).toFixed(2);
}

// Top-level orchestrator: deduplicate → group by semester → grade → compute GPA
export function analyzeResults(stresult: ResultRow[]): ResultsAnalysis {
  const deduplicated = deduplicateRows(stresult);

  const bySem = new Map<number, ResultRow[]>();
  for (const row of deduplicated) {
    const sem = Number(row[0]);
    if (!bySem.has(sem)) bySem.set(sem, []);
    bySem.get(sem)!.push(row);
  }

  const semesters: SemesterAnalysis[] = [];
  const allGraded: GradedPaper[] = [];

  for (const [sem, semRows] of Array.from(bySem.entries()).sort((a, b) => a[0] - b[0])) {
    const { graded, unmappedPapers } = gradeRows(semRows, PAPER_CREDITS);
    const sgpa = calculateSGPA(graded);
    const totalCredits   = graded.reduce((s, r) => s + r.credits, 0);
    const earnedCredits  = graded.filter(r => r.gradePoints >= 4).reduce((s, r) => s + r.credits, 0);

    allGraded.push(...graded);
    semesters.push({ semester: sem, rows: semRows, graded, sgpa, totalCredits, earnedCredits, unmappedPapers });
  }

  const cgpa = calculateCGPA(allGraded);
  const totalCredits  = allGraded.reduce((s, r) => s + r.credits, 0);
  const earnedCredits = allGraded.filter(r => r.gradePoints >= 4).reduce((s, r) => s + r.credits, 0);

  return { semesters, cgpa, totalCredits, earnedCredits };
}
