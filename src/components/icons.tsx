import type { SVGProps } from "react";
import Image from 'next/image';

export const Icons = {
  logo: ({ width, height, className }: { width?: number; height?: number; className?: string }) => (
    <Image 
        src="https://www.mpbfoundationhsschool.com/images/logo.png" 
        alt="M.P. Birla Foundation H.S. School Logo"
        width={width || 40}
        height={height || 40}
        className={className}
    />
  ),
};
