export interface NarrationItem {
  id: string;                    // Unique ID for highlighting
  text: string;                  // Narration text to speak
  delay: number;                 // Delay after speaking (ms)
  elementPath: number[];         // Path to element in slide tree
  slideIndex: number;            // Which slide this belongs to
}
