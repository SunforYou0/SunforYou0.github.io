/* This is a script to create a new post folder with an index.md and front-matter */

import fs from "fs"
import path from "path"

function getDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

// Quote a string as a YAML double-quoted scalar.
function yamlQuote(value) {
  return JSON.stringify(value)
}

const args = process.argv.slice(2)

if (args.length === 0) {
  console.error(`Error: No slug argument provided
Usage: pnpm new-post <slug> [title]
Example: pnpm new-post llm-temperature-zero-randomness "为什么 Temperature 设为 0 后输出还是随机的？"`)
  process.exit(1) // Terminate the script and return error code 1
}

// Normalize the slug: accept "my-post", "my-post.md" or "my-post/index.md".
let slug = args[0]
  .trim()
  .replace(/\\/g, "/")
  .replace(/\.(md|mdx)$/i, "")
  .replace(/^\/+|\/+$/g, "")
  .replace(/\/index$/, "")

if (!slug || slug.includes("..") || path.isAbsolute(slug)) {
  console.error(`Error: Invalid slug "${args[0]}". Use an English slug, e.g. "my-new-post".`)
  process.exit(1)
}

const title = args[1] || slug

const targetDir = path.join("./src/content/posts", slug)
const fullPath = path.join(targetDir, "index.md")

if (fs.existsSync(targetDir)) {
  console.error(`Error: Post folder ${targetDir} already exists`)
  process.exit(1)
}

fs.mkdirSync(targetDir, { recursive: true })

const content = `---
title: ${yamlQuote(title)}
published: ${getDate()}
description: ''
image: ''
tags: []
category: ''
draft: true
lang: ''
---

`

fs.writeFileSync(fullPath, content)

console.log(`Post created: ${fullPath}`)
console.log("Note: draft is true; set it to false before publishing.")
