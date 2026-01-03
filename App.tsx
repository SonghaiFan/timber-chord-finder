
import React, { useState, useEffect, useMemo } from 'react';
import WoodGrain from './components/WoodGrain';
import Controls from './components/Controls';
import Fretboard from './components/Fretboard';
import { CHORD_TYPES, TUNINGS, SCALES } from './constants';
import { RootNote, ChordType, TuningDefinition, ScaleDefinition } from './types';
import { getNoteName, getNoteValue, generateChords } from './utils/chordEngine';

const App: React.FC = () => {
  const [root, setRoot] = useState<RootNote>('C');
  const [quality, setQuality] = useState<ChordType>(CHORD_TYPES[0]); // Default to Major
  const [bass, setBass] = useState<RootNote>('C'); // Slash chord bass

  const [tuning, setTuning] = useState<TuningDefinition>(TUNINGS[0]);
  const [capo, setCapo] = useState<number>(0);
  const [isLefty, setIsLefty] = useState<boolean>(false);
  const [preferFlats, setPreferFlats] = useState<boolean | null>(null); // null = auto
  const [showAllNotes, setShowAllNotes] = useState<boolean>(false);
  const [selectedScale, setSelectedScale] = useState<ScaleDefinition | null>(null);
  const [showIntervals, setShowIntervals] = useState<boolean>(false);

  const [variationIndex, setVariationIndex] = useState(0);

  // Sync Bass with Root initially or when user explicitly changes root (optional UX choice)
  useEffect(() => {
    setBass(root);
  }, [root]);

  // Generate chords
  const variations = useMemo(() => {
    const rootVal = getNoteValue(root);
    const bassVal = bass === root ? null : getNoteValue(bass);
    return generateChords(rootVal, quality.intervals, tuning.offsets, capo, bassVal);
  }, [root, quality, bass, tuning, capo]);

  // Reset variation index when parameters change
  useEffect(() => {
    setVariationIndex(0);
  }, [root, quality, bass, tuning, capo]);

  const currentVariation = variations[variationIndex] || null;

  // Determine whether to use flats or sharps
  const useFlats = preferFlats !== null
    ? preferFlats
    : (root.includes('b') || root.includes('\u266d'));

  const rootName = getNoteName(getNoteValue(root), useFlats);
  const bassName = getNoteName(getNoteValue(bass), useFlats);
  const displayName = `${rootName} ${quality.name}${bass !== root ? ` / ${bassName}` : ''}`;

  return (
    <div className="fixed inset-0 w-full h-full bg-[#120c08] flex items-center justify-center p-3 lg:p-8 font-sans text-[#e6c190] overflow-hidden">

      <WoodGrain />

      {/* Footer Credit */}
      <div className="absolute bottom-2 right-4 z-50 text-[10px] text-[#c29b6d]/40 font-mono pointer-events-none select-none">
        Made by Songhai Fan
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-6xl h-full flex flex-col lg:flex-row gap-3 lg:gap-8">

        {/* Left Column: Controls */}
        {/* Mobile: Dynamic height based on expansion. Desktop: Full height. */}
        <div className="flex-shrink-0 w-full lg:w-[360px] max-h-[50vh] lg:max-h-full lg:h-full flex flex-col min-h-0 transition-all duration-500 ease-in-out">
          <Controls
            selectedRoot={root}
            selectedQuality={quality}
            selectedBass={bass}
            tuning={tuning}
            capo={capo}
            isLefty={isLefty}
            preferFlats={preferFlats}
            showAllNotes={showAllNotes}
            variations={variations}
            variationIndex={variationIndex}
            onRootChange={setRoot}
            onQualityChange={setQuality}
            onBassChange={setBass}
            onTuningChange={setTuning}
            onCapoChange={setCapo}
            onLeftyChange={setIsLefty}
            onPreferFlatsChange={setPreferFlats}
            showAllNotes={showAllNotes}
            onShowAllNotesChange={setShowAllNotes}
            selectedScale={selectedScale}
            onScaleChange={setSelectedScale}
            showIntervals={showIntervals}
            onShowIntervalsChange={setShowIntervals}
            onVariationSelect={setVariationIndex}
          />
        </div>

        {/* Right Column: Fretboard */}
        <div className="flex-1 min-h-0 flex flex-col">
          <Fretboard
            chordName={displayName}
            formula={quality.formula}
            aliases={quality.aliases}
            variation={currentVariation}
            tuning={tuning}
            capo={capo}
            isLefty={isLefty}
            showAllNotes={showAllNotes}
            selectedScale={selectedScale}
            showIntervals={showIntervals}
            variationIndex={variationIndex}
            totalVariations={variations.length}
            onVariationChange={setVariationIndex}
          />
        </div>

      </div>
    </div>
  );
};

export default App;
