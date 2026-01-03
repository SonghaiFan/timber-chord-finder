
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { TuningDefinition, ChordVariation, ScaleDefinition, RootNote } from '../types';
import { getNoteName, getNoteValue } from '../utils/chordEngine';
import { CHORD_TYPES, SCALES } from '../constants';
import { playNote, playChord } from '../utils/audioEngine';

interface FretboardProps {
  chordName: string;
  formula: string;
  aliases?: string;
  variation: ChordVariation | null;
  tuning: TuningDefinition;
  capo: number;
  isLefty: boolean;
  showAllNotes: boolean;
  selectedScale: ScaleDefinition | null;
  showIntervals: boolean;
  variationIndex: number;
  totalVariations: number;
  onVariationChange: (index: number) => void;
}

const INTERVAL_NAMES = ["1", "b2", "2", "b3", "3", "4", "b5", "5", "b6", "6", "b7", "7"];

const Fretboard: React.FC<FretboardProps> = ({
  chordName,
  formula,
  aliases,
  variation,
  tuning,
  capo,
  isLefty,
  showAllNotes,
  selectedScale,
  showIntervals,
  variationIndex,
  totalVariations,
  onVariationChange
}) => {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const [showSwipeHint, setShowSwipeHint] = useState(totalVariations > 1);
  const [viewHeight, setViewHeight] = useState(0);

  // Calculate target notes (pitch classes)
  const { targetNotes, rootVal } = useMemo(() => {
    if (!chordName) return { targetNotes: new Set<number>(), rootVal: 0 };

    const rootStr = chordName.split(' ')[0];
    const rVal = getNoteValue(rootStr);

    // Find chord type by formula
    const chordType = CHORD_TYPES.find(c => c.formula === formula);

    if (!chordType) return { targetNotes: new Set<number>(), rootVal: rVal };

    const notes = new Set<number>();
    chordType.intervals.forEach(interval => {
      notes.add((rVal + interval) % 12);
    });

    return { targetNotes: notes, rootVal: rVal };
  }, [chordName, formula]);

  // Calculate scale notes
  const scaleNotes = useMemo(() => {
    if (!selectedScale || !chordName) return new Set<number>();
    const rootStr = chordName.split(' ')[0];
    const rVal = getNoteValue(rootStr);
    const notes = new Set<number>();
    selectedScale.intervals.forEach(interval => {
      notes.add((rVal + interval) % 12);
    });
    return notes;
  }, [selectedScale, chordName]);

  const useFlats = chordName.includes('b') || chordName.includes('\u266d');

  const getNoteLabel = (pitch: number) => {
    if (showIntervals) {
      const interval = (pitch - rootVal + 12) % 12;
      return INTERVAL_NAMES[interval];
    }
    return getNoteName(pitch, useFlats);
  };

  // Config for Vertical Fretboard
  const headstockHeight = 80;
  const fretSpacing = 50;
  const minFrets = 22;

  // Calculate total frets to fill the view height
  const fretsToFill = viewHeight > 0 ? Math.ceil((viewHeight - headstockHeight) / fretSpacing) : 0;
  const totalFrets = Math.max(minFrets, fretsToFill);

  const stringNames = tuning.offsets.map(offset => getNoteName(offset, useFlats));

  // Dimensions
  const numStrings = tuning.offsets.length;
  const stringSpacing = 44;
  const boardPadding = 30;
  const boardWidth = (numStrings - 1) * stringSpacing + (boardPadding * 2);
  const boardHeight = totalFrets * fretSpacing;

  const getStringX = (index: number) => {
    const x = boardPadding + (index * stringSpacing);
    if (isLefty) {
      return boardWidth - x; // Mirror
    }
    return x;
  };

  // Fret Y position (location of the metal wire)
  const getFretY = (fretNum: number) => headstockHeight + (fretNum * fretSpacing);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (totalVariations <= 1) {
      setShowSwipeHint(false);
      return;
    }
    setShowSwipeHint(true);
    const timer = setTimeout(() => setShowSwipeHint(false), 4000);
    return () => clearTimeout(timer);
  }, [totalVariations]);

  // Ref to hold latest props/state for event handlers
  const stateRef = useRef({ variationIndex, totalVariations, onVariationChange });
  useEffect(() => {
    stateRef.current = { variationIndex, totalVariations, onVariationChange };
  }, [variationIndex, totalVariations, onVariationChange]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Resize Observer to update viewHeight
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setViewHeight(entry.contentRect.height);
      }
    });
    resizeObserver.observe(container);

    const onTouchStart = (e: TouchEvent) => {
      const { totalVariations } = stateRef.current;
      if (totalVariations <= 1) return;
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    };

    const onTouchMove = (e: TouchEvent) => {
      const { totalVariations } = stateRef.current;
      if (!touchStartRef.current || totalVariations <= 1) return;
      const touch = e.touches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;

      // If user is clearly swiping horizontally, prevent vertical scroll jitter.
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 25) {
        if (e.cancelable) e.preventDefault();
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      const { variationIndex, totalVariations, onVariationChange } = stateRef.current;
      const start = touchStartRef.current;
      touchStartRef.current = null;
      if (!start || totalVariations <= 1) return;

      const touch = e.changedTouches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      const dt = Date.now() - start.time;

      const horizontalSwipe = Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) && dt < 800;

      if (horizontalSwipe) {
        if (dx < 0) {
          onVariationChange((variationIndex + 1) % totalVariations);
        } else {
          onVariationChange((variationIndex - 1 + totalVariations) % totalVariations);
        }
        setShowSwipeHint(false);
      }
    };

    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      resizeObserver.disconnect();
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  // Auto-scroll logic
  useEffect(() => {
    if (variation && scrollContainerRef.current) {
      // Calculate visible frets (absolute)
      const absoluteFrets = variation.frets
        .filter(f => f >= 0)
        .map(f => (f === 0 && capo === 0) ? 0 : f + capo); // If open string no capo, 0. If open string with capo, absolute fret is capo.

      let targetScroll = 0;

      if (absoluteFrets.length > 0) {
        const minFret = Math.min(...absoluteFrets.filter(f => f > 0)); // Ignore nut for scrolling usually, unless all open
        const maxFret = Math.max(...absoluteFrets);

        // If we only have open strings (at nut), minFret might be Infinity.
        const effectiveMin = minFret === Infinity ? 0 : minFret;

        const startPx = headstockHeight + ((effectiveMin - 1) * fretSpacing);
        const endPx = headstockHeight + (maxFret * fretSpacing);
        const centerPx = (startPx + endPx) / 2;

        const containerHeight = scrollContainerRef.current.clientHeight;
        targetScroll = centerPx - (containerHeight / 2);
      }

      scrollContainerRef.current.scrollTo({
        top: Math.max(0, targetScroll),
        behavior: 'smooth'
      });
    }
  }, [variation, chordName, isLefty, capo]);

  return (
    <div className="relative flex flex-col h-full w-full max-w-md mx-auto lg:max-w-none">

      {/* Chord Info Bar - Skeuomorphic "Display" (Unified for Mobile & Desktop) */}
      <div className="mb-3 lg:mb-6">
        <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-6 lg:py-5 rounded-2xl lg:rounded-[2rem] bg-[#0a0705] shadow-[inset_0_4px_12px_rgba(0,0,0,0.9),0_1px_0_rgba(255,255,255,0.05)] relative overflow-hidden">
          {/* Glass reflection */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-10 pointer-events-none" />

          <div className="flex items-center gap-4 lg:gap-6 relative z-10">
            <button
              onClick={() => variation && playChord(variation.frets, tuning.offsets, capo)}
              className="w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-[#e6c190] text-[#1a110b] flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.4)] active:scale-95 active:translate-y-0.5 transition-all group/play"
              aria-label="Play Chord"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 lg:h-9 lg:w-9 transition-transform group-hover/play:scale-110" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
            <div className="flex flex-col">
              <span className="text-xl lg:text-3xl font-black leading-tight text-[#e6c190] tracking-tight uppercase font-serif italic">{chordName}</span>
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="w-1 h-1 lg:w-1.5 lg:h-1.5 rounded-full bg-[#ff4d00] shadow-[0_0_6px_#ff4d00]" />
                <span className="text-[9px] lg:text-[11px] font-mono font-black uppercase tracking-[0.2em] text-[#c29b6d] opacity-80">{formula}</span>
                {aliases && (
                  <span className="hidden lg:inline text-[10px] text-[#c29b6d]/40 italic border-l border-[#c29b6d]/20 pl-3">
                    {aliases}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 lg:gap-2 relative z-10">
            {capo > 0 && (
              <span className="text-[8px] lg:text-[10px] font-black px-2 py-0.5 lg:px-3 lg:py-1 rounded bg-[#ff4d00]/10 text-[#ff4d00] border border-[#ff4d00]/20 uppercase tracking-widest">
                CAPO {capo}
              </span>
            )}
            <div className="bg-[#1a110b] px-2 py-1 lg:px-4 lg:py-2 rounded-lg lg:rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
              <span className="text-[10px] lg:text-xs text-[#c29b6d] font-black tracking-tighter">
                VAR <span className="text-[#e6c190]">{Math.min(variationIndex + 1, totalVariations)}</span><span className="opacity-30 mx-0.5">/</span>{Math.max(totalVariations, 1)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {totalVariations > 1 && showSwipeHint && (
        <div className="lg:hidden absolute top-2 left-1/2 -translate-x-1/2 z-50 px-3 py-1 rounded-full bg-[#1a110b]/80 border border-[#3a2216] shadow-lg backdrop-blur-sm text-[11px] font-bold uppercase tracking-widest text-[#e6c190] flex items-center gap-2 pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-[#e6c190] animate-pulse"></span>
          Swipe for shapes
        </div>
      )}

      {/* Fretboard Container with Arrows */}
      <div className="flex-1 relative min-h-0 group/board">

        {/* Navigation Arrows */}
        {totalVariations > 1 && (
          <>
            <button
              onClick={() => onVariationChange((variationIndex - 1 + totalVariations) % totalVariations)}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-50 p-2 text-[#e6c190]/50 hover:text-[#e6c190] hover:scale-110 transition-all opacity-100 lg:opacity-0 lg:group-hover/board:opacity-100 focus:opacity-100 outline-none"
              aria-label="Previous Variation"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => onVariationChange((variationIndex + 1) % totalVariations)}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-50 p-2 text-[#e6c190]/50 hover:text-[#e6c190] hover:scale-110 transition-all opacity-100 lg:opacity-0 lg:group-hover/board:opacity-100 focus:opacity-100 outline-none"
              aria-label="Next Variation"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        <div
          ref={scrollContainerRef}
          style={{ touchAction: 'pan-y' }}
          className="h-full w-full overflow-y-auto overflow-x-hidden custom-scrollbar bg-[#1a110b] rounded-2xl lg:rounded-[2rem] shadow-[inset_0_20px_40px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.05)] relative"
        >
          {/* Wood Texture Overlay for Fretboard Cavity */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-20 pointer-events-none mix-blend-overlay z-0" />

          {/* Depth Overlay & Bezel Effect */}
          <div className="absolute inset-0 pointer-events-none z-40 rounded-2xl lg:rounded-[2rem] shadow-[inset_0_2px_10px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)]" />
          <div className="absolute inset-0 pointer-events-none z-40 bg-gradient-to-b from-black/40 via-transparent to-black/20 opacity-60" />

          {/* Side Vignettes for depth */}
          <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/40 to-transparent pointer-events-none z-40" />
          <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/40 to-transparent pointer-events-none z-40" />

          <div className="flex justify-center pb-32 lg:pb-40 min-h-full relative z-10">
            <div
              className="relative shadow-[0_0_50px_rgba(0,0,0,0.8)] select-none rounded-b-lg"
              style={{
                width: `${boardWidth}px`,
                height: `${boardHeight + headstockHeight}px`,
                background: 'linear-gradient(90deg, #3a2216 0%, #5a3a29 50%, #3a2216 100%)'
              }}
            >
              <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] mix-blend-overlay pointer-events-none" />

              {/* Headstock Area */}
              <div
                className="absolute top-0 left-0 right-0 bg-gradient-to-b from-[#1a110b] to-[#2a1b12] z-50 border-b-4 border-[#1a110b]"
                style={{ height: `${headstockHeight}px` }}
              >
                <div className="absolute bottom-0 left-0 right-0 h-[14px] bg-gradient-to-b from-[#f4f1ea] to-[#dcd8cc] border-b border-[#999] shadow-md z-20" />

                {stringNames.map((name, i) => (
                  <span
                    key={`label-${i}`}
                    className="absolute bottom-5 text-[10px] font-mono font-bold text-[#8b6520] text-center w-6 -ml-3 drop-shadow-md"
                    style={{ left: `${getStringX(i)}px` }}
                  >
                    {name}
                  </span>
                ))}
              </div>

              {/* Fret Lines */}
              {Array.from({ length: totalFrets }).map((_, i) => {
                const fretNum = i + 1;
                const topY = getFretY(fretNum);
                const isBeforeCapo = fretNum <= capo;

                return (
                  <React.Fragment key={`fret-${fretNum}`}>
                    <div
                      className={`absolute left-0 right-0 h-[4px] z-10 shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition-opacity duration-300 ${isBeforeCapo ? 'opacity-20' : 'opacity-100'}`}
                      style={{
                        top: `${topY}px`,
                        background: 'linear-gradient(180deg, #888 0%, #fff 40%, #ccc 60%, #444 100%)',
                        borderRadius: '2px'
                      }}
                    />

                    {/* Fret Number */}
                    <span
                      className={`absolute text-xs text-[#c29b6d] font-mono font-bold w-8 text-right flex items-center justify-end transition-opacity duration-300 ${isBeforeCapo ? 'opacity-10' : 'opacity-50'}`}
                      style={{
                        top: `${topY - (fretSpacing / 2) - 8}px`,
                        height: '16px',
                        [isLefty ? 'right' : 'left']: '-40px'
                      }}
                    >
                      {fretNum}
                    </span>

                    {/* Inlay Dots */}
                    {[3, 5, 7, 9, 15, 17, 19].includes(fretNum) && (
                      <div
                        className={`absolute left-1/2 w-5 h-5 rounded-full z-0 -ml-2.5 -mt-[25px] transition-opacity duration-300 ${isBeforeCapo ? 'opacity-10' : 'opacity-100'}`}
                        style={{
                          top: `${topY - (fretSpacing / 2) + 25}px`,
                          background: 'radial-gradient(circle at 30% 30%, #fff 0%, #e6e2d8 40%, #999 100%)',
                          boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.8), 0 1px 2px rgba(0,0,0,0.3)'
                        }}
                      />
                    )}
                    {fretNum === 12 && (
                      <>
                        <div className={`absolute left-[30%] w-5 h-5 rounded-full z-0 -ml-2.5 -mt-[25px] transition-opacity duration-300 ${isBeforeCapo ? 'opacity-10' : 'opacity-100'}`}
                          style={{
                            top: `${topY - (fretSpacing / 2) + 25}px`,
                            background: 'radial-gradient(circle at 30% 30%, #fff 0%, #e6e2d8 40%, #999 100%)',
                            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.8), 0 1px 2px rgba(0,0,0,0.3)'
                          }} />
                        <div className={`absolute right-[30%] w-5 h-5 rounded-full z-0 -mr-2.5 -mt-[25px] transition-opacity duration-300 ${isBeforeCapo ? 'opacity-10' : 'opacity-100'}`}
                          style={{
                            top: `${topY - (fretSpacing / 2) + 25}px`,
                            background: 'radial-gradient(circle at 30% 30%, #fff 0%, #e6e2d8 40%, #999 100%)',
                            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.8), 0 1px 2px rgba(0,0,0,0.3)'
                          }} />
                      </>
                    )}
                  </React.Fragment>
                );
              })}

              {/* CAPO Visualization */}
              {capo > 0 && (
                <div
                  className="absolute left-[-4px] right-[-4px] z-30 shadow-xl"
                  style={{
                    top: `${getFretY(capo) - 32}px`, // Centered on the fret space just behind the wire
                    height: '32px',
                    background: 'linear-gradient(90deg, #111, #333 10%, #222 50%, #333 90%, #111)',
                    borderRadius: '4px',
                    borderBottom: '2px solid #000',
                    boxShadow: '0 5px 10px rgba(0,0,0,0.6)'
                  }}
                >
                  {/* Capo details */}
                  <div className="absolute top-0 bottom-0 left-2 right-2 border-t border-white/10 rounded-sm"></div>
                  <div className="absolute -bottom-1 left-0 right-0 h-1 bg-black/50 blur-[2px]"></div>
                </div>
              )}

              {/* All Chord Tones (Ghost Notes) */}
              {showAllNotes && tuning.offsets.map((_, stringIdx) => {
                return Array.from({ length: totalFrets + 1 }).map((_, i) => {
                  const physicalFret = i; // 0..22

                  // Don't show notes behind the nut/capo if they aren't relevant?
                  // Actually, notes behind capo are not playable usually.
                  if (physicalFret < capo) return null;

                  const pitch = tuning.offsets[stringIdx] + physicalFret;
                  const noteVal = pitch % 12;

                  if (targetNotes.has(noteVal)) {
                    // Check if this is already covered by variation
                    // variation[stringIdx] is relative fret.
                    // relative fret r corresponds to physical fret r + capo.
                    // If variation is -1 (mute), we might still want to show the ghost note?
                    // If variation is defined and matches this physical fret, don't show ghost.

                    const isMainNote = variation && (variation.frets[stringIdx] !== -1) && (variation.frets[stringIdx] + capo === physicalFret);
                    if (isMainNote) return null;

                    const xPos = getStringX(stringIdx);
                    let topY;
                    if (physicalFret === 0) {
                      topY = headstockHeight - 30;
                    } else {
                      topY = getFretY(physicalFret) - (fretSpacing / 2);
                    }

                    return (
                      <button
                        key={`ghost-${stringIdx}-${physicalFret}`}
                        onClick={() => playNote(stringIdx, physicalFret - capo, tuning.offsets, capo)}
                        className="absolute w-8 h-8 z-40 flex items-center justify-center transition-opacity cursor-pointer"
                        style={{
                          top: `${topY}px`,
                          left: `${xPos}px`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        <div className="w-6 h-6 rounded-full bg-[#1a110b]/90 flex items-center justify-center shadow-sm backdrop-blur-sm">
                          <span className="text-[10px] font-black text-[#777] leading-none flex items-center justify-center" style={{ transform: 'translateY(0.5px)' }}>
                            {getNoteLabel(pitch)}
                          </span>
                        </div>
                      </button>
                    );
                  }
                  return null;
                });
              })}

              {/* Scale Overlay (Ghost Notes) */}
              {selectedScale && tuning.offsets.map((_, stringIdx) => {
                return Array.from({ length: totalFrets + 1 }).map((_, i) => {
                  const physicalFret = i;
                  if (physicalFret < capo) return null;

                  const pitch = tuning.offsets[stringIdx] + physicalFret;
                  const noteVal = pitch % 12;

                  if (scaleNotes.has(noteVal)) {
                    // Don't show if it's a main chord note
                    const isMainNote = variation && (variation.frets[stringIdx] !== -1) && (variation.frets[stringIdx] + capo === physicalFret);
                    if (isMainNote) return null;

                    // Don't show if "Show All Notes" is on and it's already showing a chord tone
                    if (showAllNotes && targetNotes.has(noteVal)) return null;

                    const xPos = getStringX(stringIdx);
                    let topY;
                    if (physicalFret === 0) {
                      topY = headstockHeight - 30;
                    } else {
                      topY = getFretY(physicalFret) - (fretSpacing / 2);
                    }

                    const isRoot = noteVal === rootVal;

                    return (
                      <button
                        key={`scale-${stringIdx}-${physicalFret}`}
                        onClick={() => playNote(stringIdx, physicalFret - capo, tuning.offsets, capo)}
                        className="absolute w-8 h-8 z-40 flex items-center justify-center  transition-opacity cursor-pointer"
                        style={{
                          top: `${topY}px`,
                          left: `${xPos}px`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-sm backdrop-blur-sm ${isRoot ? 'bg-[#e6c190]/40' : 'bg-[#c29b6d]/20'}`}>
                          <span className={`text-[10px] font-black leading-none flex items-center justify-center ${isRoot ? 'text-[#e6c190]' : 'text-[#c29b6d]'}`} style={{ transform: 'translateY(0.5px)' }}>
                            {getNoteLabel(pitch)}
                          </span>
                        </div>
                      </button>
                    );
                  }
                  return null;
                });
              })}

              {/* Strings */}
              {stringNames.map((_, i) => (
                <div
                  key={`string-${i}`}
                  className="absolute top-[80px] bottom-0 shadow-[2px_0_4px_rgba(0,0,0,0.6)] z-20 pointer-events-none"
                  style={{
                    left: `${getStringX(i)}px`,
                    width: i < 3 ? '3px' : '1px',
                    background: i < 3
                      ? 'linear-gradient(90deg, #3d2b1f, #a88b7d 40%, #5e4030 100%)'
                      : 'linear-gradient(90deg, #555, #fff 50%, #555)',
                    marginLeft: i < 3 ? '-1.5px' : '-0.5px'
                  }}
                />
              ))}

              {/* CAGED Shape Connections */}
              {variation && variation.cagedShape && (
                <svg className="absolute inset-0 w-full h-full z-30 pointer-events-none">
                  <polyline
                    points={variation.frets
                      .map((fret, stringIdx) => {
                        if (fret === -1) return null;
                        const absoluteFret = fret >= 0 ? fret + capo : -1;

                        // Skip open strings for the connection line
                        if (absoluteFret === 0) return null;

                        const x = getStringX(stringIdx);
                        const y = getFretY(absoluteFret) - (fretSpacing / 2); // Match Fretted Marker
                        return `${x},${y}`;
                      })
                      .filter(Boolean)
                      .join(' ')}
                    fill="none"
                    stroke="rgba(230, 193, 144, 0.4)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}

              {/* Note Markers */}
              {variation && variation.frets.map((fret, stringIdx) => {
                const xPos = getStringX(stringIdx);
                // Pitch calculation
                const pitch = tuning.offsets[stringIdx] + capo + (fret === -1 ? 0 : fret);
                const noteName = getNoteLabel(pitch);
                const isRoot = (pitch % 12) === rootVal;

                // Logic for handling position with Capo
                // Engine returns fret relative to Capo (0 = open at capo).
                // Absolute fret = fret + capo.
                const absoluteFret = fret >= 0 ? fret + capo : -1;

                // Calculate Y position for "above the nut/capo" markers
                const markerY = capo > 0
                  ? getFretY(capo) - 50 // Just above the capo
                  : headstockHeight - 50; // Just above the nut

                // 1. Muted String (X)
                if (fret === -1) {
                  return (
                    <button
                      key={`marker-mute-${stringIdx}`}
                      onClick={() => playNote(stringIdx, 0, tuning.offsets, capo)} // Play open string even if muted? Or maybe just don't play?
                      className="absolute flex items-center justify-center z-[60] cursor-pointer hover:scale-110 transition-transform"
                      style={{
                        top: `${markerY - 15}px`,
                        left: `${xPos}px`,
                        marginLeft: '-16px',
                        width: '32px'
                      }}
                    >
                      <div className="text-[#cc4444] font-sans font-bold text-xl drop-shadow-[0_1px_1px_rgba(0,0,0,1)] opacity-80">✕</div>
                    </button>
                  );
                }

                // 2. Open String (at Nut or Capo)
                if (fret === 0) {
                  return (
                    <button
                      key={`marker-open-${stringIdx}`}
                      onClick={() => playNote(stringIdx, 0, tuning.offsets, capo)}
                      className="absolute flex items-center justify-center z-[60] cursor-pointer group/open"
                      style={{
                        top: `${markerY}px`,
                        left: `${xPos}px`,
                        marginLeft: '-16px',
                        width: '32px'
                      }}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg border transition-all duration-200 group-hover/open:scale-110 ${isRoot ? 'z-10 scale-110' : ''}`}
                        style={{
                          backgroundColor: isRoot ? '#e6c190' : '#c29b6d',
                          borderColor: isRoot ? '#e6c190' : '#c29b6d',
                          color: '#2a1b12',
                          boxShadow: isRoot ? '0 0 15px rgba(230,193,144,0.4)' : '0 0 10px rgba(194,155,109,0.4)'
                        }}
                      >
                        <span className="font-black text-xs leading-none flex items-center justify-center" style={{ transform: 'translateY(0.5px)' }}>{noteName}</span>
                      </div>
                    </button>
                  );
                }

                // 3. Fretted Note
                const topWireY = getFretY(absoluteFret);
                const centerY = topWireY - (fretSpacing / 2);

                return (
                  <button key={`note-${stringIdx}`}
                    onClick={() => playNote(stringIdx, fret, tuning.offsets, capo)}
                    className="absolute w-10 h-10 z-50 flex items-center justify-center animate-pop-in group cursor-pointer"
                    style={{
                      top: `${centerY}px`,
                      left: `${xPos}px`,
                      transform: 'translate(-50%, -50%)'
                    }}>
                    <div
                      className="relative w-full h-full rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-110 border"
                      style={{
                        backgroundColor: isRoot ? '#e6c190' : '#c29b6d',
                        borderColor: isRoot ? '#e6c190' : '#c29b6d',
                        color: '#2a1b12',
                        boxShadow: isRoot
                          ? '0 0 15px rgba(230,193,144,0.4)'
                          : '0 0 10px rgba(194,155,109,0.4)',
                      }}
                    >
                      <span className="font-black font-sans text-lg z-10 leading-none flex items-center justify-center tracking-tighter" style={{ transform: 'translateY(0.5px)' }}>
                        {noteName}
                      </span>
                    </div>
                  </button>
                );
              })}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Fretboard;
