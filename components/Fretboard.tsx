
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { TuningDefinition, ChordVariation } from '../types';
import { getNoteName, getNoteValue } from '../utils/chordEngine';
import { CHORD_TYPES } from '../constants';

interface FretboardProps {
  chordName: string;
  formula: string;
  aliases?: string;
  variation: ChordVariation | null;
  tuning: TuningDefinition;
  capo: number;
  isLefty: boolean;
  showAllNotes: boolean;
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

      {/* Mobile Info Bar */}
      <div className="lg:hidden mb-2">
        <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl border border-[#3a2216] bg-[#1a110b]/80 backdrop-blur-sm shadow-lg">
          <div className="flex flex-col">
            <span className="text-lg font-bold leading-tight text-[#e6c190]">{chordName}</span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#c29b6d]">{formula}</span>
          </div>
          <div className="flex flex-col items-end gap-1">
            {capo > 0 && (
              <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-[#2a1b12] text-[#e6c190] border border-[#e6c190]/40 uppercase tracking-wider shadow-sm">
                Capo {capo}
              </span>
            )}
            <span className="text-[11px] text-[#c29b6d] font-bold">
              Var {Math.min(variationIndex + 1, totalVariations)}/{Math.max(totalVariations, 1)}
            </span>
          </div>
        </div>
      </div>

      {totalVariations > 1 && showSwipeHint && (
        <div className="lg:hidden absolute top-2 left-1/2 -translate-x-1/2 z-50 px-3 py-1 rounded-full bg-[#1a110b]/80 border border-[#3a2216] shadow-lg backdrop-blur-sm text-[11px] font-bold uppercase tracking-widest text-[#e6c190] flex items-center gap-2 pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-[#e6c190] animate-pulse"></span>
          Swipe for shapes
        </div>
      )}

      {/* Info Panel */}
      <div className="hidden lg:flex mb-2 p-3 bg-[#fdfbf7] border-2 border-[#1a110b] rounded-lg shadow-lg flex-col gap-2 text-[#1a110b] relative overflow-hidden flex-shrink-0 z-20">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] pointer-events-none" />

        <div className="relative z-10 flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold leading-none text-[#2a1b12] tracking-tight">{chordName}</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="text-xs font-mono text-[#666] font-bold">{formula}</div>
              {aliases && (
                <div className="text-[10px] text-[#888] italic border-l border-[#ddd] pl-2">
                  {aliases}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {capo > 0 && (
              <div className="bg-[#2a1b12] text-[#e6c190] px-3 py-1 rounded text-xs font-bold uppercase tracking-wider shadow-sm border border-[#e6c190]/30">
                Capo {capo}
              </div>
            )}
          </div>
        </div>

        <div className="relative z-10 flex gap-2 text-xs border-t border-[#ddd] pt-1">
          <span className="font-bold text-[#666]">Notes:</span>
          <span className="font-mono text-[#2a1b12]">
            {variation?.frets.map((f, i) => {
              if (f < 0) return null;
              const pitch = tuning.offsets[i] + capo + f;
              return getNoteName(pitch, useFlats);
            }).filter(Boolean).join(', ')}
          </span>
        </div>
      </div>

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
          className="h-full w-full overflow-y-auto overflow-x-hidden custom-scrollbar bg-[#0f0a06] rounded-xl  shadow-2xl relative"
        >
          <div className="flex justify-center pb-24 min-h-full">

            {/* The Guitar Neck */}
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
                      <div key={`ghost-${stringIdx}-${physicalFret}`}
                        className="absolute w-6 h-6 z-30 flex items-center justify-center"
                        style={{
                          top: `${topY}px`,
                          left: `${xPos}px`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        <div className="w-5 h-5 rounded-full bg-[#1a110b]/90 flex items-center justify-center shadow-sm backdrop-blur-sm border border-[#3a2216]">
                          <span className="text-[9px] font-bold text-[#555]">{getNoteLabel(pitch)}</span>
                        </div>
                      </div>
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
                    <div
                      key={`marker-mute-${stringIdx}`}
                      className="absolute flex items-center justify-center z-[60]"
                      style={{
                        top: `${markerY - 15}px`,
                        left: `${xPos}px`,
                        marginLeft: '-16px',
                        width: '32px'
                      }}
                    >
                      <div className="text-[#cc4444] font-sans font-bold text-xl drop-shadow-[0_1px_1px_rgba(0,0,0,1)] opacity-80">✕</div>
                    </div>
                  );
                }

                // 2. Open String (at Nut or Capo)
                if (fret === 0) {
                  return (
                    <div
                      key={`marker-open-${stringIdx}`}
                      className="absolute flex items-center justify-center z-[60]"
                      style={{
                        top: `${markerY}px`,
                        left: `${xPos}px`,
                        marginLeft: '-16px',
                        width: '32px'
                      }}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg border transition-all duration-200 ${isRoot ? 'z-10 scale-110' : ''}`}
                        style={{
                          backgroundColor: isRoot ? '#e6c190' : '#c29b6d',
                          borderColor: isRoot ? '#e6c190' : '#c29b6d',
                          color: '#2a1b12',
                          boxShadow: isRoot ? '0 0 15px rgba(230,193,144,0.4)' : '0 0 10px rgba(194,155,109,0.4)'
                        }}
                      >
                        <span className="font-bold text-xs">{noteName}</span>
                      </div>
                    </div>
                  );
                }

                // 3. Fretted Note
                const topWireY = getFretY(absoluteFret);
                const centerY = topWireY - (fretSpacing / 2);

                return (
                  <div key={`note-${stringIdx}`}
                    className="absolute w-10 h-10 z-50 flex items-center justify-center animate-pop-in group"
                    style={{
                      top: `${centerY}px`,
                      left: `${xPos}px`,
                      transform: 'translate(-50%, -50%)'
                    }}>
                    <div
                      className="relative w-full h-full rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 border"
                      style={{
                        backgroundColor: isRoot ? '#e6c190' : '#c29b6d',
                        borderColor: isRoot ? '#e6c190' : '#c29b6d',
                        color: '#2a1b12',
                        boxShadow: isRoot
                          ? '0 0 15px rgba(230,193,144,0.4)'
                          : '0 0 10px rgba(194,155,109,0.4)',
                      }}
                    >
                      <span className="font-bold font-sans text-lg z-10 leading-none">
                        {noteName}
                      </span>
                    </div>
                  </div>
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
