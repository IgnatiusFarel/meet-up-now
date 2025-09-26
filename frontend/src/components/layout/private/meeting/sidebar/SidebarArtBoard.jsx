import { Button } from "antd";
import { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
import { EraserBrush } from "@erase2d/fabric";

const SidebarArtboard = () => {
  const canvasRef = useRef(null);
  const [canvas, setCanvas] = useState(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      isDrawingMode: true,
      backgroundColor: "#fff",
    });

    // default brush
    fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas);
    fabricCanvas.freeDrawingBrush.width = 2;
    fabricCanvas.freeDrawingBrush.color = "#000";

    // semua path yang dibuat otomatis erasable
    fabricCanvas.on("path:created", (opt) => {
      if (opt.path) {
        opt.path.set({ erasable: true });
      }
    });

    setCanvas(fabricCanvas);

    return () => {
      fabricCanvas.dispose();
    };
  }, []);

  const setPen = () => {
    if (!canvas) return;
    setIsActive(true);
    canvas.isDrawingMode = true;

    const brush = new fabric.PencilBrush(canvas);
    brush.width = 2;
    brush.color = "#000";
    canvas.freeDrawingBrush = brush;
  };

  const setMarker = () => {
    if (!canvas) return;
    setIsActive(true);
    canvas.isDrawingMode = true;

    const brush = new fabric.PencilBrush(canvas);
    brush.width = 10;
    brush.color = "rgba(204,255,0,0.5)"; // semi transparan
    canvas.freeDrawingBrush = brush;
  };

  const setEraser = () => {
    if (!canvas) return;
    setIsActive(true);
    canvas.isDrawingMode = true;

    const eraser = new EraserBrush(canvas);
    eraser.width = 30;

    // commit otomatis setelah selesai erase
    eraser.on("end", async (e) => {
      const { path, targets } = e.detail;
      await eraser.commit({ path, targets });
      canvas.renderAll();
    });

    canvas.freeDrawingBrush = eraser;
  };

  const clearCanvas = () => {
    if (!canvas) return;
    setIsActive(true);
    canvas.clear();
    canvas.backgroundColor = "#fff";
    canvas.renderAll();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 bg-white border border-gray-300 rounded-lg relative overflow-hidden">
        {/* Canvas selalu ada */}
        <canvas ref={canvasRef} width={600} height={400} />

        {/* Overlay placeholder */}
        {!isActive && (
          <div className="absolute inset-0 bg-gray-50 flex items-center justify-center pointer-events-none">
            <div className="text-center text-gray-500">
              <div className="text-6xl mb-4">🎨</div>
              <p className="text-lg font-medium mb-2">Collaborative Artboard</p>
              <p className="text-sm">
                Draw, sketch, and collaborate with participants
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button size="small" onClick={setPen}>
          ✏️ Pen
        </Button>
        <Button size="small" onClick={setMarker}>
          🖍️ Marker
        </Button>
        <Button size="small" onClick={setEraser}>
          🧽 Eraser
        </Button>
        <Button size="small" onClick={clearCanvas}>
          🗑️ Clear
        </Button>
      </div>
    </div>
  );
};

export default SidebarArtboard;
