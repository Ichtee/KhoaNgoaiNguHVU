# Khu quản trị riêng `/quan-tri`

Ngày: 2026-11-19 · Trạng thái: **đã duyệt**

## Mục đích
Trang công khai luôn giống nhau với mọi người, kể cả khi admin đã đăng nhập. Mọi công cụ sửa chỉ nằm trong khu `/quan-tri/…`, là bản sao của website kèm công cụ, được bảo vệ bằng kiểm tra phiên với máy chủ.

## Thiết kế
- Trang công khai `/`, `/muc/:slug`, `/trang/:slug`, `/bai-viet/:slug`, `/tim-kiem`: không bao giờ có thanh quản trị, nút ✎ ★ 📌 ↑↓.
- Khu quản trị: `/quan-tri` (trang chủ), `/quan-tri/muc/:slug`, `/quan-tri/trang/:slug`, `/quan-tri/bai-viet/:slug`, `/quan-tri/tim-kiem` = cùng trang, có công cụ; mọi link nội bộ giữ tiền tố `/quan-tri`.
- Màn hình quản lý: `/quan-tri/quan-ly` (bài viết), `/quan-ly/muc/:slug`, `/quan-ly/trang`, `/quan-ly/chuyen-muc`, `/quan-ly/thong-tin`. Trình sửa: `/quan-tri/bai/:slug`, `/bai-moi`, `/sua-trang/:slug`, `/trang-moi` (như cũ).
- Chặn truy cập: vào bất kỳ `/quan-tri/…` → hỏi máy chủ (`/api/session`) trước khi hiện nội dung; chưa có/không hợp lệ → xóa mã, hiện form đăng nhập, đăng nhập xong ở lại đúng đường dẫn. Kiểm tra lại khi tab được focus lại. Mọi thao tác bị 401 → về form đăng nhập. Khu quản trị có `<meta name="robots" content="noindex">`.
- Thanh quản trị (chỉ trong khu quản trị): Quản lý · + Viết bài · + Trang mới · Sửa thông tin khoa · Sửa menu · **Xem như khách** (cùng trang, bản công khai) · Đăng xuất (về trang chủ công khai).
- Máy chủ không đổi: mọi thao tác ghi vẫn đòi phiên hợp lệ (401 nếu không).

## Không làm
- Không đổi backend, không thêm tài khoản/phân quyền.
