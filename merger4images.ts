
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
