import React from 'react';

const WoodGrain: React.FC = () => {
  return (
    <>
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <filter id="woodGrain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.01 0.2"
            numOctaves="4"
            result="noise"
          />
          <feDiffuseLighting
            in="noise"
            lightingColor="#ffffff"
            surfaceScale="2"
            result="light"
          >
            <feDistantLight azimuth="45" elevation="60" />
          </feDiffuseLighting>
          <feComposite
            in="light"
            in2="SourceGraphic"
            operator="arithmetic"
            k1="1"
            k2="0"
            k3="0"
            k4="0"
          />
        </filter>
      </svg>
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.12] z-50 mix-blend-overlay"
        style={{ filter: 'url(#woodGrain)' }}
      />
    </>
  );
};

export default WoodGrain;