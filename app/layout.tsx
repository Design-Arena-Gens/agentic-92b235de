import './globals.css';
import React from 'react';

export const metadata = {
  title: '20-Day Python + AI Planner',
  description: 'Daily learning plan with reminders and calendar export',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <header>
            <h1>20-Day Python + AI Planner</h1>
          </header>
          <main>{children}</main>
          <footer>
            <p>Built with Next.js</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
