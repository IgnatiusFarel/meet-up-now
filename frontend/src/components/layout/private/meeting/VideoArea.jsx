import { useEffect, useState } from "react";
import ParticipantCard from "./ParticipantCard";

const VideoArea = ({ participants }) => {
  return (
    <div className="grid grid-cols-2 gap-4 w-full h-full bg-black p-4">
      {participants.map((p) => (
        <ParticipantCard key={p.id} participant={p} />
      ))}
    </div>
  );
};

export default VideoArea;
