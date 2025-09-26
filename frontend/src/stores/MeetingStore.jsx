// stores/MeetingStore.jsx
import Api from "@/Services/Api";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools, subscribeWithSelector } from "zustand/middleware";

const useMeetingStore = create(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // ============ STATE ============
        meetings: [],
        currentMeeting: null,
        activeMeetings: [],
        participants: [],
        currentUserStatus: null,

        // Loading states
        isCreatingMeeting: false,
        isJoiningMeeting: false,
        isFetchingMeeting: false,
        isLeavingMeeting: false,
        isEndingMeeting: false,
        isFetchingActiveMeetings: false,
        isCheckingJoin: false,

        error: null,
        joinCheckResult: null,
        stream: null,

        // ============ BASIC ACTIONS ============
        setIsCreatingMeeting: (value) => {
          set((s) => {
            s.isCreatingMeeting = value;
          });
        },
        setIsJoiningMeeting: (value) => {
          set((s) => {
            s.isJoiningMeeting = value;
          });
        },

        setLocalStream: (stream) => {
          set((s) => {
            s.stream = stream;
          });
        },

        setStream: (stream) => {
          get().setLocalStream(stream);
        },

        setCurrentUserStatus: (status) => {
          set((s) => {
            s.currentUserStatus = { ...s.currentUserStatus, ...status };
          });
        },

        getCurrentUserStatus: () => get().currentUserStatus,

        updateParticipant: (participantData) => {
          set((s) => {
            const idx = s.participants.findIndex(
              (p) => p.id === participantData.id
            );
            if (idx >= 0)
              s.participants[idx] = {
                ...s.participants[idx],
                ...participantData,
              };
            else s.participants.push(participantData);
          });
        },

        removeParticipant: (participantId) => {
          set((s) => {
            s.participants = s.participants.filter(
              (p) => p.id !== participantId
            );
          });
        },

        clearParticipants: () => {
          set((s) => {
            s.participants = [];
          });
        },

        // ============ API ACTIONS ============

        createMeeting: async (title) => {
          set((s) => {
            s.isCreatingMeeting = true;
            s.error = null;
          });
          try {
            const res = await Api.post("/meetings", { title });
            if (res.data?.success) {
              const newMeeting = res.data.data;
              set((s) => {
                s.meetings.unshift(newMeeting);
                s.currentMeeting = newMeeting;
                s.isCreatingMeeting = false;
              });
              return newMeeting;
            }
          } catch (e) {
            set((s) => {
              s.isCreatingMeeting = false;
              s.error = "Failed to create meeting";
            });
            throw e;
          }
        },

        getMeetingByCode: async (code) => {
          set((s) => {
            s.isFetchingMeeting = true;
            s.error = null;
          });
          try {
            const res = await Api.get(`/meetings/code/${code}`);
            if (res.data?.success) {
              const meeting = res.data.data;
              set((s) => {
                s.currentMeeting = meeting;
                s.isFetchingMeeting = false;
              });
              return meeting;
            }
          } catch (e) {
            set((s) => {
              s.isFetchingMeeting = false;
              s.error = "Meeting not found!";
            });
            throw e;
          }
        },

        joinMeeting: async (code) => {
          set((s) => {
            s.isJoiningMeeting = true;
            s.error = null;
          });
          try {
            const res = await Api.post("/meetings/join", { code });
            if (res.data?.success) {
              await get().getMeetingByCode(code);
              set((s) => {
                s.isJoiningMeeting = false;
              });
              return res.data.data;
            }
          } catch (e) {
            set((s) => {
              s.isJoiningMeeting = false;
              s.error = "Failed to join meeting!";
            });
            throw e;
          }
        },

        leaveMeeting: async (meetingId) => {
          set((s) => {
            s.isLeavingMeeting = true;
            s.error = null;
          });
          try {
            await Api.post(`/meetings/${meetingId}/leave`);
            set((s) => {
              s.currentMeeting = null;
              s.participants = [];
              s.currentUserStatus = null;
              s.isLeavingMeeting = false;
            });
          } catch (e) {
            set((s) => {
              s.currentMeeting = null;
              s.participants = [];
              s.currentUserStatus = null;
              s.isLeavingMeeting = false;
            });
            throw e;
          }
        },

        endMeeting: async (meetingId) => {
          set((s) => {
            s.isEndingMeeting = true;
            s.error = null;
          });
          try {
            const res = await Api.post(`/meetings/${meetingId}/end`);
            if (res.data?.success) {
              set((s) => {
                s.currentMeeting = null;
                s.participants = [];
                s.currentUserStatus = null;
                s.isEndingMeeting = false;
              });
              return res.data.data;
            }
          } catch (e) {
            set((s) => {
              s.isEndingMeeting = false;
              s.error = "Failed to end meeting";
            });
            throw e;
          }
        },

        getActiveMeetings: async () => {
          set((s) => {
            s.isFetchingActiveMeetings = true;
            s.error = null;
          });
          try {
            const res = await Api.get("/meetings/active");
            if (res.data?.success) {
              set((s) => {
                s.activeMeetings = res.data.data;
                s.isFetchingActiveMeetings = false;
              });
              return res.data.data;
            }
          } catch (e) {
            set((s) => {
              s.isFetchingActiveMeetings = false;
              s.error = "Failed to fetch active meetings";
            });
            throw e;
          }
        },

        checkCanJoin: async (code) => {
          set((s) => {
            s.isCheckingJoin = true;
            s.error = null;
            s.joinCheckResult = null;
          });
          try {
            const res = await Api.get(`/meetings/code/${code}/can-join`);
            if (res.data?.success) {
              set((s) => {
                s.joinCheckResult = res.data.data;
                s.isCheckingJoin = false;
              });
              return res.data.data;
            }
          } catch (e) {
            set((s) => {
              s.isCheckingJoin = false;
              s.error = "Cannot join";
            });
            throw e;
          }
        },

        clearMeetingData: () => {
          set((s) => {
            s.meetings = [];
            s.currentMeeting = null;
            s.activeMeetings = [];
            s.participants = [];
            s.currentUserStatus = null;
            s.isCreatingMeeting = false;
            s.isJoiningMeeting = false;
            s.isFetchingMeeting = false;
            s.isLeavingMeeting = false;
            s.isEndingMeeting = false;
            s.isFetchingActiveMeetings = false;
            s.isCheckingJoin = false;
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
