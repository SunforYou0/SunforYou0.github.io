/// <reference types="astro/client" />
/// <reference path="../.astro/types.d.ts" />

// 全局样式在 Layout.astro 中显式 import；.styl 需要声明模块类型
declare module "*.styl";
