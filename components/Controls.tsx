
import React, { useRef, useEffect, useState } from 'react';
import { ROOTS, CHORD_TYPES, TUNINGS, CAPO_POSITIONS } from '../constants';
import { RootNote, ChordType, TuningDefinition, ChordVariation } from '../types';

// --- Types ---

interface ControlsProps {
    selectedRoot: RootNote;
    selectedQuality: ChordType;
    selectedBass: RootNote;
    tuning: TuningDefinition;
    capo: number;
    isLefty: boolean;
    showAllNotes: boolean;
    showIntervals: boolean;
    variations: ChordVariation[];
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

// --- Helper Components ---

interface ScrollablePickerProps<T> {
    label?: string;
    displayValue?: string;
    items: T[];
    selectedItem: T;
    onSelect: (item: T) => void;
    itemKey: (item: T) => string | number;
    renderItem: (item: T, isSelected: boolean) => React.ReactNode;
    className?: string;
}

function ScrollablePicker<T>({
    label,
    displayValue,
    items,
    selectedItem,
    onSelect,
    itemKey,
    renderItem,
    className = ""
}: ScrollablePickerProps<T>) {
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Center active item on change
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const activeItem = container.querySelector('[data-active="true"]') as HTMLElement;
        if (activeItem) {
            const containerCenter = container.scrollLeft + container.clientWidth / 2;
            const itemCenter = activeItem.offsetLeft + activeItem.offsetWidth / 2;
            if (Math.abs(containerCenter - itemCenter) < 10) return;
            activeItem.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
    }, [selectedItem]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const container = e.currentTarget;
        if (scrollTimeout.current) clearTimeout(scrollTimeout.current);

        scrollTimeout.current = setTimeout(() => {
            const containerCenter = container.scrollLeft + container.clientWidth / 2;
            let closestItem = null;
            let minDiff = Infinity;

            Array.from(container.children).forEach((child, index) => {
                const htmlChild = child as HTMLElement;
                if (htmlChild.tagName !== 'BUTTON') return;
                const childCenter = htmlChild.offsetLeft + htmlChild.offsetWidth / 2;
                const diff = Math.abs(containerCenter - childCenter);
                if (diff < minDiff) {
                    minDiff = diff;
                    closestItem = items[index];
                }
            });

            if (closestItem) {
                const currentKey = itemKey(selectedItem);
                const closestKey = itemKey(closestItem);
                if (currentKey !== closestKey) {
                    onSelect(closestItem);
                }
            }
        }, 100);
    };

