/**
 * my-web-toolkits - CardClash Module
 * 模組名稱: CardClash
 * 模組描述: 簡約像素風卡牌碰撞戰鬥與數值結算模組
 * 模組目錄: modules/card-clash/
 */

(function (window, document) {
  'use strict';

  // 1. CardClash overlay style, aligned with DiceRoller's internal UI
  const CSS_STYLES = `
    .card-clash-overlay {
      position: fixed;
      inset: 0;
      z-index: 999999;
      background: rgba(10, 10, 15, 0.75);
      backdrop-filter: blur(4px);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      user-select: none;
      -webkit-user-select: none;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
      overflow: hidden;
    }

    .card-clash-overlay.active {
      opacity: 1;
      pointer-events: auto;
    }

    .card-clash-overlay .toon-box {
      color: #1e293b;
      background: #ffffff;
      border: 3px solid #1e293b;
      box-shadow: 4px 4px 0 #1e293b;
      border-radius: 1rem;
      padding: 1rem;
    }

    .card-clash-overlay header {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      width: min(100%, 36rem);
      padding: 12px 16px;
      margin-top: 4px;
    }

    .card-clash-overlay #card-clash-canvas {
      position: absolute;
      inset: 0;
      z-index: 0;
      display: block;
      width: 100%;
      height: 100%;
    }

    .card-clash-overlay #clash-title {
      color: #1e293b;
      font-size: clamp(14px, 3vw, 20px);
      letter-spacing: .04em;
    }

    .card-clash-overlay header > div > div:first-child {
      color: #64748b;
      font: 700 10px/1.5 system-ui, sans-serif;
    }

    .card-clash-overlay footer {
      position: relative;
      z-index: 2;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 12px;
      margin-bottom: 8px;
      padding: 8px 16px;
      border: 3px solid #1e293b;
      border-radius: 9999px;
      background: #ffffff;
      box-shadow: 4px 4px 0 #1e293b;
    }

    .card-clash-overlay .toon-btn {
      background: #6366f1;
      border: 3px solid #1e293b;
      box-shadow: 3px 3px 0 #1e293b;
      color: #ffffff;
      font: 900 1.125rem/1.2 system-ui, sans-serif;
      padding: 0.6rem 2rem;
      border-radius: 9999px;
      cursor: pointer;
      transition: all .1s ease;
    }

    .card-clash-overlay #clash-auto-btn { background: #10b981; }
    .card-clash-overlay #clash-auto-btn.is-active,
    .card-clash-overlay #clash-auto-btn.is-active:hover { background: #059669; }

    .card-clash-overlay .toon-btn:hover {
      background: #4f46e5;
      transform: translate(-1px, -1px);
      box-shadow: 5px 5px 0 #1e293b;
    }

    .card-clash-overlay .toon-btn:active {
      transform: translate(3px, 3px);
      box-shadow: 1px 1px 0 #1e293b;
    }

    .card-clash-overlay .toon-btn-close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
      padding: 0;
      background: #f43f5e;
      border-color: #1e293b;
      color: #ffffff;
      font-size: 1rem;
    }

    .card-clash-overlay .toon-btn-close:hover {
      background: #e11d48;
      color: #ffffff;
    }

    .clash-comic-pop {
      position: absolute;
      padding: 4px 12px;
      border: 2px solid #1e293b;
      background: #ffffff;
      box-shadow: 3px 3px 0 #1e293b;
      border-radius: .5rem;
      color: #4f46e5;
      font: 900 1.25rem/1.2 system-ui, sans-serif;
      pointer-events: none;
      z-index: 1000000;
      animation: clash-notice .45s ease forwards;
    }

    @keyframes clash-notice {
      0% { transform: scale(.65) rotate(-5deg); opacity: 0; }
      55% { transform: scale(1.12) rotate(3deg); opacity: 1; }
      100% { transform: scale(1) rotate(0); opacity: 0; }
    }

    @media (max-width: 480px) {
      .card-clash-overlay footer { gap: 8px; }
      .card-clash-overlay .toon-btn { padding: 0.5rem 1rem; font-size: .9rem; }
    }
  `;

  const DEFAULT_RULE_ID = 'basic';
  const DEFAULT_CARD_TYPE_ID = 'basic';

  // Internal rule-module contract. New rule implementations are registered here;
  // callers select an ID and never load or manage the implementation directly.
  const RULE_MODULES = Object.freeze({
    basic: Object.freeze({
      resolveCollision({ player, enemy }) {
        return {
          playerDmg: Math.max(1, Number(enemy.atk) - Number(player.def)),
          enemyDmg: Math.max(1, Number(player.atk) - Number(enemy.def))
        };
      }
    })
  });

  // Internal presentation contract. Future card renderers can be added without
  // changing the battle-rule implementation.
  const CARD_TYPES = Object.freeze({
    basic: Object.freeze({
      cardStyle: Object.freeze({
        outlineColor: '#1e293b',
        shadowColor: '#1e293b',
        hpBarColor: '#10b981'
      }),
      renderCard(module, position, card, isEnemy) {
        module._drawBasicCard(position, card, isEnemy);
      }
    })
  });

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
      this.ruleModule = RULE_MODULES.basic;
      this.ruleOptions = {};
      this.cardType = CARD_TYPES.basic;
      this.round = 0;
      this.completionSent = false;
      this.pendingTimeouts = new Set();
      this.pendingFrames = new Set();
      this.sessionId = 0;

      // 卡牌長寬比例 (標準 1 : 1.7)
      this.cardW = 120;
      this.cardH = Math.round(120 * 1.7); // 204px

      this.cards = { player: null, enemy: null };
      this.playerPos = { x: 0, y: 0, targetY: 0, tilt: 0 };
      this.enemyPos = { x: 0, y: 0, targetY: 0, tilt: 0 };

      this.particles = [];
      this.cameraShake = { duration: 0, intensity: 0 };

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
        <!-- 頂部 Header -->
        <header class="relative z-10 flex items-center justify-between w-full max-w-xl toon-box p-3 px-5 mt-2">
          <div>
            <div class="text-xs text-slate-500 font-bold tracking-wider">MY-WEB-TOOLKITS</div>
            <div id="clash-title" class="text-xl font-black tracking-tight">CARD CLASH</div>
          </div>
          <button id="clash-close-btn" class="toon-btn toon-btn-close text-sm px-4 py-1">CLOSE ✕</button>
        </header>

        <!-- Canvas 渲染畫布 (全屏) -->
        <canvas id="card-clash-canvas" class="absolute inset-0 w-full h-full z-0"></canvas>

        <!-- 底部控制按鈕區 -->
        <footer class="relative z-10 flex items-center gap-4 mb-4">
          <button id="clash-play-btn" class="toon-btn">⚔️ ATTACK</button>
          <button id="clash-auto-btn" class="toon-btn">🤖 AUTO: OFF</button>
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
          autoBtn.classList.remove('is-active');
        } else {
          this.startAuto();
          autoBtn.innerText = '⚡ AUTO: ON';
          autoBtn.classList.add('is-active');
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
      this.sessionId += 1;
      this._cancelRunWork();
      this.stopAuto();
      this.isClashing = false;
      this.completionSent = false;
      this.round = 0;

      const ruleSpec = options.rule;
      const requestedRuleId = typeof ruleSpec === 'string' ? ruleSpec : ruleSpec?.id;
      const ruleId = Object.prototype.hasOwnProperty.call(RULE_MODULES, requestedRuleId)
        ? requestedRuleId
        : DEFAULT_RULE_ID;
      this.ruleModule = RULE_MODULES[ruleId];
      this.ruleOptions = ruleId === requestedRuleId && ruleSpec && typeof ruleSpec === 'object'
        ? { ...(ruleSpec.options || {}) }
        : {};

      const requestedTypeId = typeof options.type === 'string' ? options.type : options.type?.id;
      const typeId = Object.prototype.hasOwnProperty.call(CARD_TYPES, requestedTypeId)
        ? requestedTypeId
        : DEFAULT_CARD_TYPE_ID;
      this.cardType = CARD_TYPES[typeId];

      this._createDOM();
      this._handleResize();

      const defaultPlayer = { name: 'HERO', icon: '⚔️', hp: 35, maxHp: 35, atk: 9, def: 2, color: '#4F46E5' };
      const defaultEnemy = { name: 'BOSS', icon: '👺', hp: 30, maxHp: 30, atk: 7, def: 1, color: '#F43F5E' };

      this.options = {
        title: options.title || 'CARD CLASH BATTLE',
        player: { ...defaultPlayer, ...options.player },
        enemy: { ...defaultEnemy, ...options.enemy },
        cardStyle: {
          ...this.cardType.cardStyle,
          ...(options.cardStyle || {})
        },
        autoPlay: options.autoPlay || false,
        autoInterval: options.autoInterval || 800,
        rule: ruleId,
        type: typeId,
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
        this.animFrameId = this._requestFrame((ts) => this._renderLoop(ts));
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
      const restX = centerX - this.cardW / 2;
      const centerY = (startEnemyY + startPlayerY) / 2 + this.cardH / 2;
      const restDistance = (startPlayerY - startEnemyY) / 2;
      const sectorAngle = 0;
      const dirX = Math.sin(sectorAngle);
      const dirY = Math.cos(sectorAngle);
      const windupDistance = 32 + Math.random() * 22;
      const windupDist = restDistance + windupDistance;
      const impactDist = this.cardH * 0.2;
      const windupDuration = 110;
      const dashDuration = 260;
      const duration = windupDuration + dashDuration;
      const enemyWindup = {
        x: centerX - dirX * windupDist - this.cardW / 2,
        y: centerY - dirY * windupDist - this.cardH / 2
      };
      const playerWindup = {
        x: centerX + dirX * windupDist - this.cardW / 2,
        y: centerY + dirY * windupDist - this.cardH / 2
      };
      const enemyImpact = {
        x: centerX - dirX * impactDist - this.cardW / 2,
        y: centerY - dirY * impactDist - this.cardH / 2
      };
      const playerImpact = {
        x: centerX + dirX * impactDist - this.cardW / 2,
        y: centerY + dirY * impactDist - this.cardH / 2
      };
      const mix = (from, to, amount) => from + (to - from) * amount;

      let startTime = null;

      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsed = Math.min(timestamp - startTime, duration);

        if (elapsed < windupDuration) {
          const progress = elapsed / windupDuration;
          const windup = 1 - Math.pow(1 - progress, 3);
          this.enemyPos.x = mix(restX, enemyWindup.x, windup);
          this.enemyPos.y = mix(startEnemyY, enemyWindup.y, windup);
          this.enemyPos.tilt = 0;
          this.playerPos.x = mix(restX, playerWindup.x, windup);
          this.playerPos.y = mix(startPlayerY, playerWindup.y, windup);
          this.playerPos.tilt = 0;
        } else {
          const progress = Math.min(1, (elapsed - windupDuration) / dashDuration);
          const acceleration = progress * progress * progress;
          this.enemyPos.x = mix(enemyWindup.x, enemyImpact.x, acceleration);
          this.enemyPos.y = mix(enemyWindup.y, enemyImpact.y, acceleration);
          this.enemyPos.tilt = 0;
          this.playerPos.x = mix(playerWindup.x, playerImpact.x, acceleration);
          this.playerPos.y = mix(playerWindup.y, playerImpact.y, acceleration);
          this.playerPos.tilt = 0;
        }

        if (elapsed < duration) {
          this._requestFrame(animate);
        } else {
          this._triggerImpactFX(centerX, centerY, sectorAngle);
          this._startImpactRecoil();
          this._spawnComicPop(['POW!', 'CRASH!', 'BOOM!', 'KABOOM!'][Math.floor(Math.random() * 4)], centerX, centerY);

          const damage = this.ruleModule.resolveCollision({
            player: { ...this.cards.player },
            enemy: { ...this.cards.enemy },
            options: this.ruleOptions,
            round: this.round + 1
          });
          const playerDmg = Math.max(0, Number(damage.playerDmg) || 0);
          const enemyDmg = Math.max(0, Number(damage.enemyDmg) || 0);
          this.cards.enemy.hp = Math.max(0, this.cards.enemy.hp - playerDmg);
          this.cards.player.hp = Math.max(0, this.cards.player.hp - enemyDmg);
          this.round += 1;

          const isEnded = this.cards.player.hp <= 0 || this.cards.enemy.hp <= 0;
          const winner = this.cards.enemy.hp <= 0 ? 'player' : (this.cards.player.hp <= 0 ? 'enemy' : null);
          if (this.options.onImpact) {
            this.options.onImpact({
              round: this.round,
              rule: this.options.rule,
              type: this.options.type,
              playerDmg,
              enemyDmg,
              player: { ...this.cards.player },
              enemy: { ...this.cards.enemy }
            });
          }

          this._scheduleTimeout(() => {
            this.enemyPos.x = this.canvasEl.width / 2 - this.cardW / 2;
            this.enemyPos.y = this.enemyPos.targetY;
            this.enemyPos.tilt = 0;
            this.playerPos.x = this.canvasEl.width / 2 - this.cardW / 2;
            this.playerPos.y = this.playerPos.targetY;
            this.playerPos.tilt = 0;
            this.isClashing = false;
            if (isEnded) this._finishBattle(winner);
          }, 180);
        }
      };

      this._requestFrame(animate);
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
      this._cancelRunWork();
      this.isClashing = false;

      if (this.overlayEl) {
        const overlay = this.overlayEl;
        overlay.classList.remove('active');
        overlay.remove();
        this.overlayEl = null;
        this.canvasEl = null;
        this.ctx = null;
      }
      window.removeEventListener('resize', this._handleResize);
    }

    _requestFrame(callback) {
      let frameId = null;
      frameId = requestAnimationFrame((timestamp) => {
        this.pendingFrames.delete(frameId);
        if (this.animFrameId === frameId) this.animFrameId = null;
        callback(timestamp);
      });
      this.pendingFrames.add(frameId);
      return frameId;
    }

    _scheduleTimeout(callback, delay) {
      const timerId = setTimeout(() => {
        this.pendingTimeouts.delete(timerId);
        callback();
      }, delay);
      this.pendingTimeouts.add(timerId);
      return timerId;
    }

    _cancelRunWork() {
      this.pendingFrames.forEach((frameId) => cancelAnimationFrame(frameId));
      this.pendingFrames.clear();
      this.animFrameId = null;
      this.pendingTimeouts.forEach((timerId) => clearTimeout(timerId));
      this.pendingTimeouts.clear();
    }

    _finishBattle(winner) {
      if (this.completionSent) return;
      this.completionSent = true;
      const completedSession = this.sessionId;
      this.stopAuto();
      const result = {
        rule: this.options.rule,
        type: this.options.type,
        rounds: this.round,
        winner,
        player: { ...this.cards.player },
        enemy: { ...this.cards.enemy }
      };
      try {
        if (this.options.onComplete) this.options.onComplete(result);
      } finally {
        if (this.sessionId === completedSession) this.close();
      }
    }

    _triggerImpactFX(x, y, angleOffset) {
      const pixelColors = ['#4F46E5', '#10B981', '#F59E0B', '#A5B4FC', '#F8FAFC'];
      for (let i = 0; i < 45; i++) {
        const angle = Math.random() * Math.PI * 2 + angleOffset;
        const speed = 4 + Math.random() * 16;
        this.particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 4 + Math.random() * 6,
          color: pixelColors[Math.floor(Math.random() * pixelColors.length)],
          alpha: 1.0,
          decay: 2.0 + Math.random() * 2.5
        });
      }
      this.cameraShake = { duration: 0.2, intensity: 28 };
    }

    _startImpactRecoil() {
      const enemyStart = { x: this.enemyPos.x, y: this.enemyPos.y, tilt: this.enemyPos.tilt };
      const playerStart = { x: this.playerPos.x, y: this.playerPos.y, tilt: this.playerPos.tilt };
      const enemyDistance = 56 + Math.random() * 38;
      const playerDistance = 56 + Math.random() * 38;
      const duration = 160;
      let startTime = null;

      const animateRecoil = (timestamp) => {
        if (!this.overlayEl || !this.isClashing) return;
        if (!startTime) startTime = timestamp;
        const progress = Math.min(1, (timestamp - startTime) / duration);
        const recoil = Math.sin(progress * Math.PI);

        this.enemyPos.x = enemyStart.x;
        this.enemyPos.y = enemyStart.y - enemyDistance * recoil;
        this.playerPos.x = playerStart.x;
        this.playerPos.y = playerStart.y + playerDistance * recoil;
        this.enemyPos.tilt = 0;
        this.playerPos.tilt = 0;

        if (progress < 1) this._requestFrame(animateRecoil);
      };

      this._requestFrame(animateRecoil);
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

      this.cardType.renderCard(this, this.enemyPos, this.cards.enemy, true);
      this.cardType.renderCard(this, this.playerPos, this.cards.player, false);

      this._updateParticles(dt);

      this.ctx.restore();
      this.animFrameId = this._requestFrame((ts) => this._renderLoop(ts));
    }

    _drawBasicCard(pos, card, isEnemy) {
      if (!card) return;
      const style = this.options?.cardStyle || {};
      const accentColor = card.color || (isEnemy ? '#f43f5e' : '#6366f1');
      const left = -this.cardW / 2;
      const top = -this.cardH / 2;

      this.ctx.save();
      this.ctx.translate(pos.x + this.cardW / 2, pos.y + this.cardH / 2);
      this.ctx.rotate(pos.tilt);

      this.ctx.fillStyle = style.shadowColor || '#1e293b';
      this._roundedRectPath(left + 5, top + 5, this.cardW, this.cardH, 14);
      this.ctx.fill();

      this.ctx.fillStyle = '#E9D6B0';
      this._roundedRectPath(left, top, this.cardW, this.cardH, 14);
      this.ctx.fill();
      this.ctx.lineWidth = 4;
      this.ctx.strokeStyle = style.outlineColor || '#1e293b';
      this._roundedRectPath(left + 1, top + 1, this.cardW - 2, this.cardH - 2, 13);
      this.ctx.stroke();

      // Character identity: a color strip, nameplate, and framed artwork area.
      this.ctx.fillStyle = accentColor;
      this.ctx.fillRect(left + 7, top + 8, this.cardW - 14, 8);
      this.ctx.fillStyle = '#1e293b';
      this.ctx.font = '900 12px system-ui, -apple-system, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(String(card.name || '').toUpperCase(), 0, top + 34, this.cardW - 20);

      this.ctx.fillStyle = '#F5E9D2';
      this._roundedRectPath(-48, top + 43, 96, 77, 8);
      this.ctx.fill();
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = accentColor;
      this._roundedRectPath(-48, top + 43, 96, 77, 8);
      this.ctx.stroke();
      this.ctx.fillStyle = '#1e293b';
      this.ctx.font = '42px system-ui, sans-serif';
      this.ctx.fillText(card.icon, 0, top + 96);

      // Attack and defense read as separate card stats instead of plain labels.
      const statY = top + 128;
      this.ctx.font = '900 10px system-ui, -apple-system, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = '#ffe4e6';
      this._roundedRectPath(left + 7, statY, 49, 22, 7);
      this.ctx.fill();
      this.ctx.strokeStyle = '#1e293b';
      this.ctx.lineWidth = 2;
      this._roundedRectPath(left + 7, statY, 49, 22, 7);
      this.ctx.stroke();
      this.ctx.fillStyle = '#9f1239';
      this.ctx.fillText(`ATK ${card.atk}`, left + 31.5, statY + 15);

      this.ctx.fillStyle = '#e0e7ff';
      this._roundedRectPath(left + 64, statY, 49, 22, 7);
      this.ctx.fill();
      this.ctx.strokeStyle = '#1e293b';
      this.ctx.lineWidth = 2;
      this._roundedRectPath(left + 64, statY, 49, 22, 7);
      this.ctx.stroke();
      this.ctx.fillStyle = '#3730a3';
      this.ctx.fillText(`DEF ${card.def}`, left + 88.5, statY + 15);

      const barW = this.cardW - 20;
      const barH = 9;
      const barX = left + 10;
      const barY = top + 160;
      this.ctx.fillStyle = '#1e293b';
      this._roundedRectPath(barX, barY, barW, barH, 4);
      this.ctx.fill();
      const hpPct = card.maxHp > 0 ? Math.max(0, card.hp / card.maxHp) : 0;
      if (hpPct > 0) {
        this.ctx.fillStyle = style.hpBarColor || '#10b981';
        this._roundedRectPath(barX + 2, barY + 2, (barW - 4) * hpPct, barH - 4, 2);
        this.ctx.fill();
      }

      this.ctx.font = '900 10px system-ui, -apple-system, sans-serif';
      this.ctx.fillStyle = '#64748b';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`HP ${card.hp} / ${card.maxHp}`, 0, top + 187);

      this.ctx.restore();
    }

    _roundedRectPath(x, y, width, height, radius) {
      const r = Math.min(radius, width / 2, height / 2);
      this.ctx.beginPath();
      this.ctx.moveTo(x + r, y);
      this.ctx.lineTo(x + width - r, y);
      this.ctx.quadraticCurveTo(x + width, y, x + width, y + r);
      this.ctx.lineTo(x + width, y + height - r);
      this.ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
      this.ctx.lineTo(x + r, y + height);
      this.ctx.quadraticCurveTo(x, y + height, x, y + height - r);
      this.ctx.lineTo(x, y + r);
      this.ctx.quadraticCurveTo(x, y, x + r, y);
      this.ctx.closePath();
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
        this.ctx.fillRect(Math.round(p.x), Math.round(p.y), Math.max(3, Math.round(p.size)), Math.max(3, Math.round(p.size)));
        this.ctx.restore();
      }
    }
  }

  window.CardClash = new CardClashModule();

})(window, document);

