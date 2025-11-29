import { Button } from "antd";
import { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
import { EraserBrush } from "@erase2d/fabric";
import useWebSocketArtBoard from "@/hooks/useWebSocketArtBoard.jsx";
import useMeetingStore from "@/stores/MeetingStore.jsx";

const SidebarArtboard = () => {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const isReceivingUpdate = useRef(false);
  const pathIdCounter = useRef(Date.now());
  const currentMeeting = useMeetingStore(s => s.currentMeeting);

  // Initialize WebSocket with callbacks
  const { emitDraw, emitErase, emitClear, meetingId } = useWebSocketArtBoard({
    onDrawEvent: (pathData) => {
      const canvas = fabricCanvasRef.current;
      if (canvas && pathData) {
        isReceivingUpdate.current = true;
        
        fabric.util.enlivenObjects([pathData], (objects) => {
          objects.forEach((obj) => {
            obj.set({ 
              selectable: false, 
              evented: false,
              erasable: true
            });
            canvas.add(obj);
          });
          canvas.renderAll();
        });
        
        isReceivingUpdate.current = false;
      }
    },
    
    onEraseEvent: (eraseData) => {
      const canvas = fabricCanvasRef.current;
      if (canvas && eraseData) {
        isReceivingUpdate.current = true;
        
        // Remove erased objects
        if (eraseData.erasedIds && eraseData.erasedIds.length > 0) {
          const objects = canvas.getObjects();
          eraseData.erasedIds.forEach((id) => {
            const obj = objects.find(o => o.id === id);
            if (obj) {
              canvas.remove(obj);
            }
          });
        }
        
        // Add eraser path if exists
        if (eraseData.eraserPath) {
          fabric.util.enlivenObjects([eraseData.eraserPath], (objects) => {
            objects.forEach((obj) => {
              canvas.add(obj);
            });
          });
        }
        
        canvas.renderAll();
        isReceivingUpdate.current = false;
      }
    },
    
    onClearEvent: () => {
      const canvas = fabricCanvasRef.current;
      if (canvas) {
        isReceivingUpdate.current = true;
        canvas.clear();
        canvas.backgroundColor = "#fff";
        canvas.renderAll();
        isReceivingUpdate.current = false;
      }
    }
  });

  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      isDrawingMode: false,
      backgroundColor: "#fff",
    });

    fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas);
    fabricCanvas.freeDrawingBrush.width = 2;
    fabricCanvas.freeDrawingBrush.color = "#000";

    // Handle path creation
    fabricCanvas.on("path:created", (opt) => {
      if (opt.path && !isReceivingUpdate.current) {
        // Assign unique ID
        const pathId = `path_${meetingId}_${pathIdCounter.current++}_${Math.random()}`;
        opt.path.set({ 
          erasable: true,
          id: pathId,
          selectable: false,
          evented: false
        });
        
        // Convert to object and emit
        const pathData = opt.path.toObject([
          "id", 
          "erasable", 
          "stroke", 
          "strokeWidth", 
          "fill",
          "opacity",
          "path"
        ]);
        
        emitDraw(pathData);
      }
    });

    fabricCanvasRef.current = fabricCanvas;

    return () => {
      fabricCanvas.dispose();
    };
  }, [emitDraw, meetingId]);

  // Enable artboard when meeting is active
  useEffect(() => {
    if (currentMeeting && !isActive) {
      setIsActive(true);
    }
  }, [currentMeeting, isActive]);

  // Brush functions
  const setPen = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !meetingId) return;
    
    setIsActive(true);
    canvas.isDrawingMode = true;
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush.width = 2;
    canvas.freeDrawingBrush.color = "#000";
  };

  const setMarker = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !meetingId) return;
    
    setIsActive(true);
    canvas.isDrawingMode = true;
    const brush = new fabric.PencilBrush(canvas);
    brush.width = 10;
    brush.color = "rgba(204,255,0,0.5)";
    canvas.freeDrawingBrush = brush;
  };

  const setEraser = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !meetingId) return;
    
    setIsActive(true);
    canvas.isDrawingMode = true;
    const eraser = new EraserBrush(canvas);
    eraser.width = 30;
    
    eraser.on("end", async (e) => {
      if (!isReceivingUpdate.current) {
        const { path, targets } = e.detail;
        await eraser.commit({ path, targets });
        canvas.renderAll();
        
        // Collect IDs of erased objects
        const erasedIds = targets
          .filter(t => t.id)
          .map(t => t.id);
        
        // Emit erase event
        if (erasedIds.length > 0 || path) {
          emitErase({
            erasedIds,
            eraserPath: path ? path.toObject() : null
          });
        }
      }
    });
    
    canvas.freeDrawingBrush = eraser;
  };

  const clearCanvas = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !meetingId) return;
    
    setIsActive(true);
    canvas.clear();
    canvas.backgroundColor = "#fff";
    canvas.renderAll();
    emitClear();
  };

  // Disable drawing if no active meeting
  const isDisabled = !meetingId || !currentMeeting;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 bg-white border border-gray-300 rounded-lg relative overflow-hidden">
        <canvas ref={canvasRef} width={600} height={400} />
        {(!isActive || isDisabled) && (
          <div className="absolute inset-0 bg-gray-50 flex items-center justify-center pointer-events-none">
            <div className="text-center text-gray-500">
              <div className="text-6xl mb-4">🎨</div>
              <p className="text-lg font-medium mb-2">Collaborative Artboard</p>
              <p className="text-sm">
                {isDisabled 
                  ? "Join a meeting to start collaborating"
                  : "Draw, sketch, and collaborate with participants"}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button size="small" onClick={setPen} disabled={isDisabled}>
          ✏️ Pen
        </Button>
        <Button size="small" onClick={setMarker} disabled={isDisabled}>
          🖍️ Marker
        </Button>
        <Button size="small" onClick={setEraser} disabled={isDisabled}>
          🧽 Eraser
        </Button>
        <Button size="small" onClick={clearCanvas} disabled={isDisabled}>
          🗑️ Clear
        </Button>
      </div>

      {meetingId && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          Meeting ID: {meetingId}
        </div>
      )}
    </div>
  );
};

export default SidebarArtboard;