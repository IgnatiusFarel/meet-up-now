import "dayjs/locale/en";
import dayjs from "dayjs";
import { useState } from "react";
import { App, Input, Button, Modal } from "antd";
import { useNavigate } from "react-router-dom";
import useMeetingStore from "@/stores/MeetingStore";
import { KeyIcon, PlusCircleIcon } from "@heroicons/react/24/outline";

const Meeting = () => {
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const [meetCode, setMeetCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingMeeting, setCheckingMeeting] = useState(false);

  const checkCanJoin = useMeetingStore((s) => s.checkCanJoin);
  const createMeeting = useMeetingStore((s) => s.createMeeting);

  const handleNewMeeting = async () => {
    setLoading(true);
    try {
      const title = await new Promise((resolve) => {
        let inputValue = `Meeting - ${dayjs().format("MM DD, HH:mm")}`;

        modal.confirm({
          title: "Create New Meeting",
          content: (
            <>
              <p>Enter a title for your meeting:</p>
              <Input
                defaultValue={inputValue}
                onChange={(e) => (inputValue = e.target.value)}
                placeholder="Meeting Title"
                maxLength={100}
                onPressEnter={() => Modal.destroyAll()}
              />
            </>
          ),
          okText: "Create",
          cancelText: "Cancel",
          onOk: () => resolve(inputValue),
          onCancel: () => resolve(null),
        });
      });

      if (!title) {
        setLoading(false);
        return;
      }

      const result = await createMeeting(title);
      console.log("Create meeting result:", result); // Debug log

      // MeetingStore sudah mengembalikan data meeting langsung (tanpa wrapper success/data)
      if (result && result.meetingCode) {
        const meeting = result;
        const meetingCode = meeting.meetingCode;

        if (!meetingCode) {
          console.error("Meeting code not found in response:", result);
          throw new Error("Meeting created but code not returned from server");
        }

        const successMessage = "Meeting created successfully!";
        message.success(successMessage);

        Modal.destroyAll();

        console.log("Navigating to preview with code:", meetingCode);

        setTimeout(() => {
          navigate(`/preview/${meetingCode}`, { replace: true });
        }, 200);
      } else {
        throw new Error(result?.message || "Failed to create meeting!");
      }
    } catch (error) {
      console.error("Failed to create meeting:", error);

      let errorMessage =
        "💥 Oops! Something went wrong while creating the meeting. Please try again in a moment!";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      message.destroy();
      message.error(errorMessage);
      Modal.destroyAll();
    } finally {
      setLoading(false);
    }
  };

  const handleJoinMeeting = async () => {
    if (!meetCode.trim()) {
      message.warning("🔑 Oops! You forgot to enter the room code.");
      return;
    }

    if (meetCode.length !== 6) {
      message.destroy();
      message.error("❌ Hmm... room code must be 6 characters");
      return;
    }

    setCheckingMeeting(true);
    setLoading(true);

    try {
      console.log("Checking if can join meeting:", meetCode);

      const result = await checkCanJoin(meetCode.toUpperCase());

      console.log("Full checkCanJoin result:", result);

      // Handle different possible response structures
      let canJoin, meeting, isAlreadyParticipant;

      if (result && result.data) {
        // Standard structure: { success: true, data: { canJoin, meeting, isAlreadyParticipant }, message }
        ({ canJoin, meeting, isAlreadyParticipant } = result.data);
      } else if (result && typeof result === "object") {
        // Direct structure: { canJoin, meeting, isAlreadyParticipant, success, message }
        canJoin = result.canJoin;
        meeting = result.meeting;
        isAlreadyParticipant = result.isAlreadyParticipant;
      } else {
        // Fallback if structure is unexpected
        console.warn("Unexpected result structure:", result);
        throw new Error("Invalid response format from server");
      }

      // Check if we have the required data
      if (canJoin === undefined) {
        console.error("canJoin property missing from response:", result);
        throw new Error("Server response missing required data");
      }

      if (!canJoin) {
        const errorMessage = result.message || "❌ Cannot join this meeting...";
        message.error(errorMessage);
        return;
      }

      // Success case
      let successMessage = "Connecting you to the meeting...";

      if (isAlreadyParticipant) {
        successMessage = "🔄 Reconnecting you back to the meeting...";
      } else if (meeting?.status === "waiting") {
        successMessage = "⏳ Waiting for the host... hang tight!";
      } else if (meeting?.status === "active_no_host") {
        successMessage = "👀 Meeting is open, but host isn't here yet...";
      }

      message.success(successMessage);

      console.log("Meeting info:", {
        code: meeting?.meetingCode,
        title: meeting?.title,
        participantCount: meeting?.participantCount,
        duration: meeting?.duration,
        status: meeting?.status,
        isOwner: meeting?.isOwner,
        isAlreadyParticipant,
      });

      // Navigate to meeting
      const meetingCode = meeting?.meetingCode || meetCode;
      navigate(`/preview/${meetingCode}`);
    } catch (error) {
      console.error("Join meeting error:", error);

      let errorMessage = "Unable to join meeting. Please try again later!";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.status) {
        switch (error.response.status) {
          case 404:
            errorMessage = "Meeting not found! Please check the room code.";
            break;
          case 410:
            errorMessage = "This meeting has ended or expired.";
            break;
          case 400:
            errorMessage = "Invalid meeting code format.";
            break;
          case 500:
            errorMessage = "Server error. Please try again later!";
            break;
          case 503:
            errorMessage = "Service unavailable. Please try again later!";
            break;
          default:
            errorMessage = "Network error. Please check your connection!";
        }
      }
      message.destroy();
      message.error(errorMessage);
    } finally {
      setLoading(false);
      setCheckingMeeting(false);
    }
  };

  const handleMeetCodeInput = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    setMeetCode(value);
  };

  return (
    <div className="flex-1 flex items-center px-16">
      <div className="max-w-xl">
        <h1 className="text-5xl font-normal text-gray-800 leading-tight mb-6">
          Meetings and video calls for everyone
        </h1>
        <p className="text-lg text-gray-600 mb-12 leading-relaxed">
          Connect, collaborate, and celebrate from anywhere with Meet Up Now
        </p>

        <div className="flex items-center space-x-4 mb-8">
          <Button
            type="primary"
            size="large"
            className="flex items-center gap-2 h-12"
            onClick={handleNewMeeting}
            loading={loading}
            disabled={checkingMeeting}
          >
            <PlusCircleIcon className="mr-2 w-4 h-4" /> New Meeting
          </Button>

          <div className="flex items-center space-x-2">
            <Input
              prefix={<KeyIcon className="mr-2 w-4 h-4 text-gray-400" />}
              placeholder="Enter the room code"
              className="w-64 h-12"
              size="large"
              value={meetCode}
              maxLength={6}
              onChange={handleMeetCodeInput}
              onPressEnter={() => meetCode.length === 6 && handleJoinMeeting()}
              disabled={loading}
            />
            <Button
              type="text"
              className={`font-normal rounded-full ${
                meetCode.length === 6
                  ? "font-semibold bg-blue-50 text-blue-500 hover:bg-blue-600 hover:text-blue-700"
                  : "hover:bg-gray-100 hover:text-gray-500"
              }`}
              onClick={handleJoinMeeting}
              disabled={meetCode.length !== 6}
            >
              Join
            </Button>
          </div>
        </div>

        <div className="border-t border-gray-300 my-8"></div>

        <div className="flex items-center gap-2">
          <a
            href="#"
            className="text-blue-500 hover:text-blue-600 underline text-sm transition-colors"
            onClick={(e) => {
              e.preventDefault();
              console.log("Learn More clicked");
            }}
          >
            Learn More
          </a>
          <span className="text-gray-500 text-sm">about Meet Up Now</span>
        </div>
      </div>
    </div>
  );
};

export default Meeting;
