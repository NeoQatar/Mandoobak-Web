import { SVGProps } from 'react';

export function QatarFlag(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      {...props}
    >
      <defs>
        <clipPath id="circleClip">
          <circle cx="50" cy="50" r="50" />
        </clipPath>
      </defs>
      <g clipPath="url(#circleClip)">
        <rect width="100" height="100" fill="#fff" />
        <path
          fill="#8d1b3d"
          d="M29.5 0l4.46 3.93-4.46 3.93 4.46 3.93-4.46 3.93 4.46 3.93-4.46 3.93 4.46 3.93-4.46 3.93L29.5 39.3V100H100V0z"
          transform="scale(2.5)"
        />
      </g>
    </svg>
  );
}