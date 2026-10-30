```module-meta
{
  "moduleId": "dice-roller",
  "name": "3D 骰子投擲器",
  "icon": "fa-dice-d6",
  "summary": "使用 3D 物理模擬投擲六面骰，支援多顆骰子、自訂面值、外觀及投擲參數；使用者確認結果後回傳點數與總和。",
  "dependencies": [
    { "name": "Three.js", "version": "r128", "required": true },
    { "name": "Cannon.js", "version": "0.6.2", "required": true },
    { "name": "Tone.js", "version": "14.8.49", "required": false }
  ]
}
```

# 2D Toon 3D Dice Roller (`dice-roller`)

`dice-roller` 是一個使用 Three.js 與 Cannon.js 呈現 3D 骰子物理投擲的網頁模組，提供卡通、黑白、塑膠及自訂配色外觀。
`DiceRoller.open()` 會開啟投擲介面；骰子停止後顯示朝上點數，使用者按下確認按鈕後才會收到結果回呼。

## 功能概要

- 在全螢幕覆蓋介面中投擲一顆或多顆六面骰。
- 以 Cannon.js 模擬骰子的重力、碰撞與彈跳，並以 Three.js 渲染 3D 畫面。
- 可為每顆骰子指定六個面值，並設定骰子外觀與投擲參數。
- 骰子停止後顯示各骰點數；按下「確認並關閉」後，透過 `onComplete` 回傳點數與總和。
- 可使用 Tone.js 在碰撞時播放音效；音訊初始化受瀏覽器互動政策影響。

## 引入方式與依賴

在 HTML 中依序載入 Three.js、Cannon.js、Tone.js 與模組腳本：

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/cannon.js/0.6.2/cannon.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js"></script>
<script src="https://cdn.jsdelivr.net/gh/<GitHub 帳號>/<repository>@main/modules/dice-roller/dice-roller.js"></script>
```

請將 CDN 網址中的 GitHub 帳號及 repository 替換成實際發布位置。Three.js 與 Cannon.js 為 3D 渲染及物理模擬必要依賴；Tone.js 若不存在，模組會略過音效。

## 快速開始

```javascript
DiceRoller.open({
  count: 2,
  onComplete(result) {
    console.log(result.results, result.total);
  }
});
```

開啟介面後按「播放投擲」，待骰子停止，再按「確認並關閉」觸發回呼。只呼叫 `DiceRoller.open(2)` 也可投擲兩顆預設骰子。

## API 使用指南

### `DiceRoller.open(countOrOptions, faces, callback)`

開啟骰子介面並建立骰子。

- 物件形式：`open(options)`。
- 簡寫形式：`open(count)`，或 `open(count, faces, callback)`。
- 介面中的「播放投擲」按鈕會執行投擲；JavaScript 公開方法名稱為 `playRoll()`。
- 投擲完成後須由使用者按確認按鈕，模組才呼叫 `onComplete` 並關閉。

### `DiceRoller.playRoll()`

開始投擲目前建立的骰子。若骰子正在投擲，重複呼叫不會開始另一輪。

### `DiceRoller.submitAndClose()`

提交目前顯示的結果、呼叫完成回呼並關閉介面。正常使用時由介面中的確認按鈕觸發。

### `DiceRoller.close()`

隱藏骰子介面並清除停止檢查計時器。直接關閉不會呼叫 `onComplete`。

## 參數與進階設定

物件形式支援以下欄位：

| 欄位 | 型別 | 預設值 | 說明 |
|---|---|---|---|
| `title` | string | `"{count}D6 Roll"` | 介面標題。 |
| `count` | number | `1` | 骰子數量。 |
| `faces` | number[] 或 number[][] | 標準面值 `[1,2,3,4,5,6]` | 六個面值；二維陣列可為不同骰子指定不同面值。每組須有六項，否則該骰使用標準面值。 |
| `renderStyle` | number | `0` | 外觀代碼：0 卡通、1 黑白、2 塑膠、3 自訂。 |
| `customTheme` | object | 模組內建值 | 自訂模式配色：`primary` 底色、`text` 點數色、`border` 邊框色。 |
| `physics` | object | 見下表 | 覆寫投擲物理參數。 |
| `onComplete` | function | 無 | 使用者確認結果後呼叫。 |

簡寫形式的 `faces` 只接受一組六項陣列；若要逐骰指定不同面值，請用物件形式提供二維陣列。

`physics` 可設定：

| 欄位 | 預設值 | 說明 |
|---|---:|---|
| `gravity` | `-35` | 世界重力 Y 軸值。 |
| `height` | `3.5` | 投擲時的起始高度基準。 |
| `impulseForce` | `16.0` | 水平投擲速度幅度。 |
| `torqueForce` | `30.0` | 隨機角速度幅度。 |
| `angleDeg` | `0` | 非零時以指定角度決定水平投擲方向；為零時方向隨機。 |
| `restitution` | `0.65` | 骰子與地面的彈性係數。 |

目前程式未對骰子數量、物理參數範圍或骰面資料型別作完整驗證，呼叫端應提供合理值。

## 視覺樣式與互動流程

| `renderStyle` | 外觀 |
|---:|---|
| `0` | 卡通平塗骰面及深色外框。 |
| `1` | 黑白骰面。 |
| `2` | 帶高光的塑膠材質。 |
| `3` | 使用 `customTheme` 的自訂配色與外框。 |

操作流程為：開啟介面 → 播放投擲 → 等待骰子停止並檢視點數 → 確認並關閉。骰子面值 1 至 6 以圓點繪製，其他數值以文字繪製。

## 回傳資料與回呼時機

只有透過確認操作呼叫 `submitAndClose()` 時，`onComplete(resultData)` 才會觸發。直接呼叫 `close()` 不會回呼。

```javascript
{
  title: "2D6 Roll",
  results: [4, 2],
  total: 6
}
```

- `title`: string，該次投擲標題。
- `results`: number[]，每顆骰子的朝上面值。
- `total`: number，所有面值總和。

## 限制與注意事項

- 需要支援 WebGL 的瀏覽器，以及 Three.js、Cannon.js；音效需要 Tone.js。
- 目前每顆骰子固定六面；不是可設定任意面數的多面骰。
- 完成回呼由使用者確認按鈕觸發，不是在物理模擬停止時立即觸發。
- 關閉介面會隱藏 UI，但目前實作仍持續執行 Three.js 動畫迴圈，重複使用可能持續佔用資源。
- 預覽頁及 CDN 腳本需可透過 HTTP(S) 載入；直接以本機檔案開啟時，外部依賴或相對路徑可能受瀏覽器限制。

## 預覽與操作方式

開啟 `modules/dice-roller/dice-roller.html`，選擇快速預設按鈕。按下「播放投擲」，等待結果出現後按「確認並關閉」；有設定回呼的範例會將結果記錄在頁面日誌。
