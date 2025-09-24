import { ConfigProvider } from "antd";

export default function ThemeProvider({ children }) {
  return (
    <ConfigProvider
      theme={{
        token: {
          fontFamily: "Poppins, sans-serif",
          colorPrimary: "#171717",          
        },
        components: {
          Button: {
            colorPrimary: "#171717",                        
            primaryColor: "#FDFDFD",
            contentFontSize: 16,
            fontWeight: 500,
            borderRadius: 12,
            controlHeight: 52,
            defaultBg: "#FDFDFD",
            defaultColor: "#171717",
            defaultBorderColor: "#E9E9E9",
            defaultHoverBorderColor: "#717171",
            defaultHoverColor: "#171717",
          },
          Collapse: {
            contentBg: "#FDFDFD",
            colorText: "#717171",
            colorTextHeading: "#FFFFFF",
          },
          Segmented: {
            trackBg: "#FDFDFD",
            itemSelectedColor: "#171717",
            itemColor: "#717171",
            itemActiveBg: "#F3F4F6",
            borderRadius: 12
          },
          Select: {
            controlHeight: 60, 
            optionSelectedBg: "#DFDFDF",
            optionLineHeight: 1.5,
            borderRadius: 20
          },
          Spin: {
             dotSpinDotItemBg: "#fff",              
          }
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
