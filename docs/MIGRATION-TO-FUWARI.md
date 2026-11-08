# 从 Hexo + Ayer 迁移到 Astro + Fuwari

> 目标站点：https://sunforyou.top（GitHub Pages 用户站 `SunforYou0/SunforYou0.github.io`）
> 现有站点：Hexo 7.0.0 + hexo-theme-ayer 1.9.7，2 篇文章 + 1 个 about 页
> 本文档按你当前仓库 `E:\MyBlog` 的实际情况编写，可以直接照着做。

**实施状态（2026-11-07）：全部完成，已上线。**

- 新项目：`E:\MyBlog`（Fuwari，Astro 5.13.10）
- 便携 Node 22：`E:\MyBlog\.tools\node22`；pnpm 9：`E:\MyBlog\.tools\pnpm9`
- 启动方式：在 `E:\MyBlog` 里执行 `. .\use-node22.ps1`，然后 `pnpm dev` / `pnpm preview`
- 旧站备份：本地 Hexo 已按要求清理；GitHub 上旧 main 保留为 `hexo-legacy` 分支，可随时回滚
- 已构建并通过预览检查：`pnpm build` 成功，`dist/` 已生成；两篇文章、about、数学公式、图片、RSS、sitemap、Pagefind 均验证通过
- 部署：GitHub Actions（`.github/workflows/deploy.yml`）已成功运行，`https://sunforyou.top` 已切换到新站
- 按你的要求未做旧链接兼容，`/2023/10/22/黑夜随想/`、`/archives/`、`/atom.xml` 等旧地址会 404

---

## 0. 先看清现状（迁移前盘点）

| 项目 | 现状 | 迁移影响 |
| --- | --- | --- |
| 生成器 | Hexo 7.0.0 | 全部替换为 Astro 5 + Fuwari |
| 主题 | Ayer（`themes/ayer`，配置在 `themes/ayer/_config.yml`） | 主题功能需逐项取舍 |
| 文章 | `source/_posts/` 下 2 篇 | 数量少，手改即可 |
| 独立页面 | `source/about/index.md` | 改为 `src/content/spec/about.md` |
| 永久链接 | `:year/:month/:day/:title/`，例如 `/2023/10/22/黑夜随想/` | 改为 Fuwari 的 `/posts/<slug>/`，**不做旧链接重定向**（按你的要求） |
| 分类/标签 | 分类 `随想`、`Agent/LLM`；标签 `Agent`、`LLM`、`Temperature` | Fuwari 分类是**单个字符串**，标签是数组 |
| 搜索 | `hexo-generator-searchdb` → `/search.xml` | Fuwari 用 Pagefind（构建后生效） |
| RSS | `/atom.xml` | Fuwari 用 `/rss.xml`，直接用新地址 |
| 站点地图 | `/sitemap.xml`、`/baidusitemap.xml` | Fuwari 用 `/sitemap-index.xml` |
| 评论 | Twikoo 开关打开但 `envId` 为空（生成 HTML 里是 `envId: ""`） | 实际上从未生效，没有评论数据要迁 |
| 统计 | 不蒜子 + CNZZ（`web_id=1278069914`） | Fuwari 无内置，需自己加脚本 |
| 域名/部署 | `hexo-deployer-git` 把 `public/` 推到 `SunforYou0.github.io` 的 `main` | 建议改成“源码仓库 + GitHub Actions + Pages” |
| 静态文件 | `CNAME`、`robots.txt`、`404.html`、Google/百度验证文件、`favicon.ico`、`public/images/*` | CNAME/验证文件/favicon/images 要搬；旧 404、旧 sitemap、search.xml 不用搬 |
| 本机环境 | Node **v26.13.0**、npm 12.2.1、**未安装 pnpm**、npm 缓存指向 `D:\ProgramFiles\nodejs\node_cache`（无写权限） | 需要先处理，见第 2 节 |

> 关键结论：**内容迁移本身很轻（2 篇文章），真正的工作量在“样式/功能取舍 + 部署方式切换”。**

