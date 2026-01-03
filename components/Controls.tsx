
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { ROOTS, CHORD_TYPES, TUNINGS, CAPO_POSITIONS, SCALES } from '../constants';
import { RootNote, ChordType, TuningDefinition, ChordVariation, ScaleDefinition } from '../types';
import { getNoteValue, getNoteName } from '../utils/chordEngine';
import HorizontalWheelRoller from './HorizontalWheelRoller';

// --- Types ---

interface ControlsProps {
    selectedRoot: RootNote;
    selectedQuality: ChordType;
    selectedBass: RootNote;
    tuning: TuningDefinition;
    capo: number;
    isLefty: boolean;
    preferFlats: boolean | null;
    showAllNotes: boolean;
    selectedScale: ScaleDefinition | null;
    showIntervals: boolean;
    variations: ChordVariation[];
    variationIndex: number;
    onRootChange: (root: RootNote) => void;
    onQualityChange: (quality: ChordType) => void;
    onBassChange: (bass: RootNote) => void;
    onTuningChange: (tuning: TuningDefinition) => void;
    onCapoChange: (capo: number) => void;
    onLeftyChange: (isLefty: boolean) => void;
    onPreferFlatsChange: (val: boolean | null) => void;
    onShowAllNotesChange: (show: boolean) => void;
    onScaleChange: (scale: ScaleDefinition | null) => void;
    onShowIntervalsChange: (show: boolean) => void;
    onVariationSelect: (index: number) => void;
}

// --- Helper Components ---

