import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import "./App.css";

/** ====== ENV & URL helpers ====== */
const RAW_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  "https://z277970-rr25o5.ps07.zwhhosting.com/omekas/api";
const BASE_URL = RAW_BASE.replace(/\/+$/, "");

const withKeys = (url) => {
  const key_identity = process.env.REACT_APP_API_KEY_IDENTITY;
  const key_credential = process.env.REACT_APP_API_KEY_CREDENTIAL;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}key_identity=${key_identity}&key_credential=${key_credential}`;
};
const api = (path) => withKeys(`${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`);

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
  item["o:title"] ||
  item["dcterms:title"]?.[0]?.["@value"] ||
  "ไม่มีชื่อเอกสาร";

const descOf = (item) =>
  item["dcterms:abstract"]?.[0]?.["@value"] ||
  item["dcterms:description"]?.[0]?.["@value"] ||
  "";

const thumbOf = (item) =>
  item?.thumbnail_display_urls?.medium ||
  item?.thumbnail_display_urls?.large ||
  item?.thumbnail_display_urls?.square ||
  null;

const createdOf = (item) => {
  const iso = item?.["o:created"]?.["@value"];
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
};

/** ====== Components ====== */
function Header({ query, setQuery, onSearch }) {
  return (
    <header className="nl-header">
      <div className="nl-header__brand">
        <div className="nl-logo-circle" />
        <div className="nl-brand-text">
          <div className="nl-brand-title">The Culture Read @CNX</div>
          <div className="nl-brand-sub">The Culture Read @CNX</div>
        </div>
      </div>

      <form
        className="nl-search"
        onSubmit={(e) => {
          e.preventDefault();
          onSearch?.();
        }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ค้นหา…"
          aria-label="ค้นหา"
        />
        <button type="submit" aria-label="ค้นหา">🔍</button>
      </form>
    </header>
  );
}

const NavBar = () => (
  <nav className="nl-navbar">
    <button className="nl-navlink" type="button">Browse Items</button>
    <button className="nl-navlink" type="button">Browse Collections</button>
  </nav>
);

function ItemCard({ item, onOpen }) {
  const title = titleOf(item);
  const desc = descOf(item);
  const thumb = thumbOf(item);
  return (
    <article className="nl-card">
      {thumb ? (
        <img
          src={thumb}
          alt={title}
          className="nl-card__thumb"
          loading="lazy"
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
      ) : (
        <div className="nl-card__thumb nl-card__thumb--placeholder" />
      )}

      <h3 className="nl-card__title" title={title}>{title}</h3>
      {desc && <p className="nl-card__excerpt">{desc}</p>}

      <div className="nl-card__meta">
        <span>วันที่สร้าง: {createdOf(item)}</span>
      </div>

      <div className="nl-card__actions">
        <button onClick={() => onOpen(item)} className="nl-btn">เปิดอ่าน PDF</button>
      </div>
    </article>
  );
}

export default function App() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      if (!process.env.REACT_APP_API_KEY_IDENTITY || !process.env.REACT_APP_API_KEY_CREDENTIAL) {
        throw new Error("API keys not found. Please check your .env file.");
      }
      // ถ้าต้องการใช้ fulltext ของ Omeka S จริง ๆ เปลี่ยนเป็น `api('/items?fulltext_search=' + encodeURIComponent(query))`
      const data = await fetchJsonWithProxies(api("/items"));
      setItems(Array.isArray(data) ? data : []);
      setErr("");
    } catch (e) {
      setErr(e?.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  // ค้นหาแบบ client-side (ง่ายและเร็ว)
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
    <div className="nl-root">
      <Header query={query} setQuery={setQuery} onSearch={() => { /* client filter */ }} />
      <NavBar />

      <main className="nl-main">
        <h2 className="nl-section-title">รายการเนื้อหา</h2>

        {loading ? (
          <div className="nl-state">กำลังโหลด…</div>
        ) : err ? (
          <div className="nl-error">เกิดข้อผิดพลาด: {err}</div>
        ) : filtered.length === 0 ? (
          <div className="nl-state">ไม่พบรายการ</div>
        ) : (
          <section className="nl-grid">
            {filtered.map((item) => (
              <ItemCard key={item["o:id"]} item={item} onOpen={openPDF} />
            ))}
          </section>
        )}
      </main>

      <footer className="nl-footer">
        <small>© Digital Library · Omeka S API</small>
      </footer>
    </div>
  );
}