---

## 1. 选择迁移路线

### 方案 A（推荐）：新目录 + 新项目，旧站保持在线，验证后再切换

```
E:\MyBlog                 ← 保持不动，继续作为备份/回滚
E:\MyBlog-astro           ← 新建 Fuwari 项目
```

优点：随时可回滚；旧站一直可访问；不用在 Hexo 仓库里大改。
缺点：最后需要改一次 GitHub Pages 的部署来源。

### 方案 B：原地改造（不推荐）

在 `E:\MyBlog` 里删掉 Hexo、直接建 Astro。回滚成本高，而且 `E:\MyBlog` 目前**不是 git 仓库**（只有 `.deploy_git`），误删后不好恢复。

> 本文按方案 A 编写；方案 B 的步骤只是把目录换成 `E:\MyBlog`。

---

## 2. 环境准备（重点，先解决本机问题）

Fuwari 官方要求 **Node.js ≥ 20、pnpm ≥ 9**，其 CI 在 Node 22 / 23 上验证；仓库当前锁定的 Astro 版本是 5.13.10，最后一轮依赖更新在 2025-12。

**建议不要直接用本机的 Node 26。** Fuwari 官方 CI 只在 Node 22 / 23 上验证，Astro 5.13 也不是为 Node 26 发布的；我在本机用 Node 26 + pnpm 9 安装依赖时曾遇到：

```
ERR_PNPM_SYMLINK_FAILED  Maximum call stack size exceeded
```

（也可能是 Windows 符号链接权限/缓存目录引起，但换到 Node 22 最省事。）

**推荐做法：不动系统里的 Node 26，只给这个项目用一个“便携版 Node 22”。**

你当前是单版本直装（`D:\ProgramFiles\nodejs`），全局装过 `@anthropic-ai/claude-code`、`@volcengine/ark-cli`、`hexo-cli`、`webpack`，而且 `~/.npmrc` 把全局目录固定成了 `D:\ProgramFiles\nodejs\node_global`。直接覆盖安装 Node、或改用 nvm-windows 全局切换，都可能影响这些工具；便携版 + 临时 PATH 对它们**零影响**。

```powershell
# 1) 下载 Node 22 的 Windows x64 zip（nodejs.org → Prebuilt Binaries），
#    解压到例如 E:\tools\node22（不要覆盖 D:\ProgramFiles\nodejs）
# 2) 只在当前终端临时使用 Node 22
$env:Path = "E:\tools\node22;$env:Path"
$env:npm_config_cache = "$env:LOCALAPPDATA\npm-cache"   # 绕开不可写的默认缓存目录
node -v          # v22.x

# 3) 用 Node 22 自带的 corepack 启用 pnpm 9
corepack enable
corepack prepare pnpm@9.14.4 --activate
pnpm -v          # 9.14.4
```

关闭这个终端后，系统默认仍是 Node 26，Claude Code / hexo / webpack 都不受影响。以后重开终端时先设置一次 PATH，或者在项目根放一个 `use-node22.ps1`：

```powershell
# E:\MyBlog-astro\use-node22.ps1
$env:Path = "E:\tools\node22;$env:Path"
$env:npm_config_cache = "$env:LOCALAPPDATA\npm-cache"
```

> 备选：fnm（按 shell 切换，不污染系统默认版本）。
> **不推荐** nvm-windows（它切换的是系统级符号链接，会影响所有新终端）和直接覆盖安装。
> 全局 npm 配置里，`cache` 可以安全地改到 `%LOCALAPPDATA%\npm-cache`；但**不要**轻易删掉 `prefix`，否则 `hexo-cli`、`claude-code` 等全局命令可能找不到。

**备份旧站**（在动手前做）：

```powershell
Compress-Archive -Path E:\MyBlog\source,E:\MyBlog\themes,E:\MyBlog\_config.yml,E:\MyBlog\package.json -DestinationPath "$env:USERPROFILE\Desktop\MyBlog-hexo-backup.zip"
```