    return (
        <div className={`space-y-1 lg:space-y-2 ${className}`}>
            {label && (
                <div className="flex justify-between items-center px-1">
                    <span className="text-xs text-[#c29b6d] font-bold uppercase tracking-widest">{label}</span>
                    {displayValue && (
                        <span className="text-xs font-bold text-[#e6c190] bg-[#1a110b] px-3 py-1 rounded-md border border-[#3a2216] truncate max-w-[150px]">
                            {displayValue}
                        </span>
                    )}
                </div>
            )}
            <div className="relative group">
                <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#2a1b12] to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#2a1b12] to-transparent z-10 pointer-events-none" />
                <div
                    ref={containerRef}
                    onScroll={handleScroll}
                    className="flex h-full overflow-x-auto snap-x snap-mandatory gap-2 lg:gap-4 py-2 lg:py-4 px-[50%] no-scrollbar bg-[#1a110b]/30 rounded-xl border border-[#3a2216] shadow-inner items-center relative"
                >
                    {items.map((item) => {
                        const key = itemKey(item);
                        const isSelected = key === itemKey(selectedItem);
                        return (
                            <React.Fragment key={key}>
                                {renderItem(item, isSelected)}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

const TabButton: React.FC<{
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`pb-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${active
                ? 'text-[#e6c190] border-[#e6c190]'
                : 'text-[#666] border-transparent hover:text-[#c29b6d]'
            }`}
    >
        {children}
    </button>
);

const Toggle: React.FC<{
    id: string;
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}> = ({ id, label, checked, onChange }) => (
    <div className="flex items-center gap-2">
        <input
            type="checkbox"
            id={id}
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="accent-[#e6c190]"
        />
        <label htmlFor={id} className="text-[#c29b6d] font-bold uppercase tracking-wider cursor-pointer select-none">
            {label}
        </label>
    </div>
);

const Select: React.FC<{
    label: string;
    value: string | number;
    options: { value: string | number; label: string }[];
    onChange: (value: string) => void;
}> = ({ label, value, options, onChange }) => (
    <div className="flex flex-col gap-1">
        <label className="text-[#888] font-bold uppercase tracking-wider">{label}</label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="bg-[#2a1b12] text-[#e6c190] border border-[#3a2216] rounded p-2 outline-none focus:border-[#e6c190]/50 transition-colors"
        >
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    </div>
);

// --- Main Component ---

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
    const [activeTab, setActiveTab] = useState<'finder' | 'settings'>('finder');
    const [isExpanded, setIsExpanded] = useState(true);
    const [showBass, setShowBass] = useState(false);

    const formatVariation = (v: ChordVariation) => {
        return v.frets.map(n => n === -1 ? 'x' : n).join(' ');
    };

    return (
        <div className="relative flex flex-col h-full bg-[#2a1b12] border border-[#e6c190]/20 shadow-xl overflow-hidden rounded-xl font-mono">
            {/* Decorative BG */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-10 pointer-events-none" />

            {/* Header & Tabs */}
            <div className="flex flex-col z-10 border-b border-[#e6c190]/10 bg-[#1a110b]/90 backdrop-blur-sm">
                <div className="flex items-center justify-between p-4 pb-2">
                    <div>
                        <h1 className="text-xl font-bold text-[#e6c190] uppercase tracking-tighter leading-none font-sans">
                            AxeGrain
                        </h1>
                        <span className="text-[10px] text-[#c29b6d] tracking-widest uppercase">Chord Finder</span>
                    </div>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="lg:hidden p-2 text-[#c29b6d]"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>

                <div className="flex px-4 gap-6">
                    <TabButton active={activeTab === 'finder'} onClick={() => { setActiveTab('finder'); setIsExpanded(true); }}>
                        Finder
                    </TabButton>
                    <TabButton active={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); setIsExpanded(true); }}>
                        Settings
                    </TabButton>
                </div>
            </div>

            {/* Main Content */}
            <div className={`flex-1 overflow-y-auto custom-scrollbar p-2 lg:p-4 ${isExpanded ? 'block' : 'hidden lg:block'}`}>
                {activeTab === 'settings' ? (
                    <div className="space-y-4 animate-fade-in">
                        <div className="bg-[#120c08] p-4 rounded-lg border border-[#e6c190]/10 grid grid-cols-1 gap-4 text-xs">
                            <Select
                                label="Tuning"
                                value={tuning.name}
                                options={TUNINGS.map(t => ({ value: t.name, label: t.name }))}
                                onChange={(val) => onTuningChange(TUNINGS.find(t => t.name === val) || TUNINGS[0])}
                            />
                            <Select
                                label="Capo"
                                value={capo}
                                options={CAPO_POSITIONS.map(p => ({ value: p, label: p === 0 ? '- None -' : `Fret ${p}` }))}
                                onChange={(val) => onCapoChange(Number(val))}
                            />
                            <div className="pt-2 space-y-2">
                                <Toggle id="lefty" label="Lefty Mode" checked={isLefty} onChange={onLeftyChange} />
                                <Toggle id="showScale" label="Show Scale" checked={showAllNotes} onChange={onShowAllNotesChange} />
                                <Toggle id="showIntervals" label="Show Intervals" checked={showIntervals} onChange={onShowIntervalsChange} />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2 lg:space-y-6 animate-fade-in h-full flex flex-col">
                        {/* Root Picker */}
                        <ScrollablePicker
                            label="Root"
                            displayValue={selectedRoot}
                            items={ROOTS}
                            selectedItem={selectedRoot}
                            onSelect={onRootChange}
                            itemKey={(item) => item}
                            className="h-[96px] lg:h-[112px]"
                            renderItem={(root, isSelected) => (
                                <button
                                    data-active={isSelected}
                                    onClick={() => onRootChange(root)}
                                    className={`
                                        snap-center flex-shrink-0 w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center rounded-full transition-all duration-300 ease-out border relative
                                        ${isSelected
                                            ? 'bg-[#e6c190] text-[#2a1b12] border-[#e6c190] shadow-[0_0_20px_rgba(230,193,144,0.3)] scale-110 font-bold text-lg lg:text-xl z-10'
                                            : 'bg-[#2a1b12] text-[#555] border-transparent scale-90 text-xs lg:text-sm opacity-50 hover:opacity-100'}
                                    `}
                                >
                                    {root}
                                </button>
                            )}
                        />

                        {/* Quality Picker */}
                        <ScrollablePicker
                            label="Quality"
                            displayValue={selectedQuality.name}
                            items={CHORD_TYPES}
                            selectedItem={selectedQuality}
                            onSelect={onQualityChange}
                            itemKey={(item) => item.id}
                            className="h-[84px] lg:h-[100px]"
                            renderItem={(q, isSelected) => (
                                <button
                                    data-active={isSelected}
                                    onClick={() => onQualityChange(q)}
                                    className={`
                                        snap-center flex-shrink-0 px-3 py-1 lg:px-4 lg:py-2 rounded-lg transition-all duration-300 ease-out whitespace-nowrap border
                                        ${isSelected
                                            ? 'bg-[#e6c190] text-[#2a1b12] border-[#e6c190] shadow-[0_0_20px_rgba(230,193,144,0.3)] font-bold text-xs lg:text-sm scale-110 z-10'
                                            : 'bg-[#2a1b12] text-[#555] border-transparent scale-90 text-[10px] lg:text-xs opacity-50 hover:opacity-100'}
                                    `}
                                >
                                    {q.suffix || q.name}
                                </button>
                            )}
                        />

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
                                className={`w-full flex justify-between items-center px-3 py-2 lg:px-4 lg:py-3 rounded-xl border transition-all duration-300 ${showBass
                                        ? 'bg-[#3a2216] border-[#e6c190] text-[#e6c190] shadow-lg'
                                        : 'bg-[#1a110b]/40 border-[#3a2216] text-[#c29b6d] hover:bg-[#2a1b12]'
                                    }`}
                            >
                                <span className="text-xs font-bold uppercase tracking-wide">Slash Bass / Inversion</span>
                                <span className="text-sm font-mono font-bold opacity-80">
                                    {selectedBass !== selectedRoot ? `/ ${selectedBass}` : '/ Root'}
                                </span>
                            </button>

                            {showBass && (
                                <div className="animate-fade-in">
                                    <ScrollablePicker
                                        items={ROOTS}
                                        selectedItem={selectedBass}
                                        onSelect={onBassChange}
                                        itemKey={(item) => item}
                                        className="h-[72px] lg:h-[88px]"
                                        renderItem={(root, isSelected) => (
                                            <button
                                                data-active={isSelected}
                                                onClick={() => onBassChange(root)}
                                                className={`
                                                    snap-center flex-shrink-0 w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-full transition-all duration-300 ease-out border
                                                    ${isSelected
                                                        ? 'bg-[#c29b6d] text-[#1a110b] border-[#c29b6d] scale-110 font-bold text-base lg:text-lg z-10 shadow-[0_0_15px_rgba(194,155,109,0.4)]'
                                                        : 'bg-[#2a1b12] text-[#555] border-transparent scale-90 text-[10px] lg:text-xs opacity-50 hover:opacity-100'}
                                                `}
                                            >
                                                {root}
                                            </button>
                                        )}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Variations List */}
                        <div className="flex-1 min-h-0 hidden lg:flex flex-col gap-1 lg:gap-3">
                            <div className="flex justify-between items-baseline border-b border-[#3a2216] pb-2 mt-2 lg:mt-4">
                                <span className="text-xs text-[#c29b6d] font-bold uppercase tracking-widest">
                                    Variations ({variations.length})
                                </span>
                                <span className="text-[10px] text-[#6b4e3d] font-bold uppercase tracking-widest lg:hidden">
                                    Swipe fretboard to flip
                                </span>
                            </div>
                            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-2 gap-2 overflow-y-auto flex-1 pr-1 custom-scrollbar pb-2 content-start">
                                {variations.length === 0 ? (
                                    <div className="col-span-3 sm:col-span-4 lg:col-span-2 text-center text-[#666] text-xs py-8 italic">
                                        No variations found.
                                    </div>
                                ) : (
                                    variations.map((v, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => onVariationSelect(idx)}
                                            className={`
                                                text-left px-0 lg:px-4 rounded-lg border transition-all duration-200 group relative overflow-hidden flex items-center justify-center lg:flex lg:flex-col lg:justify-center h-12 lg:h-[4.5rem]
                                                ${variationIndex === idx
                                                    ? 'bg-[#e6c190] border-[#e6c190] text-[#2a1b12] shadow-lg'
                                                    : 'bg-[#1a110b]/40 border-[#3a2216] text-[#888] hover:border-[#6b4e3d] hover:bg-[#2a1b12]'}
                                            `}
                                        >
                                            {/* Mobile: Simple Number */}
                                            <span className="lg:hidden text-sm font-bold">{idx + 1}</span>
                                            {/* Desktop: Full Details */}
                                            <div className="hidden lg:block w-full">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${variationIndex === idx ? 'text-[#2a1b12]' : 'text-[#666] group-hover:text-[#c29b6d]'}`}>
                                                        Var {idx + 1}
                                                    </span>
                                                    {v.cagedShape && (
                                                        <span className={`text-[9px] font-bold px-1.5 rounded border ${variationIndex === idx ? 'border-[#2a1b12] text-[#2a1b12]' : 'border-[#c29b6d]/50 text-[#c29b6d]'}`}>
                                                            {v.cagedShape}-Shape
                                                        </span>
                                                    )}
                                                    {variationIndex === idx && !v.cagedShape && <span className="w-1.5 h-1.5 rounded-full bg-[#2a1b12]"></span>}
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
                )}
            </div>
        </div>
    );
};

export default Controls;
