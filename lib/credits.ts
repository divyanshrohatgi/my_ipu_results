// PaperMeta is defined here (not imported from grading.ts) to avoid a circular dependency.
export type PaperMeta = { credits: number; isAudit?: boolean; isOptional?: boolean };

// All credits sourced directly from official AIDS B.Tech scheme PDFs
// (USAR/MAIT, batch admitted 2022-23 onwards).
// Paper codes use portal format (no dashes).
export const PAPER_CREDITS: Record<string, PaperMeta> = {
  // ===== Semester 1 (Total: 25 credits) =====
  'ES101':  { credits: 3 },   // Programming in C
  'BS105':  { credits: 3 },   // Applied Physics I
  'BS109':  { credits: 3 },   // Environmental Studies
  'BS111':  { credits: 4 },   // Applied Math I
  'HS113':  { credits: 3 },   // Communication Skills
  'ES119':  { credits: 4 },   // Manufacturing Process
  'BS151':  { credits: 1 },   // Applied Physics I Lab
  'ES153':  { credits: 1 },   // Programming in C Lab
  'ES157':  { credits: 2 },   // Engineering Graphics I
  'BS161':  { credits: 1 },   // Environmental Studies Lab

  // ===== Semester 2 (Total: 25 credits) =====
  // Note: portal returns BS104 for Applied Chemistry, scheme lists BS-103.
  // Same paper, batch-level code variation. Use what the portal returns.
  'BS104':  { credits: 3 },   // Applied Chemistry
  'BS106':  { credits: 3 },   // Applied Physics II
  'ES108':  { credits: 3 },   // Electrical Science (scheme: ES-107)
  'BS112':  { credits: 4 },   // Applied Math II
  'ES114':  { credits: 3 },   // Engineering Mechanics
  'HS116':  { credits: 2 },   // Indian Constitution (NUES, not audit)
  'HS118':  { credits: 1 },   // Human Values and Ethics (NUES, not audit)
  'BS152':  { credits: 1 },   // Applied Physics II Lab
  'BS156':  { credits: 1 },   // Applied Chemistry Lab (scheme: BS-155)
  'ES158':  { credits: 1 },   // Engineering Graphics II
  'ES160':  { credits: 1 },   // Electrical Science Lab (scheme: ES-159)
  'ES164':  { credits: 2 },   // Workshop Practice

  // ===== Semester 3 (Total: 27 credits) =====
  'AIDS201': { credits: 3 },
  'AIDS203': { credits: 3 },
  'AIDS205': { credits: 3 },
  'AIDS207': { credits: 3 },
  'AIDS209': { credits: 4 },
  'AIDS211': { credits: 3 },
  'AIDS213': { credits: 2 },
  'AIDS215': { credits: 1 },   // Selected Readings (NUES, but counted)
  'AIDS251': { credits: 1 },
  'AIDS253': { credits: 1 },
  'AIDS255': { credits: 1 },
  'AIDS257': { credits: 1 },
  'AIDS259': { credits: 1 },

  // ===== Semester 4 (Total: 25 credits) =====
  'AIDS202': { credits: 3 },
  'AIDS204': { credits: 3 },
  'AIDS206': { credits: 3 },
  'AIDS208': { credits: 3 },
  'AIDS210': { credits: 3 },
  'AIDS212': { credits: 3 },
  'AIDS214': { credits: 1 },   // Effective Technical Writing (NUES)
  'AIDS216': { credits: 1 },   // Emerging Trends in Tech (NUES)
  'AIDS252': { credits: 1 },
  'AIDS254': { credits: 1 },
  'AIDS256': { credits: 1 },
  'AIDS258': { credits: 1 },
  'AIDS260': { credits: 1 },   // Practicum

  // ===== Semester 5 (Total: 26 credits) =====
  'AIDS301': { credits: 4 },
  'AIDS303': { credits: 4 },
  'AIDS305': { credits: 4 },
  'AIDS307': { credits: 3 },
  'AIDS309': { credits: 3 },
  'AIDS311': { credits: 2 },
  'AIDS351': { credits: 1 },
  'AIDS353': { credits: 1 },
  'AIDS355': { credits: 1 },
  'AIDS357': { credits: 1 },
  'AIDS359': { credits: 1 },   // Summer Training Report 1 (NUES)
  'AIDS361': { credits: 1 },   // Seminar Case Study (NUES)

  // ===== Semester 6 (Total: 26 credits) =====
  'AIDS302':  { credits: 3 },
  'AIDS304T': { credits: 3 },
  'AIDS306T': { credits: 3 },
  'OAE304T':  { credits: 3 },
  'OAE310T':  { credits: 4 },
  'AIDS314T': { credits: 4 },
  'AIDS354':  { credits: 1 },
  'AIDS304P': { credits: 1 },
  'AIDS306P': { credits: 1 },
  'OAE304P':  { credits: 1 },
  'HS352':    { credits: 2 },   // NSS/NCC/Clubs (NUES)

  // ===== Semester 7 (Total: 26 credits) =====
  'AIDS401':  { credits: 2 },
  'AIDS409T': { credits: 3 },
  'AIDS411T': { credits: 3 },
  'OAE411T':  { credits: 3 },
  'OAE417T':  { credits: 3 },
  'OAE421T':  { credits: 4 },
  'AIDS409P': { credits: 1 },
  'AIDS411P': { credits: 1 },
  'OAE411P':  { credits: 1 },
  'OAE417P':  { credits: 1 },
  'AIDS451':  { credits: 3 },   // Minor Project
  'AIDS453':  { credits: 1 },   // Summer Training Report 2 (NUES)

  // ===== Semester 8 (Total: 20 credits) =====
  'AIDS456':  { credits: 18 }, // Internship Report and Viva Voce
  'AIDS458':  { credits: 2 },  // Internship Progress Evaluation

  // ===== BA(JMC) Semester 2 (Total: 20 credits) =====
  // Portal returns codes with dashes/parens stripped: BA(JMC)-202 -> BAJMC202.
  'BAJMC202': { credits: 3 },   // Advertising: Concepts and Practices
  'BAJMC204': { credits: 3 },   // Public Relations: Concepts and Practices
  'BAJMC206': { credits: 3 },   // Television Programming and Production
  'BAJMC208': { credits: 3 },   // Corporate Communication
  'BAJMC210': { credits: 3 },   // Television News: Reporting and Anchoring
  'BAJMC212': { credits: 3 },   // Digital Media – Tools and Techniques
  'BAJMC214': { credits: 2 },   // India Knowledge System (IKS)
};
