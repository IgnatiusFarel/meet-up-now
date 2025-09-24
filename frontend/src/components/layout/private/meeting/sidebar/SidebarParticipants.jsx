import ParticipantCard from "../ParticipantCard";

const SidebarParticipants = ({ participants }) => {
  return (
    <div className="p-2 space-y-2">
      {participants.map((p) => (
        <ParticipantCard key={p.id} participant={p} />
      ))}
    </div>
  );
};

export default SidebarParticipants;
