import React, { useRef, useEffect } from 'react';

interface HorizontalWheelRollerProps<T> {
    items: T[];
    selectedItem: T;
    onSelect: (item: T) => void;
    itemKey: (item: T) => string | number;
    getItemLabel?: (item: T) => string;
    renderItem?: (item: T, isSelected: boolean) => React.ReactNode;
    label?: string;
    displayValue?: string;
    className?: string;
}

function HorizontalWheelRoller<T>({
    items,
    selectedItem,
    onSelect,
    itemKey,
    getItemLabel,
    renderItem,
    label,
    displayValue,
    className = ""
}: HorizontalWheelRollerProps<T>) {
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const defaultRenderItem = (item: T, isSelected: boolean) => {
        const text = getItemLabel ? getItemLabel(item) : String(item);
        return (
            <div className={`
                flex flex-col items-center justify-center transition-all duration-500 ease-out
                ${isSelected ? 'scale-125' : 'scale-90'}
            `}>
                <span className={`
                    text-lg lg:text-xl font-black tracking-tighter transition-all duration-500
                    ${isSelected
                        ? 'text-[#e6c190] drop-shadow-[0_0_12px_rgba(230,193,144,0.6)]'
                        : 'text-[#555] opacity-40 hover:opacity-80'}
                `}>
                    {text}
                </span>
                <div className={`
                    w-1.5 h-1.5 rounded-full mt-2 transition-all duration-500
                    ${isSelected ? 'bg-[#ff4d00] shadow-[0_0_8px_#ff4d00]' : 'bg-[#1a110b]'}
                `} />
            </div>
        );
    };

    // Center active item on change
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const activeItem = container.querySelector('[data-active="true"]') as HTMLElement;
        if (activeItem) {
            const containerCenter = container.scrollLeft + container.clientWidth / 2;
            const itemCenter = activeItem.offsetLeft + activeItem.offsetWidth / 2;
            if (Math.abs(containerCenter - itemCenter) < 2) return;
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
                // We assume children are the items. If there are wrappers, we might need to adjust.
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
        <div className={`flex flex-col gap-1 lg:gap-1.5 ${className}`}>
            {label && (
                <div className="flex justify-between items-center px-1">
                    <span className="text-[9px] lg:text-[10px] text-[#c29b6d] font-black uppercase tracking-[0.2em]">{label}</span>
                    {displayValue && (
                        <span className="text-[9px] lg:text-[10px] font-bold text-[#e6c190] bg-[#0a0705] px-2 lg:px-3 py-0.5 rounded-full border border-[#3a2216] shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]">
                            {displayValue}
                        </span>
                    )}
                </div>
            )}

            <div className="relative group h-16 lg:h-20">


                {/* Glass Cover Effect - Borderless, recessed into wood */}
                <div className="absolute inset-0 rounded-2xl shadow-[inset_0_8px_20px_rgba(0,0,0,0.9),0_1px_0_rgba(255,255,255,0.05)] pointer-events-none z-30 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/20 opacity-20" />
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/10" />
                </div>

                {/* Side Vignettes */}
                <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#050302] via-[#050302]/80 to-transparent z-20 pointer-events-none rounded-l-2xl" />
                <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#050302] via-[#050302]/80 to-transparent z-20 pointer-events-none rounded-r-2xl" />

                {/* The Roller Content */}
                <div
                    ref={containerRef}
                    onScroll={handleScroll}
                    className="flex h-full overflow-x-auto snap-x snap-mandatory px-[50%] no-scrollbar bg-[#050302] rounded-2xl items-center relative z-0 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"
                >
                    {items.map((item) => {
                        const key = itemKey(item);
                        const isSelected = key === itemKey(selectedItem);
                        return (
                            <div
                                key={key}
                                data-active={isSelected}
                                className={`snap-center flex-shrink-0 flex items-center justify-center min-w-[70px] lg:min-w-[90px] transition-opacity duration-300 ${isSelected ? 'opacity-100' : 'opacity-30'}`}
                            >
                                {renderItem ? renderItem(item, isSelected) : defaultRenderItem(item, isSelected)}
                            </div>
                        );
                    })}
                </div>

                {/* Internal Scale Markings */}
                <div className="absolute inset-x-0 bottom-2 flex justify-between px-4 opacity-20 pointer-events-none z-10">
                    {Array.from({ length: 20 }).map((_, i) => (
                        <div key={i} className={`w-[1px] bg-[#c29b6d] ${i % 5 === 0 ? 'h-3' : 'h-1.5'}`} />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default HorizontalWheelRoller;
