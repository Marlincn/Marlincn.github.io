---
title: 绘世 Stable Diffusion
author: Marlin
url: 无

date: 2026-08-17 00:00:00
order: 7
tags:
  - AI绘画
---

## 一、提示词

### 1.0概念

* 提示词(tag)：相对独立的词或短语，告诉AI画什么
* 权重：单独提示词在总提示词中突出的程度，说明主要画什么
* 采样：采集文字特征，得到清晰图像的过程，不同采样方法画出的风格不同
* 采样进程：反映绘画完成程度

### 1.1写法

* 专有名词用下划线`_`连接，突出整体性，提示词之间用英文逗号`,`分隔
* 书写越靠前所占权重越高，默认值均为1
* 为确保有效，提示词数量一般不超过75
* 权重值一般在0.3-1.5

| 功能               | 写法                        | 权重值W                | 示例                                                         |
| :----------------- | :----------------------- | ---------------------- | ------------------------------------------------------------ |
| 设置权重：括号嵌套 | (tag)<br>[tag]<br>{tag} | 1.1<br>0.9<br>1.05 | ((tag1)),[[[tag2]]]<br>**W**(tag1)=1.1^2^=1.21<br>**W**(tag2)=0.9^3^=0.729 |
| 设置权重：直接设置 | (tag:W)                     |                        |                                                              |

| 功能                   | 写法             | 示例                                                         |
| ---------------------- | ---------------- | ------------------------------------------------------------ |
| 设置采样比例：后采样   | [tag:比例]       | (tree:0.8)<br>只在整体采样进程达到80%后，画树                |
| 设置采样比例：前采样   | [tag::比例]      | [tree::0.7]<br>只在整体采样进程到达70%前，画树               |
| 设置采样比例：分步采样 | [tag1:tag2:比例] | [tree:river:0.6]<br>前60%画树，后40%画河                     |
| 设置采样比例：交替采样 | [tag1\|tag2]     | [purple\|blue]hair<br>发色第一步画紫色，第二部画蓝色，交替进行，最终得到蓝紫相间的发色 |

### 1.3推荐格式

#### 1.3.1正向提示词

**1. 画质，画风**

高质量：
```text
masterpiece, best quality, highres, extremely detailed CG, perfect lighting, 8k wallpaper
```


​              杰作，最佳质量，高分辨率，极其精细的电脑生成图像，完美灯光，8K 壁纸

真实系：
```text
photograph, photorealistic
```


​              照片，超写实

二次元：
```text
anime, comic, game CG
```


​              动漫，漫画，游戏电脑生成图像，三维场景：3D，C4D 渲染，虚幻引擎，Octane 渲染

插画风：
```text
ilustration, painting, paintbrush
```


​              插画，绘画，画笔，

三维场景：
```text
3D, C4D renderunreal engine, octane render
```


​              3D，C4D 渲染，虚幻引擎，Octane 渲染

画风词：

| 赛博朋克   | Cyberpunk         |
| ---------- | ----------------- |
| 像素风     | 8bit/16bit pixel  |
| 宫崎骏风格 | studio ghibli     |
| 皮克斯风格 | pixel style       |
| 水墨画     | Chinese ink style |

**2. 主题描述**

人物，年龄，发型，发色，服饰，配饰，情绪表情，动作

**3. 场景，灯光，景别，拍摄角度**

**4. lora调用**

\<lora:名称：权重>

| 景别             |        |                   |                            |
| ---------------- | :----: | ----------------- | -------------------------- |
| close-up         | 近景   | extreme close-up  | 特写镜头                   |
| medium close-up  | 中近景 | establishing shot | 定场镜头（视野宽阔的远景） |
| medium shot      | 中景   | cowboy shot       | 牛仔镜头（上半身以及大腿） |
| long shot        | 全景   | upper body        | 上半身                     |
| medium full shot | 中全景 | full body         | 全身                       |
| full shot        | 全景   |                   |                            |

<span style="color: #FF0000">注意加入景别提示词后，尽量不要加入如beautiful face 这些脸部提示词，否则多数会生成半身照</span>

| 拍摄角度        |          |                 |          |
| :-------------- | :------: | --------------- | :------: |
| overhead shot   | 俯视     | straight on     | 水平拍摄 |
| top down        | 由上向下 | hero view       | 英雄视角 |
| bird's eye view | 鸟瞰     | low view        | 低视角   |
| high angle      | 高角度   | worm's eye view | 仰视     |
| slightly above  | 微高角度 | selfie          | 自拍     |

<img style="zoom:30%" src="C:\Users\mabin\Downloads\d43a9bd8af7901bed6459b385a3f4038.jpeg">



#### 1.3.2反向提示词

通用的范式：

```
NSFW,mutated hands and fingers,worst quality,low quality,extra limb,missing limb,floating limbs,cloned face,disconnected limbs,extra legs,fused fingers,long neck,deformed iris,deformedpupils,deformed,distorted,disfigured,lineart,watermark,cropped, out of frame,poorly drawn,bad anatomy,wrong anatomy,mutation,ugly,disgusting
```

不适合公开内容，手部与手指畸变，质量极差，质量低下，多余肢体，缺失肢体，漂浮肢体，克隆脸，断离肢体，多余腿部，手指融合，长脖子，虹膜畸变，瞳孔畸变，畸形，扭曲，毁容，线稿，水印，裁剪不当，画面出框，绘制粗糙，解剖结构错误，解剖结构异常，畸变，丑陋，恶心


## 二、模型推荐

## 2.1底模

<span style="color:#87CEEB ">SD绘画的基础大模型，决定了后续画风的内容和基本输出风格。体量在GB级别</span>

