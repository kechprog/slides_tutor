export interface ColorPalette {
  id: string;
  name: string;
  colors: {
    background: string;
    text: string;
    accent: string;
    secondary: string;
    highlight: string;
  };
}
