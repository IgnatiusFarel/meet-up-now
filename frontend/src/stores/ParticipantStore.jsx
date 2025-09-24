import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import Api from "@/Services/Api";

const useParticipantStore = create(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // ============ STATE ============
        participants: [],
        participantHistory: [],
        meetingStats: null,
        currentUserStatus: {
          isMicOn: true,
          isCameraOn: true,
          isScreenShare: false,
        },
        isLoadingParticipants: false,
        participantError: null,

        // ============ IMPROVED ACTIONS ============

        /**
         * Get active participants for a meeting
         * Enhanced with better error handling and fallback strategies
         */
        getActiveParticipants: async (meetingId) => {
          if (!meetingId) {
            console.warn("getActiveParticipants: meetingId is required");
            return [];
          }

          set((s) => {
            s.isLoadingParticipants = true;
            s.participantError = null;
          });

          try {
            console.log(`🔍 Fetching participants for meeting: ${meetingId}`);
            
            // Primary strategy: Try to get participants from dedicated endpoint
            let participantList = [];
            let usedFallback = false;

            try {
              const res = await Api.get(`/meetings/${meetingId}/participants`);
              console.log("📡 Participants API response:", res.data);
              
              if (res.data?.success && res.data.data && res.data.data.length > 0) {
                participantList = res.data.data;
                console.log(`✅ Found ${participantList.length} participants from dedicated endpoint`);
              } else {
                console.log("⚠️ Dedicated participants endpoint returned empty or no data");
                throw new Error("Empty participants data");
              }
            } catch (participantsError) {
              console.log("❌ Dedicated participants endpoint failed:", participantsError.message);
              
              // Fallback Strategy 1: Get meeting details and extract participant info
              console.log("🔄 Attempting fallback: fetch meeting details");
              
              try {
                const meetingRes = await Api.get(`/meetings/${meetingId}`);
                console.log("📡 Meeting details response:", meetingRes.data);
                
                if (meetingRes.data?.success && meetingRes.data.data) {
                  const meeting = meetingRes.data.data;
                  
                  // Create participants list from meeting data
                  if (meeting.owner) {
                    participantList.push({
                      user: meeting.owner,
                      joinedAt: meeting.createdAt,
                      isMicOn: true,
                      isCameraOn: true,
                      isOwner: true,
                      status: 'active',
                      role: 'owner'
                    });
                    console.log("👤 Added owner as participant");
                  }
                  
                  // If meeting has participantCount > 1, try to get additional info
                  if (meeting.participantCount > 1) {
                    console.log(`📊 Meeting shows ${meeting.participantCount} participants, but only found owner`);
                    
                    // Fallback Strategy 2: Try alternative participants endpoint
                    try {
                      const activeRes = await Api.get(`/meetings/${meetingId}/active-users`);
                      if (activeRes.data?.success && activeRes.data.data) {
                        console.log("📡 Active users response:", activeRes.data.data);
                        
                        activeRes.data.data.forEach(activeUser => {
                          if (!participantList.find(p => p.user?.userId === activeUser.userId)) {
                            participantList.push({
                              user: activeUser,
                              joinedAt: activeUser.joinedAt || new Date().toISOString(),
                              isMicOn: activeUser.isMicOn ?? true,
                              isCameraOn: activeUser.isCameraOn ?? true,
                              isOwner: false,
                              status: 'active',
                              role: 'participant'
                            });
                          }
                        });
                      }
                    } catch (activeUsersError) {
                      console.log("⚠️ Active users endpoint also failed:", activeUsersError.message);
                    }
                    
                    // Fallback Strategy 3: If we still only have owner but meeting shows more participants,
                    // create placeholder participants based on count
                    if (participantList.length === 1 && meeting.participantCount > 1) {
                      const additionalCount = meeting.participantCount - 1;
                      console.log(`🔄 Creating ${additionalCount} placeholder participants`);
                      
                      for (let i = 0; i < additionalCount; i++) {
                        participantList.push({
                          user: {
                            userId: `placeholder-${i + 1}`,
                            name: `Participant ${i + 1}`,
                            email: `participant${i + 1}@meeting.local`,
                            avatarUrl: null
                          },
                          joinedAt: new Date().toISOString(),
                          isMicOn: true,
                          isCameraOn: true,
                          isOwner: false,
                          status: 'active',
                          role: 'participant',
                          isPlaceholder: true
                        });
                      }
                      console.log(`📝 Added ${additionalCount} placeholder participants`);
                    }
                  }
                  
                  usedFallback = true;
                  console.log(`✅ Fallback successful: ${participantList.length} participants`);
                } else {
                  throw new Error("Meeting details not available");
                }
              } catch (meetingError) {
                console.error("❌ All fallback strategies failed:", meetingError);
                throw meetingError;
              }
            }

            // Validate and clean participant data
            const validParticipants = participantList.filter(p => {
              const isValid = p.user && (p.user.userId || p.user.email);
              if (!isValid) {
                console.warn("⚠️ Filtering out invalid participant:", p);
              }
              return isValid;
            });

            console.log(`📊 Final participant count: ${validParticipants.length}${usedFallback ? ' (using fallback)' : ''}`);
            
            set((s) => {
              s.participants = validParticipants;
              s.isLoadingParticipants = false;
              s.participantError = null;
            });
            
            return validParticipants;

          } catch (error) {
            console.error("❌ getActiveParticipants complete failure:", error);
            
            let errorMessage = "Failed to fetch participants";
            if (error.response?.status === 404) {
              errorMessage = "Meeting not found";
            } else if (error.response?.status === 403) {
              errorMessage = "Access denied";
            } else if (error.response?.data?.message) {
              errorMessage = error.response.data.message;
            } else if (error.message) {
              errorMessage = error.message;
            }

            set((s) => {
              s.participants = [];
              s.isLoadingParticipants = false;
              s.participantError = errorMessage;
            });
            
            return [];
          }
        },

        /**
         * Enhanced method to get participants with meeting context
         */
        getParticipantsWithMeetingData: async (meetingCode) => {
          if (!meetingCode) {
            console.warn("getParticipantsWithMeetingData: meetingCode is required");
            return [];
          }

          try {
            console.log(`🔍 Getting participants with meeting data for: ${meetingCode}`);
            
            // First, get meeting info to get meetingId
            const joinCheckRes = await Api.get(`/meetings/can-join/${meetingCode}`);
            
            if (joinCheckRes.data?.success && joinCheckRes.data.data?.meeting) {
              const meeting = joinCheckRes.data.data.meeting;
              console.log("📋 Meeting info:", meeting);
              
              // Now get participants using meetingId
              if (meeting.meetingId) {
                return await get().getActiveParticipants(meeting.meetingId);
              } else {
                console.warn("⚠️ Meeting ID not found in response");
                return [];
              }
            } else {
              console.warn("⚠️ Cannot get meeting data for participants");
              return [];
            }
          } catch (error) {
            console.error("❌ getParticipantsWithMeetingData error:", error);
            return [];
          }
        },

        /**
         * Update media status for current user
         */
        updateMediaStatus: async (meetingId, updates) => {
          if (!meetingId) {
            console.warn("updateMediaStatus: meetingId is required");
            return null;
          }

          try {
            const res = await Api.patch(
              `/meetings/${meetingId}/participants/status`,
              updates
            );
            
            if (res.data?.success) {
              set((s) => {
                s.currentUserStatus = { ...s.currentUserStatus, ...updates };
              });
              
              // Refresh participants to get updated status
              setTimeout(() => {
                get().getActiveParticipants(meetingId);
              }, 500);
              
              return res.data.data;
            }
          } catch (error) {
            console.error("updateMediaStatus error:", error);
            return null;
          }
        },

        /**
         * Get participant status by user ID
         */
        getParticipantStatus: async (meetingId, userId) => {
          if (!meetingId || !userId) {
            console.warn("getParticipantStatus: meetingId and userId are required");
            return null;
          }

          try {
            const res = await Api.get(
              `/meetings/${meetingId}/participants/${userId}/status`
            );
            return res.data?.success ? res.data.data : null;
          } catch (error) {
            console.error("getParticipantStatus error:", error);
            return null;
          }
        },

        /**
         * Kick participant (owner/admin only)
         */
        kickParticipant: async (meetingId, userId) => {
          if (!meetingId || !userId) {
            console.warn("kickParticipant: meetingId and userId are required");
            return false;
          }

          try {
            const res = await Api.delete(
              `/meetings/${meetingId}/participants/${userId}/kick`
            );
            
            if (res.data?.success) {
              set((s) => {
                s.participants = s.participants.filter(
                  (p) => p.user?.userId !== userId
                );
              });
              return true;
            }
          } catch (error) {
            console.error("kickParticipant error:", error);
            return false;
          }
        },

        /**
         * Toggle participant mute (owner/admin only)
         */
        toggleParticipantMute: async (meetingId, userId, mute = true) => {
          if (!meetingId || !userId) {
            console.warn("toggleParticipantMute: meetingId and userId are required");
            return false;
          }

          try {
            const res = await Api.patch(
              `/meetings/${meetingId}/participants/${userId}/mute`,
              { mute }
            );
            
            if (res.data?.success) {
              set((s) => {
                const target = s.participants.find(
                  (p) => p.user?.userId === userId
                );
                if (target) {
                  target.isMicOn = !mute;
                }
              });
              return true;
            }
          } catch (error) {
            console.error("toggleParticipantMute error:", error);
            return false;
          }
        },

        /**
         * Get meeting statistics
         */
        getMeetingStats: async (meetingId) => {
          if (!meetingId) {
            console.warn("getMeetingStats: meetingId is required");
            return null;
          }

          try {
            const res = await Api.get(
              `/meetings/${meetingId}/participants/stats`
            );
            
            if (res.data?.success) {
              set((s) => {
                s.meetingStats = res.data.data;
              });
              return res.data.data;
            }
          } catch (error) {
            console.error("getMeetingStats error:", error);
            return null;
          }
        },

        /**
         * Get participant join/leave history
         */
        getParticipantHistory: async (meetingId) => {
          if (!meetingId) {
            console.warn("getParticipantHistory: meetingId is required");
            return [];
          }

          try {
            const res = await Api.get(
              `/meetings/${meetingId}/participants/history`
            );
            
            if (res.data?.success) {
              set((s) => {
                s.participantHistory = res.data.data || [];
              });
              return res.data.data || [];
            }
          } catch (error) {
            console.error("getParticipantHistory error:", error);
            return [];
          }
        },

        // ============ LOCAL STATE MANAGEMENT ============

        /**
         * Add participant to local state
         */
        addParticipant: (participant) => {
          if (!participant?.user?.userId) {
            console.warn("addParticipant: Invalid participant data", participant);
            return;
          }

          set((s) => {
            const existingIndex = s.participants.findIndex(
              (p) => p.user?.userId === participant.user.userId
            );
            
            if (existingIndex === -1) {
              s.participants.push(participant);
              console.log(`👤 Participant added: ${participant.user.name || participant.user.userId}`);
            } else {
              // Update existing participant
              s.participants[existingIndex] = { ...s.participants[existingIndex], ...participant };
              console.log(`🔄 Participant updated: ${participant.user.name || participant.user.userId}`);
            }
          });
        },

        /**
         * Remove participant from local state
         */
        removeParticipant: (userId) => {
          if (!userId) {
            console.warn("removeParticipant: userId is required");
            return;
          }

          set((s) => {
            const beforeCount = s.participants.length;
            s.participants = s.participants.filter(
              (p) => p.user?.userId !== userId
            );
            
            if (s.participants.length < beforeCount) {
              console.log(`👤 Participant removed: ${userId}`);
            }
          });
        },

        /**
         * Update participant in local state
         */
        updateParticipant: (userId, updates) => {
          if (!userId || !updates) {
            console.warn("updateParticipant: userId and updates are required");
            return;
          }

          set((s) => {
            const target = s.participants.find((p) => p.user?.userId === userId);
            if (target) {
              Object.assign(target, updates);
              console.log(`🔄 Participant updated locally: ${userId}`, updates);
            }
          });
        },

        /**
         * Set current user status
         */
        setCurrentUserStatus: (status) => {
          set((s) => {
            s.currentUserStatus = { ...s.currentUserStatus, ...status };
          });
          console.log("🔄 Current user status updated:", status);
        },

        /**
         * Clear all participant data
         */
        clearParticipants: () => {
          set((s) => {
            s.participants = [];
            s.participantHistory = [];
            s.meetingStats = null;
            s.isLoadingParticipants = false;
            s.participantError = null;
          });
          console.log("🧹 All participant data cleared");
        },

        /**
         * Get participant by user ID
         */
        getParticipantByUserId: (userId) => {
          const state = get();
          return state.participants.find((p) => p.user?.userId === userId) || null;
        },

        /**
         * Get current user as participant
         */
        getCurrentUserAsParticipant: (currentUserId) => {
          if (!currentUserId) return null;
          return get().getParticipantByUserId(currentUserId);
        },

        /**
         * Refresh participants (alias for getActiveParticipants)
         */
        refreshParticipants: (meetingId) => {
          return get().getActiveParticipants(meetingId);
        },

        // ============ UTILITY METHODS ============

        /**
         * Get participant count
         */
        getParticipantCount: () => {
          const state = get();
          return state.participants.filter(p => !p.isPlaceholder).length;
        },

        /**
         * Get real participants (excluding placeholders)
         */
        getRealParticipants: () => {
          const state = get();
          return state.participants.filter(p => !p.isPlaceholder);
        },

        /**
         * Check if user is in meeting
         */
        isUserInMeeting: (userId) => {
          const state = get();
          return state.participants.some(p => p.user?.userId === userId);
        },
      }))
    ),
    { name: "participant-store" }
  )
);

export default useParticipantStore;