> `E:\MyBlog\.deploy_git` 里是已经发布过的整站 HTML，回滚时也用得上，一起留好。

---

## 3. 创建 Fuwari 项目

```powershell
# 方式 1：官方脚手架（推荐，交互式，按提示把项目名填成 MyBlog-astro）
cd E:\
pnpm create fuwari@latest

# 方式 2：直接克隆官方模板
git clone https://github.com/saicaca/fuwari.git E:\MyBlog-astro
cd E:\MyBlog-astro
Remove-Item .git -Recurse -Force
git init
```

安装并启动：

```powershell
cd E:\MyBlog-astro
pnpm install
pnpm dev          # http://localhost:4321
```

常用命令：

| 命令 | 作用 |
| --- | --- |
| `pnpm dev` | 本地开发 |
| `pnpm build` | 生产构建（会顺带跑 Pagefind 生成搜索索引） |
| `pnpm preview` | 预览构建结果（**搜索只在构建后可用**） |
| `pnpm new-post <文件名>` | 新建文章 |
| `pnpm check` | Astro/TypeScript 检查 |

> 说明：Fuwari 是 Astro + Tailwind 的静态博客模板，自带暗色模式、TOC、Pagefind 搜索、RSS、sitemap、Expressive Code 代码块、图片灯箱（PhotoSwipe）。**它没有内置评论系统**（README 里“评论”一项是未勾选状态）。

---

## 4. 站点配置：`src/config.ts`

把官方示例改成你的信息（重点是这些字段）：

```ts
export const siteConfig: SiteConfig = {
	title: "云中小屋",
	subtitle: "技术博客",
	lang: "zh_CN",
	themeColor: { hue: 250, fixed: false },   // 0-360，按喜好调；Ayer 偏蓝紫可先用 250
	banner: {
		enable: true,
		src: "assets/images/banner.jpg",        // 相对 /src；放 src/assets/images/ 下可自动优化
		position: "center",
		credit: { enable: false, text: "", url: "" },
	},
	toc: { enable: true, depth: 2 },
	favicon: [{ src: "/favicon.ico" }],       // 也可以放 png 并区分 light/dark
};

export const navBarConfig: NavBarConfig = {
	links: [
		LinkPreset.Home,
		LinkPreset.Archive,
		LinkPreset.About,
		{ name: "GitHub", url: "https://github.com/SunforYou0", external: true },
	],
};

export const profileConfig: ProfileConfig = {
	avatar: "assets/images/avatar.png",       // 可用 /images/ayer.png
	name: "SunYu",
	bio: "新手程序员的技术博客与随想记录",
	links: [
		{ name: "GitHub", icon: "fa6-brands:github", url: "https://github.com/SunforYou0" },
		{ name: "Email", icon: "fa6-solid:envelope", url: "mailto:sunforyu@163.com" },
	],
};

export const licenseConfig: LicenseConfig = {
	enable: true,
	name: "CC BY-NC-SA 4.0",
	url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
};
```

需要手动准备的素材：

```powershell
# 封面图（原 Ayer 的 cover11.jpg），想用哪张换成哪张
Copy-Item E:\MyBlog\public\images\cover11.jpg E:\MyBlog-astro\src\assets\images\banner.jpg
# 头像
Copy-Item E:\MyBlog\public\images\ayer.png E:\MyBlog-astro\src\assets\images\avatar.png
```

注意：

- `siteConfig` **没有**全局 `description` / `keywords` 字段。Hexo 里的站点描述要么舍弃，要么改 `src/layouts/Layout.astro` 或给具体页面传 `description`。
- 首页每页文章数固定为 `PAGE_SIZE = 8`，在 `src/constants/constants.ts`；Hexo 原来是 10，想一致就改成 10。
- 导航栏只有 Home / Archive / About 三个预设，Fuwari 不再有独立的 `/categories`、`/tags` 页面（都在归档页里用查询参数筛选）。

---

## 5. 文章迁移（核心）

### 5.1 Frontmatter 字段映射

Fuwari 的 `src/content/config.ts` 只接受这些字段：

