# WEB-TOOLKITS // 輕量嵌入式 Web 模組集合 🚀

> **Modular, Lightweight, Zero-Dependency-Injection UI & Animation Components for Modern Web Developers.**

`web-toolkits` 是一個專為網頁開發者設計的**開箱即用、組件化 Web 模組倉庫**。透過全球 jsDelivr CDN，您只需在任何 HTML 頁面載入一行 `<script>`，即可為網頁注入 2D 卡通風格 3D 物理模擬、視覺特效與極客風格互動組件，無需手動設定複雜的 CSS 或是多餘的 DOM 結構。

---

## ⚡ 核心優勢 (Core Advantages)

1. **零 DOM 污染與動態注入**：呼叫 `API.open()` 時自動封裝並動態注入獨立的 Modal 懸浮層與 3D Canvas，關閉時自動清理資源。
2. **預設 2D 美漫/卡通繪畫風格 (Toon / Cel Shading)**：所有組件預設具備黑色輪廓線（Outlines）、平塗高飽和度色彩與彈跳動畫，帶來鮮明的視覺打擊感。
3. **靈活的 API 與物理參數**：同時支援極簡傳參（如 `DiceRoller.open(2)`) 與深度自訂物理/材質參數。
4. **全球 CDN 高速載入**：無縫整合 GitHub Pages 與 jsDelivr CDN，隨處引用。

---

## 📦 模組目錄 (Module Catalog)

| # | 模組名稱 | 描述 | 狀態 |
|---|---|---|---|
| **01** | **`dice-roller`** | 2D 卡通畫風 3D 物理投擲骰子彈窗 | 🟢 已上線 (Online) |
| **02** | **`card-clash`** | 卡牌數值碰撞對戰動畫與打擊特效 | 🟡 開發中 (Coming Soon) |

---

## 🎲 模組 01：2D Toon 3D Dice Roller (`dice-roller`)

為網站提供一個懸浮置頂、帶有真實 3D 碰撞物理模擬與 2D 卡通漫畫外輪廓風格的骰子投擲組件。支援自訂骰面點數（如 `2, 2, 2, 4, 4, 4`）、投擲角度、重力與渲染風格。

### 1. 快速開始 (Quick Start)

在您的網頁中載入依賴引擎與模組腳本：

```html
<!-- 1. 基礎依賴引擎 (Three.js / Cannon.js / Tone.js) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/cannon.js/0.6.2/cannon.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js"></script>

<!-- 2. 本倉庫的骰子模組腳本 -->
<script src="https://cdn.jsdelivr.net/gh/<您的GitHub帳號>/web-toolkits@main/modules/dice-roller/dice-roller.js"></script>
```

---

### 2. API 使用說明 (Usage)

#### 🔹 模式 A：最簡短呼叫
```javascript
// 範例 1：投擲 2 顆標準骰子 (1~6 點)
DiceRoller.open(2);

// 範例 2：投擲 1 顆自訂骰面點數的骰子 (如: 2, 2, 2, 4, 4, 4)
DiceRoller.open(1, [2, 2, 2, 4, 4, 4], function(res) {
    console.log("投擲點數陣列:", res.results); // 例: [4]
    console.log("點數總和:", res.total);     // 例: 4
});
```

#### 🔹 模式 B：進階配置呼叫 (Options Object)
```javascript
DiceRoller.open({
    title: "敏捷檢定 (2D6)",
    count: 2,
    // faces 可傳入單一陣列 [1,2,3,4,5,6] 或二維陣列 [[2,2,2,4,4,4], [1,3,5,1,3,5]]
    faces: [2, 2, 2, 4, 4, 4],
    
    // 渲染風格：0: 2D卡通(預設), 1: 黑白, 2: 真實塑膠, 3: 自定義主題
    renderStyle: 0,
    
    // 當 renderStyle = 3 時生效的自訂配色
    customTheme: {
        primary: '#f59e0b',
        text: '#ffffff',
        border: '#78350f'
    },
    
    // 物理投擲參數設定
    physics: {
        gravity: -40,       // 重力加速度 (預設 -35)
        height: 4.5,        // 起始掉落高度
        impulseForce: 25.0, // 拋出沖量力道
        torqueForce: 50.0,  // 旋轉角速度力道
        angleDeg: 45        // 投擲角度 (45度方向擲出)
    },
    
    // 投擲完成並關閉時的回傳函數
    onComplete: function(res) {
        alert(`檢定完成！點數結果: ${res.results.join(', ')} (總合: ${res.total})`);
    }
});
```

---

## 🛠 目錄架構與開發規範 (Repository Structure)

為確保庫內所有模組均能穩定維護並保持統一的風格，本專案採用以下目錄結構：

```text
web-toolkits/
├── index.html                       # Dashboard 展台 (展示所有模組與互動 Demo)
├── README.md                        # 專案總覽與使用說明
├── PROJECT_STRUCTURE.md             # 架構設計文檔
└── modules/                         # 模組集合目錄
    ├── dice-roller/                 # 01. 骰子模擬器模組
    │   └── dice-roller.js
    └── [future-module]/             # 未來擴充的其他模組
        └── [future-module].js
```

### 🎨 新模組開發規範
1. **美術風格**：預設採用 2D 卡通手繪風格（Toon / Cel Shading），帶有粗黑外輪廓線。
2. **封裝原則**：採用 IIFE 打包為獨立 `.js` 檔案，自動動態注入必要的 HTML / CSS。
3. **對外接口**：全域物件必須提供 `.open(options)`, `.play()`, 與 `.close()` 三個標準介面。

---

## 📄 授權條款 (License)

本專案採用 [MIT License](LICENSE) 開源授權，歡迎自由修補、引用與二次開發。