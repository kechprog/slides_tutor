'use client';

import { palettes, ColorPalette } from '@/lib/palettes';

interface PaletteSelectorProps {
  selectedPaletteId: string;
  onSelect: (paletteId: string) => void;
}

interface ColorSwatchProps {
  color: string;
  label: string;
}

function ColorSwatch({ color, label }: ColorSwatchProps) {
  return (
    <div
      className="w-4 h-4 rounded-sm border border-gray-300"
      style={{ backgroundColor: color }}
      title={label}
    />
  );
}

interface PalettePreviewProps {
  palette: ColorPalette;
  isSelected: boolean;
  onSelect: () => void;
}

function PalettePreview({ palette, isSelected, onSelect }: PalettePreviewProps) {
  const { colors } = palette;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`
        w-full p-3 rounded-lg border-2 transition-all text-left
        hover:shadow-md
        ${isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
          {palette.name}
        </span>
        {isSelected && (
          <svg
            className="w-4 h-4 text-blue-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>
      <div className="flex gap-1">
        <ColorSwatch color={colors.background} label="Background" />
        <ColorSwatch color={colors.text} label="Text" />
        <ColorSwatch color={colors.accent} label="Accent" />
        <ColorSwatch color={colors.secondary} label="Secondary" />
        <ColorSwatch color={colors.highlight} label="Highlight" />
      </div>
    </button>
  );
}

export function PaletteSelector({ selectedPaletteId, onSelect }: PaletteSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Color Palette
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {palettes.map((palette) => (
          <PalettePreview
            key={palette.id}
            palette={palette}
            isSelected={palette.id === selectedPaletteId}
            onSelect={() => onSelect(palette.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default PaletteSelector;
