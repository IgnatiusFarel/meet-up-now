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
        previewData: null, // Untuk preview sebelum join
        currentUserStatus: {
          isMicOn: true,
          isCameraOn: true,
          isScreenShare: false,
        },
        isLoadingParticipants: false,
        isLoadingPreview: false,
        participantError: null,
        previewError: null,
        
        // Connection state untuk real-time updates
        connectionStatus: {
          isConnected: false,
          reconnectAttempts: 0,
          lastUpdateAt: null,
        },

        // ============ PREVIEW ACTIONS ============

        /**
         * Get meeting preview data (for join confirmation)
         */
        getMeetingPreview: async (meetingCode) => {
          if (!meetingCode) {
            console.warn("getMeetingPreview: meetingCode is required");
            return null;
          }

          set((s) => {
            s.isLoadingPreview = true;
            s.previewError = null;
          });

          try {
            console.log(`🔍 Getting meeting preview for: ${meetingCode}`);
            
            const res = await Api.get(`/meetings/code/${meetingCode}/can-join`);
            console.log("📡 Preview API response:", res.data);

            if (res.data?.success) {
              const previewData = {
                ...res.data.data,
                fetchedAt: new Date().toISOString(),
                participantCount: res.data.data.meeting?.participantCount || 0,
                isOwner: res.data.data.meeting?.isOwner || false,
                status: res.data.data.meeting?.status || 'waiting',
              };

              set((s) => {
                s.previewData = previewData;
                s.isLoadingPreview = false;
                s.previewError = null;
              });

              console.log("✅ Meeting preview loaded successfully");
              return previewData;
            } else {
              throw new Error(res.data?.message || "Failed to get preview");
            }
          } catch (error) {
            console.error("❌ getMeetingPreview error:", error);
            
            let errorMessage = "Failed to load meeting preview";
            if (error.response?.status === 404) {
              errorMessage = "Meeting not found";
            } else if (error.response?.status === 410) {
              errorMessage = "Meeting has ended or expired";
            } else if (error.response?.data?.message) {
              errorMessage = error.response.data.message;
            }

            set((s) => {
              s.previewData = null;
              s.isLoadingPreview = false;
              s.previewError = errorMessage;
            });

            return null;
          }
        },

        /**
         * Clear preview data
         */
        clearPreview: () => {
          set((s) => {
            s.previewData = null;
            s.previewError = null;
            s.isLoadingPreview = false;
          });
          console.log("🧹 Preview data cleared");
        },

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
                const meetingRes = await Api.get(`/meetings/details/${meetingId}`);
                console.log("📡 Meeting details response:", meetingRes.data);
                
                if (meetingRes.data?.success && meetingRes.data.data) {
                  const meeting = meetingRes.data.data;
                  
                  // Extract participants from meeting data
                  if (meeting.participants && meeting.participants.length > 0) {
                    participantList = meeting.participants;
                    console.log(`✅ Found ${participantList.length} participants from meeting details`);
                  } else if (meeting.owner) {
                    // Create participants list from meeting data
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
                  
                  // If meeting has participantCount > current list, try alternative endpoint
                  if (meeting.participantCount > participantList.length) {
                    console.log(`📊 Meeting shows ${meeting.participantCount} participants, trying active users endpoint`);
                    
                    try {
                      const activeRes = await Api.get(`/meetings/${meetingId}/active-users`);
                      if (activeRes.data?.success && activeRes.data.data) {
                        console.log("📡 Active users response:", activeRes.data.data);
                        
                        // Replace or merge with active users data
                        const activeUsers = activeRes.data.data.map(activeUser => ({
                          user: activeUser,
                          joinedAt: activeUser.joinedAt || new Date().toISOString(),
                          isMicOn: activeUser.isMicOn ?? true,
                          isCameraOn: activeUser.isCameraOn ?? true,
                          isOwner: activeUser.userId === meeting.ownerId,
                          status: 'active',
                          role: activeUser.userId === meeting.ownerId ? 'owner' : 'participant'
                        }));
                        
                        participantList = activeUsers.length > 0 ? activeUsers : participantList;
                        console.log(`✅ Using active users data: ${participantList.length} participants`);
                      }
                    } catch (activeUsersError) {
                      console.log("⚠️ Active users endpoint also failed:", activeUsersError.message);
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
              s.connectionStatus.lastUpdateAt = new Date().toISOString();
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
            const joinCheckRes = await Api.get(`/meetings/code/${meetingCode}/can-join`);
            
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

        // ============ REAL-TIME STATE MANAGEMENT ============

        /**
         * Handle real-time participant updates (for WebSocket/SSE)
         */
        handleParticipantUpdate: (update) => {
          const { type, data } = update;
          
          set((s) => {
            switch (type) {
              case 'participant:joined':
                const existingJoinIndex = s.participants.findIndex(
                  (p) => p.user?.userId === data.participant?.user?.userId
                );
                if (existingJoinIndex === -1) {
                  s.participants.push(data.participant);
                  console.log(`🔔 Participant joined: ${data.participant.user.name}`);
                } else {
                  s.participants[existingJoinIndex] = { ...s.participants[existingJoinIndex], ...data.participant };
                  console.log(`🔄 Participant updated: ${data.participant.user.name}`);
                }
                break;
                
              case 'participant:left':
                s.participants = s.participants.filter(
                  (p) => p.user?.userId !== data.userId
                );
                console.log(`🔔 Participant left: ${data.userId}`);
                break;
                
              case 'participant:status_changed':
                const statusIndex = s.participants.findIndex(
                  (p) => p.user?.userId === data.userId
                );
                if (statusIndex !== -1) {
                  Object.assign(s.participants[statusIndex], data.updates);
                  console.log(`🔄 Participant status updated: ${data.userId}`, data.updates);
                }
                break;
                
              case 'meeting:ended':
                s.participants = [];
                console.log('🔔 Meeting ended, clearing participants');
                break;
                
              default:
                console.log(`🔔 Unknown update type: ${type}`);
            }
            
            s.connectionStatus.lastUpdateAt = new Date().toISOString();
          });
        },

        /**
         * Set connection status for real-time updates
         */
        setConnectionStatus: (status) => {
          set((s) => {
            s.connectionStatus = { ...s.connectionStatus, ...status };
          });
          console.log("🌐 Connection status updated:", status);
        },

        // ============ EXISTING ACTIONS (Enhanced) ============

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
            s.previewData = null;
            s.isLoadingParticipants = false;
            s.isLoadingPreview = false;
            s.participantError = null;
            s.previewError = null;
            s.connectionStatus = {
              isConnected: false,
              reconnectAttempts: 0,
              lastUpdateAt: null,
            };
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

        /**
         * Get participants with specific status
         */
        getParticipantsByStatus: (status) => {
          const state = get();
          return state.participants.filter(p => p.status === status);
        },

        /**
         * Get participants with mic on
         */
        getParticipantsWithMicOn: () => {
          const state = get();
          return state.participants.filter(p => p.isMicOn === true);
        },

        /**
         * Get participants with camera on
         */
        getParticipantsWithCameraOn: () => {
          const state = get();
          return state.participants.filter(p => p.isCameraOn === true);
        },

        /**
         * Get screen sharing participant
         */
        getScreenSharingParticipant: () => {
          const state = get();
          return state.participants.find(p => p.isScreenShare === true) || null;
        },

        /**
         * Check if current user is meeting owner
         */
        isCurrentUserOwner: (currentUserId) => {
          const state = get();
          const currentParticipant = state.participants.find(p => p.user?.userId === currentUserId);
          return currentParticipant?.isOwner === true;
        },

        // ============ PREVIEW UTILITY METHODS ============

        /**
         * Check if meeting is ready to join
         */
        isMeetingReadyToJoin: () => {
          const state = get();
          return state.previewData?.canJoin === true && !state.previewError;
        },

        /**
         * Get meeting title from preview or participants
         */
        getMeetingTitle: () => {
          const state = get();
          return state.previewData?.meeting?.title || 'Meeting Room';
        },

        getParticipantsByCode: async (meetingCode) => {
  return await get().getParticipantsWithMeetingData(meetingCode);
},

        /**
         * Get meeting owner info
         */
        getMeetingOwner: () => {
          const state = get();
          if (state.previewData?.meeting?.owner) {
            return state.previewData.meeting.owner;
          }
          return state.participants.find(p => p.isOwner)?.user || null;
        },
      }))
    ),
    { name: "participant-store" }
  )
);

export default useParticipantStore;