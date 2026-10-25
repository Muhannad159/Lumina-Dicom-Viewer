import type { SVGProps } from 'react';

/** A simple framed L; currentColor follows the active palette. */
export default function LuminaLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" {...props}>
      <path
        d="M31 7H17A10 10 0 0 0 7 17v14a10 10 0 0 0 10 10h14a10 10 0 0 0 10-10V17A10 10 0 0 0 31 7Z"
        stroke="currentColor"
        strokeWidth="2"
        opacity=".4"
      />
      <path
        d="M18 15v17h15"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
