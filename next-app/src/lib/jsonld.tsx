import type { Player, PlayerSeason } from "./types";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://goat.starcoby.com";
const SITE_NAME = "GOAT — NBA Greatest Of All Time";

/* ─────────────────────────────────────────────
   WebSite — used once on the root layout / homepage
   ───────────────────────────────────────────── */
export function webSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: BASE_URL,
    description:
      "NBA 历史球星数据对比工具 — 800+ 名球员生涯数据对比、6700+ 个赛季单赛季分析，支持分享卡片生成。",
    inLanguage: "zh-CN",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/players?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/* ─────────────────────────────────────────────
   WebPage — generic page
   ───────────────────────────────────────────── */
export function webPageJsonLd(opts: {
  title: string;
  description: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: opts.title,
    description: opts.description,
    url: opts.url,
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: BASE_URL },
    inLanguage: "zh-CN",
  };
}

/* ─────────────────────────────────────────────
   BreadcrumbList
   ───────────────────────────────────────────── */
type Crumb = { name: string; url: string };

export function breadcrumbJsonLd(items: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/* ─────────────────────────────────────────────
   Player page — WebPage + BreadcrumbList
   ───────────────────────────────────────────── */
export function playerPageJsonLd(player: Player) {
  const url = `${BASE_URL}/player/${player.id}`;
  const title = `${player.nameZh} (${player.nameEn}) 生涯数据`;
  const desc = `${player.nameZh}（${player.nameEn}）的 NBA 生涯数据总览`;

  return [
    webPageJsonLd({ title, description: desc, url }),
    breadcrumbJsonLd([
      { name: "首页", url: BASE_URL },
      { name: "球员", url: `${BASE_URL}/players` },
      { name: player.nameZh, url },
    ]),
  ];
}

/* ─────────────────────────────────────────────
   Season page — WebPage + BreadcrumbList
   ───────────────────────────────────────────── */
export function seasonPageJsonLd(player: Player, season: string) {
  const url = `${BASE_URL}/player/${player.id}/season/${season}`;
  const title = `${player.nameZh} (${player.nameEn}) ${season} 赛季数据`;
  const desc = `${player.nameZh} 的 ${season} 赛季 NBA 数据`;

  return [
    webPageJsonLd({ title, description: desc, url }),
    breadcrumbJsonLd([
      { name: "首页", url: BASE_URL },
      { name: "球员", url: `${BASE_URL}/players` },
      { name: player.nameZh, url: `${BASE_URL}/player/${player.id}` },
      { name: `${season} 赛季`, url },
    ]),
  ];
}

/* ─────────────────────────────────────────────
   Compare page — WebPage
   ───────────────────────────────────────────── */
export function comparePageJsonLd() {
  return [
    webPageJsonLd({
      title: "NBA 球员数据对比",
      description:
        "对比 NBA 历史球员的生涯数据和单赛季表现。支持 800+ 名球员、6700+ 个赛季的多维度数据对比。",
      url: `${BASE_URL}/compare`,
    }),
    breadcrumbJsonLd([
      { name: "首页", url: BASE_URL },
      { name: "球员对比", url: `${BASE_URL}/compare` },
    ]),
  ];
}

/* ─────────────────────────────────────────────
   Players listing page — WebPage + BreadcrumbList
   ───────────────────────────────────────────── */
export function playersPageJsonLd() {
  return [
    webPageJsonLd({
      title: "NBA 球员名录",
      description:
        "浏览 800+ 名 NBA 球员的完整资料库，搜索、筛选和查看每位球员的生涯数据与赛季详情。",
      url: `${BASE_URL}/players`,
    }),
    breadcrumbJsonLd([
      { name: "首页", url: BASE_URL },
      { name: "球员名录", url: `${BASE_URL}/players` },
    ]),
  ];
}

/* ─────────────────────────────────────────────
   About page — WebPage + BreadcrumbList
   ───────────────────────────────────────────── */
export function aboutPageJsonLd() {
  return [
    webPageJsonLd({
      title: "关于 GOAT NBA 球员对比工具",
      description:
        "GOAT（Greatest Of All Time）是一个 NBA 球员对比工具，帮助篮球爱好者客观、直观地比较不同球员的职业生涯数据。",
      url: `${BASE_URL}/about`,
    }),
    breadcrumbJsonLd([
      { name: "首页", url: BASE_URL },
      { name: "关于", url: `${BASE_URL}/about` },
    ]),
  ];
}

/* ─────────────────────────────────────────────
   Helper: render JSON-LD script tags
   ───────────────────────────────────────────── */
export function JsonLdScripts({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
