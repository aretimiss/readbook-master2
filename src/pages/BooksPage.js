import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";

/** ====== ENV & URL helpers (ยกมาจากไฟล์หลักของคุณ) ====== */
const RAW_BASE = process.env.REACT_APP_API_BASE_URL || "";
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
    const viaAllorigins = `https://api.allorigins.win/get?url=${encodeURIComponent(finalUrl)}`;
    const r1 = await axios.get(viaAllorigins, { timeout: 15000 });
    return JSON.parse(r1.data.contents);
  } catch {}
  try {
    const viaCodetabs = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(finalUrl)}`;
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

/** ====== UI bits ====== */
function Breadcrumb() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 text-sm text-[#a36a46]">
      <a href="/" className="hover:underline">หน้าหลัก</a> <span className="mx-2">/</span> <span>เอกสารตัวเขียน</span>
    </div>
  );
}

function FilterSection({ title, values, selected, onToggle }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-[#d8653b] text-white rounded-md overflow-hidden mb-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 font-semibold"
      >
        <span>{title}</span>
        <span className="material-symbols-outlined">{open ? "expand_less" : "expand_more"}</span>
      </button>
      {open && (
        <div className="bg-white text-[#5b4a3e] max-h-80 overflow-auto">
          {values.map((v) => (
            <button
              key={v.name}
              onClick={() => onToggle(v.name)}
              className={`w-full flex items-center justify-between px-4 py-2 text-sm border-t border-[#f1e9de] hover:bg-[#fff7ef] ${
                selected.has(v.name) ? "text-[#d8653b] font-semibold" : ""
              }`}
            >
              <span className="truncate">{v.name}</span>
              <span className="ml-2">{v.count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BookCard({ item, onOpen }) {
  const title = titleOf(item);
  const desc = descOf(item);
  const thumb = thumbOf(item);
  return (
    <article className="flex flex-col h-full bg-[#fffdf6] border border-[#f1e9de] rounded-md shadow-sm">
      <div className="w-full bg-[#eee2d3]">
        <div className="relative w-full aspect-[4/3] flex items-center justify-center">
          {thumb ? (
            <img src={thumb} alt={title} className="w-full h-full object-contain" loading="lazy" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#efe7db] to-[#faefe1]" />
          )}
        </div>
      </div>
      <div className="p-4 flex flex-col gap-2">
        <h3 className="text-[#5b4a3e] font-semibold leading-snug">{title}</h3>
        <div className="text-xs text-[#a36a46]">วันที่สร้าง: {createdOf(item)}</div>
        <p className="text-sm text-[#6c5b4a] line-clamp-3">{desc}</p>
        <div className="mt-2">
          <button
            onClick={() => onOpen(item)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-[#d8653b] text-white text-sm font-semibold hover:bg-[#c85a32]"
          >
            เปิดอ่าน PDF
            <span className="material-symbols-outlined text-base">picture_as_pdf</span>
          </button>
        </div>
      </div>
    </article>
  );
}

function Pagination({ total, page, perPage, onPage }) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  const window = 6;
  let start = Math.max(1, page - 2);
  let end = Math.min(pages, start + window - 1);
  if (end - start + 1 < window) start = Math.max(1, end - window + 1);

  const nums = [];
  for (let i = start; i <= end; i++) nums.push(i);

  return (
    <div className="flex items-center justify-center gap-2 py-6">
      <button
        className="px-3 py-1.5 border border-[#f1e9de] rounded hover:bg-[#fff7ef]"
        onClick={() => onPage(Math.max(1, page - 1))}
        disabled={page === 1}
      >
        {"<"}
      </button>
      {nums.map((n) => (
        <button
          key={n}
          className={`px-3 py-1.5 border rounded ${
            n === page
              ? "bg-[#d8653b] border-[#d8653b] text-white"
              : "border-[#f1e9de] hover:bg-[#fff7ef]"
          }`}
          onClick={() => onPage(n)}
        >
          {n}
        </button>
      ))}
      <button
        className="px-3 py-1.5 border border-[#f1e9de] rounded hover:bg-[#fff7ef]"
        onClick={() => onPage(Math.min(pages, page + 1))}
        disabled={page === pages}
      >
        {">"}
      </button>
    </div>
  );
}

/** ====== หน้า Books (รวมหนังสือ) ====== */
export default function BooksPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [query, setQuery] = useState("");

  // filter states
  const [facetCat, setFacetCat] = useState(new Set());      // หมวด/ประเภท
  const [facetLang, setFacetLang] = useState(new Set());    // ภาษา
  const [facetSource, setFacetSource] = useState(new Set()); // แหล่งข้อมูล

  // pagination
  const [page, setPage] = useState(1);
  const perPage = 9;

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await fetchJsonWithProxies(api("/items"));
        setItems(Array.isArray(data) ? data : []);
        setErr("");
      } catch (e) {
        setErr(e?.message || "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // สร้าง “facets” แบบ client-side จากข้อมูล (อิง property ทั่วไปของ Omeka S)
  const facets = useMemo(() => {
    const catMap = new Map();
    const langMap = new Map();
    const srcMap = new Map();

    for (const it of items) {
      // ประเภท/สาขาความรู้ (ลองดึงจาก subject หรือ type)
      const cats =
        (it["dcterms:subject"] || [])
          .map((x) => x?.["o:label"] || x?.["@value"])
          .filter(Boolean) ||
        [];
      cats.forEach((c) => catMap.set(c, (catMap.get(c) || 0) + 1));

      // ภาษา
      const langs =
        (it["dcterms:language"] || [])
          .map((x) => x?.["o:label"] || x?.["@value"])
          .filter(Boolean) || [];
      langs.forEach((l) => langMap.set(l, (langMap.get(l) || 0) + 1));

      // แหล่งข้อมูล
      const srcs =
        (it["dcterms:source"] || [])
          .map((x) => x?.["o:label"] || x?.["@value"])
          .filter(Boolean) || [];
      srcs.forEach((s) => srcMap.set(s, (srcMap.get(s) || 0) + 1));
    }

    const toList = (m) =>
      Array.from(m.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    return {
      categories: toList(catMap),
      languages: toList(langMap),
      sources: toList(srcMap),
    };
  }, [items]);

  // คัดกรองผลลัพธ์
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      const t = titleOf(it).toLowerCase();
      const d = descOf(it).toLowerCase();
      const subject = (it["dcterms:subject"] || []).map(
        (x) => (x?.["o:label"] || x?.["@value"] || "").toLowerCase()
      );
      const langs = (it["dcterms:language"] || []).map(
        (x) => (x?.["o:label"] || x?.["@value"] || "").toLowerCase()
      );
      const srcs = (it["dcterms:source"] || []).map(
        (x) => (x?.["o:label"] || x?.["@value"] || "").toLowerCase()
      );

      const queryOk = !q || t.includes(q) || d.includes(q);

      const catOk =
        facetCat.size === 0 ||
        subject.some((s) => facetCat.has(s) || facetCat.has(s.toLowerCase()));

      const langOk =
        facetLang.size === 0 ||
        langs.some((l) => facetLang.has(l) || facetLang.has(l.toLowerCase()));

      const srcOk =
        facetSource.size === 0 ||
        srcs.some((s) => facetSource.has(s) || facetSource.has(s.toLowerCase()));

      return queryOk && catOk && langOk && srcOk;
    });
  }, [items, query, facetCat, facetLang, facetSource]);

  // สลับเลือกใน facet
  const toggleSet = (set, setSet, name) => {
    const next = new Set(set);
    const key = (name || "").toLowerCase();
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSet(next);
    setPage(1);
  };

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

  // แบ่งหน้า
  const total = filtered.length;
  const start = (page - 1) * perPage;
  const paged = filtered.slice(start, start + perPage);

  return (
  <div className="min-h-screen bg-[#fbf6ed] text-[#5b4a3e]">
    {/* Header ติดบนสุด */}
    <SiteHeader />
    {/* spacer กันเนื้อหาถูกทับ (ความสูงควรเท่าความสูง header ของคุณ) */}
    <div className="h-[88px]" />

    {/* HERO + กล่องค้นหา */}
    <section className="relative w-full h-[360px] md:h-[420px] overflow-hidden">
      <img
        src="/assets/hero-books.jpg"
        alt="banner"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative z-10 h-full flex items-center justify-center">
        <form
          className="flex w-[90%] max-w-2xl"
          onSubmit={(e) => { e.preventDefault(); setPage(1); }}
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 h-12 md:h-14 px-4 rounded-l-full bg-white/95 focus:outline-none"
            placeholder="ค้นหาเอกสารตัวเขียน…"
          />
          <button type="submit" className="px-5 md:px-6 rounded-r-full bg-[#f08a24] text-white font-bold">
            ค้นหา
          </button>
        </form>
      </div>
    </section>

      <Breadcrumb />

      {/* ชื่อหน้า + จำนวนผลลัพธ์ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <h1 className="text-2xl md:text-3xl text-center font-semibold text-[#5b4a3e]">
          เอกสารตัวเขียน
        </h1>
        <div className="mt-2 text-center text-sm text-[#8e6f5a]">
          พบผลลัพธ์ทั้งหมด {total.toLocaleString("th-TH")} รายการ
        </div>
      </div>

      {/* เนื้อหาหลัก: sidebar + grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-6 grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-6">
        {/* SIDEBAR */}
        <aside className="order-2 lg:order-1">
          <FilterSection
            title="ประเภทเอกสาร"
            values={facets.categories}
            selected={facetCat}
            onToggle={(name) => toggleSet(facetCat, setFacetCat, name)}
          />
          <FilterSection
            title="ภาษา"
            values={facets.languages}
            selected={facetLang}
            onToggle={(name) => toggleSet(facetLang, setFacetLang, name)}
          />
          <FilterSection
            title="แหล่งข้อมูล"
            values={facets.sources}
            selected={facetSource}
            onToggle={(name) => toggleSet(facetSource, setFacetSource, name)}
          />
        </aside>

        {/* GRID */}
        <section className="order-1 lg:order-2">
          {loading ? (
            <div className="py-20 text-center">กำลังโหลด…</div>
          ) : err ? (
            <div className="py-20 text-center text-red-600">เกิดข้อผิดพลาด: {err}</div>
          ) : paged.length === 0 ? (
            <div className="py-20 text-center">ไม่พบรายการที่ตรงกับเงื่อนไข</div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {paged.map((it) => (
                  <BookCard key={it["o:id"]} item={it} onOpen={openPDF} />
                ))}
              </div>
              <Pagination
                total={total}
                page={page}
                perPage={perPage}
                onPage={(p) => setPage(p)}
              />
            </>
          )}
        </section>
      </div>
    <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-6 grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-6">
    </div>
    
    <Footer />
  </div>
  );
}
