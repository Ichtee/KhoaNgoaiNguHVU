# Quản trị ngay trên website

Ngày: 2026-11-19 · Trạng thái: **đề xuất, chờ duyệt**

## Mục đích

Admin đã đăng nhập thì đi xem bất kỳ trang nào của website cũng **thấy và sửa được mọi thứ trên trang đó ngay tại chỗ đang xem**, giống chủ trang Facebook thấy nút sửa trên trang của mình. Không phải nhớ "cái này sửa ở mục nào trong /quan-tri". Người xem bình thường không thấy gì khác.

Trang `/quan-tri` vẫn giữ, làm nơi xem danh sách, tìm kiếm, xóa hàng loạt; còn việc sửa từng thứ thì vào được từ chính trang ngoài.

## Cách hoạt động chung

1. **Thanh quản trị** mỏng trên cùng mọi trang (chỉ khi đã đăng nhập):
   `Đang xem với quyền quản trị · ⚙ Trang quản trị · + Viết bài · + Trang mới · Đăng xuất`
2. **Nút ✎ trên từng phần** của trang: nhỏ, góc trên-phải của phần đó, hiện rõ khi rê chuột/chạm; trên điện thoại luôn hiện.
3. Bấm ✎ → mở **đúng màn hình sửa** của thứ đó (màn hình dạng bài viết đã làm). **Lưu xong quay về đúng trang đang xem**, thấy ngay thay đổi. Hủy cũng quay về.
4. Các thao tác nhanh không cần mở màn hình sửa thì làm ngay tại chỗ: bật/tắt **★ nổi bật**, **📌 ghim**, **↑↓ đổi thứ tự**.

## Từng trang và admin quản lý gì

### Phần chung mọi trang (đầu trang + chân trang)
| Phần | Nút | Mở ra |
|---|---|---|
| Logo, tên khoa, tên trường | ✎ | Thông tin khoa |
| Menu (mục lớn, mục con, trang cố định trong menu) | ✎ Sửa menu | **Mới:** màn hình menu: thêm/đổi tên/xóa mục, **kéo hoặc ↑↓ để đổi thứ tự**, chọn trang nào hiện trong menu của mục nào |
| Chân trang: liên hệ, Facebook, website trường | ✎ | Thông tin khoa |

### Trang chủ `/`
| Phần | Nút | Mở ra |
|---|---|---|
| Khối đầu (ảnh nền, logo, tên, mô tả, 2 nút) | ✎ | Thông tin khoa (ảnh nền, logo, dòng mô tả) |
| Thông báo quan trọng | 📌 bỏ ghim trên từng dòng; ✎ trên từng bài | bỏ ghim tại chỗ / sửa bài |
| Trình chiếu bài nổi bật | ✎ Sửa bài này (bài đang hiện); ★ Chọn bài nổi bật | sửa bài / **Mới:** hộp chọn tối đa 5 bài nổi bật, tích/bỏ tích tại chỗ |
| Tin mới | ✎ trên từng dòng | sửa bài |
| Các cột chuyên mục | ✎ trên từng bài; ↑↓ đổi thứ tự cột | sửa bài / thứ tự theo menu |
| Giới thiệu chung + Liên hệ | ✎ | sửa trang "Giới thiệu chung" / Thông tin khoa |

### Trang mục `/muc/<mục>` (Giới thiệu, Đào tạo, Đoàn thanh niên…)
| Phần | Nút | Mở ra |
|---|---|---|
| Dải tiêu đề (tên mục) | ✎ đổi tên mục; **Mới:** dòng mô tả ngắn của mục | sửa mục tại chỗ |
| Thẻ trang cố định | ✎ trên từng thẻ; ↑↓ đổi thứ tự; + Thêm trang vào mục này | sửa trang / trang mới đã chọn sẵn mục |
| Danh sách bài | ✎ ★ 📌 trên từng thẻ bài; **+ Viết bài trong mục này** | sửa bài / bài mới đã chọn sẵn mục |

