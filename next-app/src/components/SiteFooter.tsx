import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 mt-auto py-4 bg-white/40">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between text-[11px] text-slate-400">
        <p>GOAT — Greatest Of All Time Comparator</p>
        <nav className="flex gap-4">
          <Link href="/compare" className="hover:text-slate-600 transition-colors">对比</Link>
          <Link href="/players" className="hover:text-slate-600 transition-colors">球员</Link>
          <Link href="/about" className="hover:text-slate-600 transition-colors">关于</Link>
        </nav>
      </div>
    </footer>
  );
}
