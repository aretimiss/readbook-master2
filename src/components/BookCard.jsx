// src/components/BookCard.jsx
import React from "react";
import { titleOf, descOf, thumbOf, createdOf } from "../lib/omekaClient";

export default function BookCard({ item, onOpen }) {
  const title = titleOf(item);
  const thumb = thumbOf(item);

  return (
    <article className="flex flex-col h-full bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg transition-shadow">
      <div className="w-full bg-gray-100">
        <div className="relative w-full aspect-[3/4] flex items-center justify-center">
          {thumb ? (
            <img src={thumb} alt={title} className="w-full h-full object-contain" loading="lazy" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-100" />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 p-4 grow">
        <p className="text-primary text-sm font-bold">ข้อความ</p>
        <h3 className="text-[#111518] text-base font-medium leading-snug line-clamp-2">{title}</h3>
        <span className="text-xs text-gray-500">วันที่สร้าง: {createdOf(item)}</span>

        <div className="mt-auto pt-2">
          <button onClick={() => onOpen(item)} className="bg-primary text-white text-sm font-bold px-4 py-2 rounded-lg">
            เปิดอ่าน PDF
          </button>
        </div>
      </div>
    </article>
  );
}
