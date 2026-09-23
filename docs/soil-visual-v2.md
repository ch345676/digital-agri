# 土壤写实素材 V2

- 工具：内置 image_gen（非 CLI/API fallback）。
- 最终素材：`public/media/insights/soil-root-profile-v2.webp`，1536 × 1024，470,604 字节。
- 原始生成图已通过浏览器 Canvas 编码为 WebP；没有改变构图或增加照片内容。
- 使用位置：土壤报告的 SoilScene。Canvas 动效独立叠加，指标值来自现有演示数据。
- 性质：AI 生成的通用农业根系剖面示意，不是指定地块、指定品种的实拍照片，也不是实测地下结构。页面可见标识为“写实生成示意 · 非实测剖面”。
- 不含人物、手部或文字水印。

## 实际生成提示词

Use case: scientific-educational. Create one photorealistic premium agricultural soil cutaway asset for a Chinese smart farm dashboard, landscape 3:2 composition, no text or UI. A living young cereal seedling with several natural slender green leaves growing in a broad natural block of dark rich farm soil shown in frontal cutaway. Entire plant and full root network visible. Plant above ground occupies upper 40 percent, exposed soil face occupies lower 60 percent. Delicate cream roots branch organically downward through crumbly moist loam, tiny mineral grains, pores, pebbles and organic matter, realistic microtexture and irregular earthy edges. This is a realistic scientific visualization with photographic materials and physically plausible soft daylight, NOT vector art, NOT a cartoon, NOT smooth plastic 3D. Background is softly defocused real farmland with warm green bokeh; soil extends to the left right and bottom frame edges without a floating cube, without tabletop or studio. Main stem at 50 percent width, roots spread from x25 to x75 percent, ground boundary at y42 percent. High detail, natural restrained greens and deep warm browns, soft morning side lighting, enough visual depth to feel tactile. No people, no hands, no equipment, no labels, no numbers, no icons, no arrows, no glowing effects. Generated educational visualization, not a claim of a specific crop or real measured underground profile. Save output file for use in a website project.

## 动效说明

资源图：水肥基准费用决定通道宽度与粒子密度，双通道拖尾粒子汇聚后形成输出流；输出金额沿用投入测算。静态光晕、双层流带、轨道环、细小环境粒子共同形成层次。粒子不是物理实测流量。

土壤图：水分、离子、酸碱、温度与养分显示不同色彩和波纹，根系方向光点与土层扫描为示意。八项指标、图内快捷切换和读数保持同步。

两个场景都支持独立暂停、全局动画关闭和系统减少动画偏好；IntersectionObserver、页面可见状态控制 RAF，离屏和后台不持续渲染，DPR 上限 2，绘制频率约 30 fps。
