import Api from "@/Services/Api";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools, subscribeWithSelector } from "zustand/middleware";

/**
 * Enhanced Meeting Store with comprehensive participant management
 * Covers all endpoints from the routes you provided
 */
const useMeetingStore = create(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // ============ STATE ============
        meetings: [],
        currentMeeting: null,
        activeMeetings: [],
        participants: [], // Added participants state
        currentUserStatus: null, // Added current user status state
        isLoading: false,
        error: null,
        joinCheckResult: null,
        stream: null, 

        // ============ ACTIONS ============

         /**
         * Set local media stream
         */
        setLocalStream: (stream) => {
          set((s) => {
            s.stream = stream;
          });
        },

        /**
         * Alias untuk setLocalStream (biar ga error di komponen lama)
         */
        setStream: (stream) => {
          get().setLocalStream(stream);
        },

        /**
         * Set current user status (mic, camera, screen share)
         */
        setCurrentUserStatus: (status) => {
          set((s) => {
            s.currentUserStatus = {
              ...s.currentUserStatus,
              ...status
            };
          });
          console.log("Current user status updated:", status);
        },

        /**
         * Get current user status
         */
        getCurrentUserStatus: () => {
          return get().currentUserStatus;
        },

        /**
         * Add or update participant
         */
        updateParticipant: (participantData) => {
          set((s) => {
            const existingIndex = s.participants.findIndex(
              p => p.id === participantData.id
            );
            
            if (existingIndex >= 0) {
              s.participants[existingIndex] = {
                ...s.participants[existingIndex],
                ...participantData
              };
            } else {
              s.participants.push(participantData);
            }
          });
        },

        /**
         * Remove participant
         */
        removeParticipant: (participantId) => {
          set((s) => {
            s.participants = s.participants.filter(p => p.id !== participantId);
          });
        },

        /**
         * Clear all participants
         */
        clearParticipants: () => {
          set((s) => {
            s.participants = [];
          });
        },

        /**
         * Create a new meeting
         */
        createMeeting: async (title) => {
          set((s) => {
            s.isLoading = true;
            s.error = null;
          });
          try {
            const res = await Api.post("/meetings", { title });
            if (res.data?.success) {
              const newMeeting = res.data.data;
              set((s) => {
                s.meetings.unshift(newMeeting);
                s.currentMeeting = newMeeting;
                s.isLoading = false;
              });
              return newMeeting;
            }
          } catch (e) {
            set((s) => {
              s.isLoading = false;
              s.error = "Failed to create meeting";
            });
            throw e;
          }
        },

        /**
         * Get meeting by code
         */
        getMeetingByCode: async (code) => {
          set((s) => {
            s.isLoading = true;
            s.error = null;
          });
          try {
            const res = await Api.get(`/meetings/code/${code}`);
            if (res.data?.success) {
              const meeting = res.data.data;
              set((s) => {
                s.currentMeeting = meeting;
                s.isLoading = false;
              });
              return meeting;
            }
          } catch (e) {
            set((s) => {
              s.isLoading = false;
              s.error = "Meeting not found!";
            });
            throw e;
          }
        },

        /**
         * Join a meeting by code
         */
        joinMeeting: async (code) => {
          set((s) => {
            s.isLoading = true;
            s.error = null;
          });
          try {
            const res = await Api.post("/meetings/join", { code });
            if (res.data?.success) {
              await get().getMeetingByCode(code);
              set((s) => {
                s.isLoading = false;
              });
              return res.data.data;
            }
          } catch (e) {
            set((s) => {
              s.isLoading = false;
              s.error = "Failed to join meeting!";
            });
            throw e;
          }
        },

        /**
         * Leave a meeting
         */
        leaveMeeting: async (meetingId) => {
          try {
            await Api.post(`/meetings/${meetingId}/leave`);
            // Clear meeting-related state when leaving
            set((s) => {
              s.currentMeeting = null;
              s.participants = [];
              s.currentUserStatus = null;
            });
          } catch (e) {
            console.warn("leaveMeeting failed, clearing state anyway!");
            set((s) => {
              s.currentMeeting = null;
              s.participants = [];
              s.currentUserStatus = null;
            });
          }
        },

        /**
         * End a meeting (owner only)
         */
        endMeeting: async (meetingId) => {
          set((s) => {
            s.isLoading = true;
            s.error = null;
          });
          try {
            const res = await Api.post(`/meetings/${meetingId}/end`);
            if (res.data?.success) {
              set((s) => {
                s.currentMeeting = null;
                s.participants = [];
                s.currentUserStatus = null;
                s.isLoading = false;
              });
              return res.data.data;
            }
          } catch (e) {
            set((s) => {
              s.isLoading = false;
              s.error = "Failed to end meeting";
            });
            throw e;
          }
        },

        /**
         * Get active meetings for current user
         */
        getActiveMeetings: async () => {
          set((s) => {
            s.isLoading = true;
            s.error = null;
          });
          try {
            const res = await Api.get("/meetings/active");

            if (res.data?.success) {
              set((s) => {
                s.activeMeetings = res.data.data;
                s.isLoading = false;
              });
              return res.data.data;
            }
          } catch (e) {
            set((s) => {
              s.isLoading = false;
              s.error = "Failed to fetch active meetings";
            });
            throw e;
          }
        },

        checkCanJoin: async (code) => {
          set((s) => {
            s.isLoading = true;
            s.error = null;
            s.joinCheckResult = null;
          });
          try {
            const res = await Api.get(`/meetings/code/${code}/can-join`);
            if (res.data?.success) {
              set((s) => {
                s.joinCheckResult = res.data.data;
                s.isLoading = false;
              });
              return res.data.data;
            }
          } catch (e) {
            set((s) => {
              s.isLoading = false;
              s.error = "Cannot join";
            });
            throw e;
          }
        },

        /**
         * Clear all meeting data (useful for logout)
         */
        clearMeetingData: () => {
          set((s) => {
            s.meetings = [];
            s.currentMeeting = null;
            s.activeMeetings = [];
            s.participants = [];
            s.currentUserStatus = null;
            s.isLoading = false;
            s.error = null;
            s.joinCheckResult = null;
            s.stream = null;
          });
        },
      }))
    ),
    { name: "meeting-store" }
  )
);

export default useMeetingStore;