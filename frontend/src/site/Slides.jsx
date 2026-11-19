import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { fmtDate } from '../api';
import { Cover } from './parts';

// Featured posts as a swipeable carousel: CSS scroll-snap does the sliding, JS only adds buttons and autoplay.
// `tools(post)` = the admin's buttons for the slide on screen (nothing for visitors)
export default function Slides({ posts, cats, tools }) {
  const track = useRef(null);
  const [cur, setCur] = useState(0);
  const [paused, setPaused] = useState(false); // the pause button
  const [hold, setHold] = useState(false); // mouse over or keyboard focus inside
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const many = posts.length > 1;

  const go = (k) => {
    const t = track.current;
    const n = (k + posts.length) % posts.length;
    t.scrollTo({ left: n * t.clientWidth, behavior: calm ? 'auto' : 'smooth' });
  };
  const step = (d) => go(Math.round(track.current.scrollLeft / track.current.clientWidth) + d);

  useEffect(() => {
    if (!many || paused || hold || calm) return;
    const id = setInterval(() => document.hidden || step(1), 7000);
    return () => clearInterval(id);
  }, [many, paused, hold, calm]);

  return (
    <div
      className="slides"
      role="region"
      aria-roledescription="carousel"
      aria-label="Tin nổi bật"
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setHold(false)}
    >
      <div className="track" ref={track} onScroll={(e) => setCur(Math.round(e.target.scrollLeft / e.target.clientWidth))}>
        {posts.map((p, k) => {
          const cat = cats.find((c) => c.slug === p.category);
          return (
            <Link key={p.id} className="lead" to={`/bai-viet/${p.slug}`} aria-roledescription="slide" aria-label={`${k + 1} / ${posts.length}: ${p.title}`}>
              <Cover post={p} />
              {/* laid over the bottom of the photo on wide screens, under it on phones */}
              <span className="lead-text">
                {cat && <span className="cat">{cat.name}</span>}
                <h2>{p.title}</h2>
                {p.excerpt && <p>{p.excerpt}</p>}
                <time className="date">{fmtDate(p.createdAt)}</time>
              </span>
            </Link>
          );
        })}
      </div>
      {tools?.(posts[Math.min(cur, posts.length - 1)])}
      {many && (
        <div className="ctrl">
          <button aria-label="Tin trước" onClick={() => step(-1)}><ChevronLeft size={20} /></button>
          {posts.map((p, k) => (
            <button key={p.id} className="dot" aria-label={`Tin ${k + 1}`} aria-current={k === cur} onClick={() => go(k)} />
          ))}
          <button aria-label="Tin sau" onClick={() => step(1)}><ChevronRight size={20} /></button>
          {!calm && (
            <button aria-label={paused ? 'Tự chuyển tin' : 'Dừng tự chuyển'} onClick={() => setPaused(!paused)}>
              {paused ? <Play size={18} /> : <Pause size={18} />}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
