
import { SVGProps } from 'react';

export function MandobakLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 200 40"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <text 
        x="0" 
        y="30" 
        fontFamily="Gimbalgrot, sans-serif" 
        fontSize="30" 
        fill="hsl(var(--primary))"
      >
        Mandobak
      </text>
    </svg>
  );
}
