'use client';

import { useSettings } from '@/context/SettingsContext';
import { SubtitleSize } from '@/lib/subtitles/types';

export function SubtitleSettings() {
  const { settings, updateSettings } = useSettings();

  return (
    <div className="subtitle-settings">
      <h3 className="text-lg font-semibold mb-4">Subtitle Settings</h3>

      {/* Enable/Disable Toggle */}
      <div className="setting-row mb-4">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.subtitlesEnabled}
            onChange={(e) => updateSettings({ subtitlesEnabled: e.target.checked })}
            className="mr-3 h-5 w-5"
          />
          <span>Enable Subtitles</span>
        </label>
      </div>

      {/* Size Selector */}
      <div className="setting-row mb-4">
        <label className="block mb-2">Size</label>
        <select
          value={settings.subtitleSize}
          onChange={(e) => updateSettings({ subtitleSize: e.target.value as SubtitleSize })}
          disabled={!settings.subtitlesEnabled}
          className="w-full p-2 border rounded disabled:opacity-50"
        >
          <option value="small">Small (14px)</option>
          <option value="medium">Medium (18px)</option>
          <option value="large">Large (24px)</option>
        </select>
      </div>

      {/* Position Selector */}
      <div className="setting-row mb-4">
        <label className="block mb-2">Position</label>
        <select
          value={settings.subtitlePosition}
          onChange={(e) => updateSettings({ subtitlePosition: e.target.value as 'top' | 'bottom' })}
          disabled={!settings.subtitlesEnabled}
          className="w-full p-2 border rounded disabled:opacity-50"
        >
          <option value="top">Top</option>
          <option value="bottom">Bottom</option>
        </select>
      </div>

      {/* Background Style Selector */}
      <div className="setting-row mb-4">
        <label className="block mb-2">Background Style</label>
        <select
          value={settings.subtitleBackground}
          onChange={(e) => updateSettings({ subtitleBackground: e.target.value as 'solid' | 'blur' | 'none' })}
          disabled={!settings.subtitlesEnabled}
          className="w-full p-2 border rounded disabled:opacity-50"
        >
          <option value="solid">Solid</option>
          <option value="blur">Blur</option>
          <option value="none">None (Text Shadow Only)</option>
        </select>
      </div>
    </div>
  );
}
