import { Metadata } from "next";
import PlayersClient from "./PlayersClient";

export const metadata: Metadata = {
  title: "NBA 球员名录",
  description:
    "浏览 800+ 名 NBA 球员的完整资料库，搜索、筛选和查看每位球员的生涯数据与赛季详情。",
};

export default function PlayersPage() {
  return <PlayersClient />;
}
