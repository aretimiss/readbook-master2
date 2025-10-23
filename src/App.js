import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import "./App.css";

/** ====== ENV & URL helpers ====== */
const RAW_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  "";
const BASE_URL = RAW_BASE.replace(/\/+$/, "");

const withKeys = (url) => {
  const key_identity = process.env.REACT_APP_API_KEY_IDENTITY;
  const key_credential = process.env.REACT_APP_API_KEY_CREDENTIAL;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}key_identity=${key_identity}&key_credential=${key_credential}`;
};
const api = (path) =>
  withKeys(`${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`);

const fetchJsonWithProxies = async (finalUrl) => {
  try {
    const viaAllorigins = `https://api.allorigins.win/get?url=${encodeURIComponent(
      finalUrl
    )}`;
    const r1 = await axios.get(viaAllorigins, { timeout: 15000 });
    return JSON.parse(r1.data.contents);
  } catch {}
  try {
    const viaCodetabs = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(
      finalUrl
    )}`;
    const r2 = await axios.get(viaCodetabs, { timeout: 15000 });
    return r2.data;
  } catch {}
  const r3 = await axios.get(finalUrl, { timeout: 15000 });
  return r3.data;
};

/** ====== Small helpers ====== */
const titleOf = (item) =>
  item["o:title"] || item["dcterms:title"]?.[0]?.["@value"] || "ไม่มีชื่อเอกสาร";

const descOf = (item) =>
  item["dcterms:abstract"]?.[0]?.["@value"] ||
  item["dcterms:description"]?.[0]?.["@value"] ||
  "";

const thumbOf = (item) =>
  item?.thumbnail_display_urls?.large ||
  item?.thumbnail_display_urls?.medium ||
  item?.thumbnail_display_urls?.square ||
  null;

