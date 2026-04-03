# Douyin & TikTok AI Translator 🎥✨

Một ứng dụng web mạnh mẽ giúp tải video từ TikTok và Douyin (không dính logo/watermark) và dịch lời nói thông minh sang nhiều ngôn ngữ khác nhau nhờ vào sức mạnh của AI, công nghệ chuyển đổi văn bản thành giọng nói (Text-To-Speech) và tự động lồng tiếng!

## 🌟 Các tính năng nổi bật
- **Tải video không có Watermark**: Trực tiếp tải video sắc nét từ TikTok và Douyin mà không bị dính logo.
- **Nhận diện giọng nói AI**: Trích xuất và nhận diện giọng nói độ chính xác cao nhờ **Google Gemini** hoặc **AssemblyAI**.
- **Tự động dịch thuật**: Dịch lời nói mượt mà sang nhiều ngôn ngữ như: Tiếng Anh, Tiếng Việt, Tiếng Tây Ban Nha, Tiếng Nhật, Tiếng Hàn...
- **Lồng tiếng bằng AI (Dubbing)**: Tái tạo và lồng giọng với âm thanh tự nhiên, cao cấp thông qua công nghệ **Edge-TTS** của Microsoft.
- **Đồng bộ tự động**: Tự động ghép âm thanh AI vừa dịch vào lại trong video gốc.
- **Sử dụng trên mạng LAN**: Khi chạy trên máy tính, bạn có thể dễ dàng truy cập và dùng trên điện thoại hay bất kỳ thiết bị nào cùng mạng WiFi.

## 🛠️ Công nghệ sử dụng
- **Frontend**: React 18, Vite, TypeScript, Framer Motion (Giao diện hiện đại, mượt mà).
- **Backend**: Node.js, Express.js.
- **Xử lý Âm thanh/Video**: FFmpeg (thông qua Fluent-FFmpeg).
- **Tạo giọng nói**: Python (`edge-tts`).

## ⚙️ Yêu cầu hệ thống
Trước khi chạy dự án tại máy tính, hãy đảm bảo bạn đã cài đặt các phần mềm sau:
1. **Node.js**: (Khuyến nghị bản 18 trở lên).
2. **Python**: Để dùng thư viện edge-tts.
   - Cài đặt bằng lệnh: `pip install edge-tts`
3. **FFmpeg**: Công cụ thiết yếu để xử lý tách và ghép video.
   - Phải được cài và cấu hình biến môi trường `PATH`.
   - Trên hệ điều hành Windows, có thể cài nhanh thông qua cmd: `winget install Gyan.FFmpeg`
4. **Git**: Dùng để sao chép dự án.

## 🚀 Hướng dẫn cài đặt nhanh (Local)

### 1. Cấu hình môi trường (API Key)
Vào thư mục `server/` và sửa lại file `.env` với API key của bạn:
```env
PORT=3001
NODE_ENV=development

# Lấy key miễn phí tại: https://aistudio.google.com/apikey
GEMINI_API_KEY=your_gemini_api_key

# Hoặc dùng AssemblyAI cho Text-to-Speech
ASSEMBLYAI_API_KEY=your_assemblyai_api_key
```

### 2. Cài đặt các thư viện
Bạn cần cài các gói npm cho cả thư mục góc và thư mục `server`.
```bash
# Trong thư mục gốc
npm install

# Trong thư mục server
cd server
npm install
cd ..
```

### 3. Chạy dự án (Cực nhanh con Windows!)
Nếu bạn đang dùng Windows, chỉ cần bấm đúp chuột vào file script tích hợp sẵn mà mình đã viết:
```bash
./run_local.bat
```
*Script này sẽ dọn dẹp port thừa và tự động mở 2 cửa sổ cmd đen cho Backend và Frontend.*

- **Truy cập Giao diện trên máy ảo**: `http://localhost:5173`
- **Truy cập trên điện thoại (Cùng WiFi)**: Check cái chỉ số **Network** ở cửa sổ Frontend (VD: `http://192.168.1.xxx:5173`) và nhập vào điện thoại là có thể xài!

## 📦 Triển khai lên Hosting (Deploy)
Nếu bạn có dự định đẩy web lên các VSP, server hoặc các nền tảng như Render, Railway, hay Vercel. 
Xin vui lòng đọc kỹ hướng dẫn cấu hình chi tiết tại file [DEPLOYMENT.md](DEPLOYMENT.md).

## 📄 Giấy phép
Giấy phép MIT. Bản quyền thuộc về Nobita.
