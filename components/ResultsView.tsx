'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PortalResultResponse, ResultRow } from '@/types/result';
import { analyzeResults, type ResultsAnalysis, type SemesterAnalysis } from '@/lib/grading';
import SemesterTable from './SemesterTable';

interface ResultsViewProps {
  sessionId: string;
  onLogout: () => void;
}

const INACTIVITY_MS = 15 * 60 * 1000; // 15 minutes

export default function ResultsView({ sessionId, onLogout }: ResultsViewProps) {
  const [semester, setSemester] = useState<string>('100');
  const [data, setData] = useState<PortalResultResponse | null>(null);
  // Full analysis is computed once from the all-semesters fetch and never replaced.
  // Per-semester views reuse these grade stats even when data is filtered.
  const [fullAnalysis, setFullAnalysis] = useState<ResultsAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [sessionExpired, setSessionExpired] = useState(false);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => setSessionExpired(true), INACTIVITY_MS);
  }, []);

  const fetchResults = useCallback(async (sem: string) => {
    setLoading(true);
    setError('');
    resetInactivityTimer();

    try {
      const resp = await fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, semester: sem }),
      });
      const json = await resp.json();

      if (!resp.ok || json.error) {
        if (json.error === 'SESSION_EXPIRED') { setSessionExpired(true); return; }
        setError(json.error === 'RATE_LIMITED'
          ? 'Too many requests. Please wait a moment.'
          : 'Could not fetch results. The portal may be temporarily unavailable.');
        return;
      }

      const portalData = json as PortalResultResponse;
      setData(portalData);

      // Only compute the full analysis from the complete dataset
      if (sem === '100') {
        setFullAnalysis(analyzeResults(portalData.stresult as ResultRow[]));
      }
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [sessionId, resetInactivityTimer]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchResults('100');
    return () => { if (inactivityTimer.current) clearTimeout(inactivityTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSemesterChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    setSemester(val);
    void fetchResults(val);
  }

  function handleLogout() {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    onLogout();
  }

  if (sessionExpired) {
    return (
      <div style={{ maxWidth: 720, margin: '40px auto', padding: '0 16px' }}>
        <div style={{ background: '#fff', border: '1px solid #d0d0d0', borderRadius: 4, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <p style={{ color: '#b00020', marginBottom: 12 }}>Your session has expired due to inactivity.</p>
          <button onClick={onLogout} style={btnStyle('#1e4d8b')}>Back to Login</button>
        </div>
      </div>
    );
  }

  // Group the current view's rows by semester for display
  const semesterGroups = new Map<number, ResultRow[]>();
  if (data) {
    for (const row of data.stresult as ResultRow[]) {
      const sem = Number(row[0]);
      if (!semesterGroups.has(sem)) semesterGroups.set(sem, []);
      semesterGroups.get(sem)!.push(row);
    }
  }

  // Index full analysis by semester for O(1) lookup in table loop
  const analysisBySem = new Map<number, SemesterAnalysis>(
    fullAnalysis?.semesters.map(s => [s.semester, s]) ?? []
  );

  return (
    <div style={{ maxWidth: 720, margin: '32px auto', padding: '0 16px' }}>
      <div style={{
        background: '#1e4d8b',
        color: '#fff',
        padding: '10px 20px',
        borderRadius: '4px 4px 0 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>GGSIPU Examination Division</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Examination Results</div>
        </div>
        <button onClick={handleLogout} style={{
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.5)',
          color: '#fff',
          borderRadius: 4,
          padding: '5px 12px',
          fontSize: 12,
          cursor: 'pointer',
        }}>
          Logout
        </button>
      </div>

      <div style={{ background: '#fff', border: '1px solid #d0d0d0', borderTop: 'none', borderRadius: '0 0 4px 4px', padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>

        {/* Student profile */}
        {data && (
          <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #d0d0d0' }}>
            <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 16, rowGap: 4, margin: 0, fontSize: 13 }}>
              <dt style={{ color: '#555', fontWeight: 500 }}>Name</dt>
              <dd style={{ margin: 0, color: '#1a1a1a', fontWeight: 600 }}>{data.stprofile.stname}</dd>
              <dt style={{ color: '#555', fontWeight: 500 }}>Enrollment</dt>
              <dd style={{ margin: 0, color: '#1a1a1a' }}>{data.stprofile.nrollno}</dd>
              <dt style={{ color: '#555', fontWeight: 500 }}>Programme</dt>
              <dd style={{ margin: 0, color: '#1a1a1a' }}>{data.stprofile.prgname}</dd>
              <dt style={{ color: '#555', fontWeight: 500 }}>Institute</dt>
              <dd style={{ margin: 0, color: '#1a1a1a' }}>{data.stprofile.iname}</dd>
              <dt style={{ color: '#555', fontWeight: 500 }}>Year of Admission</dt>
              <dd style={{ margin: 0, color: '#1a1a1a' }}>{data.stprofile.yoa}</dd>
            </dl>
          </div>
        )}

        {/* CGPA block */}
        {fullAnalysis && fullAnalysis.cgpa !== null && (
          <div style={{ marginBottom: 20, padding: '12px 16px', background: '#f5f5f5', border: '1px solid #d0d0d0', borderRadius: 4 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#1e4d8b' }}>
              CGPA: {fullAnalysis.cgpa.toFixed(2)}
            </div>
            <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>
              {fullAnalysis.earnedCredits} of {fullAnalysis.totalCredits} credits earned
            </div>
          </div>
        )}
        {data && fullAnalysis && fullAnalysis.cgpa === null && (
          <div style={{ marginBottom: 20, fontSize: 13, color: '#555' }}>
            CGPA: — (populate <code>lib/credits.ts</code> with your programme&apos;s credit values to enable GPA)
          </div>
        )}

        {/* Semester selector */}
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }} htmlFor="semester-select">
            View Semester:
          </label>
          <select
            id="semester-select"
            value={semester}
            onChange={handleSemesterChange}
            disabled={loading}
            style={{ padding: '6px 10px', border: '1px solid #d0d0d0', borderRadius: 4, fontSize: 13, background: '#fff', color: '#1a1a1a' }}
          >
            <option value="100">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
              <option key={n} value={String(n)}>Semester {n}</option>
            ))}
          </select>
        </div>

        {error && (
          <div style={{ color: '#b00020', fontSize: 13, marginBottom: 16, padding: '8px 10px', border: '1px solid #b00020', borderRadius: 4, background: '#fff5f5' }}>
            {error}
          </div>
        )}

        {loading && <p style={{ color: '#555', fontSize: 13 }}>Fetching results…</p>}

        {!loading && data && semesterGroups.size === 0 && (
          <p style={{ color: '#555', fontSize: 13 }}>No results found for the selected semester.</p>
        )}

        {!loading && data && Array.from(semesterGroups.entries())
          .sort((a, b) => a[0] - b[0])
          .map(([sem, rows]) => (
            <SemesterTable
              key={sem}
              semester={sem}
              rows={rows}
              headers={data.header}
              gpaInfo={analysisBySem.get(sem)}
            />
          ))
        }
      </div>
    </div>
  );
}

function btnStyle(bg: string): React.CSSProperties {
  return { background: bg, color: '#fff', border: 'none', borderRadius: 4, padding: '8px 16px', fontSize: 13, cursor: 'pointer', minHeight: 44, fontWeight: 600 };
}
