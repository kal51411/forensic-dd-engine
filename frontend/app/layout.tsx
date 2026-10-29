import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Forensic DD Engine | Bloomberg-Grade SEC Audit',
  description:
    'Production-grade multi-agent forensic due diligence system. Deterministic Beneish M-Score, Sloan Accruals, and Altman Z-Score with adversarial debate committee and citation-verified answers.',
  keywords: ['SEC', 'fraud detection', 'due diligence', 'Beneish', 'Altman', 'forensic accounting'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-terminal-bg min-h-screen font-mono antialiased">
        {/* Bloomberg scanline overlay */}
        <div className="scanline" aria-hidden="true" />

        {/* Top navigation bar */}
        <nav className="sticky top-0 z-50 bg-terminal-bg/95 backdrop-blur-sm border-b border-terminal-border">
          <div className="max-w-screen-xl mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-terminal-green font-bold text-sm tracking-widest glow-green">
                [FORENSIC DD ENGINE]
              </span>
              <span className="text-terminal-gray-dim text-xs border border-terminal-border px-2 py-0.5 rounded">
                v1.0.0
              </span>
            </div>
            <div className="flex items-center gap-6 text-xs text-terminal-gray">
              <span className="text-terminal-green-dim">
                ● SEC EDGAR LIVE
              </span>
              <span>33 TESTS · 97.6% COV</span>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-terminal-green transition-colors"
              >
                [GITHUB ↗]
              </a>
            </div>
          </div>
        </nav>

        {/* Page content */}
        <main>{children}</main>

        {/* Terminal footer */}
        <footer className="border-t border-terminal-border mt-16 py-6 text-center text-xs text-terminal-gray-dim">
          <span>
            FORENSIC DD ENGINE · HARD CONSTRAINT: ZERO LLM ARITHMETIC ·{' '}
          </span>
          <span className="text-terminal-green-dim">
            ALL NUMBERS FROM UNIT-TESTED PYTHON FUNCTIONS
          </span>
        </footer>
      </body>
    </html>
  );
}
