# ⚔️ 2D Toon Card Clash Engine (`card-clash`)

`card-clash` 是一個 **2D 美漫/卡通手繪風格（Toon / Cel Shading）卡牌數值對撞動畫模擬器**。
`CardClash.open()` 呼叫一個全螢幕動畫彈窗進行 90° 扇形動態軌跡碰撞、粒子爆破與震動特效。

---

## 📦 引入方式 (CDN Quick Start)

在您的 HTML 頁面中依序引入本模組：

```html
<!-- 本模組核心腳本與動態樣式注入 -->
<script src="https://cdn.jsdelivr.net/gh/<Your-GitHub-Username>/web-toolkits@main/modules/card-clash/card-clash.js"></script>
```

---

## 🚀 API 使用指南 (Usage)

### 1. 簡潔呼叫與預設戰鬥

```javascript
// 範例：開啟預設對戰並監聽回調
CardClash.open({
    title: 'HERO VS ORC',
    player: { name: '勇者', icon: '⚔️', hp: 35, maxHp: 35, atk: 9, def: 2, color: '#ff4757' },
    enemy: { name: '半獸人', icon: '👹', hp: 30, maxHp: 30, atk: 7, def: 1, color: '#2ed573' },
    onImpact: (data) => console.log(`勇者 -${data.playerDmg} HP | 怪物 -${data.enemyDmg} HP`),
    onComplete: (res) => console.log(`戰鬥結束！勝者: ${res.winner}`)
});
```

### 2. 進階配置呼叫 (Options Object)

```javascript
CardClash.open({
    title: "EPIC DRAGON RAID",
  
    // 玩家卡牌資訊
    player: { 
        name: '聖騎士', 
        icon: '🛡️', 
        hp: 50, 
        maxHp: 50, 
        atk: 12, 
        def: 4, 
        color: '#70a1ff' 
    },
  
    // 敵人卡牌資訊
    enemy: { 
        name: '遠古巨龍', 
        icon: '🐲', 
        hp: 60, 
        maxHp: 60, 
        atk: 14, 
        def: 3, 
        color: '#ff6b81' 
    },
  
    // 自動戰鬥設定
    autoPlay: true,
    autoInterval: 750, // 每 750ms 自動發動一次對撞
  
    // 單次碰撞回調
    onImpact: function(data) {
        console.log("當前雙方血量更新:", data.player.hp, data.enemy.hp);
    },
  
    // 戰鬥結束回調
    onComplete: function(res) {
        alert(`討伐戰結束！獲勝者: ${res.winner}`);
    }
});
```

---

## 🎨 美術風格特色 (Visual Style)

|          風格代稱          | 特色描述                                                                                                            |
| :------------------------: | ------------------------------------------------------------------------------------------------------------------- |
| **Toon Cel-Shading** | 採用 2D 美漫手繪風格，包含粗黑色外輪廓線（Outlines）、高飽和平塗色彩與動態速線背景（Speedlines）。                  |
|   **彈跳物理特效**   | 每次碰撞瞬間伴隨隨機 $90^\circ$ 扇形軌跡、反向旋轉齊平對撞、鏡頭震動與彈出式漫畫打擊文字 (`POW!`, `CRASH!`)。 |

---

## ⚙️ Callback 回傳資料結構

### 1. `onImpact(data)` 回調參數

當每次卡牌碰撞並結算扣血後觸發：

```json
{
  "playerDmg": 5,
  "enemyDmg": 3,
  "player": { "name": "勇者", "hp": 30, "maxHp": 35, "atk": 9, "def": 2 },
  "enemy": { "name": "半獸人", "hp": 25, "maxHp": 30, "atk": 7, "def": 1 }
}
```

### 2. `onComplete(res)` 回調參數

當其中一方血量归零、戰鬥分出勝負時觸發：

```json
{
  "winner": "player",
  "player": { "name": "勇者", "hp": 12, "maxHp": 35 },
  "enemy": { "name": "半獸人", "hp": 0, "maxHp": 30 }
}
```
