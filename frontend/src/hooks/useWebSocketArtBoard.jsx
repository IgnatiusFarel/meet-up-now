import socket from "@/services/Socket.jsx";
import useAuthStore from "@/stores/AuthStore.jsx";
import { useCallback, useEffect, useRef } from "react";
import useMeetingStore from "@/stores/MeetingStore.jsx";

const useWebSocketArtBoard = ({ onDrawEvent, onEraseEvent, onClearEvent }) => {
  const socketRef = useRef(socket);
  const currentMeeting = useMeetingStore((s) => s.currentMeeting);
  const user = useAuthStore((s) => s.user);
  const isLocalAction = useRef(false);

  useEffect(() => {
    if (!socketRef.current || !currentMeeting?.meetingId) {
      console.log("[Artboard] No socket or meeting:", {
        socket: !!socketRef.current,
        meetingId: currentMeeting?.meetingId,
      });
      return;
    }

    const meetingId = currentMeeting.meetingId;

    // PERBAIKAN: Simplified handler - tidak perlu cek userId lagi
    // karena server sudah broadcast ke user lain saja
    const handleDraw = (data) => {
      console.log("[Artboard] Draw event received:", {
        fromUserId: data.userId,
        currentUserId: user?.userId,
        pathData: data.pathData,
      });

      if (onDrawEvent && data.pathData) {
        console.log("[Artboard] Processing drawing from other user");
        onDrawEvent(data.pathData);
      }
    };

    // PERBAIKAN: Simplified handler
    const handleErase = (data) => {
      console.log("[Artboard] Erase event received:", {
        fromUserId: data.userId,
        currentUserId: user?.userId,
        eraseData: data.eraseData,
      });

      if (onEraseEvent && data.eraseData) {
        console.log("[Artboard] Processing erase from other user");
        onEraseEvent(data.eraseData);
      }
    };

    // PERBAIKAN: Simplified handler
    const handleClear = (data) => {
      console.log("[Artboard] Clear event received:", {
        fromUserId: data.userId,
        currentUserId: user?.userId,
      });

      if (onClearEvent) {
        console.log("[Artboard] Processing clear from other user");
        isLocalAction.current = true;
        onClearEvent();
        isLocalAction.current = false;
      }
    };

    // Register listeners
    socketRef.current.on("artboard:draw", handleDraw);
    socketRef.current.on("artboard:erase", handleErase);
    socketRef.current.on("artboard:clear", handleClear);

    console.log(`[Artboard] Listeners registered for meeting: ${meetingId}`);

    // Cleanup
    return () => {
      socketRef.current.off("artboard:draw", handleDraw);
      socketRef.current.off("artboard:erase", handleErase);
      socketRef.current.off("artboard:clear", handleClear);
      console.log(`[Artboard] Listeners removed for meeting: ${meetingId}`);
    };
  }, [
    currentMeeting?.meetingId,
    user?.userId,
    onDrawEvent,
    onEraseEvent,
    onClearEvent,
  ]);

  // Emit draw event
  const emitDraw = useCallback(
    (pathData) => {
      console.log("[Artboard] Emitting draw:", {
        hasSocket: !!socketRef.current,
        isConnected: socketRef.current?.connected,
        meetingId: currentMeeting?.meetingId,
        isLocalAction: isLocalAction.current,
        pathData,
      });

      if (
        socketRef.current &&
        currentMeeting?.meetingId &&
        !isLocalAction.current
      ) {
        socketRef.current.emit("artboard:draw", {
          meetingId: currentMeeting.meetingId,
          pathData,
          timestamp: Date.now(),
        });
        console.log("[Artboard] Draw event emitted successfully");
      } else {
        console.warn("[Artboard] Cannot emit draw:", {
          hasSocket: !!socketRef.current,
          isConnected: socketRef.current?.connected,
          hasMeeting: !!currentMeeting?.meetingId,
          isLocal: isLocalAction.current,
        });
      }
    },
    [currentMeeting?.meetingId]
  );

  // Emit erase event
  const emitErase = useCallback(
    (eraseData) => {
      console.log("[Artboard] Emitting erase:", {
        hasSocket: !!socketRef.current,
        isConnected: socketRef.current?.connected,
        meetingId: currentMeeting?.meetingId,
        eraseData,
      });

      if (
        socketRef.current &&
        currentMeeting?.meetingId &&
        !isLocalAction.current
      ) {
        socketRef.current.emit("artboard:erase", {
          meetingId: currentMeeting.meetingId,
          eraseData,
          timestamp: Date.now(),
        });
        console.log("[Artboard] Erase event emitted successfully");
      }
    },
    [currentMeeting?.meetingId]
  );

  // Emit clear event
  const emitClear = useCallback(() => {
    console.log("[Artboard] Emitting clear:", {
      hasSocket: !!socketRef.current,
      isConnected: socketRef.current?.connected,
      meetingId: currentMeeting?.meetingId,
    });

    if (
      socketRef.current &&
      currentMeeting?.meetingId &&
      !isLocalAction.current
    ) {
      socketRef.current.emit("artboard:clear", {
        meetingId: currentMeeting.meetingId,
        timestamp: Date.now(),
      });
      console.log("[Artboard] Clear event emitted successfully");
    }
  }, [currentMeeting?.meetingId]);

  return {
    isConnected: socketRef.current?.connected || false,
    socket: socketRef.current,
    emitDraw,
    emitErase,
    emitClear,
    meetingId: currentMeeting?.meetingId,
  };
};

export default useWebSocketArtBoard;
