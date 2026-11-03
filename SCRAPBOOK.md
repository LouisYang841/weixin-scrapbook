# 把喜欢，贴进纸里

基于 https://github.com/KeJunMao/mono-flipbook 的 Three.js 翻页引擎制作。

图片来自本机 `/storage/emulated/0/Pictures/WeiXin`，共 10 张。原图不做覆盖修改，网页使用项目内副本。原画中的署名和文字通过完整显示保留。页面短句是本次编排添加的文字，不代表画作者原意。

12 页结构：封面；生日来信（3 页）；线条与陪伴（4 页）；蓝色小心情（3 页）；尾页。奶油纸纹、雾蓝与鼠尾草绿胶带、错落的相纸框与便签形成手作剪贴簿风格。

`src/paper-relief.ts` 绘制相纸厚边、微拱表面、底部翘角与半透明胶带的高光和接触阴影。浮雕效果在书页生成时一次性合成，随原翻页引擎弯曲，不增加独立 3D 图层或持续动画。

`src/scrapbook-pages.ts` 在浏览器中生成书页纹理；`src/scrapbook.ts` 提供目录、翻页、键盘控制和平面阅读；`src/scrapbook.css` 提供响应式界面。原有工作台源码保留，入口改为收藏阅读器。

## 本地运行

```sh
npm install
npm run dev -- --host 127.0.0.1
```

## 构建

```sh
npm run build
```

将 `dist/` 作为静态网站托管。网页无第三方字体或图片请求；需要现代浏览器，卷曲翻页需要 WebGL，不支持时自动转为平面阅读。本版本发布于公开 GitHub 仓库与 GitHub Pages。每次向 main 推送会自动构建与部署。

构建通过 TypeScript 与 Vite 校验；浮雕绘图已用本地 Canvas 实现生成全部 12 页，并检查封面、竖图和横图样页；当前 Termux 环境没有可用浏览器，尚未执行真实浏览器的桌面/触摸翻页验证。原仓库来源及素材说明见 README.md。