```ts
title: string          // 必填
published: Date        // 必填
updated?: Date
draft?: boolean        // 默认 false
description?: string   // 默认 ""
image?: string         // 封面图，默认 ""
tags?: string[]        // 默认 []
category?: string      // 默认 ""（注意：单个字符串）
lang?: string          // 仅在和站点语言不同时填
```

| Hexo 字段 | Fuwari 字段 | 说明 |
| --- | --- | --- |
| `title` | `title` | 原样 |
| `date: 2023-10-22 00:00:35` | `published: 2023-10-22 00:00:35` | 保留原值，**不要补 `+08:00`**（见下方时区说明） |
| `updated`（Hexo 用文件 mtime） | `updated` | 可选，想保留就写 |
| `tags: [Agent, LLM]` | `tags: [Agent, LLM]` | 数组，换行/行内都行 |
| `categories: Agent/LLM` | `category: Agent/LLM` | **只能一个字符串**；多级分类要么拍平成一级，要么保留 `Agent/LLM` 这串文字 |
| `<!--more-->` | 删除 | Fuwari 没有摘要标记；用 `description`，不填则取正文第一段 |
| `type/layout/comments/mathjax` 等 | 删除 | Fuwari 用不到，数学和目录是全局开启 |
| 文件名（隐含 `:title`） | 文件名决定 `slug` | URL 变为 `/posts/<slug>/`，建议用英文短 slug |

**时区坑**：Fuwari 用 `date.toISOString().substring(0,10)` 显示日期，等于按 UTC 取日期。YAML 里 `2023-10-22 00:00:35` 这种不带时区的时间会被当作 UTC，显示出来仍是 2023-10-22，正好和原来一致；如果你写成 `2023-10-22T00:00:35+08:00`，在 UTC 构建机上会显示成 2023-10-21。所以**保持原样（不带时区）最稳**。

### 5.2 两篇文章的具体改法

**`source/_posts/黑夜随想.md` → `src/content/posts/night-thoughts.md`**

```markdown
---
title: 黑夜随想
published: 2023-10-22 00:00:35
description: 短诗一首：夜晚的车灯把我变成两个影子，一个向左，一个向右。
tags: []
category: 随想
draft: false
---

夜晚的车灯把我变成俩个影子，
一个向左，
一个向右。
而我在中间，
找不到前进的方向。
```

（删掉 `<!--more-->`；“短诗一首”可作为描述，也可以直接删掉。）

**`source/_posts/为什么Temperature设为0后，相同的输入下模型的输出还是随机的？.md` → `src/content/posts/llm-temperature-zero-randomness.md`**

```markdown
---
title: 为什么Temperature设为0后，相同的输入下模型的输出还是随机的？
published: 2026-11-03 20:30:13
description: 即使 temperature=0，大模型的输出也可能变化。本文从 softmax 原理、采样随机性、浮点与推理引擎实现三层解释随机性从何而来。
tags: [Agent, LLM, Temperature]
category: Agent/LLM
draft: false
---

## 1 引子   ← 按 5.6 的建议把正文标题整体降一级
...
```

正文其余部分基本不用改，但见 5.3–5.6 的几个注意点。

### 5.3 文件名与 URL

- 推荐英文 slug：`night-thoughts`、`llm-temperature-zero-randomness`，URL 更干净、分享/复制更友好。
- 直接用中文文件名也能构建（URL 会变成百分号编码，例如 `/posts/%E9%BB%91%E5%A4%9C%E9%9A%8F%E6%83%B3/`），但不建议。
- 旧链接会直接失效，不做兼容（见第 7 节）。

### 5.4 图片与静态资源

文章里的图片用的是绝对路径：

```markdown
![不同 Temperature 取值下的概率分布](/images/temperature.svg)
```

处理方式二选一：

```powershell
# 方式 1（最省事）：保持绝对路径，把原图片全部复制到 public/images/
New-Item -ItemType Directory -Force E:\MyBlog-astro\public\images | Out-Null
Copy-Item E:\MyBlog\source\images\* E:\MyBlog-astro\public\images\ -Recurse
Copy-Item E:\MyBlog\themes\ayer\source\images\* E:\MyBlog-astro\public\images\ -Recurse
```

