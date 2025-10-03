import type { Metadata } from "next";
import { MenuWizard } from "./_components/menu-wizard";

export const metadata: Metadata = {
  title: "用途別 最強筋トレメニュー｜マチョ田の部屋",
  description:
    "性別・トレーニングタイプ・頻度から最適な筋トレメニューを診断。ジム週３回の最強メニューを今すぐチェック。",
  openGraph: {
    title: "用途別 最強筋トレメニュー｜マチョ田の部屋",
    description:
      "性別・トレーニングタイプ・頻度から最適な筋トレメニューを診断。ジム週３回の最強メニューをチェック。",
    url: "https://macho.example/menu",
    type: "website",
    images: [
      {
        url: "/picture/man.png",
        width: 800,
        height: 800,
        alt: "マチョ田の部屋 キャラクター",
      },
    ],
  },
};

export default function MenuPage() {
  return <MenuWizard />;
}
