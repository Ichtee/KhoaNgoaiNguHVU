// Starting data only. db.js copies it into MongoDB once, on an empty database; after that the database is the source of truth.
// An older install kept everything in data/db.json; legacy() still reads that file so nothing the admin typed is lost.
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'data', 'db.json');
const VERSION = 2;

const cat = (slug, name, parent) => (parent ? { slug, name, parent } : { slug, name });

// Order here is the menu order. Top-level first, then its children.
const DEFAULT_CATS = [
  cat('gioi-thieu', 'Giới thiệu'),
  cat('dao-tao', 'Đào tạo'),
  cat('thong-bao-dao-tao', 'Thông báo đào tạo', 'dao-tao'),
  cat('thuc-tap-thuc-te', 'Thực tập – thực tế', 'dao-tao'),
  cat('ngoai-ngu-khong-chuyen', 'Ngoại ngữ không chuyên', 'dao-tao'),
  cat('boi-duong-giao-vien', 'Bồi dưỡng giáo viên', 'dao-tao'),
  cat('nckh', 'NCKH'),
  cat('hoi-thao-seminar', 'Hội thảo – seminar', 'nckh'),
  cat('cong-bo-giang-vien', 'Công bố của giảng viên', 'nckh'),
  cat('nckh-sinh-vien', 'NCKH sinh viên', 'nckh'),
  cat('doan-thanh-nien', 'Đoàn thanh niên'),
  cat('hoat-dong-doan', 'Tin hoạt động', 'doan-thanh-nien'),
  cat('su-kien-phong-trao', 'Sự kiện – phong trào', 'doan-thanh-nien'),
  cat('tinh-nguyen', 'Tình nguyện', 'doan-thanh-nien'),
  cat('cau-lac-bo', 'Câu lạc bộ', 'doan-thanh-nien'),
  cat('hoc-sinh-sinh-vien', 'Học sinh sinh viên'),
  cat('thong-bao-sinh-vien', 'Thông báo sinh viên', 'hoc-sinh-sinh-vien'),
  cat('hoc-bong', 'Học bổng', 'hoc-sinh-sinh-vien'),
  cat('viec-lam-huong-nghiep', 'Việc làm – hướng nghiệp', 'hoc-sinh-sinh-vien'),
  cat('cuoc-thi', 'Cuộc thi', 'hoc-sinh-sinh-vien'),
  cat('guong-mat-sinh-vien', 'Gương mặt sinh viên', 'hoc-sinh-sinh-vien')
];

const UPDATING = 'Thông tin đang được cập nhật.';

