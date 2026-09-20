import { SVGProps } from 'react';

export function USFlag(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 30 30"
      {...props}
    >
      <defs>
        <clipPath id="circleClip">
          <circle cx="15" cy="15" r="15" />
        </clipPath>
      </defs>
      <g clipPath="url(#circleClip)">
        <rect width="30" height="30" fill="#002868" />
        <path
          fill="#fff"
          d="M0 3h30v3H0zm0 6h30v3H0zm0 6h30v3H0zm0 6h30v3H0z"
        />
        <path fill="#bf0a30" d="M0 0h30v3H0zm0 6h30v3H0zm0 6h30v3H0z" />
        <path fill="#fff" d="M0 0h15v15H0z" />
        <path
          fill="#002868"
          d="M1.5 1.5h2.25v1.5H1.5zm3 0h2.25v1.5H4.5zm3 0h2.25v1.5H7.5zm3 0h2.25v1.5h-2.25zm3 0h2.25v1.5h-2.25zM3 4.5h2.25v1.5H3zm3 0h2.25v1.5H6zm3 0h2.25v1.5H9zm3 0h2.25v1.5h-2.25zM1.5 7.5h2.25v1.5H1.5zm3 0h2.25v1.5H4.5zm3 0h2.25v1.5H7.5zm3 0h2.25v1.5h-2.25zm3 0h2.25v1.5h-2.25zM3 10.5h2.25v1.5H3zm3 0h2.25v1.5H6zm3 0h2.25v1.5H9zm3 0h2.25v1.5h-2.25zM1.5 13.5h2.25v1.5H1.5zm3 0h2.25v1.5H4.5zm3 0h2.25v1.5H7.5zm3 0h2.25v1.5h-2.25zm3 0h2.25v1.5h-2.25z"
        />
      </g>
    </svg>
  );
}