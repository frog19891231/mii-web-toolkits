# Web-Toolkits

Web-Toolkits 是一組以原生網頁技術製作的互動模組。每個模組獨立放在 `modules/{module-id}/`，提供 JavaScript 實作、說明文件及預覽頁。

目前專案收錄三個模組：3D 骰子投擲、卡牌數值對戰，以及文字冒險劇本播放器。各模組的功能與限制以其說明文件及目前實作為準。

## 模組目錄

| 模組 | 功能 | 主要依賴 | 說明文件 | 預覽頁 |
|---|---|---|---|---|
| [dice-roller](modules/dice-roller/dice-roller.md) | 以 3D 物理模擬投擲六面骰；支援多顆骰子、自訂骰面數值、外觀及部分物理參數。使用者確認結果後透過回呼取得點數與總和。 | Three.js、Cannon.js；Tone.js 提供可選音效。 | [使用說明](modules/dice-roller/dice-roller.md) | [開啟預覽](modules/dice-roller/dice-roller.html) |
| [card-clash](modules/card-clash/card-clash.md) | 顯示玩家與敵方卡牌，依攻擊及防禦數值同時結算傷害，支援手動或自動對戰，並回報每次撞擊及戰鬥結果。 | 瀏覽器 Canvas、DOM、動畫影格 API；使用 Google Fonts 字型。 | [使用說明](modules/card-clash/card-clash.md) | [開啟預覽](modules/card-clash/card-clash.html) |
| [text-adventure](modules/text-adventure/text-adventure.md) | 解析標籤、文字、選項及跳轉指令，呈現可分支的文字冒險流程，並回報完成或關閉狀態。 | 模組核心無外部套件依賴。 | [使用說明](modules/text-adventure/text-adventure.md) | [開啟預覽](modules/text-adventure/text-adventure.html) |

首頁依照根目錄的 `modules.json` 載入模組 ID，並從各模組 `.md` 文件開頭的 `module-meta` JSON 區塊讀取名稱、圖示、簡介與依賴來產生卡片。README 中的模組介紹仍是**手動維護**的清單；新增或移除模組時，請更新本表、`modules.json` 及模組文件。

## 開始使用

### 在本機檢視

以 HTTP 靜態伺服器開啟專案根目錄，再瀏覽 `index.html`。首頁透過 `fetch('./modules.json')` 讀取索引；使用 HTTP 伺服器比直接以 `file://` 開啟更可靠。

各模組也有獨立預覽頁，可從上表開啟，或直接瀏覽對應的 HTML 檔案。

### 在自己的頁面載入模組

模組以瀏覽器腳本提供全域 API。請按模組文件所列的依賴順序載入腳本。以下為骰子模組的 CDN 範例；將帳號與 repository 替換成實際發布位置：

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/cannon.js/0.6.2/cannon.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js"></script>
<script src="https://cdn.jsdelivr.net/gh/<GitHub 帳號>/<repository>@main/modules/dice-roller/dice-roller.js"></script>
```

呼叫模組 API：

```javascript
DiceRoller.open({
  count: 2,
  onComplete(result) {
    console.log(result.results, result.total);
  }
});
```

其他模組的依賴與 API 請參閱各自的使用說明。模組之間的介面並非完全相同，請勿假設每個模組都提供相同的方法。

## 目前視覺方向

專案後續新增及調整模組時，以**簡約像素風**為主要視覺方向。目前模組仍保留各自現有的介面樣式，尚未完成整體視覺改版；各模組的具體現況請見其說明文件。

## 專案結構

```text
web-toolkits/
├── index.html
├── modules.json
├── README.md
├── 專案開發與協作標準規範.md
└── modules/
    ├── dice-roller/
    │   ├── dice-roller.js
    │   ├── dice-roller.md
    │   └── dice-roller.html
    ├── card-clash/
    │   ├── card-clash.js
    │   ├── card-clash.md
    │   └── card-clash.html
    └── text-adventure/
        ├── text-adventure.js
        ├── text-adventure.md
        └── text-adventure.html
```

新增模組時，依照[專案開發與協作標準規範](專案開發與協作標準規範.md)建立必要檔案，在 `.md` 文件加入有效的 `module-meta` JSON 區塊，並手動更新 README 的模組目錄與 `modules.json`。首頁卡片會依索引 ID 讀取該區塊，不需另維護卡片資料。

## 授權

本專案採用 [MIT License](LICENSE)。