```markdown
<!-- 方式 2：用文章资源目录，交给 Astro 优化（新文章推荐） -->
src/content/posts/llm-temperature-zero-randomness/
  index.md
  temperature.svg
```

正文中写成 `![...](./temperature.svg)`，封面用 frontmatter 的 `image: ./cover.jpg`。

另外记得把站点级静态文件搬过去：

```powershell
Copy-Item E:\MyBlog\source\CNAME                E:\MyBlog-astro\public\CNAME
Copy-Item E:\MyBlog\source\robots.txt           E:\MyBlog-astro\public\robots.txt   # 注意与 Fuwari 自动生成的 robots 冲突，二选一
Copy-Item E:\MyBlog\source\favicon.ico          E:\MyBlog-astro\public\favicon.ico
Copy-Item E:\MyBlog\source\google3e81ee6efa252534.html E:\MyBlog-astro\public\
Copy-Item E:\MyBlog\source\92dd015aaa0e4456a20653cf8518270d.txt E:\MyBlog-astro\public\
```

> Fuwari 自带 `src/pages/robots.txt.ts` 会生成 robots.txt（含 sitemap 地址）。如果你要保留旧 `robots.txt`，就删掉这个路由文件，否则以路由生成的为准。

### 5.5 数学公式

原文用 Hexo + MathJax，Fuwari 内置 `remark-math + rehype-katex`，`$...$`、`$$...$$` 语法兼容，不需要在文章里加 `mathjax: true`。

但两套渲染器仍有差异，重点检查：

- `\begin{cases}` 里的换行在源码里是 `\\\\`（Markdown 转义后交给 KaTeX 的是 `\\`），构建后应正常换行；
- `\operatorname`、`\xrightarrow`、`\mathrm`、`\big/\sum` 这些 KaTeX 都支持；
- `$y_{<t}$` 里的 `<` 在 Markdown 数学块中不会被当成 HTML；
- 极少数 MathJax 专有宏（`\tag`、`\label`、`\color` 等）KaTeX 行为不同，遇到再改；
- 上线前务必打开第二篇文章逐段对照公式。

### 5.6 标题层级、HTML 与代码块

