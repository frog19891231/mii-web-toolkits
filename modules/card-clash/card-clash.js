/**
 * my-web-toolkits - CardClash Module
 * 模組名稱: CardClash
 * 模組描述: 2D 美漫/卡通手繪風格卡牌對撞動畫與戰鬥模擬器
 * 模組目錄: modules/card-clash/
 */

(function (window, document) {
  'use strict';

  // 1. 預設樣式注入 (美漫 Toon 粗線條 + 彈跳動畫)
  const CSS_STYLES = `
    @import url('https://fonts.googleapis.com/css2?family=Bangers&family=Outfit:wght@700;900&display=swap');

    .card-clash-overlay {
      position: fixed;
      inset: 0;
      z-index: 999999;
      background: rgba(11, 15, 25, 0.92);
      backdrop-filter: blur(8px);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: 20px;
      font-family: 'Outfit', sans-serif;
      user-select: none;
      -webkit-user-select: none;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s ease-out;
      overflow: hidden;
    }

    .card-clash-overlay.active {
      opacity: 1;
      pointer-events: auto;
    }

    /* 美漫速線背景 (Speedlines) */
    .card-clash-speedlines {
      position: absolute;
      inset: 0;
      pointer-events: none;
      background: repeating-conic-gradient(
        from 0deg,
        rgba(255, 255, 255, 0.04) 0deg 15deg,
        transparent 15deg 30deg
      );
      animation: clash-spin 20s linear infinite;
    }

    @keyframes clash-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* 美漫風格通用按鈕與面板 */
    .toon-box {
      background: #fff;
      border: 4px solid #000;
      box-shadow: 6px 6px 0px #000;
      border-radius: 16px;
    }

    .toon-btn {
      background: #ffcc00;
      border: 4px solid #000;
      box-shadow: 5px 5px 0px #000;
      color: #000;
      font-family: 'Bangers', cursive, sans-serif;
      font-size: 22px;
      letter-spacing: 1px;
      padding: 8px 24px;
      border-radius: 999px;
      cursor: pointer;
      transition: transform 0.1s, box-shadow 0.1s, background-color 0.2s;
    }

    .toon-btn:hover {
      background: #ffe600;
      transform: translate(-2px, -2px);
      box-shadow: 7px 7px 0px #000;
    }

    .toon-btn:active {
      transform: translate(3px, 3px);
      box-shadow: 2px 2px 0px #000;
    }

    .toon-btn-close {
      background: #ff4757;
      color: #fff;
    }

    .toon-btn-close:hover {
      background: #ff6b81;
    }

    /* 打擊文字彈跳 Popup (POW / CRASH / BOOM) */
    .clash-comic-pop {
      position: absolute;
      font-family: 'Bangers', cursive;
      font-size: 64px;
      color: #fff700;
      text-shadow: 4px 4px 0px #000, -4px -4px 0px #000, 4px -4px 0px #000, -4px 4px 0px #000;
      pointer-events: none;
      z-index: 1000000;
      animation: pop-bounce 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }

    @keyframes pop-bounce {
      0% { transform: scale(0) rotate(-12deg); opacity: 0; }
      50% { transform: scale(1.3) rotate(8deg); opacity: 1; }
      100% { transform: scale(1) rotate(-4deg); opacity: 0; }
    }
  `;

  // 2. CardClash 模組核心類別
  class CardClashModule {
    constructor() {
      this.overlayEl = null;
      this.canvasEl = null;
      this.ctx = null;
      this.options = null;

      this.animFrameId = null;
      this.autoPlayTimer = null;
      this.isClashing = false;

      // 卡牌長寬比例 (標準 1 : 1.7)
      this.cardW = 120;
      this.cardH = Math.round(120 * 1.7); // 204px

      this.cards = { player: null, enemy: null };
      this.playerPos = { x: 0, y: 0, targetY: 0, tilt: 0 };
      this.enemyPos = { x: 0, y: 0, targetY: 0, tilt: 0 };

      this.particles = [];
      this.cameraShake = { duration: 0, intensity: 0 };
      this.lastAngle = null;

      this._injectStyles();
    }

    _injectStyles() {
      if (document.getElementById('card-clash-styles')) return;
      const styleTag = document.createElement('style');
      styleTag.id = 'card-clash-styles';
      styleTag.innerHTML = CSS_STYLES;
      document.head.appendChild(styleTag);
    }

    _createDOM() {
      if (this.overlayEl) return;

      const overlay = document.createElement('div');
      overlay.className = 'card-clash-overlay';
      overlay.innerHTML = `
        <div class="card-clash-speedlines"></div>

        <!-- 頂部 Header -->
        <header class="relative z-10 flex items-center justify-between w-full max-w-xl toon-box p-3 px-5 mt-2">
          <div>
            <div class="text-xs text-slate-500 font-bold tracking-wider">MY-WEB-TOOLKITS</div>
            <div id="clash-title" class="text-xl font-black text-slate-800 tracking-tight">CARD CLASH TOON</div>
          </div>
          <button id="clash-close-btn" class="toon-btn toon-btn-close text-sm px-4 py-1">CLOSE ✕</button>
        </header>

        <!-- Canvas 渲染畫布 (全屏) -->
        <canvas id="card-clash-canvas" class="absolute inset-0 w-full h-full z-0"></canvas>

        <!-- 底部控制按鈕區 -->
        <footer class="relative z-10 flex items-center gap-4 mb-4">
          <button id="clash-play-btn" class="toon-btn">⚔️ ATTACK (PLAY)</button>
          <button id="clash-auto-btn" class="toon-btn" style="background:#00d2d3;">🤖 AUTO: OFF</button>
        </footer>
      `;

      document.body.appendChild(overlay);
      this.overlayEl = overlay;
      this.canvasEl = overlay.querySelector('#card-clash-canvas');
      this.ctx = this.canvasEl.getContext('2d');

      overlay.querySelector('#clash-close-btn').addEventListener('click', () => this.close());
      overlay.querySelector('#clash-play-btn').addEventListener('click', () => this.play());
      
      const autoBtn = overlay.querySelector('#clash-auto-btn');
      autoBtn.addEventListener('click', () => {
        if (this.autoPlayTimer) {
          this.stopAuto();
          autoBtn.innerText = '🤖 AUTO: OFF';
          autoBtn.style.background = '#00d2d3';
        } else {
          this.startAuto();
          autoBtn.innerText = '⚡ AUTO: ON';
          autoBtn.style.background = '#ff9f43';
        }
      });

      window.addEventListener('resize', this._handleResize);
    }

    _handleResize = () => {
      if (!this.canvasEl || !this.overlayEl) return;
      this.canvasEl.width = window.innerWidth;
      this.canvasEl.height = window.innerHeight;

      const centerX = this.canvasEl.width / 2 - this.cardW / 2;
      const centerY = this.canvasEl.height / 2;

      this.enemyPos.x = centerX;
      this.enemyPos.targetY = centerY - (this.cardH + 20);
      this.enemyPos.y = this.enemyPos.targetY;

      this.playerPos.x = centerX;
      this.playerPos.targetY = centerY + 20;
      this.playerPos.y = this.playerPos.targetY;
    };

    open(options = {}) {
      this._createDOM();
      this._handleResize();

      const defaultPlayer = { name: 'HERO', icon: '⚔️', hp: 35, maxHp: 35, atk: 9, def: 2, color: '#ff4757' };
      const defaultEnemy = { name: 'BOSS', icon: '👺', hp: 30, maxHp: 30, atk: 7, def: 1, color: '#2ed573' };

      this.options = {
        title: options.title || 'CARD CLASH BATTLE',
        player: { ...defaultPlayer, ...options.player },
        enemy: { ...defaultEnemy, ...options.enemy },
        autoPlay: options.autoPlay || false,
        autoInterval: options.autoInterval || 800,
        onImpact: options.onImpact || null,
        onComplete: options.onComplete || null
      };

      this.cards.player = { ...this.options.player };
      this.cards.enemy = { ...this.options.enemy };

      this.overlayEl.querySelector('#clash-title').innerText = this.options.title;

      requestAnimationFrame(() => {
        if (this.overlayEl) {
          this.overlayEl.classList.add('active');
        }
      });

      if (!this.animFrameId) {
        this.animFrameId = requestAnimationFrame((ts) => this._renderLoop(ts));
      }

      if (this.options.autoPlay) {
        this.startAuto();
      }
    }

    play() {
      if (this.isClashing || !this.cards.player || !this.cards.enemy) return;

      if (this.cards.player.hp <= 0 || this.cards.enemy.hp <= 0) {
        return;
      }

      this.isClashing = true;

      const startEnemyY = this.enemyPos.targetY;
      const startPlayerY = this.playerPos.targetY;
      const centerX = this.canvasEl.width / 2;
      const centerY = (startEnemyY + startPlayerY) / 2 + this.cardH / 2;
      const restDistance = (startPlayerY - startEnemyY) / 2;

      const sectorAngle = this._getSectorAngle();

      let startTime = null;
      const duration = 160;

      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min(1, (timestamp - startTime) / duration);
        const ease = progress * progress * progress;

        const impactDist = this.cardH * 0.2;
        const currDist = restDistance - (restDistance - impactDist) * ease;

        const dirX = Math.sin(sectorAngle);
        const dirY = Math.cos(sectorAngle);

        this.enemyPos.x = (centerX - dirX * currDist) - this.cardW / 2;
        this.enemyPos.y = (centerY - dirY * currDist) - this.cardH / 2;
        this.enemyPos.tilt = -sectorAngle;

        this.playerPos.x = (centerX + dirX * currDist) - this.cardW / 2;
        this.playerPos.y = (centerY + dirY * currDist) - this.cardH / 2;
        this.playerPos.tilt = -sectorAngle;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this._triggerImpactFX(centerX, centerY, sectorAngle);

          const pDmg = Math.max(1, this.cards.player.atk - this.cards.enemy.def);
          const eDmg = Math.max(1, this.cards.enemy.atk - this.cards.player.def);

          this.cards.enemy.hp = Math.max(0, this.cards.enemy.hp - pDmg);
          this.cards.player.hp = Math.max(0, this.cards.player.hp - eDmg);

          this._spawnComicPop(['POW!', 'CRASH!', 'BOOM!', 'KABOOM!'][Math.floor(Math.random() * 4)], centerX, centerY);

          const isEnded = this.cards.player.hp <= 0 || this.cards.enemy.hp <= 0;
          const winner = this.cards.enemy.hp <= 0 ? 'player' : (this.cards.player.hp <= 0 ? 'enemy' : null);

          if (this.options.onImpact) {
            this.options.onImpact({ playerDmg: pDmg, enemyDmg: eDmg, player: this.cards.player, enemy: this.cards.enemy });
          }

          setTimeout(() => {
            this.enemyPos.x = this.canvasEl.width / 2 - this.cardW / 2;
            this.enemyPos.y = this.enemyPos.targetY;
            this.enemyPos.tilt = 0;

            this.playerPos.x = this.canvasEl.width / 2 - this.cardW / 2;
            this.playerPos.y = this.playerPos.targetY;
            this.playerPos.tilt = 0;

            this.isClashing = false;

            if (isEnded) {
              this.stopAuto();
              if (this.options.onComplete) {
                this.options.onComplete({ winner, player: this.cards.player, enemy: this.cards.enemy });
              }
            }
          }, 180);
        }
      };

      requestAnimationFrame(animate);
    }

    startAuto() {
      this.stopAuto();
      this.autoPlayTimer = setInterval(() => {
        if (!this.isClashing) this.play();
      }, this.options?.autoInterval || 800);
    }

    stopAuto() {
      if (this.autoPlayTimer) {
        clearInterval(this.autoPlayTimer);
        this.autoPlayTimer = null;
      }
    }

    close() {
      this.stopAuto();

      if (this.animFrameId) {
        cancelAnimationFrame(this.animFrameId);
        this.animFrameId = null;
      }

      if (this.overlayEl) {
        this.overlayEl.classList.remove('active');
        setTimeout(() => {
          this.overlayEl.remove();
          this.overlayEl = null;
          this.canvasEl = null;
          this.ctx = null;
        }, 250);
      }
      window.removeEventListener('resize', this._handleResize);
    }

    _getSectorAngle() {
      let angle;
      do {
        angle = (Math.random() - 0.5) * (Math.PI / 2);
      } while (this.lastAngle !== null && Math.abs(angle - this.lastAngle) < (10 * Math.PI) / 180);
      this.lastAngle = angle;
      return angle;
    }

    _triggerImpactFX(x, y, angleOffset) {
      const toonColors = ['#ff4757', '#ffa502', '#eccc68', '#70a1ff', '#ffffff'];
      for (let i = 0; i < 45; i++) {
        const angle = Math.random() * Math.PI * 2 + angleOffset;
        const speed = 4 + Math.random() * 16;
        this.particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 4 + Math.random() * 6,
          color: toonColors[Math.floor(Math.random() * toonColors.length)],
          alpha: 1.0,
          decay: 2.0 + Math.random() * 2.5
        });
      }
      this.cameraShake = { duration: 0.35, intensity: 20 };
    }

    _spawnComicPop(text, x, y) {
      const pop = document.createElement('div');
      pop.className = 'clash-comic-pop';
      pop.innerText = text;
      pop.style.left = `${x - 60}px`;
      pop.style.top = `${y - 40}px`;
      this.overlayEl.appendChild(pop);

      setTimeout(() => pop.remove(), 450);
    }

    _renderLoop(timestamp) {
      if (!this.ctx || !this.canvasEl) return;

      const dt = 0.016;
      this.ctx.clearRect(0, 0, this.canvasEl.width, this.canvasEl.height);

      this.ctx.save();

      if (this.cameraShake.duration > 0) {
        this.cameraShake.duration -= dt;
        const rx = (Math.random() - 0.5) * this.cameraShake.intensity;
        const ry = (Math.random() - 0.5) * this.cameraShake.intensity;
        this.ctx.translate(rx, ry);
      }

      if (!this.isClashing) {
        const floatOffset = Math.sin(timestamp * 0.005) * 6;
        this.enemyPos.y = this.enemyPos.targetY + floatOffset;
        this.playerPos.y = this.playerPos.targetY - floatOffset;
      }

      this._drawToonCard(this.enemyPos, this.cards.enemy, true);
      this._drawToonCard(this.playerPos, this.cards.player, false);

      this._updateParticles(dt);

      this.ctx.restore();
      this.animFrameId = requestAnimationFrame((ts) => this._renderLoop(ts));
    }

    _drawToonCard(pos, card, isEnemy) {
      if (!card) return;

      this.ctx.save();
      this.ctx.translate(pos.x + this.cardW / 2, pos.y + this.cardH / 2);
      this.ctx.rotate(pos.tilt);

      this.ctx.fillStyle = '#000000';
      this.ctx.fillRect(-this.cardW / 2 + 6, -this.cardH / 2 + 6, this.cardW, this.cardH);

      this.ctx.fillStyle = card.color || (isEnemy ? '#ff4757' : '#2ed573');
      this.ctx.fillRect(-this.cardW / 2, -this.cardH / 2, this.cardW, this.cardH);

      this.ctx.lineWidth = 5;
      this.ctx.strokeStyle = '#000000';
      this.ctx.strokeRect(-this.cardW / 2, -this.cardH / 2, this.cardW, this.cardH);

      this.ctx.fillStyle = '#000000';
      this.ctx.font = '900 12px "Outfit", sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(card.name, 0, -this.cardH / 2 + 20);

      this.ctx.font = '42px sans-serif';
      this.ctx.fillText(card.icon, 0, 8);

      this.ctx.font = '900 13px "Outfit", sans-serif';
      this.ctx.textAlign = 'left';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 3;
      this.ctx.strokeText(`⚔️ ${card.atk}`, -this.cardW / 2 + 10, this.cardH / 2 - 30);
      this.ctx.fillText(`⚔️ ${card.atk}`, -this.cardW / 2 + 10, this.cardH / 2 - 30);

      this.ctx.textAlign = 'right';
      this.ctx.strokeText(`🛡️ ${card.def}`, this.cardW / 2 - 10, this.cardH / 2 - 30);
      this.ctx.fillText(`🛡️ ${card.def}`, this.cardW / 2 - 10, this.cardH / 2 - 30);

      const barW = this.cardW - 20;
      const barH = 12;
      const barX = -this.cardW / 2 + 10;
      const barY = this.cardH / 2 - 20;

      this.ctx.fillStyle = '#000000';
      this.ctx.fillRect(barX, barY, barW, barH);

      const hpPct = card.maxHp > 0 ? Math.max(0, card.hp / card.maxHp) : 0;
      this.ctx.fillStyle = '#ffda79';
      this.ctx.fillRect(barX + 2, barY + 2, (barW - 4) * hpPct, barH - 4);

      this.ctx.font = '900 9px "Outfit", sans-serif';
      this.ctx.fillStyle = '#000000';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`${card.hp}/${card.maxHp}`, 0, barY + 9);

      this.ctx.restore();
    }

    _updateParticles(dt) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay * dt;

        if (p.alpha <= 0) {
          this.particles.splice(i, 1);
          continue;
        }

        this.ctx.save();
        this.ctx.globalAlpha = Math.max(0, p.alpha);
        this.ctx.fillStyle = p.color;
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.restore();
      }
    }
  }

  window.CardClash = new CardClashModule();

})(window, document);