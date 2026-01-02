# Guitar Chord Finder

A beautiful, wood-themed guitar chord finder application built with React, TypeScript, and Vite.

## Features

- **Chord Discovery**: Explore a vast library of chords by selecting root notes, qualities (Major, Minor, 7th, etc.), and bass notes (slash chords).
- **Interactive Fretboard**: Visual representation of chord voicings on a realistic-looking guitar neck.
- **Customizable Settings**:
  - **Tunings**: Support for Standard, Drop D, Double Drop D, DADGAD, Open D, Open G, and Open E.
  - **Capo**: Adjustable capo position (0-12 frets).
  - **Left-Handed Mode**: Mirror the fretboard for left-handed players.
- **Chord Variations**: Browse through multiple voicings for any given chord to find the one that fits your playing style.
- **Scale Visualization**: Toggle "Show Scale" to see all available notes for the selected chord across the entire fretboard.
- **Responsive Design**: Optimized for both desktop and mobile devices.

## Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/timber-chord-finder.git
   cd timber-chord-finder
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173` (or the port shown in your terminal).

## Project Structure

- `src/App.tsx`: Main application component.
- `src/components/`: UI components (Fretboard, Controls, WoodGrain).
- `src/utils/chordEngine.ts`: Logic for generating chord shapes and calculating intervals.
- `src/constants.ts`: Definitions for chord types, tunings, and theme colors.
- `src/types.ts`: TypeScript interfaces and type definitions.

## License

This project is licensed under the MIT License.