- **标题层级**：Fuwari 的文章标题已经是 `<h1>`，而你的正文从 `# 1 引子` 开始（也是 h1）。建议把正文标题整体降一级（`#`→`##`、`##`→`###`），否则目录和 SEO 层级会乱。注意别改到代码块里的 `#` 注释。
- **HTML**：Astro 的 Markdown 默认允许内嵌 HTML，文章末尾的 `<a id="ref-1"></a>` 这类锚点可以保留。
- **代码块**：` ```python ` 之类保持原样即可；Fuwari 用 Expressive Code，自带行号、复制按钮、折叠。
- `<!--more-->` 删除；如果以后想手动控制摘要，写 `description` 即可。

---

## 6. 独立页面与其它页面

### About

`source/about/index.md` 的内容（去掉 Hexo frontmatter）放到：

`src/content/spec/about.md`

```markdown
现为国内某教育行业头部公司后端开发，积极学习 LLM 和 Agent 中。工作机会和技术交流请加微信 SunRising62 或电子邮箱 sunforyu@163.com。
```

Fuwari 的 `/about/` 页面会自动渲染这个文件；个人头像/昵称/社交链接在 `src/config.ts` 的 `profileConfig` 里配。

### 404

Fuwari 没有 404 页面，需要的话新建 `src/pages/404.astro`（可以简单写一个“页面不存在，返回首页”的页面）；否则 GitHub Pages 会显示默认 404。

### 归档 / 分类 / 标签

- 归档：`/archive/`（注意是单数，原来 `/archives/`）
- 分类/标签：没有独立页面，统一在 `/archive/` 里通过 `?category=`、`?tag=` 筛选
- 首页分页：`/2/`、`/3/`…（和原来一致）

---

## 7. URL 策略（按你的要求：不做旧链接兼容）

既然不需要兼容旧链接，这一节可以大幅简化：**不配置 redirects，不保留 `/atom.xml`、`/sitemap.xml` 等旧地址。**

新站 URL 规则：

| 类型 | 地址 |
| --- | --- |
| 文章 | `/posts/<slug>/`，例如 `/posts/night-thoughts/` |
| 归档 | `/archive/` |
| 分类/标签筛选 | `/archive/?category=...`、`/archive/?tag=...` |
| 关于 | `/about/` |
| 搜索 | 页面内 Pagefind 搜索（没有独立的 search.xml） |
| RSS | `/rss.xml` |
| sitemap | `/sitemap-index.xml` |

上线后会发生什么：

- 旧链接（`/2023/10/22/黑夜随想/`、`/archives/`、`/categories/...`、`/tags/...`、`/atom.xml`、`/search.xml`）会直接 404，**这是预期行为**。
- 到 Google Search Console / 百度搜索资源平台提交新的 `/sitemap-index.xml`；搜索引擎抓取后会逐步换成新地址，旧收录会自然衰减。
- 站内如果以后引用了自己的旧文章地址，记得手动换成新 URL（目前两篇文章里没有这种情况）。
- 可选项：新建一个简单的 `src/pages/404.astro`，引导访客回首页/归档，减少旧链接 404 的负面体验。

### 7.1 站点地图与 canonical

- `astro.config.mjs` 里 `site: "https://sunforyou.top/"` 必须正确，RSS、sitemap、canonical/OG 都依赖它。
- Fuwari 的 sitemap 是 `/sitemap-index.xml`，上线后重新提交。
- 旧的 Google/百度验证文件要保留到 `public/`，否则原验证可能失效。

---

## 8. 功能对照与取舍

| 原 Ayer 功能 | Fuwari | 处理建议 |
| --- | --- | --- |
| 首页文章列表 + 分页 | ✅ 内置（每页 8 篇，可改） | 直接可用 |
| 暗色模式 | ✅ 内置 | 直接可用 |
| 文章 TOC | ✅ 内置 | `siteConfig.toc` 配置 |
| 字数 / 阅读时间 | ✅ 内置 | 直接可用 |
| 代码高亮 + 复制按钮 | ✅ Expressive Code | 直接可用 |
| 图片点击放大 | ✅ PhotoSwipe | 直接可用 |
| 搜索 | ✅ Pagefind | `pnpm build` 后生效；中文效果需实测 |
| RSS | ✅ `/rss.xml` | 直接用新地址，不保留 `/atom.xml` |
| sitemap | ✅ `/sitemap-index.xml` | 重新提交 |
| 归档 / 分类 / 标签 | ⚠️ 归档页 + 查询参数 | 导航去掉分类/标签入口 |
| 评论（Twikoo） | ❌ 无内置 | 你原先 `envId` 为空、实际没启用；要评论就自己集成 Twikoo/Giscus |
| 不蒜子访问量 | ❌ 无内置 | 自己加脚本，或舍弃（新站计数本来也会清零） |
| CNZZ 统计 | ❌ 无内置 | 如需保留：加 CNZZ 脚本；建议改用 Umami/Plausible |
| 分享按钮 | ❌ 无内置 | 舍弃或自己加 |
| 打赏（支付宝二维码） | ❌ 无内置 | 舍弃或做成 about 页内容 |
| 版权声明 | ✅ License 组件 | 配 `licenseConfig` |
| 封面 / 背景图 | ✅ Banner | 配 `siteConfig.banner` |
| 打字副标题 / 一言 / 进度条 / 点击特效 / 鼠标样式 / 音乐 | ❌ 都没有 | 建议全部舍弃；要的话需要自己写组件 |
| GitHub Ribbon | ⚠️ 用 profile 链接替代 | 配置 `profileConfig.links` |
| 404 页面 | ❌ 需自建 | 新建 `src/pages/404.astro` |

> 建议：**第一版先追求“内容 + 阅读体验”对齐**，评论、统计、打赏、花哨特效这些可以后补，不要卡住迁移。

---

## 9. 部署到 GitHub Pages

### 9.1 现状与目标

- 现状：`hexo deploy` 把 `public/` 推到 `SunforYou0/SunforYou0.github.io` 的 `main` 分支，GitHub Pages 从该分支发布。
- 目标：仓库里放 **Astro 源码**，由 GitHub Actions 构建并发布到 Pages；域名 `sunforyou.top` 不变。

### 9.2 配置 `astro.config.mjs`

```js
export default defineConfig({
	site: "https://sunforyou.top/",
	base: "/",           // 用户站根路径；如果是 project 站才需要 /repo-name
	trailingSlash: "always",
	// ...
});
```

`public/CNAME` 内容：

```
sunforyou.top
```

### 9.3 GitHub Actions 工作流

新建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v7
      - name: Install, build and upload
        uses: withastro/action@v6
        with:
          node-version: 22        # Fuwari 在 22/23 验证；不要用默认的 24/26 冒险
          # build-cmd: pnpm run build   # 默认就是跑 package.json 的 build（含 pagefind）

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy
        id: deployment
        uses: actions/deploy-pages@v5
```

