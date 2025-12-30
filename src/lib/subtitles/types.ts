export type SubtitleSize = 'small' | 'medium' | 'large';

export interface SubtitleConfig {
  enabled: boolean;
  size: SubtitleSize;
  position: 'top' | 'bottom';
  background: 'solid' | 'blur' | 'none';
}
