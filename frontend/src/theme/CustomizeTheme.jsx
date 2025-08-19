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
          },
          Collapse: {
            
            
                  
            contentBg: "#FDFDFD",
            
            
            
            colorText: "#717171", 
            colorTextHeading: "#FFFFFF", 
            
                        
            
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