要点：

- `pnpm-lock.yaml` **必须提交**，Action 靠它识别包管理器；Fuwari 的 `preinstall` 也强制只允许 pnpm。
- `withastro/action` 会自动 `pnpm install` 并执行 `pnpm run build`；Fuwari 的 build 脚本是 `astro build && pagefind --site dist`，所以搜索索引会自动生成。
- 到仓库 **Settings → Pages → Source** 选 **GitHub Actions**；首次部署后在 Pages 设置里确认 Custom domain 是 `sunforyou.top`，并勾选 **Enforce HTTPS**。
- DNS 不用动（原来就指向 GitHub Pages）。证书在切换后可能重新签发，等几分钟即可。
- Actions 产物部署不需要 `.nojekyll`；但保留也无害。

### 9.4 仓库怎么切

推荐流程：

```powershell
# 1) 先备份 GitHub 上的旧仓库（可选但强烈建议）
git clone https://github.com/SunforYou0/SunforYou0.github.io E:\github-pages-backup

# 2) 在本地新项目里提交
cd E:\MyBlog-astro
git add -A
git commit -m "chore: migrate blog from Hexo to Astro + Fuwari"
git branch -M main

# 3) 关联原仓库并推送（注意：这会覆盖 main 分支上的旧构建产物）
git remote add origin https://github.com/SunforYou0/SunforYou0.github.io.git
git push -u origin main --force
```

如果不想 force push，也可以：

- 新建仓库（例如 `blog`），先部署到 `https://sunforyou.top` 以外的地方验证；
- 或者用 `gh-pages` 分支方案：`main` 放源码，Actions 构建后推 `dist` 到 `gh-pages`，Pages 从 `gh-pages` 发布（多一步，但能保留旧构建历史）。

### 9.5 平滑切换 / 回滚

1. 先在本地 `pnpm build && pnpm preview` 完整验收（第 10 节）。
2. 可先把新站部署到 Vercel/Cloudflare Pages 的临时域名，逐页对比旧站。
3. 确认无误后再把 GitHub Pages 的 Source 改为 GitHub Actions、推送源码。
4. 回滚：把旧仓库备份重新推回 `main` 并恢复 Pages Source 为分支即可；旧 Hexo 工程 `E:\MyBlog` 和 `.deploy_git` 都保留着。

---

## 10. 验收清单（上线前逐项打勾）

