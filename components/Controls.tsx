
import React, { useRef, useEffect, useState } from 'react';
import { ROOTS, CHORD_TYPES, TUNINGS, CAPO_POSITIONS } from '../constants';
import { RootNote, ChordType, TuningDefinition } from '../types';

interface ControlsProps {
    selectedRoot: RootNote;
    selectedQuality: ChordType;
    selectedBass: RootNote;
    tuning: TuningDefinition;
    capo: number;
    isLefty: boolean;
    showAllNotes: boolean;
    showIntervals: boolean;
    variations: number[][];
    variationIndex: number;
    onRootChange: (root: RootNote) => void;
    onQualityChange: (quality: ChordType) => void;
    onBassChange: (bass: RootNote) => void;
    onTuningChange: (tuning: TuningDefinition) => void;
    onCapoChange: (capo: number) => void;
    onLeftyChange: (isLefty: boolean) => void;
    onShowAllNotesChange: (show: boolean) => void;
    onShowIntervalsChange: (show: boolean) => void;
    onVariationSelect: (index: number) => void;
}

const Controls: React.FC<ControlsProps> = ({
    selectedRoot,
    selectedQuality,
    selectedBass,
    tuning,
    capo,
    isLefty,
    showAllNotes,
    showIntervals,
    variations,
    variationIndex,
    onRootChange,
    onQualityChange,
    onBassChange,
    onTuningChange,
    onCapoChange,
    onLeftyChange,
    onShowAllNotesChange,
    onShowIntervalsChange,
    onVariationSelect
}) => {
    const rootContainerRef = useRef<HTMLDivElement>(null);
    const qualityContainerRef = useRef<HTMLDivElement>(null);
    const bassContainerRef = useRef<HTMLDivElement>(null);

    const rootScrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const qualityScrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const bassScrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [showSettings, setShowSettings] = useState(false);
    const [showBass, setShowBass] = useState(false);

    // Helper to scroll active item to center
    const centerActiveItem = (container: HTMLDivElement | null) => {
        if (!container) return;
        const activeItem = container.querySelector('[data-active="true"]') as HTMLElement;
        if (activeItem) {
            const containerCenter = container.scrollLeft + container.clientWidth / 2;
            const itemCenter = activeItem.offsetLeft + activeItem.offsetWidth / 2;

            // If close enough, skip smooth scroll to prevent fighting snap
            if (Math.abs(containerCenter - itemCenter) < 10) return;

            activeItem.scrollIntoView({
                behavior: 'smooth',
                inline: 'center',
                block: 'nearest'
            });
        }
    };

    useEffect(() => centerActiveItem(rootContainerRef.current), [selectedRoot]);
    useEffect(() => centerActiveItem(qualityContainerRef.current), [selectedQuality]);
    useEffect(() => { if (showBass) centerActiveItem(bassContainerRef.current); }, [showBass, selectedBass]);

    const handleScroll = (
        e: React.UIEvent<HTMLDivElement>,
        items: any[],
        onSelect: (item: any) => void,
        currentItem: any,
        timeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
        idKey: string | null = null
    ) => {
        const container = e.currentTarget;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(() => {
            const containerCenter = container.scrollLeft + container.clientWidth / 2;
            let closestItem = null;
            let minDiff = Infinity;

            Array.from(container.children).forEach((child, index) => {
                const htmlChild = child as HTMLElement;
                // Only consider button elements (snap items)
                if (htmlChild.tagName !== 'BUTTON') return;

                const childCenter = htmlChild.offsetLeft + htmlChild.offsetWidth / 2;
                const diff = Math.abs(containerCenter - childCenter);
                if (diff < minDiff) {
                    minDiff = diff;
                    closestItem = items[index];
                }
            });

            if (closestItem) {
                const isSame = idKey
                    ? closestItem[idKey] === currentItem[idKey]
                    : closestItem === currentItem;

                if (!isSame) {
                    onSelect(closestItem);
                }
            }
        }, 100);
    };

    const formatVariation = (v: number[]) => {
        return v.map(n => n === -1 ? 'x' : n).join(' ');
    };

    return (
        <div className="relative flex flex-col h-full bg-[#2a1b12] border border-[#e6c190]/20 shadow-xl overflow-hidden rounded-xl font-mono">

            {/* Decorative BG */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-10 pointer-events-none" />

            {/* Header & Settings Toggle */}
            <div className="flex items-center justify-between z-10 border-b border-[#e6c190]/10 p-4 bg-[#1a110b]/50">
                <div>
                    <h1 className="text-xl font-bold text-[#e6c190] uppercase tracking-tighter leading-none font-sans">
                        AxeGrain
                    </h1>
                    <span className="text-[10px] text-[#c29b6d] tracking-widest uppercase">Chord Finder</span>
                </div>
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={`p-2 rounded hover:bg-[#3a2216] transition-colors ${showSettings ? 'text-[#e6c190] bg-[#3a2216]' : 'text-[#c29b6d]'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.532 1.532 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.532 1.532 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>

            {/* Main Controls */}
            <div className={`flex-1 overflow-y-auto custom-scrollbar p-2 lg:p-4 space-y-2 lg:space-y-6 ${showSettings ? '' : 'hidden lg:block'}`}>

                {/* Settings Panel */}
                {showSettings && (
                    <div className="bg-[#120c08] p-4 rounded-lg border border-[#e6c190]/10 grid grid-cols-2 gap-4 text-xs animate-slide-down mb-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[#888] font-bold uppercase tracking-wider">Tuning</label>
                            <select
                                value={tuning.name}
                                onChange={(e) => onTuningChange(TUNINGS.find(t => t.name === e.target.value) || TUNINGS[0])}
                                className="bg-[#2a1b12] text-[#e6c190] border border-[#3a2216] rounded p-2 outline-none"
                            >
                                {TUNINGS.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[#888] font-bold uppercase tracking-wider">Capo</label>
                            <select
                                value={capo}
                                onChange={(e) => onCapoChange(Number(e.target.value))}
                                className="bg-[#2a1b12] text-[#e6c190] border border-[#3a2216] rounded p-2 outline-none"
                            >
                                {CAPO_POSITIONS.map(p => <option key={p} value={p}>{p === 0 ? '- None -' : `Fret ${p}`}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center gap-2 col-span-2 pt-2">
                            <input
                                type="checkbox"
                                id="lefty"
                                checked={isLefty}
                                onChange={(e) => onLeftyChange(e.target.checked)}
                                className="accent-[#e6c190]"
                            />
                            <label htmlFor="lefty" className="text-[#c29b6d] font-bold uppercase tracking-wider cursor-pointer">Lefty Mode</label>
                        </div>
                        <div className="flex items-center gap-2 col-span-2">
                            <input
                                type="checkbox"
                                id="showScale"
                                checked={showAllNotes}
                                onChange={(e) => onShowAllNotesChange(e.target.checked)}
                                className="accent-[#e6c190]"
                            />
                            <label htmlFor="showScale" className="text-[#c29b6d] font-bold uppercase tracking-wider cursor-pointer">Show Scale</label>
                        </div>
                        <div className="flex items-center gap-2 col-span-2">
                            <input
                                type="checkbox"
                                id="showIntervals"
                                checked={showIntervals}
                                onChange={(e) => onShowIntervalsChange(e.target.checked)}
                                className="accent-[#e6c190]"
                            />
                            <label htmlFor="showIntervals" className="text-[#c29b6d] font-bold uppercase tracking-wider cursor-pointer">Show Intervals</label>
                        </div>
                    </div>
                )}

                {/* Root Picker */}
                <div className="space-y-1 lg:space-y-2">
                    <div className="flex justify-between items-center px-1">
                        <span className="text-xs text-[#c29b6d] font-bold uppercase tracking-widest">Root</span>
                        <span className="text-xs font-bold text-[#e6c190] bg-[#1a110b] px-3 py-1 rounded-md border border-[#3a2216]">{selectedRoot}</span>
                    </div>

                    <div className="relative group">
                        {/* Gradient Masks */}
                        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#2a1b12] to-transparent z-10 pointer-events-none" />
                        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#2a1b12] to-transparent z-10 pointer-events-none" />

                        <div
                            ref={rootContainerRef}
                            onScroll={(e) => handleScroll(e, ROOTS, onRootChange, selectedRoot, rootScrollTimeout)}
                            className="flex overflow-x-auto snap-x snap-mandatory gap-2 lg:gap-4 py-2 lg:py-4 px-[50%] no-scrollbar bg-[#1a110b]/30 rounded-xl border border-[#3a2216] shadow-inner items-center relative"
                        >
                            {ROOTS.map((root) => (
                                <button
                                    key={root}
                                    data-active={selectedRoot === root}
                                    onClick={() => onRootChange(root)}
                                    className={`
                        snap-center flex-shrink-0 w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center rounded-full transition-all duration-300 ease-out border relative
                        ${selectedRoot === root
                                            ? 'bg-[#e6c190] text-[#2a1b12] border-[#e6c190] shadow-[0_0_20px_rgba(230,193,144,0.3)] scale-110 font-bold text-lg lg:text-xl z-10'
                                            : 'bg-[#2a1b12] text-[#555] border-transparent scale-90 text-xs lg:text-sm opacity-50 hover:opacity-100'}
                        `}
                                >
                                    {root}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Quality Picker */}
                <div className="space-y-1 lg:space-y-2">
                    <div className="flex justify-between items-center px-1">
                        <span className="text-xs text-[#c29b6d] font-bold uppercase tracking-widest">Quality</span>
                        <span className="text-xs font-bold text-[#e6c190] bg-[#1a110b] px-3 py-1 rounded-md border border-[#3a2216] truncate max-w-[150px]">{selectedQuality.name}</span>
                    </div>
                    <div className="relative group">
                        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#2a1b12] to-transparent z-10 pointer-events-none" />
                        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#2a1b12] to-transparent z-10 pointer-events-none" />

                        <div
                            ref={qualityContainerRef}
                            onScroll={(e) => handleScroll(e, CHORD_TYPES, onQualityChange, selectedQuality, qualityScrollTimeout, 'id')}
                            className="flex overflow-x-auto snap-x snap-mandatory gap-2 lg:gap-4 py-2 lg:py-4 px-[50%] no-scrollbar bg-[#1a110b]/30 rounded-xl border border-[#3a2216] shadow-inner items-center relative"
                        >
                            {CHORD_TYPES.map((q) => (
                                <button
                                    key={q.id}
                                    data-active={selectedQuality.id === q.id}
                                    onClick={() => onQualityChange(q)}
                                    className={`
                            snap-center flex-shrink-0 px-3 py-1 lg:px-4 lg:py-2 rounded-lg transition-all duration-300 ease-out whitespace-nowrap border
                            ${selectedQuality.id === q.id
                                            ? 'bg-[#e6c190] text-[#2a1b12] border-[#e6c190] shadow-[0_0_20px_rgba(230,193,144,0.3)] font-bold text-xs lg:text-sm scale-110 z-10'
                                            : 'bg-[#2a1b12] text-[#555] border-transparent scale-90 text-[10px] lg:text-xs opacity-50 hover:opacity-100'}
                        `}
                                >
                                    {q.suffix || q.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Slash Chord Toggle/Picker */}
                <div className="space-y-1 lg:space-y-2">
                    <button
                        onClick={() => {
                            if (showBass) {
                                onBassChange(selectedRoot);
                                setShowBass(false);
                            } else {
                                setShowBass(true);
                            }
                        }}
                        className={`w-full flex justify-between items-center px-3 py-2 lg:px-4 lg:py-3 rounded-xl border transition-all duration-300 ${showBass ? 'bg-[#3a2216] border-[#e6c190] text-[#e6c190] shadow-lg' : 'bg-[#1a110b]/40 border-[#3a2216] text-[#c29b6d] hover:bg-[#2a1b12]'
                            }`}
                    >
                        <span className="text-xs font-bold uppercase tracking-wide">Slash Bass / Inversion</span>
                        <span className="text-sm font-mono font-bold opacity-80">{selectedBass !== selectedRoot ? `/ ${selectedBass}` : '/ Root'}</span>
                    </button>

                    {showBass && (
                        <div className="relative group animate-fade-in">
                            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#2a1b12] to-transparent z-10 pointer-events-none" />
                            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#2a1b12] to-transparent z-10 pointer-events-none" />

                            <div
                                ref={bassContainerRef}
                                onScroll={(e) => handleScroll(e, ROOTS, onBassChange, selectedBass, bassScrollTimeout)}
                                className="flex overflow-x-auto snap-x snap-mandatory gap-2 lg:gap-4 py-2 lg:py-4 px-[50%] no-scrollbar bg-[#1a110b]/30 rounded-xl border border-[#3a2216] shadow-inner items-center relative"
                            >
                                {ROOTS.map((root) => (
                                    <button
                                        key={root}
                                        data-active={selectedBass === root}
                                        onClick={() => onBassChange(root)}
                                        className={`
                            snap-center flex-shrink-0 w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-full transition-all duration-300 ease-out border
                            ${selectedBass === root
                                                ? 'bg-[#c29b6d] text-[#1a110b] border-[#c29b6d] scale-110 font-bold text-base lg:text-lg z-10 shadow-[0_0_15px_rgba(194,155,109,0.4)]'
                                                : 'bg-[#2a1b12] text-[#555] border-transparent scale-90 text-[10px] lg:text-xs opacity-50 hover:opacity-100'}
                            `}
                                    >
                                        {root}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Variations List */}
                <div className="flex-1 min-h-[100px] lg:min-h-0 flex flex-col gap-1 lg:gap-3">
                    <div className="flex justify-between items-baseline border-b border-[#3a2216] pb-2 mt-2 lg:mt-4">
                        <span className="text-xs text-[#c29b6d] font-bold uppercase tracking-widest">Variations ({variations.length})</span>
                    </div>
                    <div className="grid grid-cols-5 lg:grid-cols-2 gap-2 overflow-y-auto max-h-[150px] lg:max-h-none lg:flex-1 pr-1 custom-scrollbar pb-2">
                        {variations.length === 0 ? (
                            <div className="col-span-5 lg:col-span-2 text-center text-[#666] text-xs py-8 italic">No variations found.</div>
                        ) : (
                            variations.map((v, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => onVariationSelect(idx)}
                                    className={`
                                text-left px-0 py-2 lg:px-4 lg:py-3 rounded-lg border transition-all duration-200 group relative overflow-hidden flex items-center justify-center lg:block
                                ${variationIndex === idx
                                            ? 'bg-[#e6c190] border-[#e6c190] text-[#2a1b12] shadow-lg'
                                            : 'bg-[#1a110b]/40 border-[#3a2216] text-[#888] hover:border-[#6b4e3d] hover:bg-[#2a1b12]'}
                            `}
                                >
                                    {/* Mobile: Simple Number */}
                                    <span className="lg:hidden text-sm font-bold">{idx + 1}</span>

                                    {/* Desktop: Full Details */}
                                    <div className="hidden lg:block">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${variationIndex === idx ? 'text-[#2a1b12]' : 'text-[#666] group-hover:text-[#c29b6d]'}`}>
                                                Var {idx + 1}
                                            </span>
                                            {variationIndex === idx && <span className="w-1.5 h-1.5 rounded-full bg-[#2a1b12]"></span>}
                                        </div>
                                        <div className={`font-mono text-sm tracking-widest ${variationIndex === idx ? 'font-bold' : ''}`}>
                                            {formatVariation(v)}
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Controls;
