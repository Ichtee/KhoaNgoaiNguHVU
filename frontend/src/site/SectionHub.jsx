import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { api } from '../api';
import { EditPin, MoveButtons, useAdmin, useAdminAction, useHere } from './admin/OnSite';
import { editPageHref, menuHref, newPageHref } from './admin/links';
import { move } from './admin/order';
import {
  ArrowRight, BookOpen, ClipboardList, FileText, GraduationCap, History, Info, Mail, MapPin, Network, Phone, Target, Users
} from 'lucide-react';

// an icon that fits the page title; anything unknown gets a plain document
const ICONS = [
  [/lịch sử|hình thành/i, History],
  [/chức năng|nhiệm vụ/i, Target],
  [/ban chủ nhiệm|lãnh đạo/i, Users],
  [/cơ cấu|bộ môn|tổ chức/i, Network],
  [/giảng viên|đội ngũ/i, GraduationCap],
  [/liên hệ/i, Phone],
  [/giới thiệu/i, Info],
  [/ngành|chương trình/i, BookOpen],
  [/tuyển sinh/i, ClipboardList]
];
export const iconFor = (title) => (ICONS.find(([rx]) => rx.test(title)) || [, FileText])[1];

// markdown -> one line of plain text for a card.
// List items and paragraphs become sentences; a table row becomes "Trưởng khoa: TS. …" (its header row is dropped).
export function plain(md) {
  const out = [];
  let inTable = false;
  for (const raw of (md || '').split('\n')) {
    const line = raw.trim();
    if (line.startsWith('|')) {
      if (/^\|[\s:|-]+\|?$/.test(line)) continue; // divider row
      if (!inTable) { inTable = true; continue; } // header row
      const [first, ...rest] = line.split('|').map((c) => c.trim()).filter(Boolean);
      out.push(rest.length ? `${first}: ${rest.join(', ')}` : first);
      continue;
    }
    inTable = false;
    const text = line
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/^([-*+]|\d+\.)\s+/, '')
      .replace(/[#*_>`]/g, '')
      .trim();
    if (text) out.push(text);
  }
  // each piece reads as its own sentence
  return out.map((s) => (/[.!?:…]$/.test(s) ? s : `${s}.`)).join(' ');
}

// Contact details from the site settings; shown where a section would otherwise end early.
export function ContactCard({ site, title = 'Liên hệ khoa' }) {
  const rows = [
    [MapPin, site.address],
    [Phone, site.phone && <a href={`tel:${site.phone.replace(/\s/g, '')}`}>{site.phone}</a>],
    [Mail, site.email && <a href={`mailto:${site.email}`}>{site.email}</a>]
  ].filter(([, v]) => v);
  if (!rows.length) return null;
  return (
    <div className="contact-card">
      <h2>{title}</h2>
      <ul>
        {rows.map(([Icon, value], k) => (
          <li key={k}><Icon size={18} aria-hidden="true" /> <span>{value}</span></li>
        ))}
      </ul>
    </div>
  );
}

// The landing view of a section that holds fixed pages (Giới thiệu, Đào tạo…): a banner, one card per page, and contact details.
export default function SectionHub({ cat, pages, site, showContact }) {
  const { reload } = useOutletContext();
  const here = useHere();
  const act = useAdminAction();
  const { admin } = useAdmin();
  const movePage = (i, dir) => {
    const next = move(pages.map((p) => p.slug), i, dir);
    if (next) act(async () => { await api.reorderPages(next); await reload(); });
  };
  return (
    <>
      <section className={site.heroImage ? 'banner photo' : 'banner'} style={site.heroImage ? { '--hero': `url(${JSON.stringify(site.heroImage)})` } : undefined}>
        <div className="banner-in">
          <p className="eyebrow">{site.name}</p>
          <h1>{cat.name}</h1>
          {cat.description ? <p>{cat.description}</p> : (site.university || site.tagline) && <p>{[site.university, site.tagline].filter(Boolean).join(' · ')}</p>}
          {admin && <p className="banner-tools"><EditPin to={menuHref(here)} label="Sửa tên, mô tả mục" className="on-dark" /> <EditPin to={newPageHref(cat.slug, here)} label="+ Thêm trang vào mục này" className="on-dark" /></p>}
        </div>
      </section>

      <ul className="hub">
        {pages.map((p, i) => {
          const Icon = iconFor(p.title);
          return (
            <li key={p.slug} className="hub-item">
              <Link to={`/trang/${p.slug}`} className="hub-card">
                <span className="hub-icon"><Icon size={22} aria-hidden="true" /></span>
                <h2>{p.title}</h2>
                <span className="hub-more"><span className="hub-more-text">Xem chi tiết</span> <ArrowRight size={16} aria-hidden="true" /></span>
              </Link>
              <span className="hub-tools">
                <EditPin to={editPageHref(p.slug, here)} />
                <MoveButtons index={i} count={pages.length} onMove={(dir) => movePage(i, dir)} label={p.title} />
              </span>
            </li>
          );
        })}
      </ul>

      {/* a "Liên hệ" page among the cards already gives these details */}
      {showContact && !pages.some((p) => /liên hệ/i.test(p.title)) && <ContactCard site={site} />}
    </>
  );
}
