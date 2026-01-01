
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { TuningDefinition } from '../types';
import { getNoteName, getNoteValue } from '../utils/chordEngine';
import { CHORD_TYPES } from '../constants';

interface FretboardProps {
  chordName: string;
  formula: string;
  variation: number[] | null;
  tuning: TuningDefinition;
  capo: number;
  isLefty: boolean;
  showAllNotes: boolean;
}

const Fretboard: React.FC<FretboardProps> = ({
  chordName,
  formula,
  variation,
  tuning,
  capo,
  isLefty,
  showAllNotes
}) => {
  // Calculate target notes (pitch classes)
  const targetNotes = useMemo(() => {
    if (!chordName) return new Set<number>();

    const rootStr = chordName.split(' ')[0];
    const rootVal = getNoteValue(rootStr);

    // Find chord type by formula
    const chordType = CHORD_TYPES.find(c => c.formula === formula);

    if (!chordType) return new Set<number>();

    const notes = new Set<number>();
    chordType.intervals.forEach(interval => {
      notes.add((rootVal + interval) % 12);
    });

    return notes;
  }, [chordName, formula]);

  // Config for Vertical Fretboard
  const totalFrets = 22;
  const stringNames = tuning.offsets.map(offset => getNoteName(offset));

  // Dimensions
  const boardWidth = 280;
  const headstockHeight = 80;
  const fretSpacing = 50;
  const boardHeight = totalFrets * fretSpacing;

  const getStringX = (index: number) => {
    const x = 30 + (index * 44);
    if (isLefty) {
      return boardWidth - x; // Mirror
    }
    return x;
  };

  // Fret Y position (location of the metal wire)
  const getFretY = (fretNum: number) => headstockHeight + (fretNum * fretSpacing);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic
  useEffect(() => {
    if (variation && scrollContainerRef.current) {
      // Calculate visible frets (absolute)
      const absoluteFrets = variation
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
    <div className="flex flex-col h-full w-full max-w-md mx-auto lg:max-w-none">

      {/* Info Panel */}
      <div className="mb-2 p-3 bg-[#fdfbf7] border-2 border-[#1a110b] rounded-lg shadow-lg flex flex-col gap-2 text-[#1a110b] relative overflow-hidden flex-shrink-0 z-20">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] pointer-events-none" />

        <div className="relative z-10 flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold leading-none text-[#2a1b12] tracking-tight">{chordName}</h2>
            <div className="text-xs font-mono text-[#666] mt-1 font-bold">{formula}</div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {capo > 0 && (
              <div className="bg-[#2a1b12] text-[#e6c190] px-3 py-1 rounded text-xs font-bold uppercase tracking-wider shadow-sm border border-[#e6c190]/30">
                Capo {capo}
              </div>
            )}
            <button
              onClick={() => setShowAllNotes(!showAllNotes)}
              className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded border border-[#2a1b12]/20 hover:bg-[#2a1b12]/5 transition-colors text-[#2a1b12]"
            >
              {showAllNotes ? 'Hide Scale' : 'Show Scale'}
            </button>
          </div>
        </div>

        <div className="relative z-10 flex gap-2 text-xs border-t border-[#ddd] pt-1">
          <span className="font-bold text-[#666]">Notes:</span>
          <span className="font-mono text-[#2a1b12]">
            {variation?.map((f, i) => {
              if (f < 0) return null;
              const pitch = tuning.offsets[i] + capo + f;
              return getNoteName(pitch);
            }).filter(Boolean).join(', ')}
          </span>
        </div>
      </div>

      {/* Fretboard Scroll Container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 w-full overflow-y-auto overflow-x-hidden custom-scrollbar bg-[#0f0a06] rounded-xl border-4 border-[#2a1b12] shadow-2xl relative"
      >
        <div className="flex justify-center pb-24 min-h-full">

          {/* The Guitar Neck */}
          <div
            className="relative shadow-[0_0_50px_rgba(0,0,0,0.8)] select-none rounded-b-lg overflow-hidden"
            style={{
              width: `${boardWidth}px`,
              height: `${boardHeight + headstockHeight}px`,
              background: 'linear-gradient(90deg, #3a2216 0%, #5a3a29 50%, #3a2216 100%)'
            }}
          >
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] mix-blend-overlay pointer-events-none" />

            {/* Headstock Area */}
            <div
              className="absolute top-0 left-0 right-0 bg-gradient-to-b from-[#1a110b] to-[#2a1b12] z-10 border-b-4 border-[#1a110b]"
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

              return (
                <React.Fragment key={`fret-${fretNum}`}>
                  <div
                    className="absolute left-0 right-0 h-[4px] z-10 shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                    style={{
                      top: `${topY}px`,
                      background: 'linear-gradient(180deg, #888 0%, #fff 40%, #ccc 60%, #444 100%)',
                      borderRadius: '2px'
                    }}
                  />

                  {/* Fret Number */}
                  <span
                    className={`absolute text-xs text-[#c29b6d] font-mono font-bold opacity-50 w-8 text-right flex items-center justify-end`}
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
                      className="absolute left-1/2 w-5 h-5 rounded-full z-0 -ml-2.5 -mt-[25px]"
                      style={{
                        top: `${topY - (fretSpacing / 2) + 25}px`,
                        background: 'radial-gradient(circle at 30% 30%, #fff 0%, #e6e2d8 40%, #999 100%)',
                        boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.8), 0 1px 2px rgba(0,0,0,0.3)'
                      }}
                    />
                  )}
                  {fretNum === 12 && (
                    <>
                      <div className="absolute left-[30%] w-5 h-5 rounded-full z-0 -ml-2.5 -mt-[25px]"
                        style={{
                          top: `${topY - (fretSpacing / 2) + 25}px`,
                          background: 'radial-gradient(circle at 30% 30%, #fff 0%, #e6e2d8 40%, #999 100%)',
                          boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.8), 0 1px 2px rgba(0,0,0,0.3)'
                        }} />
                      <div className="absolute right-[30%] w-5 h-5 rounded-full z-0 -mr-2.5 -mt-[25px]"
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
            {showAllNotes && Array.from({ length: 6 }).map((_, stringIdx) => {
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

                  const isMainNote = variation && (variation[stringIdx] !== -1) && (variation[stringIdx] + capo === physicalFret);
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
                      <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shadow-sm backdrop-blur-[1px] border border-white/10">
                        <span className="text-[9px] font-bold text-white/60">{getNoteName(pitch)}</span>
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

            {/* Note Markers */}
            {variation && variation.map((fret, stringIdx) => {
              const xPos = getStringX(stringIdx);
              // Pitch calculation
              const pitch = tuning.offsets[stringIdx] + capo + (fret === -1 ? 0 : fret);
              const noteName = getNoteName(pitch);
              const rootName = chordName.split(' ')[0];
              const isRoot = noteName === rootName;

              // Logic for handling position with Capo
              // Engine returns fret relative to Capo (0 = open at capo).
              // Absolute fret = fret + capo.
              const absoluteFret = fret >= 0 ? fret + capo : -1;

              // 1. Muted String (X)
              if (fret === -1) {
                return (
                  <div
                    key={`marker-mute-${stringIdx}`}
                    className="absolute flex items-center justify-center z-40"
                    style={{
                      top: `${headstockHeight - 65}px`,
                      left: `${xPos}px`,
                      marginLeft: '-16px',
                      width: '32px'
                    }}
                  >
                    <div className="text-[#cc4444] font-sans font-bold text-xl drop-shadow-[0_1px_1px_rgba(0,0,0,1)] opacity-80">✕</div>
                  </div>
                );
              }

              // 2. Open String (No Capo)
              if (absoluteFret === 0) {
                return (
                  <div
                    key={`marker-open-${stringIdx}`}
                    className="absolute flex items-center justify-center z-40"
                    style={{
                      top: `${headstockHeight - 50}px`,
                      left: `${xPos}px`,
                      marginLeft: '-16px',
                      width: '32px'
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm shadow-sm"
                      style={{
                        backgroundColor: 'rgba(20, 20, 20, 0.5)'
                      }}
                    >
                      <span className="text-white font-bold text-xs drop-shadow-sm">{noteName}</span>
                    </div>
                  </div>
                );
              }

              // 3. Fretted Note (includes "Open" at Capo)
              const topWireY = getFretY(absoluteFret);
              const centerY = topWireY - (fretSpacing / 2);
              // If note is "at capo" (fret === 0 relative to capo), style might be different?
              // For now, consistent styling. The dot sits ON the capo if fret=0.

              return (
                <div key={`note-${stringIdx}`}
                  className="absolute w-10 h-10 z-50 flex items-center justify-center animate-pop-in group"
                  style={{
                    top: `${centerY}px`,
                    left: `${xPos}px`,
                    transform: 'translate(-50%, -50%)'
                  }}>
                  <div
                    className="relative w-full h-full rounded-full flex items-center justify-center backdrop-blur-sm shadow-md transition-transform duration-200"
                    style={{
                      backgroundColor: isRoot
                        ? 'rgba(245, 158, 11, 0.5)' // Brighter for root
                        : 'rgba(20, 20, 20, 0.5)', // Dark glass
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    }}
                  >
                    <span className="font-bold font-sans text-lg z-10 leading-none text-white drop-shadow-sm">
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
  );
};

export default Fretboard;