// Facts below come from the public pages of hvu.edu.vn (Khoa Tiếng Anh, thông tin tuyển sinh 2026); the faculty should review them.
const DEFAULT_PAGES = {
  'gioi-thieu': {
    title: 'Giới thiệu chung',
    group: 'gioi-thieu',
    content:
      'Khoa Tiếng Anh – Trường Đại học Hùng Vương (Hung Vuong University – English Department) thành lập từ năm 1996.\n\nKhoa đào tạo hai ngành **Sư phạm Tiếng Anh** và **Ngôn ngữ Anh**, đồng thời giảng dạy tiếng Anh, tiếng Nhật, tiếng Hàn cho sinh viên các ngành không chuyên ngữ.',
    files: []
  },
  'lich-su': {
    title: 'Lịch sử hình thành',
    group: 'gioi-thieu',
    content:
      '- **1996**: Khoa được thành lập, thuộc Trường Cao đẳng Sư phạm Phú Thọ.\n- **2003**: Trường được nâng cấp thành Trường Đại học Hùng Vương.',
    files: []
  },
  'chuc-nang-nhiem-vu': {
    title: 'Chức năng – nhiệm vụ',
    group: 'gioi-thieu',
    content: [
      'Khoa Tiếng Anh thực hiện các nhiệm vụ:',
      '',
      '- Đào tạo ngành Sư phạm Tiếng Anh và Ngôn ngữ Anh.',
      '- Giảng dạy tiếng Anh, tiếng Nhật, tiếng Hàn cho các hệ không chuyên ngữ ở bậc đại học và sau đại học.',
      '- Tổ chức các hoạt động giáo dục khác như nghiệp vụ sư phạm và thực tập chuyên môn.',
      '- Bồi dưỡng giáo viên ngoại ngữ cho các trường phổ thông.',
      '- Tham gia Đề án Ngoại ngữ Quốc gia.',
      '- Tham gia xây dựng chương trình và biên soạn sách giáo khoa tiếng Anh phổ thông khi được giao.'
    ].join('\n'),
    files: []
  },
  'ban-chu-nhiem': {
    title: 'Ban chủ nhiệm khoa',
    group: 'gioi-thieu',
    content: [
      '| Chức vụ | Họ và tên |',
      '|---|---|',
      '| Trưởng khoa | TS. Vũ Thị Quỳnh Dung |',
      '| Phó trưởng khoa | ThS. Nguyễn Thị Thu Hằng |',
      '| Phó trưởng khoa | TS. Nguyễn Thị Tố Loan |'
    ].join('\n'),
    files: []
  },
  'co-cau-bo-mon': { title: 'Cơ cấu – bộ môn', group: 'gioi-thieu', content: UPDATING, files: [] },
  'doi-ngu-giang-vien': { title: 'Đội ngũ giảng viên', group: 'gioi-thieu', content: UPDATING, files: [] },
  'lien-he': {
    title: 'Liên hệ',
    group: 'gioi-thieu',
    content: [
      '- **Địa chỉ**: Phường Nông Trang, Việt Trì, Phú Thọ',
      '- **Điện thoại khoa**: 0210 3710 249',
      '- **Email khoa**: khoangoaingu@hvu.edu.vn',
      '- **Facebook**: [Khoa Tiếng Anh - HVU](https://www.facebook.com/profile.php?id=61584171670477)',
      '- **Tư vấn tuyển sinh**: 0866 993 468 – tuyensinh@hvu.edu.vn'
    ].join('\n'),
    files: []
  },
  'nganh-su-pham-tieng-anh': {
    title: 'Ngành Sư phạm Tiếng Anh',
    group: 'dao-tao',
    content: [
      'Chương trình đào tạo giáo viên tiếng Anh.',
      '',
      '- **Mã ngành**: 7140231',
      '- **Chỉ tiêu 2026**: 80',
      '- **Tổ hợp xét tuyển**: D01, D14, D15, X78',
      '- **Đối tượng**: thí sinh thường trú tại tỉnh Phú Thọ (trừ trường hợp có đặt hàng hoặc đấu thầu từ tỉnh khác)',
      '',
      'Chương trình đào tạo của trường: [hvu.edu.vn – Chương trình đào tạo](https://www.hvu.edu.vn/thong-tin/dao-tao/chuong-trinh-dao-tao.hvu)'
    ].join('\n'),
    files: []
  },
  'nganh-ngon-ngu-anh': {
    title: 'Ngành Ngôn ngữ Anh',
    group: 'dao-tao',
    content: [
      '- **Mã ngành**: 7220201',
      '- **Chỉ tiêu 2026**: 270',
      '- **Tổ hợp xét tuyển**: D01, D14, D15, X78',
      '- **Đối tượng**: tuyển sinh toàn quốc',
      '',
      'Chương trình đào tạo của trường: [hvu.edu.vn – Chương trình đào tạo](https://www.hvu.edu.vn/thong-tin/dao-tao/chuong-trinh-dao-tao.hvu)'
    ].join('\n'),
    files: []
  },
  'tuyen-sinh': {
    title: 'Tuyển sinh 2026',
    group: 'dao-tao',
    content: [
      '| Ngành | Mã ngành | Chỉ tiêu | Tổ hợp xét tuyển |',
      '|---|---|---|---|',
      '| Sư phạm Tiếng Anh | 7140231 | 80 | D01, D14, D15, X78 |',
      '| Ngôn ngữ Anh | 7220201 | 270 | D01, D14, D15, X78 |',
      '',
      'D01: Anh, Văn, Toán. D14: Anh, Văn, Sử. D15: Anh, Văn, Địa. X78: Anh, Văn, Giáo dục kinh tế và pháp luật.',
      '',
      '## Phương thức xét tuyển',
      '',
      '- **TS01**: kết quả thi tốt nghiệp THPT 2026.',
      '- **TS02**: kết quả học tập cấp THPT (học bạ).',
      '- **TS03**: học bạ kết hợp chứng chỉ quốc tế.',
      '- **TS06**: xét tuyển thẳng và ưu tiên xét tuyển.',
      '- **TS07**: học sinh hoàn thành dự bị đại học và cử tuyển.',
      '',
      '## Ngưỡng đầu vào (xét học bạ – TS02)',
      '',
      '- **Sư phạm Tiếng Anh**: học lực lớp 12 đạt giỏi trở lên và tổng điểm 3 môn thi tốt nghiệp từ 18,00, hoặc điểm xét tốt nghiệp THPT từ 8,50.',
      '- **Ngôn ngữ Anh**: điểm trung bình 3 năm lớp 10–12 của 3 môn trong tổ hợp (đã cộng điểm ưu tiên) từ 18,0 và tổng điểm 3 môn thi tốt nghiệp tối thiểu 15,00.',
      '',
      '## Quy đổi chứng chỉ IELTS (TS03)',
      '',
      '| IELTS | 7.0 trở lên | 6.5 | 6.0 | 5.5 | 5.0 |',
      '|---|---|---|---|---|---|',
      '| Điểm quy đổi (thang 10) | 10 | 9,5 | 9,0 | 8,5 | 8,0 |',
      '',
      'Đăng ký nguyện vọng trên hệ thống của Bộ GD&ĐT từ 02/7 đến 14/7. Tư vấn: 0866 993 468 – tuyensinh@hvu.edu.vn.',
      '',
      'Thông tin theo [thông báo tuyển sinh năm 2026 của Trường](https://www.hvu.edu.vn/tin-tuc/thong-tin-tuyen-sinh-nam-2026/1773029218.hvu). Thí sinh cần đối chiếu thông báo chính thức.'
    ].join('\n'),
    files: []
  },
  'bieu-mau': {
    title: 'Biểu mẫu',
    group: 'hoc-sinh-sinh-vien',
    content: 'Các biểu mẫu dành cho sinh viên được đăng ở mục tệp đính kèm bên dưới.',
    files: []
  }
};

