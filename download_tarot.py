import urllib.request
import os
import re

# 创建目录
major_dir = "F:/Web/MAX/src/assets/tarot/major"
minor_dir = "F:/Web/MAX/src/assets/tarot/minor"
os.makedirs(major_dir, exist_ok=True)
os.makedirs(minor_dir, exist_ok=True)

# 大阿卡纳22张牌
major_cards = [
    ("00-fool", "愚者"),
    ("01-magician", "魔术师"),
    ("02-high-priestess", "女祭司"),
    ("03-empress", "女皇"),
    ("04-emperor", "皇帝"),
    ("05-hierophant", "教皇"),
    ("06-lovers", "恋人"),
    ("07-chariot", "战车"),
    ("08-strength", "力量"),
    ("09-hermit", "隐士"),
    ("10-wheel-of-fortune", "命运之轮"),
    ("11-justice", "正义"),
    ("12-hanged-man", "倒吊人"),
    ("13-death", "死神"),
    ("14-temperance", "节制"),
    ("15-devil", "恶魔"),
    ("16-tower", "高塔"),
    ("17-star", "星星"),
    ("18-moon", "月亮"),
    ("19-sun", "太阳"),
    ("20-judgement", "审判"),
    ("21-world", "世界"),
]

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

def download_img(url, save_path):
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = resp.read()
        with open(save_path, "wb") as f:
            f.write(data)
    return len(data)

print("=" * 50)
print("开始下载大阿卡纳 22 张...")
print("=" * 50)

for slug, name in major_cards:
    page_url = f"https://taluo.net/cards/major/{slug}/"
    try:
        # 访问页面
        req = urllib.request.Request(page_url, headers=headers)
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode("utf-8")
        
        # 找牌面图片（找 og:image 或者主图）
        img_match = re.search(r'<meta property="og:image" content="([^"]+)"', html)
        if not img_match:
            img_match = re.search(r'<img[^>]+src="([^"]+\.(jpg|png|webp))"[^>]+alt="[^"]*' + name, html)
        
        if img_match:
            img_url = img_match.group(1)
            if img_url.startswith("//"):
                img_url = "https:" + img_url
            elif img_url.startswith("/"):
                img_url = "https://taluo.net" + img_url
            
            # 下载
            ext = "jpg"
            if ".png" in img_url:
                ext = "png"
            elif ".webp" in img_url:
                ext = "webp"
            
            save_path = f"{major_dir}/{slug}_{name}.{ext}"
            size = download_img(img_url, save_path)
            print(f"✅ {name:6s} | {size//1024}KB | {img_url[:60]}...")
        else:
            print(f"⚠️  {name:6s} | 没找到图片")
    except Exception as e:
        print(f"❌ {name:6s} | {e}")

print()
print("=" * 50)
print("大阿卡纳下载完成！")
print(f"保存位置：{major_dir}")
print("=" * 50)
