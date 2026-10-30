# 📖 文字冒險小引擎 (`text-adventure`)

`text-adventure` 是一個 **基於「解讀/理解/演出」三層架構的輕量級網頁文字冒險小引擎組件**。
`TextAdventure.open()` 呼叫一個採用 2D 卡通手繪風（Toon / Cel Shading）的全螢幕互動彈窗，具備 2:1 上下版面配置與動態劇本選項推進功能。

---

## 一、引入方式與依賴

本模組為零外部套件依賴（No Dependencies），僅需引入核心 JavaScript 腳本即可使用：

```html
<script src="./modules/text-adventure/text-adventure.js"></script>
```

---

## 二、快速開始

```javascript
const sampleScript = `
  @label start
  [text] 你睜開眼睛，發現自己站在一座荒廢城堡的迴廊中。
  @choice "開啟左側大門" -> door_a
  @choice "走下右側階梯" -> door_b

  @label door_a
  [text] 大門背後是一間滿是寶藏的房間！
  @goto end

  @label door_b
  [text] 階梯盡頭是一條幽暗的地下密道。
  @goto end

  @label end
  [text] 冒險結束！
`;

TextAdventure.open({
  title: '🗡️ 古堡冒險',
  script: sampleScript,
  onComplete: (result) => {
    console.log('冒險結束：', result);
  }
});
```

---

## 三、 API 使用指南

全域入口掛載於 `window.TextAdventure`。

### 1. `TextAdventure.open(options)`
開啟文字冒險彈窗並自動載入與執行劇本。

* **`options` 參數說明**：
  * `title` (string, 可選): 彈窗標題，預設為 `"📖 文字冒險小引擎"`。
  * `script` (string, 必填): TXT 格式劇本字串。
  * `onComplete` (function, 可選): 劇本執行完畢或使用者關閉視窗時觸發的回調函式。

### 2. `TextAdventure.play()`
推進至劇本的下一步驟。

### 3. `TextAdventure.close(resultData)`
關閉彈窗並清理內部資源（Reader、Engine 及 DOM 元素）。

---

## 四、 劇本語法規範

小引擎支援以下四大基礎語法：

| 語法格式 | 功能說明 | 範例 |
| :--- | :--- | :--- |
| `@label {name}` | 定義劇情位置標籤 | `@label start` |
| `[text] {content}` | 顯示文字訊息 | `[text] 天空飄起了大雨。` |
| `@choice "{選項文字}" -> {標籤}` | 動態生成分支選項 | `@choice "走左邊" -> path_left` |
| `@goto {標籤}` | 無條件跳轉至指定標籤 | `@goto start` |

---

## 五、 回傳資料結構 (`resultData`)

當呼叫 `onComplete(resultData)` 時回傳：

```json
{
  "status": "completed" // 或 "closed"
}
```