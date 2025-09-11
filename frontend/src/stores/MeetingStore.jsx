import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import Api from '@/Services/Api';

/**
 * Enhanced Meeting Store with comprehensive participant management
 * Covers all endpoints from the routes you provided
 */

const useMeetingStore = create(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // ============ STATE ============
        
        // Meeting Management
        meetings: [],
        currentMeeting: null,
        activeMeetings: [],
        isLoading: false,
        error: null,
        
        // Participant Management
        participants: [],
        participantHistory: [],
        meetingStats: null,
        currentUserStatus: {
          isMicOn: true,
          isCameraOn: true,
          isScreenShare: false
        },
        
        // Filters & Pagination
        filters: {
          status: 'all',
          dateRange: null,
          search: ''
        },
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        },

        // ============ MEETING MANAGEMENT ACTIONS ============

        /**
         * Create a new meeting
         */
        createMeeting: async (title) => {
          console.log('🎯 Creating new meeting:', title);
          
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            const response = await Api.post('/meetings', { title });
            
            if (response.data?.success) {
              const newMeeting = response.data.data;
              
              set((state) => {
                state.meetings.unshift(newMeeting);
                state.currentMeeting = newMeeting;
                state.isLoading = false;
              });
              
              console.log('✅ Meeting created successfully:', newMeeting.meetingCode);
              return newMeeting;
            }
          } catch (error) {
            console.error('❌ Failed to create meeting:', error);
            
            set((state) => {
              state.isLoading = false;
              state.error = error.response?.data?.message || 'Failed to create meeting';
            });
            throw error;
          }
        },

        /**
         * Get meeting by code
         */
        getMeetingByCode: async (code) => {
          console.log('🔍 Getting meeting by code:', code);
          
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            const response = await Api.get(`/meetings/code/${code}`);
            
            if (response.data?.success) {
              const meeting = response.data.data;
              
              set((state) => {
                state.currentMeeting = meeting;
                state.participants = meeting.participants || [];
                state.isLoading = false;
              });
              
              console.log('✅ Meeting fetched successfully:', meeting.meetingCode);
              return meeting;
            }
          } catch (error) {
            console.error('❌ Failed to fetch meeting:', error);
            
            const errorMessage = error.response?.data?.message || 'Meeting not found';
            
            set((state) => {
              state.isLoading = false;
              state.error = errorMessage;
            });
            throw error;
          }
        },

        /**
         * Join a meeting by code
         */
        joinMeeting: async (code) => {
          console.log('🚪 Joining meeting:', code);
          
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            const response = await Api.post('/meetings/join', { code });
            
            if (response.data?.success) {
              const participant = response.data.data;
              
              // Also fetch the updated meeting info
              await get().getMeetingByCode(code);
              
              set((state) => {
                state.isLoading = false;
              });
              
              console.log('✅ Joined meeting successfully');
              return participant;
            }
          } catch (error) {
            console.error('❌ Failed to join meeting:', error);
            
            const errorMessage = error.response?.data?.message || 'Failed to join meeting';
            
            set((state) => {
              state.isLoading = false;
              state.error = errorMessage;
            });
            throw error;
          }
        },

        /**
         * Leave a meeting
         */
        leaveMeeting: async (meetingId) => {
          console.log('🚶 Leaving meeting:', meetingId);

          try {
            await Api.post(`/meetings/${meetingId}/leave`);
            
            set((state) => {
              state.currentMeeting = null;
              state.participants = [];
              state.meetingStats = null;
              state.participantHistory = [];
              state.currentUserStatus = {
                isMicOn: true,
                isCameraOn: true,
                isScreenShare: false
              };
            });
            
            console.log('✅ Left meeting successfully');
          } catch (error) {
            console.error('⚠️ Failed to leave meeting (continuing anyway):', error);
            // Clear local state even if API call fails
            set((state) => {
              state.currentMeeting = null;
              state.participants = [];
            });
          }
        },

        /**
         * End a meeting (owner only)
         */
        endMeeting: async (meetingId) => {
          console.log('🔚 Ending meeting:', meetingId);
          
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            const response = await Api.post(`/meetings/${meetingId}/end`);
            
            if (response.data?.success) {
              const endedMeeting = response.data.data;
              
              set((state) => {
                // Update meeting in list
                const index = state.meetings.findIndex(m => m.meetingId === meetingId);
                if (index !== -1) {
                  state.meetings[index] = endedMeeting;
                }
                
                // Clear current meeting if it's the one being ended
                if (state.currentMeeting?.meetingId === meetingId) {
                  state.currentMeeting = null;
                  state.participants = [];
                }
                
                state.isLoading = false;
              });
              
              console.log('✅ Meeting ended successfully');
              return endedMeeting;
            }
          } catch (error) {
            console.error('❌ Failed to end meeting:', error);
            
            set((state) => {
              state.isLoading = false;
              state.error = error.response?.data?.message || 'Failed to end meeting';
            });
            throw error;
          }
        },

        /**
         * Get active meetings for current user
         */
        getActiveMeetings: async () => {
          console.log('📋 Fetching active meetings');
          
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            const response = await Api.get('/meetings/active');
            
            if (response.data?.success) {
              const meetings = response.data.data;
              
              set((state) => {
                state.activeMeetings = meetings;
                state.isLoading = false;
              });
              
              console.log('✅ Active meetings fetched:', meetings.length);
              return meetings;
            }
          } catch (error) {
            console.error('❌ Failed to fetch active meetings:', error);
            
            set((state) => {
              state.isLoading = false;
              state.error = error.response?.data?.message || 'Failed to fetch active meetings';
            });
            throw error;
          }
        },

        // ============ PARTICIPANT MANAGEMENT ACTIONS ============

        /**
         * Get active participants in a meeting
         */
        getActiveParticipants: async (meetingId) => {
          console.log('👥 Getting active participants for meeting:', meetingId);

          try {
            const response = await Api.get(`/meetings/${meetingId}/participants`);
            
            if (response.data?.success) {
              const participants = response.data.data;
              
              set((state) => {
                state.participants = participants;
              });
              
              console.log('✅ Participants fetched:', participants.length);
              return participants;
            }
          } catch (error) {
            console.error('❌ Failed to fetch participants:', error);
            throw error;
          }
        },

        /**
         * Update current user's media status (mic, camera, screen share)
         */
        updateMediaStatus: async (meetingId, statusUpdates) => {
          console.log('🎛️ Updating media status:', statusUpdates);

          try {
            const response = await Api.patch(`/meetings/${meetingId}/participants/status`, statusUpdates);
            
            if (response.data?.success) {
              set((state) => {
                state.currentUserStatus = { ...state.currentUserStatus, ...statusUpdates };
              });
              
              console.log('✅ Media status updated');
              return response.data.data;
            }
          } catch (error) {
            console.error('❌ Failed to update media status:', error);
            throw error;
          }
        },

        /**
         * Get specific participant status
         */
        getParticipantStatus: async (meetingId, userId) => {
          console.log('📊 Getting participant status:', { meetingId, userId });

          try {
            const response = await Api.get(`/meetings/${meetingId}/participants/${userId}/status`);
            
            if (response.data?.success) {
              console.log('✅ Participant status fetched');
              return response.data.data;
            }
          } catch (error) {
            console.error('❌ Failed to fetch participant status:', error);
            throw error;
          }
        },

        /**
         * Kick a participant from meeting (owner/admin only)
         */
        kickParticipant: async (meetingId, participantUserId) => {
          console.log('🚫 Kicking participant:', participantUserId);

          try {
            const response = await Api.delete(`/meetings/${meetingId}/participants/${participantUserId}/kick`);
            
            if (response.data?.success) {
              // Remove participant from local state
              set((state) => {
                state.participants = state.participants.filter(
                  p => p.user.userId !== participantUserId
                );
              });
              
              console.log('✅ Participant kicked successfully');
              return response.data.data;
            }
          } catch (error) {
            console.error('❌ Failed to kick participant:', error);
            throw error;
          }
        },

        /**
         * Toggle participant mute (owner/admin only)
         */
        toggleParticipantMute: async (meetingId, participantUserId, mute = true) => {
          console.log('🔇 Toggling participant mute:', { participantUserId, mute });

          try {
            const response = await Api.patch(`/meetings/${meetingId}/participants/${participantUserId}/mute`, {
              mute
            });
            
            if (response.data?.success) {
              // Update participant in local state
              set((state) => {
                const participant = state.participants.find(
                  p => p.user.userId === participantUserId
                );
                if (participant) {
                  participant.isMicOn = !mute;
                }
              });
              
              console.log('✅ Participant mute toggled');
              return response.data.data;
            }
          } catch (error) {
            console.error('❌ Failed to toggle participant mute:', error);
            throw error;
          }
        },

        /**
         * Get meeting statistics
         */
        getMeetingStats: async (meetingId) => {
          console.log('📈 Getting meeting stats:', meetingId);

          try {
            const response = await Api.get(`/meetings/${meetingId}/stats`);
            
            if (response.data?.success) {
              const stats = response.data.data;
              
              set((state) => {
                state.meetingStats = stats;
              });
              
              console.log('✅ Meeting stats fetched');
              return stats;
            }
          } catch (error) {
            console.error('❌ Failed to fetch meeting stats:', error);
            throw error;
          }
        },

        /**
         * Get participant history for a meeting
         */
        getParticipantHistory: async (meetingId) => {
          console.log('📜 Getting participant history:', meetingId);

          try {
            const response = await Api.get(`/meetings/${meetingId}/history`);
            
            if (response.data?.success) {
              const history = response.data.data;
              
              set((state) => {
                state.participantHistory = history;
              });
              
              console.log('✅ Participant history fetched');
              return history;
            }
          } catch (error) {
            console.error('❌ Failed to fetch participant history:', error);
            throw error;
          }
        },

        /**
         * Check if user can join a meeting
         */
        checkCanJoin: async (meetingCode) => {
          console.log('🔒 Checking if can join meeting:', meetingCode);

          try {
            const response = await Api.get(`/meetings/code/${meetingCode}/can-join`);
            
            if (response.data?.success) {
              console.log('✅ Join check completed');
              return response.data.data;
            }
          } catch (error) {
            console.error('❌ Failed to check join permission:', error);
            throw error;
          }
        },

        /**
         * Cleanup expired meetings (admin function)
         */
        cleanupExpiredMeetings: async () => {
          console.log('🧹 Cleaning up expired meetings');

          try {
            const response = await Api.post('/meetings/cleanup/expired');
            
            if (response.data?.success) {
              console.log('✅ Expired meetings cleaned up');
              return response.data.data;
            }
          } catch (error) {
            console.error('❌ Failed to cleanup expired meetings:', error);
            throw error;
          }
        },

        // ============ LOCAL STATE MANAGEMENT ============

        /**
         * Update local participant list (for real-time updates)
         */
        updateParticipant: (userId, updates) => {
          set((state) => {
            const participant = state.participants.find(p => p.user.userId === userId);
            if (participant) {
              Object.assign(participant, updates);
            }
          });
        },

        /**
         * Add participant to local state
         */
        addParticipant: (participant) => {
          set((state) => {
            const exists = state.participants.find(p => p.user.userId === participant.user.userId);
            if (!exists) {
              state.participants.push(participant);
            }
          });
        },

        /**
         * Remove participant from local state
         */
        removeParticipant: (userId) => {
          set((state) => {
            state.participants = state.participants.filter(p => p.user.userId !== userId);
          });
        },

        /**
         * Set current meeting
         */
        setCurrentMeeting: (meeting) => {
          set((state) => {
            state.currentMeeting = meeting;
            state.participants = meeting?.participants || [];
          });
        },

        /**
         * Update current user media status locally
         */
        setCurrentUserStatus: (status) => {
          set((state) => {
            state.currentUserStatus = { ...state.currentUserStatus, ...status };
          });
        },

        // ============ UTILITY ACTIONS ============

        /**
         * Set filters for meeting list
         */
        setFilters: (filters) => {
          set((state) => {
            state.filters = { ...state.filters, ...filters };
            state.pagination.page = 1; // Reset to first page
          });
        },

        /**
         * Set pagination
         */
        setPagination: (pagination) => {
          set((state) => {
            state.pagination = { ...state.pagination, ...pagination };
          });
        },

        /**
         * Clear error state
         */
        clearError: () => {
          set((state) => {
            state.error = null;
          });
        },

        /**
         * Reset entire store state
         */
        reset: () => {
          set((state) => {
            state.meetings = [];
            state.currentMeeting = null;
            state.activeMeetings = [];
            state.participants = [];
            state.participantHistory = [];
            state.meetingStats = null;
            state.currentUserStatus = {
              isMicOn: true,
              isCameraOn: true,
              isScreenShare: false
            };
            state.isLoading = false;
            state.error = null;
            state.filters = {
              status: 'all',
              dateRange: null,
              search: ''
            };
            state.pagination = {
              page: 1,
              limit: 10,
              total: 0,
              totalPages: 0
            };
          });
        },

        /**
         * Get store status for debugging
         */
        getStoreStatus: () => {
          const state = get();
          return {
            hasCurrentMeeting: !!state.currentMeeting,
            participantCount: state.participants.length,
            activeMeetingsCount: state.activeMeetings.length,
            isLoading: state.isLoading,
            hasError: !!state.error,
            currentUserStatus: state.currentUserStatus
          };
        }
      }))
    ),
    { name: 'meeting-store' }
  )
);

export default useMeetingStore;