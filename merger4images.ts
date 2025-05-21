// Mã TypeScript cho Deno Deploy để ghép 4 ảnh từ URL thành 1 ảnh hình vuông
// Tạo file với tên là main.ts

import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { Canvas, Image, createCanvas, loadImage } from "https://deno.land/x/canvas@v1.4.1/mod.ts";

// Hàm chính để ghép 4 ảnh thành 1 ảnh vuông
async function merge4Images(
  imageUrl1: string,
  imageUrl2: string,
  imageUrl3: string,
  imageUrl4: string,
  spacing: number = 0 // Khoảng cách giữa các ảnh (tùy chọn)
): Promise<Uint8Array> {
  try {
    // Tải 4 ảnh từ URL
    const img1 = await loadImage(imageUrl1);
    const img2 = await loadImage(imageUrl2);
    const img3 = await loadImage(imageUrl3);
    const img4 = await loadImage(imageUrl4);

    // Tìm kích thước lớn nhất trong các ảnh để đảm bảo các phần đều bằng nhau
    const maxWidth = Math.max(img1.width(), img2.width(), img3.width(), img4.width());
    const maxHeight = Math.max(img1.height(), img2.height(), img3.height(), img4.height());

    // Tính kích thước của canvas
    const canvasWidth = maxWidth * 2 + spacing;
    const canvasHeight = maxHeight * 2 + spacing;

    // Tạo canvas với kích thước phù hợp
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext("2d");

    // Điền nền trắng (tùy chọn)
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Vẽ 4 ảnh lên canvas theo vị trí
    // Ảnh 1: Góc trên bên trái
    ctx.drawImage(img1, 0, 0, maxWidth, maxHeight);
    
    // Ảnh 2: Góc trên bên phải
    ctx.drawImage(img2, maxWidth + spacing, 0, maxWidth, maxHeight);
    
    // Ảnh 3: Góc dưới bên trái
    ctx.drawImage(img3, 0, maxHeight + spacing, maxWidth, maxHeight);
    
    // Ảnh 4: Góc dưới bên phải
    ctx.drawImage(img4, maxWidth + spacing, maxHeight + spacing, maxWidth, maxHeight);

    // Trả về dữ liệu ảnh dưới dạng buffer
    return canvas.toBuffer("image/png");
  } catch (error) {
    console.error("Lỗi khi ghép ảnh:", error);
    throw error;
  }
}

// Tạo router và ứng dụng
const router = new Router();
const app = new Application();

// API endpoint để ghép ảnh
router.get("/merge", async (ctx) => {
  try {
    const url = new URL(ctx.request.url);
    const params = url.searchParams;
    
    // Lấy các URL ảnh từ query parameters
    const img1 = params.get("img1");
    const img2 = params.get("img2");
    const img3 = params.get("img3");
    const img4 = params.get("img4");
    const spacing = parseInt(params.get("spacing") || "0");
    
    // Kiểm tra xem có đủ 4 URL ảnh không
    if (!img1 || !img2 || !img3 || !img4) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: "Vui lòng cung cấp đủ 4 URL ảnh (img1, img2, img3, img4)"
      };
      return;
    }
    
    // Ghép ảnh
    const imageBuffer = await merge4Images(img1, img2, img3, img4, spacing);
    
    // Thiết lập header và trả về ảnh
    ctx.response.headers.set("Content-Type", "image/png");
    ctx.response.body = imageBuffer;
  } catch (error) {
    console.error("Lỗi:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Có lỗi xảy ra khi xử lý ảnh",
      error: error.message
    };
  }
});

// Trang chủ hiển thị form đơn giản
router.get("/", (ctx) => {
  ctx.response.headers.set("Content-Type", "text/html");
  ctx.response.body = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ghép 4 ảnh thành 1 ảnh hình vuông</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        form {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        label {
          font-weight: bold;
        }
        input {
          padding: 8px;
          width: 100%;
        }
        button {
          padding: 10px;
          background-color: #4CAF50;
          color: white;
          border: none;
          cursor: pointer;
          margin-top: 10px;
        }
        .preview {
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <h1>Ghép 4 ảnh thành 1 ảnh hình vuông</h1>
      <form id="mergeForm">
        <div>
          <label for="img1">URL Ảnh 1 (Trên trái):</label>
          <input type="url" id="img1" name="img1" required>
        </div>
        <div>
          <label for="img2">URL Ảnh 2 (Trên phải):</label>
          <input type="url" id="img2" name="img2" required>
        </div>
        <div>
          <label for="img3">URL Ảnh 3 (Dưới trái):</label>
          <input type="url" id="img3" name="img3" required>
        </div>
        <div>
          <label for="img4">URL Ảnh 4 (Dưới phải):</label>
          <input type="url" id="img4" name="img4" required>
        </div>
        <div>
          <label for="spacing">Khoảng cách giữa các ảnh (pixel):</label>
          <input type="number" id="spacing" name="spacing" value="0" min="0">
        </div>
        <button type="submit">Ghép ảnh</button>
      </form>
      
      <div class="preview">
        <h2>Kết quả:</h2>
        <div id="result"></div>
      </div>
      
      <script>
        document.getElementById('mergeForm').addEventListener('submit', function(e) {
          e.preventDefault();
          const img1 = encodeURIComponent(document.getElementById('img1').value);
          const img2 = encodeURIComponent(document.getElementById('img2').value);
          const img3 = encodeURIComponent(document.getElementById('img3').value);
          const img4 = encodeURIComponent(document.getElementById('img4').value);
          const spacing = document.getElementById('spacing').value;
          
          const mergeUrl = \`/merge?img1=\${img1}&img2=\${img2}&img3=\${img3}&img4=\${img4}&spacing=\${spacing}\`;
          
          const resultDiv = document.getElementById('result');
          resultDiv.innerHTML = \`
            <p>Ảnh đã được ghép:</p>
            <img src="\${mergeUrl}" style="max-width: 100%;" alt="Ảnh đã ghép">
            <p>Link trực tiếp: <a href="\${mergeUrl}" target="_blank">\${mergeUrl}</a></p>
          \`;
        });
      </script>
    </body>
    </html>
  `;
});

// Thiết lập middleware và lắng nghe port
app.use(router.routes());
app.use(router.allowedMethods());

// Lắng nghe cổng mà Deno Deploy cung cấp hoặc port 8000 cho local development
const port = Deno.env.get("PORT") || "8000";
console.log(`Khởi động server tại http://localhost:${port}`);

await app.listen({ port: parseInt(port) });
