import type { SVGProps } from "react";
import Image from 'next/image';

export const Icons = {
  logo: (props: Omit<React.ComponentProps<typeof Image>, 'src' | 'alt'>) => (
    <Image 
        src="https://www.mpbfoundationhsschool.com/images/logo.png" 
        alt="M.P. Birla Foundation H.S. School Logo"
        width={props.width || 40}
        height={props.height || 40}
        {...props} 
    />
  ),
};
