from PIL import Image
import os

# 要压缩的文件夹
folders = [
    r"F:\Web\MAX\src\assets\tarot",
    r"F:\Web\MAX\src\assets\Playing cards"
]

for folder in folders:
    print(f"处理: {folder}")
    for root, dirs, files in os.walk(folder):
        for file in files:
            if file.endswith('.png'):
                png_path = os.path.join(root, file)
                jpg_path = png_path.replace('.png', '.jpg')
                
                # 打开图片
                img = Image.open(png_path)
                
                # 白底转jpg
                if img.mode == 'RGBA':
                    bg = Image.new('RGB', img.size, (255, 255, 255))
                    bg.paste(img, mask=img.split()[3])
                    bg.save(jpg_path, 'JPEG', quality=85, optimize=True)
                else:
                    img.convert('RGB').save(jpg_path, 'JPEG', quality=85, optimize=True)
                
                # 删除原来的png
                os.remove(png_path)
                print(f"转换: {file}")

print("全部完成！")
