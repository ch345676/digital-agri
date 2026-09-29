# 惠农智慧农场 Android

原移动端的离线安装版，应用包名 `cn.huinong.mobile`，版本 1.0.0，最低 Android 8.0 (API 26)。页面、图片、卫星地图随 APK 安装；天气查询和外部设备控制页面需要网络。设备需有较新的 Android System WebView。

网页功能与安装包共用 `mobile/dist`。演示账号、任务、照片、预警、时间轴保存在当前设备，不代表云端账号或真实农业设备数据。应用不注入原生 JavaScript 桥，不申请文件存储、定位或摄像头权限；照片通过系统文件选择器授权读取。

构建：先在 mobile 运行 TypeScript 检查和 Vite build，然后执行：

```powershell
./android/build.ps1 -SdkRoot <SDK工具目录> -JdkRoot <JDK目录> -SigningDir <私有签名目录> -OutputDir <交付目录>
```

SDK 目录结构参考脚本中的 build-tools 36.0.0 / platform 36。Windows aapt2 不接受部分 Unicode 路径，因此脚本在同一盘符的 `huinong-android-build` 中暂存构建文件。

签名密钥保存在指定 SigningDir，密码由当前 Windows 账户的 DPAPI 保护。后续版本必须复用此密钥，递增 Manifest 的 versionCode。不要提交密钥或密码文件。构建脚本自动执行 APK 签名与 ZIP 对齐校验，并生成 SHA256SUMS.txt。

验证：`node scripts/verify-completion.mjs` 检查工作流和 39 个页面尺寸组合；`node scripts/verify-motion.mjs` 和 `verify-farm-sync.mjs` 检查原有动效、地图与巡检。APK 解包后用 `APK_ASSETS=<目录> node scripts/verify-android-assets.mjs` 检查离线资源与页面启动。原生系统文件选择器和不同厂商手机仍需在设备上验证。
