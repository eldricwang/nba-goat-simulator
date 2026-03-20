import { Metadata } from "next";
import PlayersClient from "./PlayersClient";

export const metadata: Metadata = {
  title: "球员名录 - NBA GOAT 模拟器",
  description:
    "浏览 1050+ 名 NBA 球员的完整资料库，搜索、筛选和查看每位球员的生涯数据。",
};

export default function PlayersPage() {
  return <PlayersClient />;
}
