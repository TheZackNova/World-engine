# 世界引擎 World Engine

Tiện ích mở rộng bên thứ ba cho SillyTavern — engine diễn tiến thế giới chạy bằng API độc lập.

Sau mỗi lượt hội thoại, tiện ích tự động diễn tiến trạng thái thế giới và tiêm ngữ cảnh vào prompt, giúp thế giới trong lúc nhập vai thực sự "sống": NPC có cuộc sống riêng, chuỗi sự kiện tự diễn tiến, các thế lực hưng suy thay đổi, tin đồn lan khắp nơi, kinh tế biến động — tất cả không xoay quanh người chơi.

## Tổng quan tính năng

**Diễn tiến thế giới**
- Sau mỗi lượt hội thoại tự động (hoặc thủ công) gọi API tương thích OpenAI bên ngoài để diễn tiến biến đổi của thế giới
- Hỗ trợ hai chế độ nhịp: «diễn tiến mỗi N vòng» và «diễn tiến theo thời gian trong truyện»
- Kết quả diễn tiến tự động tiêm vào prompt, để AI cảm nhận được động thái thế giới khi viết nội dung chính

**Bộ quy tắc engine sống** (12 mô-đun tích hợp)
- Vận hành thế giới, chuỗi sự kiện, lan truyền tin đồn, hệ thống thế lực, hệ thống danh tiếng, hệ thống kinh tế, thao túng hậu trường, sự kiện đột phát khu vực, v.v.
- Tiến triển giai đoạn sự kiện do xúc xắc điều khiển (Manh nha → Lên men → Cận kề → Bùng phát/Tan biến)
- Dao động tự nhiên của trụ cột quyền lực, độ gắn kết và vận thế các thế lực

**Bảng trạng thái thế giới**
- Tóm tắt thế giới / Đại thế thiên hạ / Sự kiện khu vực / Chuỗi sự kiện / Tin đồn / Chuỗi tác động / Danh tiếng / Thế lực / Thù địch / Kinh tế / Hộp đen
- Mỗi mô-đun có thể thu gọn, hỗ trợ chỉnh sửa tại chỗ, thêm mới, xóa
- Hiển thị song trạng thái a/b giữa điểm lưu (ảnh chụp trước khi diễn tiến) và trạng thái hiện tại

**Bộ nhớ đệm & lưu trữ Tavern** (v2.2.0)
- Đồng bộ thời gian thực xuyên thiết bị: phản chiếu trạng thái thế giới vào `chat_metadata`, lưu cùng tệp chat lên máy chủ Tavern
- Bản lưu đặt tên + tự sao lưu cuốn chiếu: phòng mất dữ liệu, hỗ trợ khôi phục/đổi tên/xuất/nhập/xóa
- Giải quyết xung đột bằng bộ đếm Lamport, lá chắn nội dung trống ngăn thiết bị rỗng ghi đè dữ liệu thật
- Mặc định tắt; nếu không bật thì hoàn toàn không ghi vào tệp chat

**World book cho diễn tiến nền**
- Chọn các mục world book tham gia diễn tiến theo từng cuộc trò chuyện, để kết quả diễn tiến bám sát thiết định thế giới quan cụ thể
- Kích hoạt đèn xanh-lam (v2.3.0): 🔵 mục thường trú luôn được tiêm, 🟢 mục từ khóa chỉ tiêm khi trúng từ khóa trong hội thoại gần đây, theo cấu hình world book của Tavern, mỗi mục có thể ghi đè riêng (mặc định tắt)

**Điền lại hàng loạt diễn tiến thế giới** (v2.3.1)
- Bắt đầu từ tầng AI thứ 1, chia lô diễn tiến lại trạng thái thế giới tới tầng chỉ định (ví dụ: 30 tầng AI, mỗi 5 tầng một lô → gọi diễn tiến 6 lần)
- Mỗi lô chỉ đưa hội thoại của các tầng trong lô đó, token ổn định kiểm soát được; trạng thái thế giới tích lũy dần qua từng lô, giữ tính liền mạch
- Có thể cấu hình số tầng mỗi lô, tầng kết thúc, số lần thử lại riêng cho mỗi lô; trước khi xóa làm lại sẽ tự lưu một ảnh chụp sao lưu

**Nhập/Xuất dữ liệu**
- Xuất toàn bộ trạng thái thế giới ở định dạng JSON, có thể nhập sang cuộc trò chuyện khác
- Khi nhập tự động chuẩn hóa số tầng, tránh phán định sai lệch

## Cài đặt

### Cách 1: Qua trình quản lý tiện ích của SillyTavern

1. Mở SillyTavern, vào trang **Extensions**
2. Bấm **Install extension**
3. Nhập địa chỉ kho: `https://github.com/DlSNlGHT/World`
4. Cài xong thì làm mới trang

### Cách 2: Cài thủ công

```bash
cd <thư-mục-cài-SillyTavern>/data/default-user/extensions
git clone https://github.com/DlSNlGHT/World world-engine
```

Làm mới trang SillyTavern là xong.

## Cấu hình

Sau khi cài, tìm bảng tiện ích **World Engine** ở thanh bên SillyTavern, vào trang **Cài đặt**:

1. **Cấu hình API** (bắt buộc)
   - API URL: bất kỳ endpoint tương thích OpenAI (ví dụ `https://api.openai.com/v1`)
   - API Key: khóa tương ứng
   - Tên mô hình: ví dụ `gpt-4o`, `claude-3-5-sonnet`, v.v.