const createdOf = (item) => {
  const iso = item?.["o:created"]?.["@value"];
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/** ====== UI Components (Tailwind) ====== */
function SiteHeader({ query, setQuery, onSearch }) {
  return (
  <header className="fixed top-0 left-0 w-full z-50 bg-gradient-to-b from-[#5b4a3e]/80 to-[#5b4a3e]/40 backdrop-blur-lg text-white shadow-md">
    <div className="max-w-7xl mx-auto flex items-center justify-between px-6 sm:px-10 py-5 md:py-6">
      {/* โลโก้ + ชื่อโครงการ */}
      <div className="flex items-center gap-4 md:gap-6">
        {/* โลโก้ซ้าย (SAC) */}
        <img
          src="/assets/logo.png"
          alt="SAC Logo"
          className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/85 p-2 shadow-lg ring-1 ring-white/30"
        />

        {/* ข้อความชื่อโครงการ */}
        <h1 className="text-lg md:text-2xl font-bold tracking-wide drop-shadow-sm">
          The Culture Read @CNX
        </h1>
      </div>

      {/* เมนูหลัก */}
      <nav className="hidden md:flex items-center gap-10 text-sm md:text-base font-medium">
        <a className="hover:text-[#ffb84d] transition">หน้าหลัก</a>
        <a className="hover:text-[#ffb84d] transition">แหล่งข้อมูล</a>
        <a className="hover:text-[#ffb84d] transition">บทความ</a>
        <a className="hover:text-[#ffb84d] transition">กิจกรรม</a>
        <a className="hover:text-[#ffb84d] transition">เกี่ยวกับโครงการ</a>
      </nav>

      {/* เมนูมือถือ */}
      <button className="md:hidden p-3 rounded-lg hover:bg-white/20 transition">
        <span className="material-symbols-outlined text-white text-2xl">menu</span>
      </button>
    </div>
  </header>

  );
}


function Hero({ query, setQuery, onSearch }) {
  // 1) รายการสไลด์ (ใส่ลิงก์รูปจริงของคุณ)
 const slides = [
  { img: "/assets/hero.jpg",  },
  { img: "/assets/hero2.jpeg",  },
  { img: "/assets/hero3.jpg", },
];


  const [index, setIndex] = useState(0);

  // 2) เปลี่ยนสไลด์อัตโนมัติทุก 5 วิ
  useEffect(() => {
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  const current = slides[index];

  return (
    // 3) ทำให้ hero เต็มกว้าง สูงตามที่กำหนด
    <section className="relative w-full h-[520px] md:h-[620px] overflow-hidden">
      {/* รูปพื้นหลังเต็มกว้าง */}
      <img
        src={current.img}
        alt={current.title}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* เลเยอร์ไล่เฉดมืดเพื่อให้อ่านตัวอักษรง่าย */}
      {/*<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />*/}

      {/* 4) กล่องข้อความแบบมีพื้นหลังโปร่งแสง + เบลอเล็กน้อย (อ่านสบายตา) */}
      <div className="relative z-10 h-full flex items-center justify-center px-4">
        <div className="max-w-4xl w-full text-center rounded-2xl shadow-lg p-6 md:p-10">
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white leading-snug">
            {current.title}
          </h1>
          <p className="mt-3 text-base md:text-xl text-gray-800 dark:text-gray-200">
            {current.subtitle}
          </p>

          {/* ช่องค้นหา */}
          <form
            className="mt-6 flex w-full max-w-xl mx-auto"
            onSubmit={(e) => {
              e.preventDefault();
              onSearch?.();
            }}
          >
            <input
              className="flex-1 h-12 md:h-14 px-4 rounded-l-lg border border-gray-300 focus:outline-none"
              placeholder="ค้นหาหนังสือ บทความ หรือคอลเลกชัน..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="ค้นหา"
            />
            <button
              type="submit"
              className="px-5 rounded-r-lg bg-accent text-white font-bold"
            >
              Search
            </button>
          </form>
        </div>

        {/* จุดบอกสถานะสไลด์ */}
        <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <span
              key={i}
              className={`w-3 h-3 rounded-full transition-all ${
                i === index ? "bg-accent scale-110" : "bg-white/60"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}


function Card({ item, onOpen }) {
  const title = titleOf(item);
  const desc = descOf(item);
  const thumb = thumbOf(item);

  return (
    <article className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-lg transition-shadow duration-300">

      <div className="w-full bg-gray-100">
  <div className="relative w-full aspect-[3/4] flex items-center justify-center">
    {thumb ? (
      <img
        src={thumb}
        alt={title}
        className="w-full h-full object-contain"
        loading="lazy"
      />
    ) : (
      <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-100" />
    )}
  </div>
</div>

      <div className="flex flex-col gap-2 p-4 grow">
  <p className="text-primary text-sm font-bold">ข้อความ</p>
  <h3 className="text-[#111518] dark:text-white text-base font-medium font-display leading-snug line-clamp-2">
    {title}
  </h3>
  <span className="text-xs text-gray-500">
    วันที่สร้าง: {createdOf(item)}
  </span>

  <div className="mt-auto pt-2">
    <button
      onClick={() => onOpen(item)}
      className="bg-primary text-white text-sm font-bold px-4 py-2 rounded-lg"
    >
      เปิดอ่าน PDF
    </button>
  </div>
</div>

    </article>
  );
}

function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 sm:px-10 lg:px-40 py-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="size-6 text-primary">
              <svg className="fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
              </svg>
            </div>
            <h3 className="text-[#111518] dark:text-white text-lg font-bold font-display">
              The Culture Read @CNX
            </h3>
          </div>
          <p className="text-[#637c88] dark:text-gray-400 text-sm">
            © 2025 The Culture Read @CNX. All rights reserved.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <h4 className="footer-title">หัวข้อ 1</h4>
          <a className="footer-link" href="/topic/1-1">1.1</a>
          <a className="footer-link" href="/topic/1-2">1.2</a>
          <a className="footer-link" href="/topic/1-3">1.3</a>
        </div>

        <div className="flex flex-col gap-3">
          <h4 className="footer-title">หัวข้อ 2</h4>
          <a className="footer-link" href="/topic/2-1">2.1</a>
          <a className="footer-link" href="/topic/2-2">2.2</a>
        </div>

        <div className="flex flex-col gap-3">
          <h4 className="footer-title">Developers</h4>
          <a className="footer-link flex items-center gap-2" href="/status">
            <span>API Status</span>
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full" />
          </a>
        </div>
      </div>
    </footer>
  );
}

/** ====== App ====== */
export default function App() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      if (
        !process.env.REACT_APP_API_KEY_IDENTITY ||
        !process.env.REACT_APP_API_KEY_CREDENTIAL
      ) {
        throw new Error("API keys not found. Please check your .env file.");
      }
      // ถ้าจะใช้ fulltext จริง ๆ ให้เปลี่ยนเป็น api(`/items?fulltext_search=${encodeURIComponent(query)}`)
      const data = await fetchJsonWithProxies(api("/items"));
      setItems(Array.isArray(data) ? data : []);
      setErr("");
    } catch (e) {
      setErr(e?.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((it) => {
      const t = titleOf(it).toLowerCase();
      const d = descOf(it).toLowerCase();
      return t.includes(q) || d.includes(q);
    });
  }, [items, query]);

  const openPDF = async (item) => {
    try {
      const mediaId = item?.["o:primary_media"]?.["o:id"];
      if (!mediaId) throw new Error("ไม่พบไฟล์หลักของรายการนี้");
      const media = await fetchJsonWithProxies(api(`/media/${mediaId}`));
      const url = media?.["o:original_url"];
      if (!url) throw new Error("ไม่พบ URL ของไฟล์ PDF");
      window.open(url, "_blank");
    } catch (e) {
      alert(e?.message || "เปิดไฟล์ไม่สำเร็จ");
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-[#111518] dark:text-white">
      <SiteHeader query={query} setQuery={setQuery} onSearch={() => {}} />
      <main className="flex-1">
        <Hero query={query} setQuery={setQuery} onSearch={() => {}} />

        <section className="px-4 sm:px-10 lg:px-40">
          <h2 className="section-title">อยู่ในช่วงพัฒนา</h2>

          {loading ? (
            <div className="state">กำลังโหลด…</div>
          ) : err ? (
            <div className="state text-red-500">เกิดข้อผิดพลาด: {err}</div>
          ) : filtered.length === 0 ? (
            <div className="state">ไม่พบรายการ</div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] items-stretch gap-6 p-4">
              {filtered.slice(0, 12).map((item) => (
                <Card key={item["o:id"]} item={item} onOpen={openPDF} />
              ))}
            </div>
          )}
          
        </section>

        {/* หมายเหตุ: Sections "Our Collections" / "Recent Articles" สามารถเชื่อม Omeka S ได้ในขั้นต่อไป */}
      </main>
      <Footer />
    </div>
  );
}
