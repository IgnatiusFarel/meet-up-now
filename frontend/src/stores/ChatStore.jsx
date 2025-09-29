// stores/ChatStore.jsx
import Api from "@/Services/Api";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import io from "socket.io-client";

let socket;

const useChatStore = create(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // ============ STATE ============
        messages: [],
        currentMeetingId: null,
        socket: null,
        
        // Loading states
        isFetchingMessages: false,
        isSendingMessage: false,
        isDeletingMessage: false,
        isClearingMessages: false,
        
        error: null,
        
        // ============ BASIC ACTIONS ============
        setCurrentMeetingId: (meetingId) => {
          set((s) => {
            s.currentMeetingId = meetingId;
          });
        },
        
        setIsFetchingMessages: (value) => {
          set((s) => {
            s.isFetchingMessages = value;
          });
        },
        
        setIsSendingMessage: (value) => {
          set((s) => {
            s.isSendingMessage = value;
          });
        },
        
        addMessage: (message) => {
          set((s) => {
            // Check if message already exists to avoid duplicates
            const exists = s.messages.find(m => m.messageId === message.messageId);
            if (!exists) {
              s.messages.push(message);
            }
          });
        },
        
        removeMessage: (messageId) => {
          set((s) => {
            s.messages = s.messages.filter(msg => msg.messageId !== messageId);
          });
        },
        
        clearMessages: () => {
          set((s) => {
            s.messages = [];
          });
        },

        // ============ API ACTIONS ============
        getMessages: async (meetingId) => {
          if (!meetingId) {
            console.error("getMessages: meetingId is required");
            return;
          }
          
          set((s) => {
            s.isFetchingMessages = true;
            s.error = null;
            s.currentMeetingId = meetingId;
          });
          
          try {
            console.log("Fetching messages for meeting:", meetingId);
            const res = await Api.get(`/chat/${meetingId}/messages`);
            console.log("Messages response:", res.data);
            
            if (res.data?.success) {
              const messages = res.data.data || [];
              set((s) => {
                s.messages = messages;
                s.isFetchingMessages = false;
              });
              return messages;
            } else {
              // Handle case where success is false
              const messages = res.data || [];
              set((s) => {
                s.messages = Array.isArray(messages) ? messages : [];
                s.isFetchingMessages = false;
              });
            }
          } catch (err) {
            console.error("getMessages error:", err);
            console.error("Error response:", err.response?.data);
            set((s) => {
              s.isFetchingMessages = false;
              s.error = "Failed to fetch messages";
            });
            throw err;
          }
        },

        sendMessage: async (meetingId, content) => {
          if (!meetingId) {
            console.error("sendMessage: meetingId is required");
            throw new Error("Meeting ID is required");
          }
          
          if (!content?.trim()) {
            console.error("sendMessage: content is required");
            throw new Error("Message content is required");
          }

          set((s) => {
            s.isSendingMessage = true;
            s.error = null;
          });
          
          try {
            console.log("Sending message:", { meetingId, content });
            
            const res = await Api.post(`/chat/${meetingId}/messages`, { 
              content: content.trim() 
            });
            console.log("Send message response:", res.data);
            
            if (res.data?.success) {
              const newMessage = res.data.data;
              set((s) => {
                // Check if message already exists to avoid duplicates
                const exists = s.messages.find(m => m.messageId === newMessage.messageId);
                if (!exists) {
                  s.messages.push(newMessage);
                }
                s.isSendingMessage = false;
              });
              return newMessage;
            } else {
              // Handle response without success flag
              const newMessage = res.data;
              set((s) => {
                s.messages.push(newMessage);
                s.isSendingMessage = false;
              });
              return newMessage;
            }
          } catch (err) {
            console.error("sendMessage error:", err);
            console.error("Error response:", err.response?.data);
            set((s) => {
              s.isSendingMessage = false;
              s.error = "Failed to send message";
            });
            throw err;
          }
        },

        deleteMessage: async (messageId) => {
          if (!messageId) {
            console.error("deleteMessage: messageId is required");
            return;
          }
          
          set((s) => {
            s.isDeletingMessage = true;
            s.error = null;
          });
          
          try {
            const res = await Api.delete(`/chat/messages/${messageId}`);
            
            if (res.data?.success) {
              set((s) => {
                s.messages = s.messages.filter(msg => msg.messageId !== messageId);
                s.isDeletingMessage = false;
              });
              return res.data.data;
            }
          } catch (err) {
            console.error("deleteMessage error:", err);
            set((s) => {
              s.isDeletingMessage = false;
              s.error = "Failed to delete message";
            });
            throw err;
          }
        },

        clearMeetingMessages: async (meetingId) => {
          if (!meetingId) {
            console.error("clearMeetingMessages: meetingId is required");
            return;
          }
          
          set((s) => {
            s.isClearingMessages = true;
            s.error = null;
          });
          
          try {
            const res = await Api.delete(`/chat/${meetingId}/messages`);
            
            if (res.data?.success) {
              set((s) => {
                s.messages = [];
                s.isClearingMessages = false;
              });
              return res.data.data;
            }
          } catch (err) {
            console.error("clearMeetingMessages error:", err);
            set((s) => {
              s.isClearingMessages = false;
              s.error = "Failed to clear messages";
            });
            throw err;
          }
        },

        // ============ SOCKET ACTIONS ============
        initSocket: (meetingId) => {
          if (!meetingId) {
            console.error("initSocket: meetingId is required");
            return;
          }
          
          try {
            console.log("Initializing socket for meeting:", meetingId);
            
            // Disconnect existing socket if any
            if (socket) {
              socket.disconnect();
              socket = null;
            }

            const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            console.log("Connecting to socket:", socketUrl);

            socket = io(socketUrl, {
              transports: ['websocket', 'polling'],
              timeout: 20000,
            });

            socket.on("connect", () => {
              console.log("Socket connected:", socket.id);
              // Join meeting room after connection
              socket.emit("join-meeting", meetingId);
            });

            socket.on("connect_error", (error) => {
              console.error("Socket connection error:", error);
            });

            socket.on("disconnect", (reason) => {
              console.log("Socket disconnected:", reason);
            });

            socket.on("new-message", (msg) => {
              console.log("Received new message:", msg);
              get().addMessage(msg);
            });

            socket.on("message-deleted", (data) => {
              console.log("Message deleted:", data);
              get().removeMessage(data.messageId);
            });

            socket.on("messages-cleared", (data) => {
              console.log("Messages cleared:", data);
              get().clearMessages();
            });

            set((s) => {
              s.socket = socket;
              s.currentMeetingId = meetingId;
            });

          } catch (err) {
            console.error("initSocket error:", err);
          }
        },

        disconnectSocket: () => {
          if (socket) {
            console.log("Disconnecting socket");
            socket.disconnect();
            socket = null;
            
            set((s) => {
              s.socket = null;
            });
          }
        },

        // ============ CLEANUP ============
        clearChatData: () => {
          set((s) => {
            s.messages = [];
            s.currentMeetingId = null;
            s.isFetchingMessages = false;
            s.isSendingMessage = false;
            s.isDeletingMessage = false;
            s.isClearingMessages = false;
            s.error = null;
          });
          
          // Disconnect socket
          get().disconnectSocket();
        },
      }))
    ),
    { name: "chat-store" }
  )
);

export default useChatStore;