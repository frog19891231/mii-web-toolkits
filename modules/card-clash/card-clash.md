```module-meta
{
  "moduleId": "card-clash",
  "name": "卡牌數值對戰",
  "icon": "fa-burst",
  "summary": "依角色攻擊與防禦數值結算雙方傷害，提供手動或自動對戰，並以粒子與畫面震動呈現撞擊回饋。",
  "dependencies": [
    { "name": "Google Fonts（Bangers、Outfit）", "version": "", "required": false }
  ]
}
```

# 2D Toon Card Clash Engine (`card-clash`)

`card-clash` 是一個以 Canvas 呈現雙方角色卡牌對撞的戰鬥動畫模組，會依攻擊與防禦數值計算傷害，並以粒子、畫面震動及漫畫字樣呈現撞擊回饋。
`CardClash.open()` 會開啟戰鬥介面，供使用者逐次攻擊或啟動自動攻擊，並在每次撞擊及戰鬥結束時提供回呼。

## 功能概要

- 顯示玩家與敵方的名稱、圖示、生命值、攻擊、防禦及生命條。
- 每次攻擊時，雙方同時依攻擊減去對方防禦值計算傷害；每次傷害至少為 1。
- 以卡牌移動、粒子、隨機漫畫打擊字樣及鏡頭震動呈現撞擊動畫。
- 支援手動逐次攻擊，或依指定間隔自動攻擊。
- 提供 `onImpact` 回報每次傷害與雙方狀態，並以 `onComplete` 回報勝方及最終狀態。

## 引入方式與依賴

核心模組可直接載入：

```html
<script src="https://cdn.jsdelivr.net/gh/<GitHub 帳號>/<repository>@main/modules/card-clash/card-clash.js"></script>
```

請將網址中的 GitHub 帳號及 repository 替換成實際發布位置。模組使用瀏覽器 Canvas、DOM、計時器與動畫影格 API；樣式由腳本注入，並透過 Google Fonts 載入 Bangers 與 Outfit 字型。字型載入失敗時會使用後備字型。

## 快速開始

```javascript
CardClash.open({
  title: "HERO VS ORC",
  player: { name: "勇者", hp: 35, maxHp: 35, atk: 9, def: 2 },
  enemy: { name: "半獸人", hp: 30, maxHp: 30, atk: 7, def: 1 },
  onImpact(data) {
    console.log(data.player.hp, data.enemy.hp);
  },
  onComplete(result) {
    console.log(result.winner);
  }
});
```

按介面中的「ATTACK (PLAY)」逐次攻擊，或使用「AUTO」按鈕切換自動攻擊。若設定 `autoPlay: true`，開啟後會自動開始。

## API 使用指南

### `CardClash.open(options)`

建立或重設一場戰鬥並顯示介面。每次呼叫會依傳入角色資料建立新的當前生命值。

### `CardClash.play()`

執行一次雙方對撞及傷害結算。若正在播放對撞，或任一方生命值已歸零，呼叫不會開始新一輪。

### `CardClash.startAuto()` 與 `CardClash.stopAuto()`

啟動或停止自動攻擊計時器。使用者也可透過介面上的 AUTO 按鈕切換。已達結束條件時會停止自動攻擊。

### `CardClash.close()`

停止自動攻擊、取消目前渲染影格並關閉介面。手動關閉不會觸發 `onComplete`；正在進行的單次攻擊動畫沒有在關閉時明確取消。

## 參數與進階設定

`open(options)` 支援以下欄位：

| 欄位 | 型別 | 預設值 | 說明 |
|---|---|---|---|
| `title` | string | `CARD CLASH BATTLE` | 戰鬥標題。 |
| `player` | object | 預設 HERO 角色 | 玩家角色資料。 |
| `enemy` | object | 預設 BOSS 角色 | 敵方角色資料。 |
| `autoPlay` | boolean | `false` | 開啟後是否立即開始自動攻擊。 |
| `autoInterval` | number | `800` | 自動攻擊計時間隔，單位毫秒。 |
| `onImpact` | function | 無 | 每次傷害結算後呼叫。 |
| `onComplete` | function | 無 | 任一方生命值歸零後呼叫。 |

`player` 與 `enemy` 支援欄位：

| 欄位 | 型別 | 預設值 | 說明 |
|---|---|---|---|
| `name` | string | 玩家 `HERO`；敵方 `BOSS` | 卡牌名稱。 |
| `icon` | string | 玩家 ⚔️；敵方 👺 | 卡牌圖示文字或 emoji。 |
| `hp` | number | 玩家 35；敵方 30 | 初始生命值。 |
| `maxHp` | number | 玩家 35；敵方 30 | 生命條上限。 |
| `atk` | number | 玩家 9；敵方 7 | 攻擊力。 |
| `def` | number | 玩家 2；敵方 1 | 防禦力。 |
| `color` | string | 玩家 `#ff4757`；敵方 `#2ed573` | 卡牌底色。 |

傷害公式為 `max(1, 攻擊方 atk - 受擊方 def)`。每次撞擊雙方都會同時受到傷害。模組目前不驗證數值是否為有效數字或合理範圍。

## 視覺樣式與互動流程

目前實作採用美漫卡通呈現：深色背景、粗黑卡牌邊框、角色色塊、旋轉速線背景、粒子、鏡頭震動與 POW／CRASH 等撞擊文字。畫布會依視窗尺寸調整。

操作流程為：開啟戰鬥 → 手動攻擊或啟動自動攻擊 → 每次撞擊更新生命值 → 一方生命值歸零後停止並回報結果。後續視覺調整將依專案規範朝簡約像素風靠攏；目前程式尚未完成該視覺改版。

## 回傳資料與回呼時機

### `onImpact(data)`

每次傷害結算後觸發一次：

```javascript
{
  playerDmg: 5,
  enemyDmg: 3,
  player: { name: "勇者", hp: 30, maxHp: 35, atk: 9, def: 2 },
  enemy: { name: "半獸人", hp: 25, maxHp: 30, atk: 7, def: 1 }
}
```

### `onComplete(result)`

任一方生命值歸零後觸發一次，並停止自動攻擊：

```javascript
{
  winner: "player",
  player: { name: "勇者", hp: 12, maxHp: 35, atk: 9, def: 2 },
  enemy: { name: "半獸人", hp: 0, maxHp: 30, atk: 7, def: 1 }
}
```

`winner` 為 `"player"` 或 `"enemy"`。若同一擊使雙方同時歸零，現行判定會回傳 `"player"`。

## 限制與注意事項

- 需要支援 Canvas 2D、DOM 與 `requestAnimationFrame` 的瀏覽器。
- 字型依賴 Google Fonts 網路載入；離線時使用後備字型。
- 模組目前使用固定尺寸比例繪製卡牌，窄螢幕上可能需要調整版面。
- `close()` 會取消渲染循環，但單次對撞動畫中的影格及延遲回呼未集中管理，關閉時可能仍執行已排程的工作。
- 自動模式以固定間隔排程；攻擊動畫進行時，重疊的攻擊呼叫會被略過。
- 卡牌生命值及戰鬥規則目前沒有完整輸入驗證。

## 預覽與操作方式

開啟 `modules/card-clash/card-clash.html`，按「啟動預設對戰」或「啟動 BOSS 討伐戰」。預設對戰提供逐次攻擊；Boss 範例會示範自動攻擊及回呼日誌。
