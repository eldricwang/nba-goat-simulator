import Link from "next/link";
import { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { aboutPageJsonLd, JsonLdScripts } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "关于 GOAT NBA 球员对比工具",
  description:
    "GOAT（Greatest Of All Time）是一个 NBA 球员对比工具，帮助篮球爱好者客观、直观地比较不同球员的职业生涯数据。了解项目简介、数据来源和技术栈。",
  openGraph: {
    title: "关于 GOAT NBA 球员对比工具",
    description:
      "了解 GOAT 项目的简介、数据来源和技术栈。",
    type: "website",
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* JSON-LD */}
      <JsonLdScripts data={aboutPageJsonLd()} />

      {/* Header */}
      <SiteHeader />

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
            关于 GOAT 对比工具
          </h1>

          <div className="space-y-8">
            {/* 项目介绍 */}
            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-4">项目简介</h2>
              <p className="text-slate-600 leading-relaxed">
                GOAT（Greatest Of All Time）是一个 NBA 球员对比工具，旨在帮助篮球爱好者客观、直观地比较不同球员的职业生涯成就和数据表现。
                我们相信每个时代都有伟大的球员，而数据是理解他们伟大之处的重要参考。
              </p>
            </section>

            {/* 数据来源 */}
            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-4">数据来源</h2>
              <div className="space-y-4">
                <p className="text-slate-600 leading-relaxed">
                  本工具使用的球员数据主要来源于以下公开数据源：
                </p>
                <ul className="space-y-2 text-slate-600">
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></span>
                    <span><strong>NBA 官方数据</strong> - 包括球员基础信息、职业生涯统计数据</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></span>
                    <span><strong>Basketball-Reference</strong> - 详细的历史赛季数据</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></span>
                    <span><strong>NBA API</strong> - 实时更新的球员信息和统计数据</span>
                  </li>
                </ul>
                <p className="text-sm text-slate-500">
                  数据最后更新：2026年3月
                </p>
              </div>
            </section>

            {/* 功能特性 */}
            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-4">功能特性</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-700 mb-2">⚡ 快速对比</h3>
                  <p className="text-slate-600 text-sm">
                    支持按球员姓名搜索，提供5组热门预设对比组合
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-700 mb-2">📊 多维度分析</h3>
                  <p className="text-slate-600 text-sm">
                    职业生涯模式 vs 单赛季模式，覆盖主要统计指标
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-700 mb-2">🖼️ 分享卡片</h3>
                  <p className="text-slate-600 text-sm">
                    生成精美的对比卡片，支持中英文切换和 PNG 下载
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-700 mb-2">📱 响应式设计</h3>
                  <p className="text-slate-600 text-sm">
                    完美适配桌面和移动设备，随时随地对比球员
                  </p>
                </div>
              </div>
            </section>

            {/* 免责声明 */}
            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-4">免责声明</h2>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>
                  <strong>数据准确性：</strong>本工具提供的数据仅供参考，虽然我们力求准确，但不能保证数据的绝对精确性。
                  建议以官方 NBA 数据为准。
                </p>
                <p>
                  <strong>球员评价：</strong>本工具仅提供客观数据对比，不涉及主观评价。
                  球员的伟大程度受多种因素影响，数据只是参考指标之一。
                </p>
                <p>
                  <strong>版权声明：</strong>本工具使用的球员姓名、统计数据等均属于 NBA 及相关机构的版权。
                  本工具为非商业用途，旨在服务篮球爱好者。
                </p>
                <p>
                  <strong>使用风险：</strong>用户自行承担使用本工具可能产生的任何风险。
                </p>
              </div>
            </section>

            {/* 技术栈 */}
            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-4">技术栈</h2>
              <div className="flex flex-wrap gap-3">
                {[
                  "Next.js 16", "TypeScript", "Tailwind CSS", 
                  "React 19", "Vercel", "NBA API"
                ].map((tech) => (
                  <span 
                    key={tech}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </section>

            {/* 联系与反馈 */}
            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-4">联系与反馈</h2>
              <p className="text-slate-600 leading-relaxed">
                如果您发现数据错误、有功能建议，或遇到任何技术问题，
                欢迎通过项目仓库提交 Issue 或 Pull Request。
              </p>
              <div className="mt-4">
                <Link 
                  href="/compare"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all"
                >
                  开始对比球员
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}