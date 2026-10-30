```module-meta
{
  "moduleId": "text-adventure",
  "name": "文字冒險引擎",
  "icon": "fa-book-open",
  "summary": "以文字、標籤、選項及跳轉指令建立可分支的互動劇情，並回報冒險完成或視窗關閉狀態。",
  "dependencies": []
}
```

# 文字冒險小引擎 (`text-adventure`)

`text-adventure` 是一個零外部套件依賴的網頁文字冒險模組，使用簡單的標籤、文字、選項與跳轉指令推進分支劇情。
`TextAdventure.open()` 會解析劇本並開啟互動視窗，逐段顯示故事文字，讓玩家選擇分支或繼續閱讀，並於完成或關閉時回傳狀態。

## 功能概要

- 解析純文字劇本中的標籤、文字、選項與跳轉指令。
- 以互動視窗逐段呈現文字，並將已讀文字加入訊息區。
- 選項會建立按鈕，點擊後跳轉到指定標籤。
- 提供 `onComplete` 回呼，回報故事完成或視窗關閉狀態。
- 使用瀏覽器原生 JavaScript 與 DOM，無須外部執行期套件。

## 引入方式與依賴

載入模組腳本即可：

```html
<script src="./modules/text-adventure/text-adventure.js"></script>
```

模組不依賴外部 JavaScript 函式庫。預覽頁本身另載入 Tailwind CSS 與 Google Fonts 作為展示頁樣式，不是模組核心執行的必要依賴。

## 快速開始

```javascript
const script = `
@label start
[text] 你來到城堡的岔路口。
@choice "走左邊" -> left
@choice "走右邊" -> right

@label left
[text] 左側通道通往庭院。
@goto end

@label right
[text] 右側通道通往地窖。
@goto end

@label end
[text] 冒險結束。
`;

TextAdventure.open({
  title: "城堡冒險",
  script,
  onComplete(result) {
    console.log(result.status);
  }
});
```

每次顯示一段文字後，按「點擊繼續」推進；顯示選項時，點選其中一個分支。最後按「結束並返回」結束劇情。

## API 使用指南

### `TextAdventure.open(options)`

建立劇本讀取器與執行器，開啟冒險視窗並立即執行劇本第一個可呈現的指令。

### `TextAdventure.play()`

執行劇本下一步。介面中的「點擊繼續」按鈕會呼叫此方法。

### `TextAdventure.close(resultData)`

移除冒險視窗並呼叫 `onComplete`。未傳入結果時，預設回傳 `{ status: "closed" }`。劇情結束畫面中的「結束並返回」會以 `{ status: "completed" }` 呼叫此方法。

## 參數與進階設定

`TextAdventure.open(options)` 支援以下欄位：

| 欄位 | 型別 | 必填 | 預設值 | 說明 |
|---|---|---|---|---|
| `title` | string | 否 | `📖 文字冒險小引擎` | 視窗標題。 |
| `script` | string | 否（建議提供） | 空字串 | 劇本內容。空字串會直接進入結束狀態。 |
| `onComplete` | function | 否 | 無 | 呼叫 `close()` 時接收結果物件。 |

### 劇本語法

每行為一個指令；空行及以 `//` 開頭的行會忽略。

| 語法 | 用途 | 範例 |
|---|---|---|
| `@label {name}` | 定義可跳轉的位置。 | `@label start` |
| `[text] {content}` | 顯示一段文字，等待玩家繼續。 | `[text] 天空下起大雨。` |
| `@choice "{文字}" -> {label}` | 加入分支選項。連續選項會合併顯示。 | `@choice "走左邊" -> path_left` |
| `@goto {label}` | 直接跳到標籤並繼續執行。 | `@goto end` |

標籤名稱須與跳轉目標完全一致。選項文字需用雙引號括住。未知指令會被略過。

## 視覺樣式與互動流程

模組以彈窗呈現：上方為標題與關閉按鈕，中間區域顯示目前文字或選項，下方訊息區保留已讀文字。點擊文字下方的繼續按鈕推進；點擊選項則跳至相應標籤。

模組執行介面採用深色半透明模糊遮罩、淺色厚框視窗及錯位陰影；繼續與選項使用靛紫色膠囊按鈕，完成操作使用綠色按鈕，關閉操作使用紅色按鈕。此介面與主網站及預覽頁外框的簡約像素風分開設計。

## 回傳資料與回呼時機

`onComplete(resultData)` 會在呼叫 `TextAdventure.close()` 時觸發。使用者點擊關閉按鈕時回傳：

```javascript
{ status: "closed" }
```

劇本到達結尾後，玩家按「結束並返回」時回傳：

```javascript
{ status: "completed" }
```

劇本執行到最後一行時會顯示完成畫面；回呼要等使用者按下完成按鈕才觸發。程式未防止呼叫端重複呼叫 `close()` 後多次觸發回呼。

## 限制與注意事項

- 劇本目前以逐行文字指令解析，不支援變數、條件、角色演出、存檔或富文本。
- `@goto` 或分支跳轉若形成無限循環，可能造成同步遞迴過深；撰寫劇本時應避免無終止循環。
- 目標標籤不存在時會寫入主控台錯誤訊息，沒有顯示在視窗中的專用錯誤提示。
- 選項格式不符時不會建立對應選項按鈕。
- 劇本文字目前會以 HTML 字串插入顯示區；不要載入不可信任的劇本內容。後續應改為安全的純文字呈現。
- 關閉視窗會移除介面 DOM；樣式則保留在頁面中供再次開啟使用。

## 預覽與操作方式

開啟 `modules/text-adventure/text-adventure.html`，可在劇本編輯區修改範例，然後按「啟動 TextAdventure.open()」。在彈窗中逐段閱讀、選擇分支，完成或關閉後可於瀏覽器主控台查看回傳狀態。
