# 🎲 2D Toon 3D Dice Roller (`dice-roller`)

`dice-roller` 是一個 **2D 卡通畫風 3D 物理投擲骰子彈窗組件**。

---

## 📦 引入方式 (CDN Quick Start)

在您的 HTML 頁面中依序引入基礎引擎與本模組：

```html
<!-- 1. 基礎依賴引擎 (Three.js / Cannon.js / Tone.js) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/cannon.js/0.6.2/cannon.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js"></script>

<!-- 2. 本模組核心腳本 -->
<script src="https://cdn.jsdelivr.net/gh/<Your-GitHub-Username>/web-toolkits@main/modules/dice-roller/dice-roller.js"></script>
```

---

## 🚀 API 使用指南 (Usage)

### 1. 簡潔呼叫 (Short Hand)

```javascript
// 範例 A：投擲 2 顆標準 1~6 點骰子
DiceRoller.open(2);

// 範例 B：投擲 1 顆自訂骰面點數（例如 2, 2, 2, 4, 4, 4）
DiceRoller.open(1, [2, 2, 2, 4, 4, 4], function(res) {
    console.log("投擲結果陣列:", res.results); // 例: [4]
    console.log("總和:", res.total);           // 例: 4
});
```

### 2. 進階配置呼叫 (Options Object)

```javascript
DiceRoller.open({
    title: "敏捷檢定 (D6)",
    count: 2,
  
    // 自訂骰面（可傳入單一陣列或指定每顆骰子不同的陣列）
    faces: [2, 2, 2, 4, 4, 4], 
  
    // 渲染風格：0: 2D卡通(預設), 1: 極簡黑白, 2: 真實塑膠, 3: 自定義主題
    renderStyle: 0,
  
    // 自訂配色 (僅當 renderStyle = 3 生效)
    customTheme: {
        primary: '#f59e0b',
        text: '#ffffff',
        border: '#78350f'
    },
  
    // 物理投擲參數
    physics: {
        gravity: -40,       // 重力加速度 (預設 -35)
        height: 4.5,        // 起始掉落高度
        impulseForce: 25.0, // 拋出沖量力道
        torqueForce: 50.0,  // 旋轉角速度力道
        angleDeg: 45        // 投擲角度 (45度方向擲出)
    },
  
    // 完成時的回調函數
    onComplete: function(res) {
        alert(`檢定完成！點數結果: ${res.results.join(', ')} (總合: ${res.total})`);
    }
});
```

---

## 🎨 渲染風格通道 (Render Styles)

| 代碼 | 名稱                  | 特色描述                                                     |
| :---: | --------------------- | ------------------------------------------------------------ |
| `0` | **Toon (預設)** | 2D 美漫/卡通手繪風格，帶有黑色粗外輪廓線與高飽和度平塗貼圖。 |
| `1` | **Monochrome**  | 極簡黑白風格。                                               |
| `2` | **Realistic**   | 帶有高光反射質感的 3D 塑膠材質。                             |
| `3` | **Custom**      | 可透過 `customTheme` 自訂骰子底色、點數顏色與邊框色。      |

---

## ⚙️ Callback 回傳資料結構

當使用者投擲完畢並點擊「確認並關閉」按鈕時，`onComplete` 會收到以下格式的 JSON 物件：

```json
{
  "title": "敏捷檢定 (D6)",
  "results": [4, 2],
  "total": 6
}
```