### Trang cố định `/trang/<trang>`
| Phần | Nút | Mở ra |
|---|---|---|
| Nội dung trang | ✎ Sửa trang này (cạnh tiêu đề) | sửa trang |
| Cột bên: danh sách trang cùng mục | ↑↓ đổi thứ tự | tại chỗ |
| Cột bên: liên hệ | ✎ | Thông tin khoa |
| Tệp đính kèm (biểu mẫu) | ✎ | sửa trang (phần tệp đính kèm ở cuối) |

### Trang bài viết `/bai-viet/<bài>`
| Phần | Nút | Mở ra |
|---|---|---|
| Bài | ✎ Sửa bài này · ★ · 📌 · 🗑 Xóa (có hỏi lại) | sửa bài / tại chỗ |

### Trang tìm kiếm `/tim-kiem`
Như danh sách bài: ✎ ★ 📌 trên từng thẻ.

## Những gì phải làm thêm (hiện chưa có)

1. Trang ngoài biết admin đã đăng nhập (kiểm tra phiên khi mở trang; hết hạn thì tự ẩn công cụ).
2. Đường dẫn riêng trong quản trị để nút ✎ mở thẳng: `/quan-tri/bai/<id>`, `/quan-tri/bai-moi?muc=<mục>`, `/quan-tri/trang/<trang>`, `/quan-tri/trang-moi?muc=<mục>`, `/quan-tri/thong-tin`, `/quan-tri/menu`, kèm `?ve=<trang đang xem>` để lưu xong quay về.
3. **Thứ tự** mục và trang cố định đổi được (hiện chỉ thêm/đổi tên/xóa). Backend: một API nhận thứ tự mới.
4. **Mô tả ngắn cho mục** (một dòng trên dải tiêu đề trang mục). Backend: thêm trường `description` cho chuyên mục.
5. Bật/tắt nổi bật, ghim, xóa bài ngay trên trang ngoài (dùng API sửa bài sẵn có).

## Không làm

- Không sửa chữ trực tiếp trên trang ngoài (bấm vào chữ là gõ) — bấm ✎ mở màn hình sửa dạng bài viết đã có, trông như bài thật.
- Không thêm tài khoản/phân quyền nhiều người (vẫn một tài khoản quản trị chung).
- Không cho chỉnh các chữ giao diện cố định ("Tin mới", "Xem tất cả"…) và cách sắp xếp khối trang chủ.

## Điều không được xảy ra

- Người xem bình thường thấy nút sửa hoặc trang tải chậm hơn: công cụ quản trị là phần code riêng, chỉ tải khi có phiên đăng nhập.
- Bấm nhầm xóa mất bài: xóa luôn hỏi lại.
- Lưu xong bị đưa về trang quản trị thay vì trang đang xem.

## Các hướng đã cân nhắc

1. **Thanh quản trị + nút ✎ trên từng phần, mở màn hình sửa có sẵn** — *đề xuất*: phủ hết mọi trang, dùng lại màn hình sửa dạng bài viết, công sức vừa phải.
2. Sửa trực tiếp trên trang ngoài (bấm chữ là gõ, kiểu Wix): trực quan nhất nhưng phải làm lại trình soạn thảo cho từng kiểu khối (thẻ, cột, trình chiếu), công gấp mấy lần, dễ lỗi bố cục.
3. Chỉ thêm thanh quản trị có link về `/quan-tri`: nhanh nhất nhưng không giải quyết "sửa ngay chỗ đang xem".

## Chia đợt (đề xuất)

- **Đợt 1:** thanh quản trị, nút ✎ cho bài/trang/thông tin khoa trên mọi trang, đường dẫn riêng + quay về trang đang xem, ★ 📌 🗑 tại chỗ.
- **Đợt 2:** màn hình menu (đổi thứ tự mục và trang), mô tả ngắn cho mục, chọn bài nổi bật trên trang chủ.
