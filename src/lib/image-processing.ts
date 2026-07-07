type FaceBox = { x: number; y: number; width: number; height: number };

type BrowserFaceDetector = new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => {
  detect: (source: CanvasImageSource) => Promise<Array<{ boundingBox: FaceBox }>>;
};

const loadImage = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image illisible"));
    };
    img.src = url;
  });

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const detectPrimaryFace = async (img: HTMLImageElement): Promise<FaceBox | null> => {
  const detectorCtor = (window as unknown as { FaceDetector?: BrowserFaceDetector }).FaceDetector;
  if (!detectorCtor) return null;
  try {
    const detector = new detectorCtor({ fastMode: true, maxDetectedFaces: 1 });
    const faces = await detector.detect(img);
    return faces[0]?.boundingBox ?? null;
  } catch {
    return null;
  }
};

const canvasToFile = (canvas: HTMLCanvasElement, fileName: string) =>
  new Promise<File>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Traitement image impossible"));
          return;
        }
        resolve(new File([blob], fileName.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.9,
    );
  });

export const processProfileImage = async (file: File, kind: "avatar" | "cover") => {
  const img = await loadImage(file);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponible");

  if (kind === "avatar") {
    canvas.width = 720;
    canvas.height = 720;
    const face = await detectPrimaryFace(img);
    const baseSize = Math.min(img.naturalWidth, img.naturalHeight);
    const cropSize = face ? Math.min(Math.max(face.width, face.height) * 2.5, baseSize) : baseSize;
    const centerX = face ? face.x + face.width / 2 : img.naturalWidth / 2;
    const centerY = face ? face.y + face.height / 2 : img.naturalHeight / 2;
    const sx = clamp(centerX - cropSize / 2, 0, img.naturalWidth - cropSize);
    const sy = clamp(centerY - cropSize / 2, 0, img.naturalHeight - cropSize);
    ctx.filter = "brightness(1.08) contrast(1.08) saturate(1.06)";
    ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, canvas.width, canvas.height);
  } else {
    canvas.width = 1600;
    canvas.height = 620;
    const coverScale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
    const bgW = img.naturalWidth * coverScale;
    const bgH = img.naturalHeight * coverScale;
    ctx.filter = "blur(24px) brightness(1.12) contrast(1.05) saturate(1.08)";
    ctx.drawImage(img, (canvas.width - bgW) / 2, (canvas.height - bgH) / 2, bgW, bgH);
    ctx.filter = "brightness(1.08) contrast(1.08) saturate(1.06)";
    const containScale = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
    const fgW = img.naturalWidth * containScale;
    const fgH = img.naturalHeight * containScale;
    ctx.drawImage(img, (canvas.width - fgW) / 2, (canvas.height - fgH) / 2, fgW, fgH);
  }

  return canvasToFile(canvas, file.name);
};
