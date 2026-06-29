// PaperMeta is defined here (not imported from grading.ts) to avoid a circular dependency.
export type PaperMeta = { credits: number; isAudit?: boolean; isOptional?: boolean };

// Paper codes use portal format (dashes/parens stripped: BA(JMC)-202 -> BAJMC202).
//
// The map is split by scheme. B.Tech AIDS codes never collide with BA(JMC) codes,
// so they live in a shared base. The two BA(JMC) schemes DO reuse the same codes
// with different credits, so they are kept apart and chosen by year of admission
// via creditsForBatch(). See that function for the cutoff.

// Credit maps keyed by scheme. creditsForBatch() picks the right BA(JMC) scheme
// by year of admission and merges the always-applicable B.Tech base on top.
const CREDIT_MAP: Record<string, Record<string, PaperMeta>> = {
  // AIDS B.Tech (USAR/MAIT, batch admitted 2022-23 onwards), from official PDFs.
  BTECH: {
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
  },

  // =========================================================================
  // BA(JMC) — 2025 NEP scheme (Batch 2024–2028 / 2025–2029), 8-sem honours.
  // Lookup table: a student's result lists only the papers/electives they took,
  // so per-semester scheme maxima are higher than the stated semester totals
  // (one of each "(Elective)" pair is realised).
  // =========================================================================
  BAJMC_NEP: {
  // ===== BA(JMC) Semester I =====
  'BAJMC101': { credits: 3 },   // Introduction to Communication
  'BAJMC103': { credits: 3 },   // Socio, Economic and Political Overview
  'BAJMC105': { credits: 3 },   // Basics of Design and Graphics
  'BAJMC107': { credits: 3 },   // Cultural Communication (Elective)
  'BAJMC109': { credits: 3 },   // Personality Development (Elective)
  'BAJMC111': { credits: 3 },   // Writing Skills for Media
  'BAJMC113': { credits: 3 },   // Basics of English Language
  'BAJMC115': { credits: 2 },   // Human Values & Professional Ethics
  'BAJMC117': { credits: 2 },   // MOOCs
  'BAJMC151': { credits: 1 },   // Communication Skills Lab
  'BAJMC153': { credits: 1 },   // Design & Graphics Lab
  'BAJMC155': { credits: 1 },   // Cultural Communication Lab
  'BAJMC157': { credits: 1 },   // Personality Development Lab
  'BAJMC159': { credits: 1 },   // Writing Skills for Media Lab

  // ===== BA(JMC) Semester II =====
  'BAJMC102': { credits: 3 },   // Development Communication
  'BAJMC104': { credits: 3 },   // Reporting & Editing for Print Journalism
  'BAJMC106': { credits: 3 },   // Media Laws and Ethics
  'BAJMC108': { credits: 3 },   // Health Communication (Elective)
  'BAJMC110': { credits: 3 },   // Sports Journalism (Elective)
  'BAJMC112': { credits: 3 },   // Still Photography
  'BAJMC114': { credits: 3 },   // Basics of Hindi Language
  'BAJMC116': { credits: 2 },   // Thoughts, Ideas and Experiments for Developed India
  'BAJMC152': { credits: 1 },   // Reporting & Editing Lab
  'BAJMC154': { credits: 1 },   // Still Photography Lab
  'BAJMC156': { credits: 4 },   // Project & Viva I

  // ===== BA(JMC) Semester III =====
  'BAJMC201': { credits: 3 },   // History of Journalism: Print, Electronic & Digital
  'BAJMC203': { credits: 3 },   // Radio Programming & Production
  'BAJMC205': { credits: 3 },   // Basics of Video Camera, Lights & Sound
  'BAJMC207': { credits: 3 },   // Investigative Journalism (Elective)
  'BAJMC209': { credits: 3 },   // Radio Jockeying & News Reading (Elective)
  'BAJMC211': { credits: 3 },   // Audio and Video Editing
  'BAJMC213': { credits: 2 },   // Environmental Studies
  'BAJMC215': { credits: 2 },   // MOOCs
  'BAJMC251': { credits: 1 },   // Radio Production Lab
  'BAJMC253': { credits: 1 },   // Video Production Lab
  'BAJMC255': { credits: 1 },   // Audio & Video Editing Lab
  'BAJMC257': { credits: 4 },   // Summer Training Report I

  // ===== BA(JMC) Semester IV =====
  'BAJMC202': { credits: 3 },   // Advertising: Concepts & Practices
  'BAJMC204': { credits: 3 },   // Public Relations: Concepts & Practices
  'BAJMC206': { credits: 3 },   // TV Programming & Production
  'BAJMC208': { credits: 3 },   // Corporate Communication (Elective)
  'BAJMC210': { credits: 3 },   // TV News Reporting & Anchoring (Elective)
  'BAJMC212': { credits: 3 },   // Digital Media – Tools & Techniques
  'BAJMC214': { credits: 2 },   // Indian Knowledge System (IKS)
  'BAJMC252': { credits: 1 },   // Advertising Lab
  'BAJMC254': { credits: 1 },   // Public Relations Lab
  'BAJMC256': { credits: 1 },   // TV Production Lab
  'BAJMC258': { credits: 1 },   // Corporate Communication Lab
  'BAJMC260': { credits: 1 },   // TV News Reporting & Anchoring Lab
  'BAJMC262': { credits: 1 },   // Digital Media Lab
  'BAJMC264': { credits: 4 },   // Project & Viva II

  // ===== BA(JMC) Semester V =====
  'BAJMC301': { credits: 3 },   // Event Management
  'BAJMC303': { credits: 3 },   // Communication Research
  'BAJMC305': { credits: 3 },   // Integrated Marketing Communication
  'BAJMC307': { credits: 3 },   // Theatre Appreciation (Elective)
  'BAJMC309': { credits: 3 },   // Film Appreciation (Elective)
  'BAJMC311': { credits: 3 },   // Content Creation for Digital Media
  'BAJMC313': { credits: 2 },   // Entrepreneurial Mindset
  'BAJMC315': { credits: 2 },   // MOOCs
  'BAJMC351': { credits: 1 },   // Event Management Lab
  'BAJMC353': { credits: 1 },   // Communication Research Lab
  'BAJMC355': { credits: 1 },   // Integrated Marketing Communication Lab
  'BAJMC357': { credits: 4 },   // Summer Training Report II

  // ===== BA(JMC) Semester VI =====
  'BAJMC302': { credits: 3 },   // Global Media Scenario
  'BAJMC304': { credits: 3 },   // Media Organization & Management
  'BAJMC306': { credits: 3 },   // Data Journalism (Elective)
  'BAJMC308': { credits: 3 },   // Digital Film Making (Elective)
  'BAJMC310': { credits: 3 },   // Digital Media Marketing
  'BAJMC352': { credits: 1 },   // Data Journalism Lab
  'BAJMC354': { credits: 1 },   // Digital Film Making Lab
  'BAJMC356': { credits: 1 },   // Digital Media Marketing Lab
  'BAJMC358': { credits: 4 },   // Project & Viva III
  'BAJMC360': { credits: 2 },   // NCC/NSS/Community Engagement

  // ===== BA(JMC) Semester VII (Honours) =====
  'BAJMC401': { credits: 3 },   // Media Literacy
  'BAJMC403': { credits: 3 },   // OTT Content Production & Promotion
  'BAJMC405': { credits: 3 },   // Podcast Production (Elective)
  'BAJMC407': { credits: 3 },   // AI Tools for Media (Elective)
  'BAJMC409': { credits: 3 },   // Basics of Animation
  'BAJMC451': { credits: 1 },   // OTT Content Production Lab
  'BAJMC453': { credits: 1 },   // Podcast Production Lab
  'BAJMC455': { credits: 1 },   // AI Tools for Media Lab
  'BAJMC457': { credits: 4 },   // Summer Training Report III

  // ===== BA(JMC) Semester VIII (Honours) =====
  'BAJMC452': { credits: 8 },   // Major Project & Placement Portfolio
  'BAJMC454': { credits: 8 },   // Comprehensive Viva
  },

  // =========================================================================
  // BA(JMC) — 2022 CBCS scheme (revised syllabus, effective Academic Session
  // 2022–23), 6-semester degree. NUES papers are counted (not audit), matching
  // the B.Tech convention above.
  // =========================================================================
  BAJMC_2022: {
  // Section totals are the official per-semester credits; the object lists ALL
  // electives, so summing every entry exceeds them (a student takes one of each pair).
  // ===== Semester I (Official total: 26 credits) =====
  'BAJMC101': { credits: 4 },   // Communication: Concepts & Processes
  'BAJMC103': { credits: 4 },   // Contemporary India: An Overview
  'BAJMC105': { credits: 4 },   // Basics of Design and Graphics
  'BAJMC107': { credits: 4 },   // Personality Development (Elective)
  'BAJMC109': { credits: 4 },   // Writing Skills (Elective)
  'BAJMC111': { credits: 4 },   // Indian Culture (Foreign Students Only)
  'BAJMC113': { credits: 2 },   // Human Values and Ethics (NUES)
  'BAJMC151': { credits: 2 },   // Communication Skills Lab
  'BAJMC153': { credits: 2 },   // Contemporary India: Issues & Debates (Seminar)
  'BAJMC155': { credits: 2 },   // Design & Graphics Lab – I
  'BAJMC157': { credits: 2 },   // Personality Development Lab
  'BAJMC159': { credits: 2 },   // Writing Skills Lab

  // ===== Semester II (Official total: 24 credits) =====
  'BAJMC102': { credits: 4 },   // Print Journalism
  'BAJMC104': { credits: 4 },   // Media Laws and Ethics
  'BAJMC106': { credits: 4 },   // Still Photography
  'BAJMC108': { credits: 4 },   // Health Communication (Elective)
  'BAJMC110': { credits: 4 },   // Sports Journalism (Elective)
  'BAJMC152': { credits: 2 },   // Print Journalism Lab
  'BAJMC154': { credits: 2 },   // Still Photography Lab
  'BAJMC156': { credits: 2 },   // Design & Graphics Lab – II
  'BAJMC158': { credits: 2 },   // Health Communication Lab
  'BAJMC160': { credits: 2 },   // Sports Journalism Lab

  // ===== Semester III (Official total: 26 credits) =====
  'BAJMC201': { credits: 4 },   // Development Communication
  'BAJMC203': { credits: 4 },   // Basics of Radio Programming and Production
  'BAJMC205': { credits: 4 },   // Basics of Video Camera, Lights and Sound
  'BAJMC207': { credits: 4 },   // Radio Jockeying and News Reading (Elective)
  'BAJMC209': { credits: 4 },   // Video Editing (Elective)
  'BAJMC251': { credits: 2 },   // Radio Production Lab
  'BAJMC253': { credits: 2 },   // Video Production Lab
  'BAJMC255': { credits: 4 },   // Summer Training Report
  'BAJMC257': { credits: 2 },   // Radio Jockeying & News Reading Lab
  'BAJMC259': { credits: 2 },   // Video Editing Lab

  // ===== Semester IV (Official total: 24 credits) =====
  'BAJMC202': { credits: 4 },   // Basics of Advertising
  'BAJMC204': { credits: 4 },   // Basics of Public Relations
  'BAJMC206': { credits: 4 },   // Television Programming and Production
  'BAJMC208': { credits: 4 },   // Television News: Reporting & Anchoring (Elective)
  'BAJMC210': { credits: 4 },   // Corporate Communication (Elective)
  'BAJMC252': { credits: 2 },   // Advertising Lab
  'BAJMC254': { credits: 2 },   // Public Relations Lab
  'BAJMC256': { credits: 2 },   // TV Production Lab
  'BAJMC258': { credits: 2 },   // Television News: Reporting & Anchoring Lab
  'BAJMC260': { credits: 2 },   // Corporate Communication Lab

  // ===== Semester V (Official total: 28 credits) =====
  'BAJMC301': { credits: 4 },   // Basics of New Media
  'BAJMC303': { credits: 4 },   // Media Research
  'BAJMC305': { credits: 4 },   // Event Management
  'BAJMC307': { credits: 4 },   // Digital Media Marketing (Elective)
  'BAJMC309': { credits: 4 },   // Film Appreciation (Elective)
  'BAJMC351': { credits: 2 },   // New Media Lab
  'BAJMC353': { credits: 2 },   // Media Research Lab
  'BAJMC355': { credits: 2 },   // Event Management Lab
  'BAJMC357': { credits: 4 },   // Functional Exposure Report
  'BAJMC359': { credits: 2 },   // Digital Media Marketing Lab
  'BAJMC361': { credits: 2 },   // Film Appreciation Lab

  // ===== Semester VI (Official total: 26 credits) =====
  'BAJMC302': { credits: 4 },   // Media Management and Entrepreneurship
  'BAJMC304': { credits: 4 },   // Global Media: An Overview
  'BAJMC306': { credits: 4 },   // Environmental Studies
  'BAJMC308': { credits: 2 },   // Entrepreneurial Mindset
  'BAJMC352': { credits: 10 },  // Final Project and Comprehensive Viva
  'BAJMC354': { credits: 2 },   // NCC/NSS/Community Engagement/Socio-Cultural Outreach (NUES)
  },
};

// Choose the credit map for a student by their year of admission (stprofile.yoa).
// BA(JMC) reuses the same codes across schemes, so the batch decides which credits
// apply. The B.Tech base is always merged in (its codes never collide).
//
// Batch years are enumerated explicitly rather than using `yoa >= 2024`: when IPU
// introduces the next scheme (say 2027), the `default` keeps it on NEP, which will
// be WRONG — so add an explicit case for the new batches and point it at the new
// map. Listing known years makes that maintenance obvious instead of silent.
export function creditsForBatch(yoa: number): Record<string, PaperMeta> {
  switch (yoa) {
    case 2022:
    case 2023:
      return { ...CREDIT_MAP.BTECH, ...CREDIT_MAP.BAJMC_2022 };

    case 2024:
    case 2025:
      return { ...CREDIT_MAP.BTECH, ...CREDIT_MAP.BAJMC_NEP };

    default:
      // Assume future BA(JMC) batches continue on the current NEP scheme
      // until a newer official curriculum is added.
      return { ...CREDIT_MAP.BTECH, ...CREDIT_MAP.BAJMC_NEP };
  }
}
