'use client';

import type { ResultRow } from '@/types/result';
import type { SemesterGPA } from '@/lib/grading';

interface SemesterTableProps {
  semester: number;
  rows: ResultRow[];
  headers: string[];
  gpaInfo?: SemesterGPA;
}

export default function SemesterTable({ semester, rows, headers, gpaInfo }: SemesterTableProps) {
  // headers[0] is "Sem/ Annual" — skip it, semester is the table title
  const displayHeaders = headers.slice(1);

  let totalMarks = 0;
  let passCount = 0;
  let failCount = 0;

  for (const row of rows) {
    const totalStr = String(row[5]);
    const n = Number(totalStr);
    if (!isNaN(n) && totalStr !== '-') totalMarks += n;
    if (!isNaN(n)) {
      if (n >= 40) passCount++;
      else failCount++;
    }
  }

  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a', marginBottom: 6, borderBottom: '2px solid #1e4d8b', paddingBottom: 4 }}>
        Semester {semester}
      </h2>

      {gpaInfo && (
        <div style={{ marginBottom: 8, fontSize: 13 }}>
          {gpaInfo.sgpa !== null ? (
            <span style={{ color: '#1a1a1a' }}>
              <strong>SGPA:</strong> {gpaInfo.sgpa.toFixed(2)}
              {' '}({gpaInfo.earnedCredits} / {gpaInfo.totalCredits} credits earned)
            </span>
          ) : (
            <span style={{ color: '#555' }}>SGPA: N/A (no credits mapped for this semester)</span>
          )}
          {gpaInfo.unmappedPapers.length > 0 && (
            <div style={{ marginTop: 4, color: '#7a5c00', background: '#fffbea', border: '1px solid #e0c84a', borderRadius: 4, padding: '4px 8px', fontSize: 12 }}>
              Credits not mapped for: {gpaInfo.unmappedPapers.join(', ')}. Excluded from SGPA.
            </div>
          )}
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 600 }}>
          <thead>
            <tr>
              {displayHeaders.map((h, i) => (
                <th key={i} style={{
                  background: '#1e4d8b',
                  color: '#fff',
                  padding: '8px 10px',
                  textAlign: 'left',
                  border: '1px solid #1a3d70',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr key={rowIdx} style={{ background: rowIdx % 2 === 0 ? '#fafafa' : '#fff' }}>
                {row.slice(1).map((cell, cellIdx) => (
                  <td key={cellIdx} style={{
                    padding: '7px 10px',
                    border: '1px solid #d0d0d0',
                    color: '#1a1a1a',
                    whiteSpace: cellIdx === 1 ? 'normal' : 'nowrap',
                  }}>
                    {String(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 8, fontSize: 12, color: '#555', display: 'flex', gap: 16 }}>
        <span><strong>Total Marks:</strong> {totalMarks}</span>
        <span><strong>Pass:</strong> {passCount}</span>
        <span><strong>Fail:</strong> {failCount}</span>
        <span><strong>Papers:</strong> {rows.length}</span>
      </div>
    </div>
  );
}