const TabButton: React.FC<{
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 lg:px-6 py-2 lg:py-2.5 text-[9px] lg:text-[10px] font-black uppercase tracking-[0.25em] transition-all duration-500 rounded-lg ${active
            ? 'bg-[#e6c190] text-[#1a110b] shadow-[0_10px_20px_rgba(0,0,0,0.4),inset_0_1px_2px_rgba(255,255,255,0.5)] -translate-y-1'
            : 'bg-[#1a110b] text-[#6b4e3d] shadow-[inset_0_4px_8px_rgba(0,0,0,0.6),0_1px_0_rgba(255,255,255,0.05)] hover:text-[#c29b6d]'
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
    <div className="flex items-center justify-between bg-[#0a0705]/60 p-4 rounded-xl shadow-[inset_0_4px_12px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.05)]">
        <label htmlFor={id} className="text-[10px] text-[#c29b6d] font-black uppercase tracking-[0.2em] cursor-pointer select-none">
            {label}
        </label>
        <button
            onClick={() => onChange(!checked)}
            className={`w-14 h-7 rounded-full relative transition-all duration-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] ${checked ? 'bg-[#e6c190]' : 'bg-[#1a110b]'}`}
        >
            <div className={`absolute top-1 w-5 h-5 rounded-full transition-all duration-500 shadow-[0_4px_8px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.4)] flex items-center justify-center ${checked ? 'left-[32px] bg-[#1a110b]' : 'left-1 bg-[#c29b6d]'}`}>
                <div className="w-1 h-2.5 bg-white/20 rounded-full" />
            </div>
        </button>
    </div>
);

const Select: React.FC<{
    label: string;
    value: string | number;
    options: { value: string | number; label: string }[];
    onChange: (value: string) => void;
}> = ({ label, value, options, onChange }) => (
    <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2.5 ml-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#ff4d00] shadow-[0_0_8px_#ff4d00]" />
            <label className="text-[9px] text-[#c29b6d] font-black uppercase tracking-[0.3em] opacity-80">{label}</label>
        </div>
        <div className="relative group">
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-[#0a0705] text-[#e6c190] rounded-xl p-4 outline-none transition-all appearance-none text-xs font-bold shadow-[inset_0_6px_15px_rgba(0,0,0,0.9),0_1px_0_rgba(255,255,255,0.05)] cursor-pointer group-hover:bg-[#120c08]"
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-[#1a110b]">{opt.label}</option>
                ))}
            </select>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#c29b6d] transition-transform group-hover:translate-y-[-40%]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M19 9l-7 7-7-7" />
                </svg>
            </div>
        </div>
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
    preferFlats,
    showAllNotes,
    selectedScale,
    showIntervals,
    variations,
    variationIndex,
    onRootChange,
    onQualityChange,
    onBassChange,
    onTuningChange,
    onCapoChange,
    onLeftyChange,
    onPreferFlatsChange,
    onShowAllNotesChange,
    onScaleChange,
    onShowIntervalsChange,
    onVariationSelect
}) => {
    const [activeTab, setActiveTab] = useState<'finder' | 'settings'>('finder');
    const [isExpanded, setIsExpanded] = useState(true);

    const useFlats = preferFlats !== null
        ? preferFlats
        : (selectedRoot.includes('b') || selectedRoot.includes('\u266d'));

    const chordTones = useMemo(() => {
        const rootVal = getNoteValue(selectedRoot);
        return selectedQuality.intervals.map(interval => {
            const noteVal = (rootVal + interval) % 12;
            return getNoteName(noteVal, useFlats) as RootNote;
        });
    }, [selectedRoot, selectedQuality, useFlats]);

    const formatVariation = (v: ChordVariation) => {
        return v.frets.map(n => n === -1 ? 'x' : n).join(' ');
    };

    return (
        <div className="relative flex flex-col h-full bg-[#2a1b12] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.1),inset_0_-1px_1px_rgba(0,0,0,0.4)] overflow-hidden rounded-3xl font-mono">
            {/* Wood Texture Overlay - More realistic grain */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-40 pointer-events-none mix-blend-overlay" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/40 pointer-events-none" />

            {/* Corner Screws - More 3D */}
            <div className="absolute top-3 left-4 lg:top-6 lg:left-6 w-3 h-3 lg:w-4 lg:h-4 rounded-full bg-gradient-to-b from-[#3a2216] to-[#1a110b] shadow-[0_2px_4px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] flex items-center justify-center z-20">
                <div className="w-[1px] h-2 lg:h-2.5 bg-[#120c08] rotate-45 shadow-[1px_0_1px_rgba(255,255,255,0.05)]" />
            </div>
            <div className="absolute top-3 right-4 lg:top-6 lg:right-6 w-3 h-3 lg:w-4 lg:h-4 rounded-full bg-gradient-to-b from-[#3a2216] to-[#1a110b] shadow-[0_2px_4px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] flex items-center justify-center z-20">
                <div className="w-[1px] h-2 lg:h-2.5 bg-[#120c08] -rotate-45 shadow-[1px_0_1px_rgba(255,255,255,0.05)]" />
            </div>

            {/* Speaker Grille Section*/}
            <div className="absolute top-0 left-0 right-0 h-24 lg:h-32 bg-[#120c08] shadow-[inset_0_-10px_20px_rgba(0,0,0,0.6),0_1px_0_rgba(255,255,255,0.05)] overflow-hidden z-0">
                <div className="absolute inset-0 opacity-50" style={{
                    backgroundImage: 'radial-gradient(#c29b6d 1.5px, transparent 0)',
                    backgroundSize: '7px 7px'
                }} />
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/40" />
            </div>

            {/* Header & Tabs */}
            <div className="flex flex-col z-10 bg-transparent">
                <div className="flex items-center justify-between p-6 lg:p-10 pb-4 lg:pb-6">
                    <div className="relative">
                        <div className="absolute -inset-4 bg-[#e6c190] blur-xl opacity-5 rounded-full" />
                        <h1 className="text-2xl lg:text-3xl font-black text-[#e6c190] uppercase tracking-[-0.08em] leading-none font-serif italic drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                            FSH<span className="text-[#c29b6d]">GUITAR</span>
                        </h1>
                        <div className="flex items-center gap-3 mt-1.5 lg:mt-2">
                            <div className="h-[1px] w-4 lg:w-6 bg-gradient-to-r from-transparent to-[#c29b6d]/40" />
                            <span className="text-[7px] lg:text-[8px] text-[#c29b6d] font-black tracking-[0.4em] uppercase opacity-80">Precision Audio Gear</span>
                            <div className="h-[1px] w-4 lg:w-6 bg-gradient-to-l from-transparent to-[#c29b6d]/40" />
                        </div>
                    </div>
                    <div className="flex items-center gap-4 lg:gap-6">
                        <div className="flex flex-col items-center gap-1 lg:gap-1.5">
                            <div className="w-2 lg:w-2.5 h-2 lg:h-2.5 rounded-full bg-[#ff4d00] shadow-[0_0_12px_#ff4d00,inset_0_1px_2px_rgba(255,255,255,0.4)] animate-pulse" />
                            <span className="text-[6px] lg:text-[7px] text-[#c29b6d] font-black uppercase tracking-widest opacity-60">Signal</span>
                        </div>
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="lg:hidden p-2.5 text-[#e6c190] bg-[#1a110b] rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.1)] active:translate-y-0.5 transition-all"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="flex px-8 gap-4 mb-6">
                    <TabButton active={activeTab === 'finder'} onClick={() => { setActiveTab('finder'); setIsExpanded(true); }}>
                        Tuning
                    </TabButton>
                    <TabButton active={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); setIsExpanded(true); }}>
                        Setup
                    </TabButton>
                </div>
            </div>

            {/* Main Content */}
            <div className={`flex-1 flex flex-col min-h-0 px-4 lg:px-8 pb-12 lg:pb-16 z-10 ${isExpanded ? 'block' : 'hidden lg:block'}`}>
                {activeTab === 'settings' ? (
                    <div className="space-y-6 lg:space-y-8 animate-fade-in overflow-y-auto flex-1 custom-scrollbar pr-2">
                        <div className="bg-[#0a0705]/60 backdrop-blur-xl p-4 lg:p-6 rounded-2xl lg:rounded-[2rem] shadow-[inset_0_4px_15px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.05)] grid grid-cols-1 gap-4 lg:gap-6">
                            <Select
                                label="Instrument Tuning"
                                value={tuning.name}
                                options={TUNINGS.map(t => ({ value: t.name, label: t.name }))}
                                onChange={(val) => onTuningChange(TUNINGS.find(t => t.name === val) || TUNINGS[0])}
                            />
                            <Select
                                label="Capo Position"
                                value={capo}
                                options={CAPO_POSITIONS.map(p => ({ value: p, label: p === 0 ? 'Open Strings' : `Fret ${p}` }))}
                                onChange={(val) => onCapoChange(Number(val))}
                            />
                            <Select
                                label="Notation Style"
                                value={preferFlats === null ? 'auto' : preferFlats ? 'flats' : 'sharps'}
                                options={[
                                    { value: 'auto', label: 'Automatic' },
                                    { value: 'flats', label: 'Flats (\u266d)' },
                                    { value: 'sharps', label: 'Sharps (\u266f)' }
                                ]}
                                onChange={(val) => {
                                    if (val === 'auto') onPreferFlatsChange(null);
                                    else if (val === 'flats') onPreferFlatsChange(true);
                                    else onPreferFlatsChange(false);
                                }}
                            />
                            <Select
                                label="Scale Reference"
                                value={selectedScale?.id || 'none'}
                                options={SCALES.map(s => ({ value: s.id, label: s.name }))}
                                onChange={(val) => onScaleChange(SCALES.find(s => s.id === val) || null)}
                            />
                            <div className="pt-4 grid grid-cols-1 gap-4">
                                <Toggle id="lefty" label="Lefty Orientation" checked={isLefty} onChange={onLeftyChange} />
                                <Toggle id="showScale" label="Full Chord Map" checked={showAllNotes} onChange={onShowAllNotesChange} />
                                <Toggle id="showIntervals" label="Interval Labels" checked={showIntervals} onChange={onShowIntervalsChange} />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 lg:space-y-10 animate-fade-in flex-1 flex flex-col min-h-0">
                        {/* Root Picker */}
                        <HorizontalWheelRoller
                            label="Root Frequency"
                            displayValue={getNoteName(getNoteValue(selectedRoot), useFlats)}
                            items={ROOTS}
                            selectedItem={selectedRoot}
                            onSelect={onRootChange}
                            itemKey={(item) => item}
                            getItemLabel={(root) => getNoteName(getNoteValue(root), useFlats)}
                        />

                        {/* Quality Picker */}
                        <HorizontalWheelRoller
                            label="Chord Modulation"
                            displayValue={selectedQuality.name}
                            items={CHORD_TYPES}
                            selectedItem={selectedQuality}
                            onSelect={onQualityChange}
                            itemKey={(item) => item.id}
                            getItemLabel={(q) => q.suffix || q.name}
                        />

                        {/* Bass Inversion Picker */}
                        <HorizontalWheelRoller
                            label="Bass Inversion"
                            displayValue={selectedBass !== selectedRoot ? getNoteName(getNoteValue(selectedBass), useFlats) : 'ROOT POSITION'}
                            items={chordTones}
                            selectedItem={selectedBass}
                            onSelect={onBassChange}
                            itemKey={(item) => item}
                            getItemLabel={(root) => getNoteName(getNoteValue(root), useFlats)}
                        />

                        {/* Variations List */}
                        <div className="flex-1 min-h-0 hidden lg:flex flex-col gap-3">
                            <div className="flex justify-between items-center pb-2 mt-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-3 bg-[#ff4d00] rounded-full shadow-[0_0_8px_#ff4d00]" />
                                    <span className="text-[9px] text-[#c29b6d] font-black uppercase tracking-[0.3em]">
                                        Signal Variations
                                    </span>
                                </div>
                                <div className="flex gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#ff4d00] animate-pulse shadow-[0_0_4px_#ff4d00]" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#ff4d00]/20" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 overflow-y-auto flex-1 pr-2 custom-scrollbar pb-4 pt-2 content-start">
                                {variations.length === 0 ? (
                                    <div className="col-span-2 text-center text-[#444] text-[9px] py-10 font-black uppercase tracking-[0.4em] italic bg-[#050302] rounded-2xl shadow-[inset_0_4px_12px_rgba(0,0,0,0.9)]">
                                        No Signal Detected
                                    </div>
                                ) : (
                                    variations.map((v, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => onVariationSelect(idx)}
                                            className={`
                                                text-left px-4 py-3 rounded-xl transition-all duration-500 group relative overflow-hidden flex flex-col justify-center h-16
                                                ${variationIndex === idx
                                                    ? 'bg-[#e6c190] text-[#1a110b] shadow-[0_10px_25px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.4)] -translate-y-1 scale-[1.02]'
                                                    : 'bg-[#050302] text-[#6b4e3d] shadow-[inset_0_4px_10px_rgba(0,0,0,0.8)] hover:bg-[#0a0705] hover:scale-[1.02]'
                                                }
                                            `}
                                        >
                                            <div className="flex justify-between items-center mb-1 w-full">
                                                <span className={`text-[8px] font-black uppercase tracking-[0.1em] ${variationIndex === idx ? 'text-[#1a110b]' : 'text-[#6b4e3d]'}`}>
                                                    CH-{String(idx + 1).padStart(2, '0')}
                                                </span>
                                                {v.cagedShape && (
                                                    <span className={`text-[7px] font-black px-1.5 py-0.5 rounded ${variationIndex === idx ? 'bg-[#1a110b]/10 text-[#1a110b]' : 'bg-[#c29b6d]/5 text-[#c29b6d]'}`}>
                                                        {v.cagedShape}
                                                    </span>
                                                )}
                                            </div>
                                            <div className={`font-mono text-xs tracking-[0.15em] ${variationIndex === idx ? 'font-black' : 'font-bold'}`}>
                                                {formatVariation(v)}
                                            </div>
                                            {variationIndex === idx && (
                                                <div className="absolute right-0 top-0 bottom-0 w-1 bg-[#ff4d00] shadow-[-2px_0_12px_rgba(255,77,0,0.6)]" />
                                            )}
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
