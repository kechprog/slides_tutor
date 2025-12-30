export type HighlightStyle = 'glow' | 'underline' | 'background' | 'border' | 'pulse';

export interface HighlightConfig {
  style: HighlightStyle;
  color: string;
  showIndicator: boolean; // speech bubble icon
}
