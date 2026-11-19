# Trình sửa bài trực quan trong trang quản trị

Ngày: 2026-11-19

## Mục đích

Người quản trị (giảng viên, cán bộ khoa, không rành kỹ thuật) sửa bài viết và trang tĩnh trên một màn hình **trông giống bài ngoài trang thật**, sửa tại chỗ như sửa bài Facebook: ảnh bìa có nút "Đổi ảnh bìa" ở góc, tiêu đề to bấm vào là sửa, chữ trong bài gõ trực tiếp với thanh công cụ, ảnh hiện đúng chỗ trong bài. Không cần biết ký hiệu Markdown, không cần mở tab "Xem nháp" mới biết bài trông thế nào.

## Mục tiêu

- Màn hình sửa **bài viết** và **trang tĩnh** có bố cục như bài thật (cùng font, cỡ chữ, khoảng cách với trang ngoài).
- Ảnh bìa (chỉ bài viết): hiện to như ngoài trang; nút **Đổi ảnh bìa** và **Gỡ** nằm ở góc ảnh. Chưa có ảnh bìa thì hiện khung trống "+ Thêm ảnh bìa".
- Tiêu đề và tóm tắt sửa tại chỗ, trông như tiêu đề và đoạn mở đầu thật.
- Nội dung: trình soạn thảo trực tiếp với thanh công cụ: **Đậm**, *Nghiêng*, Tiêu đề, Danh sách (chấm/số), Trích dẫn, Link, Ảnh, Bảng, Hoàn tác/Làm lại.
- Ảnh trong bài: nút "Ảnh" trên thanh công cụ (chọn nhiều ảnh), kéo-thả hoặc dán ảnh vào bài đều tải lên Cloudinary và chèn tại chỗ con trỏ. Bấm vào một ảnh: hiện thanh nhỏ **Làm ảnh bìa** / **Xóa ảnh**.
- Các thiết lập không thuộc nội dung (chuyên mục, bài nổi bật, ghim, người đăng; với trang: hiện trong menu mục nào) nằm ở **cột bên phải**, kèm nút **Lưu**, **Hủy**, **Xem nháp trên website**.
- Tệp đính kèm (biểu mẫu) vẫn ở cuối bài như ngoài trang, có nút thêm/gỡ.
- Điện thoại: cột phải xuống dưới; thanh công cụ cuộn ngang được.

## Không làm

- Không đổi cách lưu: nội dung **vẫn là Markdown** trong database (bạn đã chọn phương án A). Trang ngoài, tóm tắt, bộ lọc, script nhập bài giữ nguyên.
- Không có màu chữ, cỡ chữ tùy ý, căn lề (Markdown không lưu được).
- Không đổi danh sách bài, chuyên mục, thông tin khoa trong quản trị; chỉ đổi màn hình sửa một bài/một trang.
- Không sửa trực tiếp trên trang ngoài (đăng nhập rồi bấm vào bài thật để sửa) — vẫn sửa trong trang quản trị.

## Điều không được xảy ra (dù chạy được)

- Mở một bài cũ rồi bấm Lưu mà **nội dung hiển thị bị đổi** (mất ảnh, mất bảng, mất chú thích ảnh, vỡ danh sách). Cách viết ký hiệu bên trong được phép đổi, cái người xem thấy thì không.
- Trang ngoài **tải chậm hơn** vì thư viện soạn thảo: thư viện chỉ được tải khi mở màn hình sửa.
- Mất bài đang soạn: cảnh báo "Bỏ các thay đổi chưa lưu?" và bản nháp cho tab "Xem nháp" vẫn hoạt động như hiện nay.

## Ràng buộc

- React 18 + CSS thuần, không Tailwind. Icon dùng `lucide-react` có sẵn.
- Ảnh tải lên đi qua `api.upload` có sẵn (Cloudinary).
- Đường dẫn ảnh trong bài có ba dạng đang tồn tại: Cloudinary `https://res.cloudinary.com/...`, có thể có chú thích dạng dòng `*chữ nghiêng*` ngay dưới ảnh (bài lấy từ hvu.edu.vn).
- Bảng (trang Tuyển sinh, Ban chủ nhiệm) phải giữ nguyên khi lưu.
- Trang ngoài hiển thị bằng `react-markdown` + `remark-gfm`; cái gì trình soạn thảo ghi ra phải được hai thứ này hiển thị đúng.

## Các phương án đã cân nhắc

**Cách sửa chữ trong bài**
1. *Soạn thảo trực tiếp (Tiptap)* — **đã chọn**. Không cần biết Markdown; đổi lại phải thêm thư viện và chuyển đổi Markdown ⇄ trình soạn thảo.
2. Giữ ô Markdown, bọc trong bố cục giống bài thật, có nút Sửa/Xem trước — ít rủi ro nhưng người dùng vẫn phải gõ ký hiệu.

**Cách lưu nội dung**
- *A. Vẫn lưu Markdown* — **đã chọn**: dữ liệu cũ và trang ngoài không đổi, không có rủi ro mã độc.
- B. Chuyển sang HTML: định dạng tự do hơn nhưng phải chuyển toàn bộ bài cũ, sửa trang ngoài, thêm bước lọc mã độc.

## Cách làm (đã quyết)

- Thư viện: `@tiptap/react`, `@tiptap/starter-kit`, các phần mở rộng Link, Image, Table (bảng, hàng, ô, ô tiêu đề), Placeholder, và `tiptap-markdown` để đọc/ghi Markdown.
- Trình soạn thảo được tải **riêng, chỉ khi mở màn hình sửa** (`React.lazy`), để trang ngoài không nặng thêm.
- Thay `PostForm`, `PageForm` trong `AdminForms.jsx` bằng màn hình mới; giữ nguyên `useSave` (lưu, cảnh báo chưa lưu), `useDraft` (tab xem nháp), `FilesField`, cách nhớ tên người đăng.
- Ô Markdown thô và lưới "Ảnh trong bài" hiện tại bị thay bởi trình soạn thảo (ảnh hiện ngay trong bài). Giữ một nút nhỏ **"Sửa mã Markdown"** cho trường hợp cần sửa tay — lưới an toàn khi trình soạn thảo xử lý sai một bài nào đó.

## Để người làm tự quyết (calls của mình, bạn sửa được)

- Chú thích ảnh `*…*` dưới ảnh: giữ dạng đoạn văn nghiêng ngay dưới ảnh (không làm khối chú thích riêng).
- Thanh công cụ dính trên cùng khi cuộn bài dài.
- Ô chọn chuyên mục trong cột phải, đồng thời hiện tên chuyên mục phía trên tiêu đề như ngoài trang (chỉ để xem).
- Kiểm tra: mở **toàn bộ 58 bài và 11 trang** đang có trong trình soạn thảo, ghi lại thành Markdown, rồi so sánh HTML hiển thị ngoài trang trước và sau — phải giống hệt (bỏ qua khác biệt khoảng trắng). Bài nào lệch thì sửa trước khi giao.
- Để thử màn hình quản trị trên máy cần đăng nhập: tạo một phiên đăng nhập tạm trong database cho lần thử, xóa ngay sau khi xong.
