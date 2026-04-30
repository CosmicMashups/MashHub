import type { ReactNode } from 'react';

export interface LegalSection {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  subSections?: Array<{
    title: string;
    paragraphs?: string[];
    bullets?: string[];
  }>;
}

interface LegalDocumentProps {
  documentTitle: string;
  effectiveDate: string;
  intro?: string;
  sections: LegalSection[];
}

function LegalDocument({ documentTitle, effectiveDate, intro, sections }: LegalDocumentProps) {
  return (
    <div className="space-y-8">
      <header className="rounded-lg border border-theme-border-default bg-theme-surface-base px-4 py-3">
        <h2 className="text-lg font-semibold text-theme-text-primary">{documentTitle}</h2>
        <p className="mt-1 text-sm text-theme-text-secondary">
          <span className="font-medium text-theme-text-primary">Effective Date:</span> {effectiveDate}
        </p>
      </header>

      {intro ? (
        <section className="rounded-lg border border-theme-border-default/70 bg-theme-background-secondary/40 px-4 py-3">
          <p className="text-sm leading-6 text-theme-text-secondary text-justify">{intro}</p>
        </section>
      ) : null}

      <nav aria-label={`${documentTitle} sections`} className="rounded-lg border border-theme-border-default/70 px-4 py-3">
        <p className="text-xs uppercase tracking-wide text-theme-text-muted">Sections</p>
        <ol className="mt-2 space-y-1 text-sm text-theme-text-secondary text-justify">
          {sections.map((section) => (
            <li key={`toc-${section.title}`}>{section.title}</li>
          ))}
        </ol>
      </nav>

      <div className="space-y-5">
      {sections.map((section) => (
        <section key={section.title} className="rounded-lg border border-theme-border-default/70 px-4 py-4 space-y-3">
          <h3 className="text-base font-semibold text-theme-text-primary">{section.title}</h3>
          {section.paragraphs?.map((paragraph) => (
            <p key={paragraph} className="text-sm leading-6 text-theme-text-secondary text-justify">
              {paragraph}
            </p>
          ))}
          {section.bullets && section.bullets.length > 0 ? (
            <ul className="list-disc pl-5 space-y-1.5 text-sm leading-6 text-theme-text-secondary text-justify">
              {section.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          ) : null}
          {section.subSections?.map((subSection) => (
            <div key={subSection.title} className="space-y-2 rounded-md border border-theme-border-default/50 bg-theme-background-secondary/30 px-3 py-3">
              <h4 className="text-sm font-semibold text-theme-text-primary">{subSection.title}</h4>
              {subSection.paragraphs?.map((paragraph) => (
                <p key={paragraph} className="text-sm leading-6 text-theme-text-secondary text-justify">
                  {paragraph}
                </p>
              ))}
              {subSection.bullets && subSection.bullets.length > 0 ? (
                <ul className="list-disc pl-5 space-y-1.5 text-sm leading-6 text-theme-text-secondary text-justify">
                  {subSection.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </section>
      ))}
      </div>
    </div>
  );
}

const privacySections: LegalSection[] = [
  {
    title: '1. Information We Collect',
    subSections: [
      {
        title: '1.1 User-Provided Data',
        paragraphs: ['MashHub allows users to input and manage music-related data, including:'],
        bullets: [
          'Song metadata (title, artist, BPM, key, sections, notes)',
          'Project data (project names, sections, song arrangements, notes)',
          'Imported files (e.g., CSV uploads)',
          'This data is considered user-generated content and remains under your control.',
        ],
      },
      {
        title: '1.2 Automatically Collected Data',
        paragraphs: ['Depending on system configuration, MashHub may collect:'],
        bullets: [
          'Device/browser information (for compatibility and performance)',
          'Usage interactions (feature usage, errors, performance logs)',
          'Local storage data (IndexedDB/Dexie)',
        ],
      },
      {
        title: '1.3 Authentication Data (If Supabase is Enabled)',
        paragraphs: ['When using cloud features:'],
        bullets: [
          'Email or authentication credentials (via Supabase Auth)',
          'User ID associated with projects and data',
          'MashHub does not directly store passwords; authentication is handled securely by the backend provider.',
        ],
      },
    ],
  },
  {
    title: '2. How We Use Your Information',
    paragraphs: ['We process your data for the following purposes:'],
    bullets: [
      'To provide core features (song management, project organization, matching)',
      'To enable intelligent matching and fuzzy logic recommendations',
      'To store and retrieve your projects and song data',
      'To improve system performance and user experience',
      'To enable optional cloud synchronization',
      'We do not sell, rent, or trade your personal data.',
    ],
  },
  {
    title: '3. Data Storage and Processing',
    subSections: [
      {
        title: '3.1 Local Storage (Offline Mode)',
        bullets: [
          'Data is stored on your device using IndexedDB (Dexie).',
          'No data is transmitted externally in offline mode.',
          'You are solely responsible for local data backups.',
        ],
      },
      {
        title: '3.2 Cloud Storage (Supabase Mode)',
        paragraphs: ['When enabled:'],
        bullets: [
          'Data is stored in a secure PostgreSQL database.',
          'Projects are scoped to your authenticated account.',
          'Data transmission is encrypted (HTTPS).',
        ],
      },
      {
        title: '3.3 Dual-Mode Operation',
        paragraphs: ['MashHub uses a fallback architecture:'],
        bullets: [
          'If cloud services fail, the system switches to local storage.',
          'No data loss occurs during fallback.',
          'Offline data is not automatically merged with cloud data upon reconnection.',
        ],
      },
    ],
  },
  {
    title: '4. Data Retention',
    bullets: [
      'Data stored locally remains until deleted by the user or browser.',
      'Cloud data remains until the user deletes it or the account is removed.',
      'Imported data may overwrite existing data during full imports.',
    ],
  },
  {
    title: '5. Data Security',
    paragraphs: ['We implement reasonable safeguards, including:'],
    bullets: [
      'Encrypted communication (HTTPS)',
      'Authentication-based access control (when cloud-enabled)',
      'Local data isolation per device/browser',
      'However, no system is completely secure. Users should avoid storing sensitive personal information in notes or metadata fields.',
    ],
  },
  {
    title: '6. Your Rights',
    paragraphs: ['Depending on your jurisdiction, you may:'],
    bullets: [
      'Access your data',
      'Modify or delete your data',
      'Export your data (via CSV, XLSX, JSON)',
      'Use the app entirely offline',
    ],
  },
  {
    title: '7. Third-Party Services',
    paragraphs: ['MashHub may rely on:'],
    bullets: [
      'Supabase (authentication and database)',
      'Browser storage APIs (IndexedDB)',
      'These services have their own privacy policies.',
    ],
  },
  {
    title: '8. Children’s Privacy',
    paragraphs: ['MashHub is not intended for users under 13. We do not knowingly collect data from children.'],
  },
  {
    title: '9. Changes to This Policy',
    paragraphs: ['We may update this Privacy Policy periodically. Continued use of the app constitutes acceptance of updates.'],
  },
  {
    title: '10. Contact',
    paragraphs: ['For questions or concerns, contact: cosmicminegt@gmail.com'],
  },
];

const termsSections: LegalSection[] = [
  {
    title: '1. Acceptance of Terms',
    paragraphs: ['By accessing or using MashHub, you agree to comply with these terms. If you do not agree, you must discontinue use.'],
  },
  {
    title: '2. Description of Service',
    paragraphs: ['MashHub provides:'],
    bullets: [
      'Music library management',
      'Project-based song organization',
      'Fuzzy logic-based matching and recommendations',
      'Import/export tools',
      'The service is provided "as is" without guarantees of availability or accuracy.',
    ],
  },
  {
    title: '3. User Responsibilities',
    paragraphs: ['You agree to:'],
    bullets: [
      'Provide accurate data when using the system',
      'Use the app only for lawful purposes',
      'Not attempt to disrupt or reverse-engineer the system',
      'Maintain backups of important data',
    ],
  },
  {
    title: '4. Data Ownership',
    bullets: [
      'You retain full ownership of all user-generated content.',
      'MashHub does not claim rights over your songs, projects, or notes.',
      'You are responsible for ensuring you have rights to any uploaded content.',
    ],
  },
  {
    title: '5. Acceptable Use',
    paragraphs: ['You must not:'],
    bullets: [
      'Upload malicious or harmful data',
      'Use the system for illegal distribution of copyrighted material',
      'Exploit system vulnerabilities',
      'Interfere with other users (in future multi-user scenarios)',
    ],
  },
  {
    title: '6. Intellectual Property',
    paragraphs: ['MashHub (including its code, UI, algorithms, and branding) is protected by intellectual property laws. You may not:'],
    bullets: [
      'Copy or redistribute the system',
      'Reverse-engineer proprietary algorithms (e.g., matching logic)',
      'Use MashHub branding without permission',
    ],
  },
  {
    title: '7. Service Availability',
    bullets: [
      'MashHub may operate in online or offline mode.',
      'MashHub does not guarantee continuous uptime.',
      'MashHub may modify or discontinue features at any time.',
    ],
  },
  {
    title: '8. Limitation of Liability',
    paragraphs: ['MashHub is not liable for:'],
    bullets: [
      'Data loss (including local storage loss)',
      'Incorrect matching or recommendations',
      'System downtime or errors',
      'Any indirect or consequential damages',
    ],
  },
  {
    title: '9. Data Loss Disclaimer',
    paragraphs: ['Users acknowledge that:'],
    bullets: [
      'Local storage (IndexedDB) may be cleared by the browser.',
      'Offline data is not automatically backed up.',
      'Cloud sync is dependent on external services.',
      'Users are encouraged to use export features for backups.',
    ],
  },
  {
    title: '10. Termination',
    paragraphs: ['We reserve the right to suspend or terminate access (if abuse is detected) and remove data if required for legal compliance.'],
  },
  {
    title: '11. Modifications to Terms',
    paragraphs: ['We may update these Terms at any time. Continued use constitutes acceptance.'],
  },
  {
    title: '12. Governing Law',
    paragraphs: ['These Terms shall be governed by applicable laws in the user’s jurisdiction unless otherwise specified.'],
  },
  {
    title: '13. Contact',
    paragraphs: ['For legal inquiries: cosmicminegt@gmail.com'],
  },
];

export const PRIVACY_POLICY_CONTENT: ReactNode = (
  <LegalDocument
    documentTitle="Privacy Policy"
    effectiveDate="01 May 2026"
    intro="MashHub is a music library and project management system designed for DJs, producers, and mashup creators. This Privacy Policy explains how we collect, use, store, and protect your information when you use MashHub."
    sections={privacySections}
  />
);

export const TERMS_OF_SERVICE_CONTENT: ReactNode = (
  <LegalDocument
    documentTitle="Terms of Service"
    effectiveDate="01 May 2026"
    intro="By using MashHub, you agree to the terms outlined in this document."
    sections={termsSections}
  />
);
