# 用 Obsidian 写博客

本文档说明如何在 Obsidian 里写作、预览，并让 Astro/Fuwari 正常构建。

## 1. 目录结构

每篇文章是一个目录，正文固定叫 `index.md`，文章配图放在同目录的 `assets/` 下：

```text
src/content/
  _templates/post.md                ← Obsidian 模板（Astro 会忽略下划线目录）
  posts/
    llm-temperature-zero-randomness/
      index.md                      ← 正文
      assets/temperature.svg        ← 文章配图
    night-thoughts/
      index.md
  spec/about.md
```

- `/index` 会被 Astro 从 slug 中自动去掉，所以文章 URL 是 `/posts/llm-temperature-zero-randomness/`，与扁平文件时一致。
- 全站共用图片（banner、头像、favicon）继续放在 `public/images/`，用 `/images/...` 绝对路径，不要和文章配图混在一起。
- `src/content/_templates/` 以下划线开头，Astro 不会把它当成文章。

## 2. Obsidian 设置

把 vault 指向 `E:\MyBlog\src\content`（**不要**指向仓库根目录，否则 `node_modules`、`.tools` 会被一起索引，Obsidian 会非常慢）。

设置 → 文件与链接（Files & Links）：

| 设置项 | 值 |
| --- | --- |
| 使用 `[[Wikilinks]]` | 关 |
| 新链接格式 | 相对当前文件路径 |
| 新附件默认位置 | 当前文件夹下的子文件夹 → `assets` |
| 自动更新内部链接 | 开 |
| 删除文件 | 系统回收站 |

设置 → 模板（核心插件）：

- 模板文件夹：`_templates`
- 新建笔记时可以手动套用 `post.md` 模板；也可以装 Templater/QuickAdd 做一键新建 `<slug>/index.md`。

Obsidian 的 `.obsidian/`、`.trash/` 已在 `.gitignore` 中忽略，不会被提交。

## 3. 新建一篇文章

1. 在 `posts/` 下新建文件夹，名字用英文 slug（例如 `my-new-post`）；
2. 在文件夹里新建笔记 `index`；
3. 套用 `_templates/post.md`，填写 `title`、`description`、`tags`、`category` 等属性，`draft` 先保持 `true`；
4. 正常写作。截图直接粘贴，会存进同目录的 `assets/`，链接自动是相对路径，Obsidian 里可以直接预览；
5. 写完把 `draft` 改成 `false`，跑一次 `pnpm build` 确认，再提交。

也可以命令行创建（会生成 `<slug>/index.md` 和默认 frontmatter）：

```powershell
. .\use-node22.ps1
pnpm new-post my-new-post "我的新文章标题"
```

## 4. 本地预览

```powershell
. .\use-node22.ps1
pnpm dev          # 浏览器打开 http://localhost:4321
```

Obsidian 里保存后 Astro dev 会自动热更新，可以对着浏览器看最终效果。

## 5. 写作注意事项

- **公式**：Obsidian 预览用 MathJax，站点构建用 KaTeX，常规 `$...$`/`$$...$$` 一致；`\tag` 等少数宏行为不同，发布前以 `pnpm build` 结果为准。
- **Callout**：Fuwari 的 admonitions 从 GitHub 风格语法转换，**区分大小写**，请写 `> [!NOTE]`、`> [!TIP]`、`> [!IMPORTANT]`、`> [!WARNING]`、`> [!CAUTION]`；Obsidian 的 `[!info]`、`[!todo]` 等类型不支持。
- **标签**：只写在 frontmatter 的 `tags:` 里，不要在正文里用 `#标签`（Obsidian 的正文标签 Fuwari 不识别）。
- **图片**：建议用英文短横线命名；Obsidian 默认的 `Pasted image 2026-....png` 带空格也能构建，但仓库和 URL 不美观。改文件名时 Obsidian 会自动更新链接（前提是上面的「自动更新内部链接」已开启）。
- **日期**：`published` 用 `YYYY-MM-DD`（Obsidian 属性面板支持得最好；Astro 也能解析现有文章里的 ISO 时间）。
- **链接**：统一用标准 Markdown `[文字](url)` / `![说明](相对路径)`，不要用 `[[wiki]]` 或 `![[嵌入]]`。

## 6. 发布

1. `draft: false`；
2. 本地跑一次 `pnpm build`（会同时生成 Pagefind 搜索索引）；
3. 提交并推送 `main`，GitHub Actions 会自动构建并部署到 `https://sunforyou.top`。
