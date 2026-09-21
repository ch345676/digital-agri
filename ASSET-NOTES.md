# 农业玻璃界面 · 素材与生成记录

## 新生成背景

- 使用方式：内置 image_gen 工具，未使用 CLI/API fallback。
- 最终项目文件：`public/media/glass/agri-dusk.webp`
- 用途：全站农业场景背景；保留原始生成 PNG，项目使用 WebP 压缩版本。
- 图像内容：青绿色雾山、田野与暖光温室；属于 AI 氛围示意，不是示范农场实拍。

完整提示词：

> Create a premium cinematic photographic background asset for a Chinese smart agriculture web application. A wide 16:9 panoramic dusk landscape, blue jade / misty teal atmosphere, layered forested mountains and subtle fog in the far distance, lush cultivated crop rows across the foreground, an elegant modern glass greenhouse glowing with warm amber interior lights in the lower right midground. Beautiful wet ground reflections and fine natural textures. Photorealistic, sophisticated editorial architectural photography, slightly dreamy atmospheric perspective, not sci-fi. The entire upper half is softly textured pale teal mist and distant mountain layers with ample calm negative space behind translucent UI panels; lower half has the farmland and greenhouse. Cool desaturated sage teal color grading with jade greens and warm amber accents. Make image bright enough to read translucent glass surfaces laid on top, not pitch dark. No text, no typography, no interface, no logos, no icons, no border. This is a standalone landscape bitmap, not a mockup. Save the generated image as a project usable asset.

## 复用素材

- `field-corn.jpg`, `field-soy.jpg`, `field-wheat.jpg`, `hero-field.jpg`, `leaf-disease.jpg`, `live-rover.jpg`, `live-feed.jpg`, `rover-real.jpg`：来自本项目现有 GitHub Pages `/m/images/`，保留原素材标识。
- `leaf.jpg` / `leaf.mp4`：复用用户工作区 `output/website-redesign/field-opening/leaf-dew.*`，视频压缩为 7 秒循环。
- `soil.jpg` / `soil.mp4`：复用用户工作区 V7 `soil_optical_head_10s.mp4` 的 7 秒演示片段与首帧。
- `rover.jpg` / `rover.mp4`：复用用户工作区 V7 `avoidance_no_probe_16s.mp4` 的 8 秒演示片段与首帧。
- 图片和视频均为功能素材示意，不代表实时摄像头、该次采样照片或新采集的农场记录。

## 界面覆盖

14 个页面均接入统一玻璃主题。13 个内页有独立场景题图：首页使用原田野视频和三个影像入口；任务列表有作业类型缩略图；作物、设备、采摘卡片有图；预警有风险示意图；报告含光谱采样视频；巡检有机器人视频和叶面动态素材。

视频按可见范围加载，离屏与后台暂停；支持独立播放/暂停及全站关闭动画。按钮包括悬停浮起、边缘高光、按下收缩、点击光波、图标位移和选中状态过渡。键盘操作亦有反馈，并尊重减少动态效果偏好。

## 2026-09-21 真实影像校正

农场地图和巡航视图改用真实农田遥感影像（加州戴维斯农田），地块轮廓按影像田埂布局重新绘制；业务标注和巡航轨迹仍为演示数据。底图是本地保存的影像快照，不是实时画面。

预警照片改为按预警 ID 独立映射的五种实拍参考：白粉病、蚜虫群落、大豆霜霉病、盐渍土壤、干燥土壤；不再按采样方式共用机器人和病斑素材。点击配图可以查看完整照片、适用说明、摄影作者、来源和许可。

完整来源、图片许可及保存日期见 [真实素材清单](public/media/real/SOURCES.md)。地图图片来自 Esri World Imagery，预警参考来自 Wikimedia Commons；本次未使用生成图片。
