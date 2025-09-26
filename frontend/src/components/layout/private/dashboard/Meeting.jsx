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
  const [checkingMeeting, setCheckingMeeting] = useState(false);

  // ambil state & actions dari store
  const checkCanJoin = useMeetingStore((s) => s.checkCanJoin);
  const createMeeting = useMeetingStore((s) => s.createMeeting);
  const isCreatingMeeting = useMeetingStore((s) => s.isCreatingMeeting);
  const isJoiningMeeting = useMeetingStore((s) => s.isJoiningMeeting);
  const setIsCreatingMeeting = useMeetingStore((s) => s.setIsCreatingMeeting);
  const setIsJoiningMeeting = useMeetingStore((s) => s.setIsJoiningMeeting);

  const handleNewMeeting = async () => {
    setIsCreatingMeeting(true);
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
        setIsCreatingMeeting(false);
        return;
      }

      const result = await createMeeting(title);

      if (result && result.meetingCode) {
        const meeting = result;
        const meetingCode = meeting.meetingCode;

        const successMessage = "Meeting created successfully!";
        message.success(successMessage);

        Modal.destroyAll();

        setTimeout(() => {
          navigate(`/preview/${meetingCode}`, { replace: true });
        }, 200);
      } else {
        throw new Error(result?.message || "Failed to create meeting!");
      }
    } catch (error) {
      console.error("Failed to create meeting:", error);

      let errorMessage =
        "💥 Oops! Something went wrong while creating the meeting. Please try again!";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      message.destroy();
      message.error(errorMessage);
      Modal.destroyAll();
    } finally {
      setIsCreatingMeeting(false);
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
    setIsJoiningMeeting(true);
    try {
      const result = await checkCanJoin(meetCode.toUpperCase());

      let canJoin, meeting, isAlreadyParticipant;

      if (result && result.data) {
        ({ canJoin, meeting, isAlreadyParticipant } = result.data);
      } else if (result && typeof result === "object") {
        canJoin = result.canJoin;
        meeting = result.meeting;
        isAlreadyParticipant = result.isAlreadyParticipant;
      } else {
        throw new Error("Invalid response format from server");
      }

      if (!canJoin) {
        const errorMessage = result.message || "❌ Cannot join this meeting...";
        message.error(errorMessage);
        return;
      }

      let successMessage = "Connecting you to the meeting...";
      if (isAlreadyParticipant) {
        successMessage = "🔄 Reconnecting you back to the meeting...";
      } else if (meeting?.status === "waiting") {
        successMessage = "⏳ Waiting for the host...";
      }

      message.success(successMessage);

      const meetingCode = meeting?.meetingCode || meetCode;
      navigate(`/preview/${meetingCode}`);
    } catch (error) {
      console.error("Join meeting error:", error);

      let errorMessage = "Unable to join meeting. Please try again later!";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      message.destroy();
      message.error(errorMessage);
    } finally {
      setIsJoiningMeeting(false);
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
            loading={isCreatingMeeting}
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
              onPressEnter={() =>
                meetCode.length === 6 && handleJoinMeeting()
              }
              disabled={isCreatingMeeting || isJoiningMeeting}
            />
            <Button
              type="text"
              className={`font-normal rounded-full ${
                meetCode.length === 6
                  ? "font-semibold bg-blue-50 text-blue-500 hover:bg-blue-600 hover:text-blue-700"
                  : "hover:bg-gray-100 hover:text-gray-500"
              }`}
              onClick={handleJoinMeeting}
              disabled={
                meetCode.length !== 6 ||
                isJoiningMeeting ||
                isCreatingMeeting
              }
              loading={isJoiningMeeting}
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
