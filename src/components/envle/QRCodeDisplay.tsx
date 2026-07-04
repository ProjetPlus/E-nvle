import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import envleLogo from "@/assets/envle-logo.png";

interface Props {
  value: string;
  size?: number;
}

const QRCodeDisplay = ({ value, size = 220 }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    QRCode.toCanvas(
      canvas,
      value || "https://envle.one",
      {
        errorCorrectionLevel: "H",
        margin: 2,
        width: size,
        color: { dark: "#0d3d2e", light: "#ffffff" },
      },
      (err) => {
        if (err) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const logo = new Image();
        logo.crossOrigin = "anonymous";
        logo.src = envleLogo;
        logo.onload = () => {
          const logoSize = size * 0.22;
          const x = (size - logoSize) / 2;
          const y = (size - logoSize) / 2;
          // white rounded badge
          ctx.fillStyle = "#ffffff";
          const pad = 6;
          ctx.beginPath();
          const r = 10;
          const bx = x - pad, by = y - pad, bw = logoSize + pad * 2, bh = logoSize + pad * 2;
          ctx.moveTo(bx + r, by);
          ctx.arcTo(bx + bw, by, bx + bw, by + bh, r);
          ctx.arcTo(bx + bw, by + bh, bx, by + bh, r);
          ctx.arcTo(bx, by + bh, bx, by, r);
          ctx.arcTo(bx, by, bx + bw, by, r);
          ctx.closePath();
          ctx.fill();
          ctx.drawImage(logo, x, y, logoSize, logoSize);
        };
      }
    );
  }, [value, size]);

  return (
    <div className="inline-block p-3 bg-white rounded-2xl shadow-xl">
      <canvas ref={canvasRef} style={{ width: size, height: size }} />
    </div>
  );
};

export default QRCodeDisplay;
