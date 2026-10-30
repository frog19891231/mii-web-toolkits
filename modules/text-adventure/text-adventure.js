/**
 * Text Adventure Engine Module (`text-adventure`)
 * 遵循 Web-Toolkits 專案開發與協作標準規範
 */
(function (global) {
  'use strict';

  // ==========================================
  // 1. 解讀層 (ScriptReader)
  // ==========================================
  class ScriptReader {
    constructor() {
      this.lines = [];
      this.currentIndex = 0;
    }

    load(rawText) {
      if (!rawText) return;
      this.lines = rawText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('//'));
      this.currentIndex = 0;
    }

    hasNext() {
      return this.currentIndex < this.lines.length;
    }

    nextLine() {
      if (!this.hasNext()) return null;
      return this.lines[this.currentIndex++];
    }

    jumpTo(index) {
      if (index >= 0 && index < this.lines.length) {
        this.currentIndex = index;
      }
    }
  }

  // ==========================================
  // 2. 理解層 (ScriptEngine)
  // ==========================================
  class ScriptEngine {
    constructor(reader) {
      this.reader = reader;
      this.labels = {};
      this.events = {
        onText: null,
        onChoice: null,
        onEnd: null
      };
    }

    init() {
      this.labels = {};
      this.reader.lines.forEach((line, index) => {
        if (line.startsWith('@label ')) {
          const labelName = line.replace('@label ', '').trim();
          this.labels[labelName] = index;
        }
      });
    }

    on(event, callback) {
      if (this.events[event] !== undefined) {
        this.events[event] = callback;
      }
    }

    step() {
      if (!this.reader.hasNext()) {
        if (this.events.onEnd) this.events.onEnd();
        return;
      }

      const line = this.reader.nextLine();

      // 跳過標籤宣告
      if (line.startsWith('@label ')) {
        this.step();
        return;
      }

      // [text] 訊息指令
      if (line.startsWith('[text]')) {
        const content = line.replace('[text]', '').trim();
        if (this.events.onText) {
          this.events.onText(content);
        }
        return;
      }

      // @goto 跳轉指令
      if (line.startsWith('@goto ')) {
        const targetLabel = line.replace('@goto ', '').trim();
        if (this.labels[targetLabel] !== undefined) {
          this.reader.jumpTo(this.labels[targetLabel]);
          this.step();
        } else {
          console.error(`[ScriptEngine] 找不到標籤: ${targetLabel}`);
        }
        return;
      }

      // @choice 選項解析 (例如 @choice "左邊" -> left_way)
      if (line.startsWith('@choice')) {
        const choices = [];
        let currentLine = line;

        while (currentLine && currentLine.startsWith('@choice')) {
          const match = currentLine.match(/@choice\s+"([^"]+)"\s*->\s*(.+)/);
          if (match) {
            choices.push({ text: match[1], target: match[2].trim() });
          }

          if (this.reader.hasNext()) {
            const peekLine = this.reader.lines[this.reader.currentIndex];
            if (peekLine && peekLine.startsWith('@choice')) {
              currentLine = this.reader.nextLine();
            } else {
              break;
            }
          } else {
            break;
          }
        }

        if (this.events.onChoice) {
          this.events.onChoice(choices);
        }
        return;
      }

      // 未知指令自動跳過執行下一行
      this.step();
    }

    selectChoice(targetLabel) {
      if (this.labels[targetLabel] !== undefined) {
        this.reader.jumpTo(this.labels[targetLabel]);
        this.step();
      } else {
        console.error(`[ScriptEngine] 選項目標標籤不存在: ${targetLabel}`);
      }
    }
  }

  // ==========================================
  // 3. 演出層與 UI 封裝 (TextAdventure Module)
  // ==========================================
  let containerEl = null;
  let reader = null;
  let engine = null;
  let currentOptions = {};

  // 動態注入 2D 美漫/卡通手繪風 (Toon/Cel Shading) CSS
  function injectStyles() {
    if (document.getElementById('text-adventure-style')) return;

    const style = document.createElement('style');
    style.id = 'text-adventure-style';
    style.textContent = `
      .ta-modal-overlay {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(15, 23, 42, 0.85);
        backdrop-filter: blur(4px);
        z-index: 999999;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 16px;
        box-sizing: border-box;
      }
      .ta-window {
        width: 100%;
        max-width: 850px;
        height: 90vh;
        max-height: 700px;
        background: #fffcf2;
        border: 4px solid #0f172a;
        border-radius: 24px;
        box-shadow: 10px 10px 0px #0f172a;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        position: relative;
        animation: ta-pop-in 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      @keyframes ta-pop-in {
        0% { transform: scale(0.85); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
      }
      .ta-header {
        background: #facc15;
        padding: 14px 20px;
        border-bottom: 4px solid #0f172a;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 900;
        font-size: 1.25rem;
        color: #0f172a;
      }
      .ta-close-btn {
        background: #ef4444;
        color: #ffffff;
        border: 3px solid #0f172a;
        border-radius: 12px;
        padding: 4px 14px;
        cursor: pointer;
        font-weight: 900;
        box-shadow: 3px 3px 0px #0f172a;
        transition: all 0.1s ease;
      }
      .ta-close-btn:hover { background: #dc2626; }
      .ta-close-btn:active { transform: translate(2px, 2px); box-shadow: 1px 1px 0px #0f172a; }
      
      .ta-body {
        display: flex;
        flex-direction: column;
        flex: 1;
        height: calc(100% - 62px);
      }
      .ta-display-area {
        flex: 2;
        padding: 24px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background: #fef08a;
        border-bottom: 4px solid #0f172a;
        overflow-y: auto;
        position: relative;
      }
      .ta-text-bubble {
        background: #ffffff;
        border: 3px solid #0f172a;
        border-radius: 16px;
        padding: 18px 24px;
        font-size: 1.2rem;
        font-weight: 700;
        color: #0f172a;
        box-shadow: 5px 5px 0px #0f172a;
        max-width: 90%;
        margin-bottom: 20px;
        text-align: center;
        line-height: 1.5;
      }
      .ta-choice-container {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 100%;
        max-width: 550px;
      }
      .ta-btn {
        background: #38bdf8;
        border: 3px solid #0f172a;
        border-radius: 14px;
        padding: 12px 20px;
        font-size: 1.05rem;
        font-weight: 800;
        color: #0f172a;
        cursor: pointer;
        box-shadow: 4px 4px 0px #0f172a;
        transition: all 0.1s ease;
        text-align: center;
      }
      .ta-btn:hover { background: #0ea5e9; color: #ffffff; }
      .ta-btn:active { transform: translate(3px, 3px); box-shadow: 1px 1px 0px #0f172a; }
      
      .ta-message-box {
        flex: 1;
        padding: 16px 20px;
        background: #ffffff;
        overflow-y: auto;
        font-size: 0.95rem;
        line-height: 1.6;
        color: #334155;
      }
      .ta-message-line {
        margin-bottom: 8px;
        padding-bottom: 6px;
        border-bottom: 2px dashed #e2e8f0;
        display: flex;
        gap: 8px;
      }
      .ta-message-line::before {
        content: "💬";
      }
    `;
    document.head.appendChild(style);
  }

  function createDOM() {
    if (containerEl) return;

    containerEl = document.createElement('div');
    containerEl.className = 'ta-modal-overlay';
    containerEl.innerHTML = `
      <div class="ta-window">
        <div class="ta-header">
          <span id="ta-title">📖 文字冒險小引擎</span>
          <button class="ta-close-btn" id="ta-close-x">✕ 關閉</button>
        </div>
        <div class="ta-body">
          <div class="ta-display-area" id="ta-display"></div>
          <div class="ta-message-box" id="ta-msg-box"></div>
        </div>
      </div>
    `;
    document.body.appendChild(containerEl);

    document.getElementById('ta-close-x').addEventListener('click', () => {
      TextAdventure.close();
    });
  }

  // ==========================================
  // 4. 公開 API (window.TextAdventure)
  // ==========================================
  const TextAdventure = {
    open(options = {}) {
      currentOptions = options;
      injectStyles();
      createDOM();

      if (options.title) {
        document.getElementById('ta-title').innerText = options.title;
      }

      reader = new ScriptReader();
      reader.load(options.script || '');

      engine = new ScriptEngine(reader);
      engine.init();

      const displayEl = document.getElementById('ta-display');
      const msgBoxEl = document.getElementById('ta-msg-box');
      displayEl.innerHTML = '';
      msgBoxEl.innerHTML = '';

      engine.on('onText', (text) => {
        const lineEl = document.createElement('div');
        lineEl.className = 'ta-message-line';
        lineEl.textContent = text;
        msgBoxEl.appendChild(lineEl);
        msgBoxEl.scrollTop = msgBoxEl.scrollHeight;

        displayEl.innerHTML = `
          <div class="ta-text-bubble">${text}</div>
          <button class="ta-btn" id="ta-next-btn" style="background:#f43f5e; color:#fff;">點擊繼續 ▶</button>
        `;
        document.getElementById('ta-next-btn').onclick = () => {
          engine.step();
        };
      });

      engine.on('onChoice', (choices) => {
        displayEl.innerHTML = `
          <div style="font-weight:bold; margin-bottom:12px; color:#0f172a; font-size:1.1rem;">👉 請選擇你的行動：</div>
        `;
        const choiceContainer = document.createElement('div');
        choiceContainer.className = 'ta-choice-container';

        choices.forEach((choice) => {
          const btn = document.createElement('button');
          btn.className = 'ta-btn';
          btn.textContent = choice.text;
          btn.onclick = () => {
            engine.selectChoice(choice.target);
          };
          choiceContainer.appendChild(btn);
        });

        displayEl.appendChild(choiceContainer);
      });

      engine.on('onEnd', () => {
        displayEl.innerHTML = `
          <div class="ta-text-bubble" style="background:#bbf7d0; border-color:#166534;">🎉 冒險順利結束！</div>
          <button class="ta-btn" id="ta-finish-btn" style="background:#22c55e; color:#fff;">結束並返回</button>
        `;
        document.getElementById('ta-finish-btn').onclick = () => {
          TextAdventure.close({ status: 'completed' });
        };
      });

      this.play();
    },

    play() {
      if (engine) engine.step();
    },

    close(resultData = { status: 'closed' }) {
      if (containerEl && containerEl.parentNode) {
        containerEl.parentNode.removeChild(containerEl);
        containerEl = null;
      }
      reader = null;
      engine = null;

      if (typeof currentOptions.onComplete === 'function') {
        currentOptions.onComplete(resultData);
      }
    }
  };

  global.TextAdventure = TextAdventure;
})(typeof window !== 'undefined' ? window : this);