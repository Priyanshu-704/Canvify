# Canvify - Interactive Visual Design Engine

A premium split-screen web application featuring an interactive canvas editor and a live, dark-themed code editor with high-performance two-way data synchronization.

## Features

- **Interactive Canvas Engine**: Create containers, rectangles, circles, triangles, freehand vector paths, and icons using click-and-drag drawing interfaces.
- **Two-Way Synchronization**: Edit the visual layout to generate clean CSS/HTML/Tailwind output in real time, or modify the raw source code in the Monaco code editor to update the canvas instantly.
- **Vector Path Node Editor**: Toggle **Edit Nodes** mode on any drawn vector path to distort individual segment coordinates using draggable circular handles.
- **Shape-to-Path Conversion**: Convert static geometric shapes (Rectangles, Triangles, Circles) into fully editable vector paths with the click of a button.
- **Dynamic Icon Swapper**: Search and swap over 1,000+ icons on the fly powered by a fully indexed Lucide-React catalog.
- **Box Model Overlay**: Visualize margins and paddings with an overlay outlining bounding boxes.
- **Aesthetic Controls**: Comprehensive control panel to adjust borders, strokes, fill colors, opacity, spacing, and time-travel history (Undo/Redo).

## Technology Stack

- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS & Custom CSS
- **Code Editor**: Monaco Editor
- **Icons**: Lucide React
- **Build Tool**: Vite

## Getting Started

### Installation

```bash
npm install
```

### Running Locally

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```