const iso = (daysAgo) => new Date(Date.now() - daysAgo * 864e5).toISOString();

const seed = () => ({
  version: VERSION,
  categories: DEFAULT_CATS,
  pages: DEFAULT_PAGES,
  posts: [
    ['thong-bao-dao-tao', 'Thông báo mẫu: lịch học học kỳ mới', true],
    ['thong-bao-dao-tao', 'Thông báo mẫu: đăng ký học phần', false],
    ['hoi-thao-seminar', 'Bài mẫu: hội thảo nghiên cứu khoa học cấp khoa', true],
    ['hoat-dong-doan', 'Bài mẫu: hoạt động chào đón tân sinh viên K23', true],
    ['hoc-bong', 'Bài mẫu: thông tin học bổng và câu lạc bộ', false]
  ].map(([category, title, isFeatured], i) => ({
    id: `seed-${i}`,
    slug: `bai-mau-${i + 1}`,
    title,
    excerpt: 'Đây là bài viết mẫu. Hãy đăng nhập trang Quản trị để sửa hoặc xóa.',
    content: 'Đây là bài viết mẫu.\n\nHãy đăng nhập trang Quản trị để sửa hoặc xóa bài này và đăng thông tin thật của khoa.',
    coverImage: '',
    category,
    isFeatured,
    pinned: false,
    pinnedUntil: '',
    files: [],
    createdAt: iso(i)
  }))
});

// Text the first release put in the intro page; replaced only if the admin never edited it.
const OLD_INTRO =
  'Khoa Tiếng Anh – Trường Đại học Hùng Vương (Hung Vuong University – English Department), thành lập từ năm 1996.\n\n[Admin: vào trang Quản trị > Giới thiệu chung để thay bằng nội dung thật về lịch sử, cơ cấu tổ chức, đội ngũ giảng viên và các ngành đào tạo của khoa.]';

// Adds the new menu structure to a v1 file without touching posts or anything the admin edited.
function migrate(db) {
  const have = new Map(db.categories.map((c) => [c.slug, c]));
  const known = new Set(DEFAULT_CATS.map((c) => c.slug));
  db.categories = [...DEFAULT_CATS.map((c) => have.get(c.slug) || c), ...db.categories.filter((c) => !known.has(c.slug))];

  const pages = {};
  for (const [slug, p] of Object.entries(DEFAULT_PAGES)) pages[slug] = db.pages[slug] ? { group: p.group, files: [], ...db.pages[slug] } : p;
  for (const [slug, p] of Object.entries(db.pages)) if (!pages[slug]) pages[slug] = p;
  if (pages['gioi-thieu'].content === OLD_INTRO) pages['gioi-thieu'].content = DEFAULT_PAGES['gioi-thieu'].content;
  db.pages = pages;

  db.version = VERSION;
  return db;
}

const DEFAULT_SETTINGS = {
  name: 'Khoa Tiếng Anh',
  university: 'Trường Đại học Hùng Vương',
  tagline: 'English Department, từ năm 1996',
  address: 'Phường Nông Trang, Việt Trì, Phú Thọ',
  phone: '0210 3710 249',
  email: 'khoangoaingu@hvu.edu.vn',
  facebook: 'https://www.facebook.com/profile.php?id=61584171670477',
  website: 'https://www.hvu.edu.vn'
};

// the data of an older install, upgraded to the current shape, or null when there is none
function legacy() {
  if (!fs.existsSync(FILE)) return null;
  const db = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  return db.version === VERSION ? db : migrate(db);
}

// after a successful import, so an emptied database is never silently refilled from stale data
function archiveLegacy() {
  if (fs.existsSync(FILE)) fs.renameSync(FILE, FILE.replace(/\.json$/, '.imported.json'));
}

module.exports = { seed, legacy, archiveLegacy, DEFAULT_SETTINGS };