2. **Chế độ diễn tiến**
   - Tự động: tự diễn tiến sau mỗi N vòng hội thoại (mặc định mỗi vòng)
   - Theo thời gian: quyết định số vòng diễn tiến dựa trên thời gian đã trôi qua trong truyện
   - Thủ công: chỉ kích hoạt khi bấm nút «Diễn tiến thủ công»

3. **Điền lại hàng loạt diễn tiến thế giới** (tùy chọn)
   - Chia lô diễn tiến thế giới từ tầng AI thứ 1 tới tầng chỉ định, dùng khi: đã có nhiều hội thoại trước khi cài tiện ích, hoặc muốn làm lại từ đầu
   - Số tầng AI mỗi lô: bao nhiêu tầng gọi diễn tiến một lần; Tầng kết thúc: điền 0 = diễn tiến tới cuối; Số lần thử lại mỗi lô: giới hạn thử lại khi thất bại
   - Bấm «▶ Bắt đầu điền lại diễn tiến thế giới» → xác nhận (sẽ xóa trạng thái thế giới hiện tại, tự lưu ảnh chụp sao lưu) → diễn tiến theo từng lô, có thể «■ Dừng» bất cứ lúc nào

4. **Bộ nhớ đệm & lưu trữ Tavern** (tùy chọn)
   - Đồng bộ thời gian thực xuyên thiết bị: bật rồi thì trạng thái thế giới đồng bộ giữa các thiết bị theo cuộc trò chuyện
   - Tự sao lưu cuốn chiếu: mỗi khi tiến vòng tự lưu một bản, giữ 3 bản gần nhất

## Sử dụng

1. Sau khi cấu hình API, trò chuyện bình thường với nhân vật
2. Sau khi AI trả lời, World Engine tự diễn tiến và cập nhật bảng
3. Bấm thanh tiêu đề bảng để mở/thu gọn từng mô-đun xem toàn cảnh thế giới
4. Kết quả diễn tiến tự động tiêm vào prompt, lượt trả lời tiếp theo của AI sẽ cảm nhận được biến đổi của thế giới

**Phân trang bảng**: Tóm tắt thế giới / Đại thế thiên hạ / Chuỗi sự kiện / Tin đồn / Thế lực / Danh tiếng / Kinh tế / Hộp đen / Điểm lưu / Cài đặt

**Lưu trữ & khôi phục**:
- Trong mục «Bộ nhớ đệm & lưu trữ Tavern» ở trang Cài đặt, có thể tạo bản lưu đặt tên, nhập bản lưu bên ngoài
- Mỗi bản lưu hỗ trợ khôi phục (về trạng thái thời điểm đó), đổi tên, xuất JSON, xóa
- Trước khi khôi phục tự tạo một bản sao lưu, có thể khôi phục lại bất cứ lúc nào

## Cấu trúc dự án

```
world-engine.js           Điểm vào chính: nạp mô-đun, gắn sự kiện, logic tiêm
world-engine-core.js      Cấu trúc dữ liệu lõi & lưu trữ (cô lập theo ID cuộc trò chuyện)
world-engine-store.js     Tầng trung gian lưu trữ (IndexedDB + dự phòng localStorage)
world-engine-api.js       Gọi API độc lập (định dạng tương thích OpenAI)
world-engine-evolution.js Diễn tiến thế giới (bộ quy tắc engine sống + hệ thống xúc xắc)
world-engine-inject.js    Dựng ngữ cảnh tiêm (lọc thông tin then chốt theo điều kiện)
world-engine-rules-loader.js  Toàn bộ quy tắc diễn tiến tích hợp (12 mô-đun)
world-engine-ledger.js    Sổ sự kiện trọng đại (ghi biến đổi Lv3/4)
world-engine-worldbook.js Chọn world book cho diễn tiến nền
world-engine-chatcache.js Bộ nhớ đệm & lưu trữ Tavern (đồng bộ xuyên thiết bị)
world-engine-ui.js        Bảng UI hoàn chỉnh
style.css                 Kiểu dáng
manifest.json             Bản kê khai tiện ích SillyTavern
worldmap.svg              Tài nguyên bản đồ thế giới
```

## Điểm kỹ thuật

- **Tiện ích thuần front-end**: 10 mô-đun JS, IIFE gắn vào biến toàn cục `window.*`, không có hệ thống build
- **Hai động cơ kép xúc xắc cục bộ + API ngoài**: tiến triển giai đoạn sự kiện dùng RNG cục bộ, sinh tự sự dùng LLM bên ngoài
- **Cô lập theo cuộc trò chuyện**: mỗi cuộc trò chuyện có bản lưu riêng, không ảnh hưởng lẫn nhau
- **Song trạng thái a/b**: điểm lưu trước diễn tiến (checkpoint) + trạng thái hiện tại sau diễn tiến, hỗ trợ tiêm đúng phiên bản khi re-roll
- **Ranh giới an toàn**: các thiết lập nhạy cảm như API Key tuyệt đối không ghi vào `chat_metadata`, tránh rò rỉ khi chia sẻ tệp chat

## Giấy phép

[MIT](https://opensource.org/licenses/MIT)

## Tác giả

[Disnight](https://github.com/DlSNlGHT)
