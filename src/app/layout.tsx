import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";

const promptFont = Prompt({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-prompt",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ชะโด AI — ผู้ช่วยเตือนความจำ & จัดการโน้ตผ่าน LINE (LINE LIFF)",
  description:
    "ระบบผู้ช่วยเตือนความจำผ่าน LINE Official Account (1-on-1 & Group Chat) พร้อมหน้าเว็บ LINE LIFF ปฏิทิน โน้ต และตารางการแจ้งเตือน",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={promptFont.variable}>
      <body className="font-sans bg-[#F9F9F6] text-[#2B2D42] min-h-screen selection:bg-[#4E8752]/20">
        {children}
      </body>
    </html>
  );
}
