import { Select } from "antd";

const DeviceSettings = ({ devices, selected, setSelected }) => {
  const deviceTypes = [
    {
      label: "Microphone",
      key: "microphone",
      data: devices.microphones,
    },
    { 
      label: "Speaker", 
      key: "speaker", 
      data: devices.speakers 
    },
    { 
      label: "Camera", 
      key: "camera", 
      data: devices.cameras 
    },
  ];

  return (
    <div className="space-y-4">
      {deviceTypes.map(({ label, key, data }) => (
        <div key={key}>
          <h3 className="text-sm font-medium text-[#171717] mb-2">
            {label}
          </h3>
          <Select
            value={selected[key] || ""}
            onChange={(value) =>
              setSelected((s) => ({ ...s, [key]: value }))
            }
            placeholder={`Select a ${label.toLowerCase()}`}
            className="w-full"
            disabled={data.length === 0}
          >
            {data.map((device) => (
              <Select.Option
                key={device.deviceId}
                value={device.deviceId}
              >
                {device.label ||
                  `${label} ${device.deviceId.slice(0, 5)}`}
              </Select.Option>
            ))}
          </Select>
        </div>
      ))}
    </div>
  );
};

export default DeviceSettings;