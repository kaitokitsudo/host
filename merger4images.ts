// Mã TypeScript cho Deno Deploy để ghép 4 ảnh từ URL thành 1 ảnh hình vuông
// Sử dụng thư viện ImageMagick cho Deno để tương thích với Deno Deploy
// Tạo file với tên là main.ts

import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { ImageMagick, IMagickImage, MagickFormat, initializeImageMagick  } from "https://deno.land/x/imagemagick_deno@0.0.24/mod.ts";

// Hàm để tải hình ảnh từ URL
async function fetchImageAsBuffer(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Không thể tải hình ảnh từ ${url}: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

// Hàm chính để ghép 4 ảnh thành 1 ảnh vuông
async function merge4Images(
  imageUrl1: string,
  imageUrl2: string,
  imageUrl3: string,
  imageUrl4: string,
  spacing: number = 0 // Khoảng cách giữa các ảnh (tùy chọn)
): Promise<Uint8Array> {
  // Tải 4 ảnh từ URL
  const [buffer1, buffer2, buffer3, buffer4] = await Promise.all([
    fetchImageAsBuffer(imageUrl1),
    fetchImageAsBuffer(imageUrl2),
    fetchImageAsBuffer(imageUrl3),
    fetchImageAsBuffer(imageUrl4),
  ]);

  await initializeImageMagick();

  return await new Promise((resolve, reject) => {
    // Sử dụng ImageMagick để xử lý ảnh
    ImageMagick.read(buffer1, async (img1) => {
      try {
        // Đọc các ảnh còn lại
        const img2 = await new Promise<IMagickImage>((res) => {
          ImageMagick.read(buffer2, (image) => res(image));
        });
        
        const img3 = await new Promise<IMagickImage>((res) => {
          ImageMagick.read(buffer3, (image) => res(image));
        });
        
        const img4 = await new Promise<IMagickImage>((res) => {
          ImageMagick.read(buffer4, (image) => res(image));
        });

        // Lấy kích thước của các ảnh
        const width1 = img1.width;
        const height1 = img1.height;
        const width2 = img2.width;
        const height2 = img2.height;
        const width3 = img3.width;
        const height3 = img3.height;
        const width4 = img4.width;
        const height4 = img4.height;

        // Tìm kích thước lớn nhất cho mỗi phần của grid
        const maxWidth = Math.max(width1, width2, width3, width4);
        const maxHeight = Math.max(height1, height2, height3, height4);

        // Thay đổi kích thước các ảnh để đồng nhất
        await new Promise<void>((res) => {
          img1.resize(maxWidth, maxHeight);
          res();
        });
        
        await new Promise<void>((res) => {
          img2.resize(maxWidth, maxHeight);
          res();
        });
        
        await new Promise<void>((res) => {
          img3.resize(maxWidth, maxHeight);
          res();
        });
        
        await new Promise<void>((res) => {
          img4.resize(maxWidth, maxHeight);
          res();
        });

        // Tạo một ảnh mới để chứa tất cả 4 ảnh
        ImageMagick.new(maxWidth * 2 + spacing, maxHeight * 2 + spacing, async (resultImage) => {
          try {
            // Đặt nền trắng
            resultImage.extent(maxWidth * 2 + spacing, maxHeight * 2 + spacing, "white");

            // Ghép 4 ảnh thành hình vuông
            // Ảnh 1: Góc trên bên trái
            resultImage.composite(img1, 0, 0);
            
            // Ảnh 2: Góc trên bên phải
            resultImage.composite(img2, maxWidth + spacing, 0);
            
            // Ảnh 3: Góc dưới bên trái
            resultImage.composite(img3, 0, maxHeight + spacing);
            
            // Ảnh 4: Góc dưới bên phải
            resultImage.composite(img4, maxWidth + spacing, maxHeight + spacing);

            // Chuyển đổi ảnh thành dạng buffer
            resultImage.write(MagickFormat.Png, (data) => {
              resolve(data);
            });
            
          } catch (error) {
            reject(error);
          }
        });
        
      } catch (error) {
        reject(error);
      }
    });
  });
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
      <title>Ghép 4 ảnh xx thành 1 ảnh hình vuông</title>
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
