import { describe, it, expect } from 'vitest';
import {
  marksToGrade,
  deduplicateRows,
  gradeRows,
  calculateSGPA,
  calculateCGPA,
} from '../lib/grading';
import type { ResultRow } from '../types/result';
import type { PaperMeta } from '../lib/credits';

// Minimal ResultRow factory — only the fields grading cares about are meaningful
function row(sem: number, code: string, total: string, date: string): ResultRow {
  return [sem, code, `Subject ${code}`, '-', '-', total, '08', '5,2024', date];
}

const CREDITS: Record<string, PaperMeta> = {
  P1: { credits: 4 },
  P2: { credits: 4 },
  P3: { credits: 4 },
  P4: { credits: 2 },
  AUDIT: { credits: 2, isAudit: true },
};

// ─── marksToGrade ────────────────────────────────────────────────────────────

describe('marksToGrade — boundary values', () => {
  it('89 → A+ (just below O)', () => expect(marksToGrade(89)).toEqual({ grade: 'A+', points: 9 }));
  it('90 → O',                  () => expect(marksToGrade(90)).toEqual({ grade: 'O',  points: 10 }));
  it('74 → A (just below A+)',  () => expect(marksToGrade(74)).toEqual({ grade: 'A',  points: 8 }));
  it('75 → A+',                 () => expect(marksToGrade(75)).toEqual({ grade: 'A+', points: 9 }));
  it('39 → F',                  () => expect(marksToGrade(39)).toEqual({ grade: 'F',  points: 0 }));
  it('40 → P',                  () => expect(marksToGrade(40)).toEqual({ grade: 'P',  points: 4 }));
  it('100 → O',                 () => expect(marksToGrade(100)).toEqual({ grade: 'O', points: 10 }));
  it('0 → F',                   () => expect(marksToGrade(0)).toEqual({ grade: 'F',  points: 0 }));
});

// ─── calculateSGPA ───────────────────────────────────────────────────────────

describe('calculateSGPA', () => {
  it('returns null for empty input', () => {
    expect(calculateSGPA([])).toBeNull();
  });

  it('computes correct weighted average for mixed grades', () => {
    // P1: 4 credits, 80 marks → A+(9)   contribution: 36
    // P2: 4 credits, 65 marks → A (8)   contribution: 32
    // P3: 4 credits, 50 marks → B (6)   contribution: 24
    // SGPA = (36+32+24) / 12 = 92/12 = 7.666… → 7.67
    const { graded } = gradeRows(
      [row(1, 'P1', '80', '2024-05-01'), row(1, 'P2', '65', '2024-05-01'), row(1, 'P3', '50', '2024-05-01')],
      CREDITS,
    );
    expect(calculateSGPA(graded)).toBe(7.67);
  });

  it('returns null when all papers are unmapped (graded array empty)', () => {
    const { graded } = gradeRows([row(1, 'UNKNOWN', '80', '2024-05-01')], CREDITS);
    expect(calculateSGPA(graded)).toBeNull();
  });
});

// ─── calculateCGPA ≠ average of SGPAs ────────────────────────────────────────

describe('calculateCGPA', () => {
  it('is NOT the simple average of SGPAs', () => {
    // Semester 1: 1 paper × 4 credits, 65 marks → A (8 pts) → SGPA = 8.0
    // Semester 2: 3 papers × 4 credits, 90 marks → O (10 pts) → SGPA = 10.0
    // Average of SGPAs = (8 + 10) / 2 = 9.0
    // Correct CGPA = (8×4 + 10×4×3) / (4 + 12) = (32+120)/16 = 9.5
    const sem1Rows = [row(1, 'P1', '65', '2024-05-01')];
    const sem2Rows = [
      row(2, 'P1', '90', '2024-11-01'),
      row(2, 'P2', '90', '2024-11-01'),
      row(2, 'P3', '90', '2024-11-01'),
    ];
    const { graded: g1 } = gradeRows(sem1Rows, CREDITS);
    const { graded: g2 } = gradeRows(sem2Rows, CREDITS);

    const sgpa1 = calculateSGPA(g1)!;
    const sgpa2 = calculateSGPA(g2)!;
    const avgOfSGPAs = +((sgpa1 + sgpa2) / 2).toFixed(2);
    const cgpa = calculateCGPA([...g1, ...g2])!;

    expect(sgpa1).toBe(8.0);
    expect(sgpa2).toBe(10.0);
    expect(avgOfSGPAs).toBe(9.0);
    expect(cgpa).toBe(9.5);        // credit-weighted, not 9.0
    expect(cgpa).not.toBe(avgOfSGPAs);
  });
});

// ─── deduplicateRows ─────────────────────────────────────────────────────────

describe('deduplicateRows', () => {
  it('keeps the row with the later declaredDate when the same paper appears twice', () => {
    const earlier = row(1, 'P1', '60', '2024-05-01');
    const later   = row(1, 'P1', '75', '2024-11-01');
    const result  = deduplicateRows([earlier, later]);

    expect(result).toHaveLength(1);
    expect(result[0][8]).toBe('2024-11-01'); // latest date kept
    expect(result[0][5]).toBe('75');          // latest marks kept
  });

  it('preserves distinct papers', () => {
    const r1 = row(1, 'P1', '80', '2024-05-01');
    const r2 = row(1, 'P2', '70', '2024-05-01');
    expect(deduplicateRows([r1, r2])).toHaveLength(2);
  });

  it('treats same paper code in different semesters as distinct', () => {
    const r1 = row(1, 'P1', '80', '2024-05-01');
    const r2 = row(2, 'P1', '90', '2024-11-01');
    expect(deduplicateRows([r1, r2])).toHaveLength(2);
  });
});

// ─── gradeRows — unmapped papers ─────────────────────────────────────────────

describe('gradeRows', () => {
  it('excludes unmapped papers from graded and reports them', () => {
    const rows = [
      row(1, 'P1',      '80', '2024-05-01'), // mapped
      row(1, 'UNKNOWN', '75', '2024-05-01'), // not in CREDITS
    ];
    const { graded, unmappedPapers } = gradeRows(rows, CREDITS);

    expect(graded).toHaveLength(1);
    expect(graded[0].paperCode).toBe('P1');
    expect(unmappedPapers).toContain('UNKNOWN');
  });

  it('excludes audit papers from graded without marking them unmapped', () => {
    const rows = [row(1, 'AUDIT', '90', '2024-05-01')];
    const { graded, unmappedPapers } = gradeRows(rows, CREDITS);

    expect(graded).toHaveLength(0);
    expect(unmappedPapers).toHaveLength(0); // audit ≠ unmapped
  });

  it('skips rows with non-numeric total', () => {
    const rows = [row(1, 'P1', '-', '2024-05-01')];
    const { graded } = gradeRows(rows, CREDITS);
    expect(graded).toHaveLength(0);
  });

  it('counts passed and failed credits correctly', () => {
    const rows = [
      row(1, 'P1', '80', '2024-05-01'), // pass, 4 credits
      row(1, 'P2', '30', '2024-05-01'), // fail, 4 credits
    ];
    const { graded } = gradeRows(rows, CREDITS);
    const earned = graded.filter(r => r.gradePoints >= 4).reduce((s, r) => s + r.credits, 0);
    expect(earned).toBe(4); // only P1 passes
  });
});
