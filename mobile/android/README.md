# 惠农智慧农场 Android

原移动端的离线安装版，应用包名 `cn.huinong.mobile`，版本 1.0.2（versionCode 3），最低 Android 8.0 (API 26)。页面、图片、卫星地图随 APK 安装；天气查询和外部设备控制页面需要网络。

1.0.2 修复安卓启动时 `net::ERR_HTTP_RESPONSE_CODE_FAILURE` 的打包根因：Windows AAPT2 的 `-A` 生成了 `assets/web\index.html` 等 ZIP 文件名，Android AssetManager 无法按 `web/index.html` 查找。Windows 解包会自动将反斜杠解释成目录，因此先前的解包浏览器测试漏掉了错误。现在 AAPT2 只处理 Android 资源，网页文件由打包脚本使用明确的 `/` 路径加入 APK。在签名前和签名后都直接读取 ZIP 原始目录，禁止反斜杠或重复项，逐项验证所有网页资源的完整路径和 SHA256。原生启动先通过 AssetManager 检查入口文件，并为主页面 HTTP 错误提供恢复界面。

1.0.1 加入 Chrome 58 起的兼容脚本及本地 polyfill，补齐动效库依赖的 AbortController。现代内核使用现代脚本，较旧内核自动选择兼容脚本。固定面板、导航与高度增加旧 CSS 支持。HTML 启动提示独立于 React，脚本失败和 React 渲染异常有重试入口，不清空记录。Android 外壳捕获内核初始化失败、处理显示进程退出，提供兼容模式与诊断复制；生命周期不再对未创建的 WebView 调用方法。

覆盖安装 1.0.2 即可从 1.0.0 / 1.0.1 升级，包名和签名保持相同。不要先卸载，否则 Android 会删除该应用的本地数据。兼容模式使用软件绘制，动画性能可能低于默认模式。

网页功能与安装包共用 `mobile/dist`。演示账号、任务、照片、预警、时间轴保存在当前设备，不代表云端账号或真实农业设备数据。应用不注入原生 JavaScript 桥，不申请文件存储、定位或摄像头权限；照片通过系统文件选择器授权读取。

构建：先在 mobile 运行 TypeScript 检查和 Vite build，然后执行：

```powershell
./android/build.ps1 -SdkRoot <SDK工具目录> -JdkRoot <JDK目录> -SigningDir <私有签名目录> -OutputDir <交付目录>
```

SDK 目录结构参考脚本中的 build-tools 36.0.0 / platform 36。Windows aapt2 不接受部分 Unicode 路径，因此脚本在同一盘符的 `huinong-android-build` 中暂存构建文件。

签名密钥保存在指定 SigningDir，密码由当前 Windows 账户的 DPAPI 保护。后续版本必须复用此密钥，递增 Manifest 的 versionCode。不要提交密钥或密码文件。构建脚本自动执行 APK 签名与 ZIP 对齐校验，并生成 SHA256SUMS.txt。

原始 APK 路径回归检查：`./android/verify-apk-assets.ps1 -ApkPath <安装包> -DistPath ./dist`。已确认此检查拒绝已发布的 1.0.1，并接受修复后的 1.0.2；不能以 Windows 解包后的文件存在检查代替它。

验证：`node scripts/verify-completion.mjs` 检查工作流和 39 个页面尺寸组合；`node scripts/verify-motion.mjs` 和 `verify-farm-sync.mjs` 检查原有动效、地图与巡检。APK 解包后用 `APK_ASSETS=<目录> node scripts/verify-android-assets.mjs` 检查离线资源与页面启动。原生系统文件选择器和不同厂商手机仍需在设备上验证。

增加 `LEGACY_ENGINE=1` 可强制加载 APK 兼容脚本并移除新 JS 接口，验证本地补丁、离线登录和全部主流程；`node scripts/verify-startup.mjs` 注入缺失脚本和 React 渲染错误，验证可恢复提示与数据保留。上述浏览器测试不等于 Android 原生运行测试。2026-10-02 的本机 Android 8 / 16 模拟器因主机环境启动失败，未取得设备运行结果，也没有小米 17 实机。
