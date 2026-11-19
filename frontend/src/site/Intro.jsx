import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { api } from '../api';
import { Markdown } from './parts';

export default function Intro() {
  const { site } = useOutletContext();
  const [page, setPage] = useState(null);

  useEffect(() => {
    api.page('gioi-thieu').then(setPage).catch(() => setPage({ title: 'Giới thiệu chung', content: 'Không tải được nội dung.' }));
  }, []);

  const rows = [
    ['Địa chỉ', site.address],
    ['Điện thoại', site.phone],
    ['Email', site.email && <a href={`mailto:${site.email}`}>{site.email}</a>],
    ['Facebook', site.facebook && <a href={site.facebook} target="_blank" rel="noreferrer">{site.name}</a>]
  ].filter(([, value]) => value);

  return (
    <div className="about">
      <div>
        <h2 className="label">{page?.title || 'Giới thiệu chung'}</h2>
        <Markdown>{page ? page.content : 'Đang tải…'}</Markdown>
        <Link className="more" to="/muc/gioi-thieu">Xem thêm về khoa →</Link>
      </div>
      <div>
        <h2 className="label">Liên hệ</h2>
        <dl className="contact">
          {rows.map(([label, value]) => (
            <React.Fragment key={label}><dt>{label}</dt><dd>{value}</dd></React.Fragment>
          ))}
        </dl>
      </div>
    </div>
  );
}