- [ ] `pnpm build` 无报错，`pnpm preview` 能打开
- [ ] 首页两篇文章卡片标题、日期、标签、分类、摘要正确
- [ ] 两篇文章详情页：正文完整、代码块高亮、TOC 正常
- [ ] 第二篇文章所有公式渲染正确（重点：`cases`、`\xrightarrow`、表格里的 `$`）
- [ ] `/images/temperature.svg` 图片能显示、能点开灯箱
- [ ] `/about/` 内容正确，头像/昵称/GitHub/邮箱链接正确
- [ ] `/archive/` 能按标签、分类筛选，按年份分组正常
- [ ] 搜索：`pnpm build` 后搜索中英文关键词都有结果（中文效果重点看）
- [ ] `/rss.xml` 可访问、内容正确（不保留 `/atom.xml`）
- [ ] `/sitemap-index.xml` 可访问且包含两篇文章
- [ ] 旧链接（如 `/2023/10/22/黑夜随想/`）返回 404，确认这是可接受的预期行为
- [ ] 404、robots.txt、CNAME、Google/百度验证文件都正常
- [ ] 手机窄屏、暗色模式、导航、页脚正常
- [ ] GitHub Pages 自定义域名 + HTTPS 正常，`https://sunforyou.top` 打开的是新站
- [ ] Google Search Console / 百度搜索资源平台提交新 sitemap，观察旧链接 404 情况

---

## 11. 风险与取舍

| 风险 | 说明 | 应对 |
| --- | --- | --- |
| **Fuwari 依赖较旧** | 官方 main 最后更新 2025-12，Astro 锁在 5.13.10（当前 Astro 已到 v7），Node 要求 20–23 | 用官方版本最稳；想追新需自行升级依赖并测试，或换维护中的 fork |
| **Node 版本** | 本机 Node 26 偏新；用 pnpm 9 安装依赖时曾失败（也可能是符号链接权限/缓存问题） | 装 Node 22 LTS 开发；CI 固定 `node-version: 22` |
| **URL 改变** | 旧文章/分类/标签地址会直接 404（已确认可接受） | 不做重定向；如需减少体验损失，可加一个友好的 404 页面 |
| **中文 slug/搜索** | 中文文件名可用但 URL 编码长；Pagefind 中文分词效果需实测 | 用英文 slug；搜索不理想就换 Algolia/Fuse.js |
| **评论/统计/打赏/分享** | Fuwari 都没有内置 | 按需自己加（Twikoo/Giscus、Umami/CNZZ、组件），或舍弃 |
| **Ayer 视觉风格** | 封面、打字副标题、一言、点击特效等都没有 | 接受 Fuwari 风格，或用 `src/styles/*` 自行定制 |
| **数学公式细节** | MathJax → KaTeX 有少量语法差异 | 上线前逐段校对 |
| **无 git 历史** | `E:\MyBlog` 不是 git 仓库 | 迁移前先 zip 备份；新项目 `git init` 从头管理 |

---

## 12. 建议的执行顺序（一天内可完成）

1. **备份**旧站 + 安装 Node 22 / pnpm 9（30 分钟，最容易卡住）
2. 新建 Fuwari 项目，`pnpm dev` 跑起来（15 分钟）
3. 改 `src/config.ts`（标题、语言、banner、头像、导航、profile）（30 分钟）
4. 迁移 2 篇文章 + about + 图片（30 分钟）
5. 搬静态文件（CNAME、验证文件、图片），确认新 URL 策略（15 分钟）
6. 本地 `pnpm build && pnpm preview` 逐项验收（1 小时，公式和图片多花点时间）
7. 配 GitHub Actions、切换 Pages、确认域名/HTTPS（30 分钟）
8. 提交 sitemap，观察新链接收录情况

---

## 附：可直接用的片段

### A. 不蒜子统计（可选，加到 `src/layouts/Layout.astro` 的 `</body>` 前）

```html
<script defer src="//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js"></script>
```

访问量显示的位置可以放在 `src/components/Footer.astro` 里：

```html
<span id="busuanzi_container_site_pv">
  本站访问 <span id="busuanzi_value_site_pv"></span> 次
</span>
```

> CNZZ 同理：把原 Ayer 里的 `z_stat.php?id=...` 脚本加到 Layout 即可；但要清楚第三方统计的隐私/可用性风险，建议顺手换成 Umami 之类。
