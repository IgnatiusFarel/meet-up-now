import ParticipantCard from "./ParticipantCard";

const VideoArea = ({
  viewMode,
  participants,
  pinnedParticipantId,
  togglePin,
}) => {
  // Get pinned participant (displayed in main screen)
  const pinnedParticipant =
    participants.find((p) => p.id === pinnedParticipantId) || participants[0];
  // Get other participants (displayed in sidebar)
  const otherParticipants = participants.filter(
    (p) => p.id !== pinnedParticipantId
  );

  // Function to get flexible grid layout with max 32 participants and overflow handling
  const getGalleryLayoutClasses = (count) => {
    // Handle overflow - if more than 32, show only 32 with "X+ others" indicator
    const displayCount = Math.min(count, 32);

    if (displayCount <= 4) {
      return "grid-cols-4 grid-rows-1";
    } else if (displayCount <= 8) {
      return "grid-cols-4 grid-rows-2";
    } else if (displayCount <= 12) {
      return "grid-cols-4 grid-rows-3";
    } else if (displayCount <= 16) {
      return "grid-cols-4 grid-rows-4";
    } else if (displayCount <= 20) {
      return "grid-cols-4 grid-rows-5";
    } else if (displayCount <= 24) {
      return "grid-cols-4 grid-rows-6";
    } else if (displayCount <= 28) {
      return "grid-cols-4 grid-rows-7";
    } else {
      return "grid-cols-4 grid-rows-8";
    }
  };

  // Function to get participants to display (max 32, with overflow handling)
  const getDisplayParticipants = () => {
    if (participants.length <= 32) {
      return participants;
    }

    // Show first 31 participants + overflow indicator
    return participants.slice(0, 31);
  };

  // Function to get special positioning for odd numbers in last row
  const getSpecialPositioning = (index, totalDisplayed) => {
    const remainder = totalDisplayed % 4;
    const lastRowStart = Math.floor(totalDisplayed / 4) * 4;

    // If we're in the last row and it has odd numbers
    if (index >= lastRowStart && remainder > 0) {
      const positionInLastRow = index - lastRowStart;

      if (remainder === 1) {
        // 1 item: center it across all 4 columns
        return positionInLastRow === 0
          ? "col-span-4 justify-self-center max-w-sm"
          : "";
      } else if (remainder === 2) {
        // 2 items: center them in the middle 2 columns
        if (positionInLastRow === 0) return "col-start-2";
        if (positionInLastRow === 1) return "col-start-3";
      } else if (remainder === 3) {
        // 3 items: center them in columns 1, 2, 3 (skipping column 4)
        if (positionInLastRow === 0) return "col-start-1";
        if (positionInLastRow === 1) return "col-start-2";
        if (positionInLastRow === 2) return "col-start-3";
      }
    }

    return "";
  };

  return (
    <div className="flex-1 p-6">
      <div className="h-full flex">
        {viewMode === "focus" ? (
          <>
            {/* Focus Mode: Main Presenter View */}
            <div className="flex-1 pr-4">
              <ParticipantCard
                participant={pinnedParticipant}
                isMain={true}
              />
            </div>

            {/* Participants Sidebar */}
            <div className="w-48 grid grid-cols-1 gap-3 max-h-full overflow-y-auto">
              {otherParticipants.map((participant) => (
                <ParticipantCard
                  key={participant.id}
                  participant={participant}
                  onPin={togglePin}
                />
              ))}
            </div>
          </>
        ) : (
          /* Gallery Mode: Flexible grid layout with overflow handling */
          <div
            className={`w-full grid gap-3 place-items-stretch overflow-y-auto p-2 ${getGalleryLayoutClasses(
              participants.length
            )}`}
          >
            {getDisplayParticipants().map((participant, index) => (
              <ParticipantCard
                key={participant.id}
                participant={participant}
                onPin={togglePin}
                isGalleryMode={true}
                specialClass={getSpecialPositioning(
                  index,
                  Math.min(participants.length, 32)
                )}
                totalParticipants={participants.length}
              />
            ))}

            {/* Overflow indicator for 33+ participants */}
            {participants.length > 32 && (
              <ParticipantCard
                isOverflowCard={true}
                isGalleryMode={true}
                totalParticipants={participants.length}
                specialClass={getSpecialPositioning(31, 32)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoArea;