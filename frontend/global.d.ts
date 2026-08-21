/// <reference types="next" />
/// <reference types="next/image-types/global" />

// CSS module type declarations
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

// Global CSS imports (side-effect imports)
declare module '*.css';