* <span style="font-size: 25px">NoobAI-XL V-Pred-1.0</span>
* <span style="font-size: 25px">Plant Milk - Model Suite Hemp II</span>
  <span style="color:#FFC0CB ">动漫模型，人物二次元，场景偏现实</span>

- <span style="font-size: 25px">Plant Milk - Model Suite Walnut</span> 
- <span style="font-size: 25px">Cetus-Mix_WhaleFall2</span>


## 2.2LORA

<span style="color:#87CEEB ">针对特定艺术风格、对象类型等进行快速微调，文件大小通常在百兆左右</span>

* <span style="font-size: 25px">Artist style: Rella - Illustrious-XL V1</span>
* <span style="font-size: 25px">薄塗り / USNR STYLE ILL V1.0</span>
* <span style="font-size: 25px">Artist Style: konya_karasue/紺屋鴉江</span>
* <span style="font-size: 25px">动漫光效| Flux Anime Light</span>

## 三、成图优化

1. 生成无反应时，滚动web点击最下端的**`重载UI`**
2. 512*512以上使用高清分辨率修复极易爆显存，尝试拉满像素、采样方式和迭代步数生成高质量图片
3. 3.0采样更适合高迭代步数（30-60）收敛，2.0适合低迭代步数（20-40），Krass是均衡方向


## 四、画作


### 3.1夏末游鳞

<img src="/images/posts/夏末游鳞.png" style="zoom: 25%;" />

**正向Tag**


```text
masterpiece, best quality, newest, highres, absurdres, very Aesthetic,
depth of field, cowboy shot, close-up, solo, 1girl, holding sparkler, adjusting hair, looking at viewer, from side, light smile, closed mouth, upper body, original, gloom, (medium chest), white hair, long hair, ((red eyes)), bangs, hair between eyes, brown cardigan, white shirt, black dress, school uniform, blurry background, outdoors, dusk, on beach, water, cloudy sky, sea, floating glowing goldfish surround, light particles, lens flare, sunset, bokeh, backlighitng, blurry, handsome,
```


杰作，最佳品质，最新，高分辨率，超高分辨率，非常有美感
景深，牛仔镜头，特写，单人，1女孩，手持烟花棒，整理头发，看向观众，侧面，轻笑，闭嘴，上半身，原图，阴暗，（中胸），白发，长发，（红眼），刘海，头发遮住眼睛，棕色开衫，白色衬衫，黑色连衣裙，校服，背景模糊，户外，黄昏，海滩上，水，多云天空，大海，漂浮发光的金鱼环绕，光粒子，镜头光晕，日落，背景虚化，逆光，模糊，帅气

**负向Tag**


```text
(score_4, score_3, score_2, score_1), ugly, nsfw, lineart,watermark,bad anatomy,bad proportions,extra limbs,extra digit,extra legs,extra legs and arms,disfigured,missing arms,too many fingers,fused fingers,missing fingers,watermark,username,furry,3fingers,god's eyes,yu pei,mutated hands and fingers,
```


（得分 4、得分 3、得分 2、得分 1），丑陋，不适宜公开，线稿，水印，糟糕的解剖结构，比例失调，多余肢体，多余手指，多余腿和胳膊，畸形，缺失胳膊，手指过多，手指粘连，缺失手指，水印，用户名，兽迷，三根手指，上帝之眼，余佩，变异的手和手指

**采样** Euler Karras

**迭代步数** 30，CFG5

**模型** Plant Milk HempII

**Lora** Rella - Illustrious-XL (0.4)

其他数值均为默认



### 3.2暗香盛雪

<img src="/images/posts/暗香胜雪.png" style="zoom: 25%;" />

**正向tag**


```text
masterpiece, best quality, extremely detailed CG unity 8k wallpaper, close up, (blurry background), (depth of field), (skadi {arknights}), white theme, (Inception_(film)), beautiful detailed eyes, detailed clothes, (black and white suit), solo, from side, hair_ribbons, gloom, black scarf, original, floating, falling white petals, upper body,  (medium chest), white hair, short hair, messy hair, ((red eyes)), (black cloak), cinematic highlight hair, depth of field, nature, (morning), sky, (blurry), (plum blossom:1.2), (best shadow), (sunlight), shade, handsome
```


大师级作品，顶级品质，极其精细的 CG Unity 8K 壁纸，特写镜头，（模糊背景），（景深），（斯卡蒂 {明日方舟}），白色主题，（盗梦空间），美丽细致的眼睛，精致的服装，（黑白西装），独照，侧面，发带，忧郁，黑色围巾，原创，飘浮，飘落的白色花瓣，上半身，（中等胸部），白色头发，短发，凌乱的头发，（红色眼睛），（黑色斗篷），电影级高光头发，景深，自然，（清晨），天空，（模糊），（梅花：1.2），（最佳阴影），（阳光），阴影，帅气

**采样** DPM++ 3M SDE     Karras

**迭代步数** 30，CFG5

**模型** CetusMix-WhaleFall2

**独立Lora**  薄塗り / USNR STYLE (0.4)

​	          Rella - Illustrious-XL (0.4，最佳)

​                  konya_karasue/紺屋鴉江 (0.4)

**混合Lora**

其他数值均为默认

<img src="C:\Users\mabin\Desktop\杂集\图片\暗香胜雪.png" style="zoom: 50%;" />


>本文参考于：
>
><span style="color:#87CEEB">**乌咪橘**</span>	[【SD提示词】B站最全的StableDiffusion提示词教程（上）](https://www.bilibili.com/video/BV1j4421D76v)
>
><span style="color:#87CEEB">**村口郭大爷AITechLab**</span>	[stable diffusion 必须技能之用【提示词】控制镜头景别与角度](https://www.bilibili.com/video/BV1SW4y1X7ME)

