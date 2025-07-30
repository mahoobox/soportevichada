
import React from 'react';

export const UserCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export const WrenchScrewdriverIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M12 6.75a5.25 5.25 0 015.25 5.25c0 2.396-1.636 4.458-3.854 5.065a.75.75 0 00-.626.443l-1.5 3.75a.75.75 0 01-1.44-.096l-1.5-3.75a.75.75 0 00-.626-.443C7.386 16.458 5.75 14.396 5.75 12a5.25 5.25 0 015.25-5.25zm.626 1.163a.75.75 0 01-1.252 0l-.658-1.096a.75.75 0 01.31-1.033 5.99 5.99 0 017.927 7.927.75.75 0 01-1.033.31l-1.096-.658a.75.75 0 010-1.252l1.096-.658a.75.75 0 011.033-.31 3.49 3.49 0 00-4.624-4.624.75.75 0 01-.31 1.033l.658 1.096z" clipRule="evenodd" />
        <path d="M3.75 12c0-4.965 4.035-9 9-9s9 4.035 9 9-4.035 9-9 9c-1.294 0-2.525-.273-3.666-.778a.75.75 0 01-.42-1.332l1.29-2.15a.75.75 0 00-.45-1.041 5.215 5.215 0 01-2.233-1.622.75.75 0 00-1.042-.45l-2.15 1.29a.75.75 0 01-1.332-.42A8.966 8.966 0 013.75 12z" />
    </svg>
);


export const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6.343 6.343l2.829-2.829M17.657 17.657l2.829-2.829M18 5v4M16 3h4M20.657 6.343l-2.829 2.829M12 21v-4M4.929 19.071l2.828-2.828M19.071 4.929l-2.828 2.828M12 3a9 9 0 110 18 9 9 0 010-18z" />
  </svg>
);

export const ArrowRightIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

export const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const XCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const PaperClipIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.625l-8.485 8.485a1.5 1.5 0 01-2.122-2.122l7.23-7.23" />
  </svg>
);

export const Spinner: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg className={`${className} animate-spin`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);
