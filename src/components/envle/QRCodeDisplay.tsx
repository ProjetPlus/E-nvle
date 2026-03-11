import { useEffect, useRef } from "react";

interface Props {
  value: string;
  size?: number;
}

// Simple QR-like visual generator (decorative — real QR needs a library)
const QRCodeDisplay = ({ value, size = 200 }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const s = size;
    canvas.width = s;
    canvas.height = s;

    // Generate deterministic pattern from value
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
    }

    const modules = 25;
    const cellSize = s / modules;

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, s, s);

    // Draw modules
    ctx.fillStyle = "#0a0a0a";

    // Position patterns (corners)
    const drawFinderPattern = (x: number, y: number) => {
      for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 7; j++) {
          const isOuter = i === 0 || i === 6 || j === 0 || j === 6;
          const isInner = i >= 2 && i <= 4 && j >= 2 && j <= 4;
          if (isOuter || isInner) {
            ctx.fillRect((x + i) * cellSize, (y + j) * cellSize, cellSize, cellSize);
          }
        }
      }
    };

    drawFinderPattern(0, 0);
    drawFinderPattern(modules - 7, 0);
    drawFinderPattern(0, modules - 7);

    // Data modules (pseudo-random based on hash)
    const seed = Math.abs(hash);
    for (let i = 0; i < modules; i++) {
      for (let j = 0; j < modules; j++) {
        // Skip finder patterns
        if ((i < 8 && j < 8) || (i >= modules - 8 && j < 8) || (i < 8 && j >= modules - 8)) continue;
        
        const val = ((seed * (i * modules + j + 1) * 7919) >> 3) & 1;
        if (val) {
          ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
        }
      }
    }

    // Center logo area
    const logoSize = 5;
    const logoStart = Math.floor((modules - logoSize) / 2);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(logoStart * cellSize - 2, logoStart * cellSize - 2, logoSize * cellSize + 4, logoSize * cellSize + 4);
    
    // Draw E'nvlé text
    ctx.fillStyle = "#2D7D46";
    ctx.font = `bold ${cellSize * 2.5}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("E", s / 2, s / 2);
  }, [value, size]);

  return (
    <div className="inline-block p-4 bg-white rounded-2xl shadow-lg">
      <canvas ref={canvasRef} className="rounded-lg" style={{ width: size, height: size }} />
    </div>
  );
};

export default QRCodeDisplay;
