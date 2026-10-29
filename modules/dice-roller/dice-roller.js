/**
 * 3D Toon Dice Roller Module
 * Part of Web-Toolkits Collection
 * 
 * Features:
 * - 2D Toon/Cel Shading with Black Outlines or Realistic/Monochrome shading styles.
 * - Dynamic Canvas & Modal Injection (Zero DOM pollution).
 * - Fully configurable physics (gravity, height, force, torque, angle).
 * - Custom Face Value Assignments (e.g., [2, 2, 2, 4, 4, 4]).
 */
(function (global) {
    'use strict';

    let scene, camera, renderer, world;
    let diceArray = [];
    let wallBodies = [];
    let isRolling = false;
    let rollCheckTimeout = null;
    let isInitialized = false;

    let currentTask = {
        title: 'Dice Roll',
        diceSpecs: [],
        results: [],
        total: 0,
        onComplete: null,
        renderStyle: 0, // 0: Toon, 1: Monochrome, 2: Realistic, 3: Custom
        customTheme: { primary: '#6366f1', text: '#1e293b', border: '#1e293b' },
        physics: {
            gravity: -35,
            height: 3.5,
            impulseForce: 16.0,
            torqueForce: 30.0,
            angleDeg: 0,
            restitution: 0.65
        }
    };

    let synth, noise, audioInit = false;

    function initAudio() {
        if (audioInit || typeof Tone === 'undefined') return;
        try {
            Tone.start();
            synth = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: "square" },
                envelope: { attack: 0.001, decay: 0.08, sustain: 0.01, release: 0.05 }
            }).toDestination();
            synth.volume.value = -12;

            noise = new Tone.NoiseSynth({
                noise: { type: 'white' },
                envelope: { attack: 0.001, decay: 0.04, sustain: 0 }
            }).toDestination();
            noise.volume.value = -18;
            audioInit = true;
        } catch (e) {}
    }

    function playSound(intensity) {
        if (!audioInit) return;
        try {
            const pitch = 250 + Math.random() * 300 + intensity * 150;
            if (intensity > 0.3) synth.triggerAttackRelease(pitch, "32n", undefined, Math.min(intensity, 1));
            else if (intensity > 0.05) noise.triggerAttackRelease("32n");
        } catch(e) {}
    }

    function injectUI() {
        if (document.getElementById('dr-overlay-container')) return;

        const overlayDiv = document.createElement('div');
        overlayDiv.id = 'dr-overlay-container';
        overlayDiv.className = 'dr-overlay dr-hidden';
        overlayDiv.innerHTML = `
            <style>
                .dr-overlay { position: fixed; inset: 0; z-index: 999999; display: flex; flex-direction: column; justify-content: space-between; padding: 1.5rem; background: rgba(10, 10, 15, 0.75); backdrop-filter: blur(4px); font-family: system-ui, -apple-system, sans-serif; transition: opacity 0.3s ease; }
                .dr-hidden { display: none !important; }
                .dr-canvas { position: absolute; inset: 0; z-index: 0; }
                .dr-card { background: #ffffff; border: 3px solid #1e293b; box-shadow: 4px 4px 0px #1e293b; border-radius: 1rem; padding: 1rem; pointer-events: auto; }
                .dr-btn { background: #6366f1; color: white; border: 3px solid #1e293b; box-shadow: 3px 3px 0px #1e293b; border-radius: 9999px; padding: 0.6rem 2rem; font-weight: 900; font-size: 1.125rem; cursor: pointer; transition: all 0.1s ease; display: inline-flex; align-items: center; gap: 0.5rem; }
                .dr-btn:hover { transform: translate(-1px, -1px); box-shadow: 5px 5px 0px #1e293b; }
                .dr-btn:active { transform: translate(2px, 2px); box-shadow: 1px 1px 0px #1e293b; }
                .dr-btn-submit { background: #10b981; }
                .dr-close { background: #f43f5e; color: white; border: 3px solid #1e293b; width: 2.5rem; height: 2.5rem; border-radius: 9999px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; }
                .dr-badge { background: #ffffff; border: 2px solid #1e293b; padding: 0.25rem 0.75rem; border-radius: 0.5rem; font-weight: 900; color: #4f46e5; display: inline-flex; align-items: center; gap: 0.25rem; animation: drBounce 0.5s ease infinite alternate; }
                @keyframes drBounce { from { transform: translateY(0); } to { transform: translateY(-4px); } }
            </style>
            <div id="dr-canvas-host" class="dr-canvas"></div>
            
            <div style="position: relative; z-index: 10; display: flex; justify-content: space-between; width: 100%; max-width: 56rem; margin: 0 auto; pointer-events: none;">
                <div class="dr-card">
                    <div id="dr-title" style="font-size: 1.25rem; font-weight: 900; color: #1e293b;">投擲骰子</div>
                    <div id="dr-desc" style="font-size: 0.75rem; color: #64748b; font-weight: bold;">點擊按鈕進行投擲</div>
                </div>
                <button onclick="DiceRoller.close()" class="dr-close" style="pointer-events: auto;">✕</button>
            </div>

            <div style="position: relative; z-index: 10; width: 100%; max-width: 36rem; margin: 0 auto 1rem auto; display: flex; flex-direction: column; align-items: center; gap: 1rem; pointer-events: none;">
                <div id="dr-results-badges" style="display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center; min-height: 40px; pointer-events: auto;"></div>
                <div class="dr-card" style="border-radius: 9999px; padding: 0.5rem 2rem;">
                    <button id="dr-btn-play" onclick="DiceRoller.playRoll()" class="dr-btn">▶ 播放投擲</button>
                    <button id="dr-btn-submit" onclick="DiceRoller.submitAndClose()" class="dr-btn dr-btn-submit dr-hidden">✓ 確認並關閉</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlayDiv);
    }

    function initEngine() {
        if (isInitialized) return;
        injectUI();
        const container = document.getElementById('dr-canvas-host');

        scene = new THREE.Scene();
        scene.background = null;

        const aspect = container.clientWidth / container.clientHeight;
        const frustumSize = 14;
        camera = new THREE.OrthographicCamera(
            (frustumSize * aspect) / -2, (frustumSize * aspect) / 2,
            frustumSize / 2, frustumSize / -2, 0.1, 100
        );
        camera.position.set(0, 15, 0);
        camera.lookAt(0, 0, 0);

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.BasicShadowMap;
        container.appendChild(renderer.domElement);

        scene.add(new THREE.AmbientLight(0xffffff, 0.85));
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
        dirLight.position.set(10, 20, 5);
        dirLight.castShadow = true;
        scene.add(dirLight);

        world = new CANNON.World();
        world.gravity.set(0, currentTask.physics.gravity, 0);

        const floorMat = new CANNON.Material('floor');
        const diceMat = new CANNON.Material('dice');
        world.addContactMaterial(new CANNON.ContactMaterial(diceMat, floorMat, { 
            friction: 0.2, 
            restitution: currentTask.physics.restitution 
        }));

        const floorBody = new CANNON.Body({ mass: 0, shape: new CANNON.Plane(), material: floorMat });
        floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        world.addBody(floorBody);

        updateViewBounds();
        window.addEventListener('resize', onResize);

        animate();
        isInitialized = true;
    }

    function updateViewBounds() {
        wallBodies.forEach(w => world.remove(w));
        wallBodies = [];

        const container = document.getElementById('dr-canvas-host');
        if (!container || container.clientWidth === 0) return;

        const aspect = container.clientWidth / container.clientHeight;
        const frustumSize = 14;
        const viewW = frustumSize * aspect - 1.8;
        const viewD = frustumSize - 1.8;

        const wallMat = new CANNON.Material('wall');
        const addWall = (x, z, rotY) => {
            const body = new CANNON.Body({ mass: 0, shape: new CANNON.Plane(), material: wallMat });
            body.position.set(x, 0, z);
            body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), rotY);
            world.addBody(body);
            wallBodies.push(body);
        };

        addWall(0, viewD / 2, Math.PI);
        addWall(0, -viewD / 2, 0);
        addWall(-viewW / 2, 0, Math.PI / 2);
        addWall(viewW / 2, 0, -Math.PI / 2);
    }

    function createFaceTexture(val, style, customTheme) {
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 256;
        const ctx = canvas.getContext('2d');

        let bgColor = '#ffffff';
        let dotColor = '#1e293b';
        let borderColor = '#1e293b';

        if (style === 1) {
            bgColor = '#ffffff'; dotColor = '#000000'; borderColor = '#000000';
        } else if (style === 2) {
            bgColor = '#f8fafc'; dotColor = '#1e3a8a'; borderColor = '#94a3b8';
        } else if (style === 3 && customTheme) {
            bgColor = customTheme.primary || '#ffffff';
            dotColor = customTheme.text || '#1e293b';
            borderColor = customTheme.border || '#1e293b';
        }

        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, 256, 256);

        ctx.lineWidth = 14;
        ctx.strokeStyle = borderColor;
        ctx.strokeRect(7, 7, 242, 242);

        const dotPositions = {
            1: [[0.5, 0.5]],
            2: [[0.28, 0.28], [0.72, 0.72]],
            3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
            4: [[0.28, 0.28], [0.72, 0.28], [0.28, 0.72], [0.72, 0.72]],
            5: [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]],
            6: [[0.28, 0.22], [0.72, 0.22], [0.28, 0.5], [0.72, 0.5], [0.28, 0.78], [0.72, 0.78]]
        };

        if (dotPositions[val]) {
            dotPositions[val].forEach(pos => {
                ctx.beginPath();
                ctx.arc(pos[0] * 256, pos[1] * 256, val === 1 ? 32 : 22, 0, Math.PI * 2);
                ctx.fillStyle = (val === 1 && style === 0) ? '#ef4444' : dotColor;
                ctx.fill();
                ctx.lineWidth = 4;
                ctx.strokeStyle = borderColor;
                ctx.stroke();
            });
        } else {
            ctx.fillStyle = dotColor;
            ctx.font = 'bold 120px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(val, 128, 128);
        }

        const texture = new THREE.CanvasTexture(canvas);
        if (style === 2) {
            return new THREE.MeshPhongMaterial({ map: texture, shininess: 80 });
        }
        return new THREE.MeshToonMaterial({ map: texture });
    }

    const diceGeo = new THREE.BoxGeometry(1.4, 1.4, 1.4);
    const outlineGeo = new THREE.BoxGeometry(1.52, 1.52, 1.52);
    const outlineMat = new THREE.MeshBasicMaterial({ color: 0x1e293b, side: THREE.BackSide });

    function createSingleDice(faceValues) {
        const faces = (Array.isArray(faceValues) && faceValues.length === 6) ? faceValues : [1, 2, 3, 4, 5, 6];
        const materials = faces.map(val => createFaceTexture(val, currentTask.renderStyle, currentTask.customTheme));

        const mesh = new THREE.Mesh(diceGeo, materials);
        mesh.castShadow = true;

        if (currentTask.renderStyle === 0 || currentTask.renderStyle === 3) {
            mesh.add(new THREE.Mesh(outlineGeo, outlineMat));
        }

        scene.add(mesh);

        const body = new CANNON.Body({
            mass: 1.5,
            shape: new CANNON.Box(new CANNON.Vec3(0.7, 0.7, 0.7)),
            linearDamping: 0.15,
            angularDamping: 0.15
        });
        world.addBody(body);

        body.addEventListener('collide', (e) => {
            const v = e.contact.getImpactVelocityAlongNormal();
            if (v > 0.5) playSound(v / 15);
        });

        return { mesh, body, faceValues: faces };
    }

    function setupDice(diceSpecs) {
        diceArray.forEach(d => { scene.remove(d.mesh); world.remove(d.body); });
        diceArray = [];

        const spacing = 1.8;
        const startX = -((diceSpecs.length - 1) * spacing) / 2;

        diceSpecs.forEach((faces, i) => {
            const dice = createSingleDice(faces);
            dice.body.position.set(startX + i * spacing, 1.2, 0);
            dice.body.quaternion.setFromEuler(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
            dice.mesh.position.copy(dice.body.position);
            dice.mesh.quaternion.copy(dice.body.quaternion);
            diceArray.push(dice);
        });
    }

    function onResize() {
        const container = document.getElementById('dr-canvas-host');
        if (!container || !renderer) return;
        const aspect = container.clientWidth / container.clientHeight;
        const frustumSize = 14;

        camera.left = (frustumSize * aspect) / -2;
        camera.right = (frustumSize * aspect) / 2;
        camera.top = frustumSize / 2;
        camera.bottom = frustumSize / -2;
        camera.updateProjectionMatrix();

        renderer.setSize(container.clientWidth, container.clientHeight);
        updateViewBounds();
    }

    function animate() {
        requestAnimationFrame(animate);
        if (world) {
            world.step(1 / 60);
            diceArray.forEach(dice => {
                dice.mesh.position.copy(dice.body.position);
                dice.mesh.quaternion.copy(dice.body.quaternion);
            });
        }
        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
    }

    function getTopFaceValue(dice) {
        const faceNormals = [
            new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0),
            new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -1, 0),
            new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1)
        ];
        const worldUp = new THREE.Vector3(0, 1, 0);
        let maxDot = -Infinity;
        let topIndex = 0;

        faceNormals.forEach((normal, idx) => {
            const worldNormal = normal.clone().applyQuaternion(dice.mesh.quaternion);
            const dot = worldNormal.dot(worldUp);
            if (dot > maxDot) {
                maxDot = dot;
                topIndex = idx;
            }
        });
        return dice.faceValues[topIndex];
    }

    function checkIfStopped() {
        let stopped = true;
        diceArray.forEach(dice => {
            if (dice.body.velocity.length() > 0.1 || dice.body.angularVelocity.length() > 0.1) {
                stopped = false;
            }
        });

        if (stopped) {
            isRolling = false;
            onRollFinished();
        } else {
            rollCheckTimeout = setTimeout(checkIfStopped, 150);
        }
    }

    function onRollFinished() {
        currentTask.results = diceArray.map(dice => getTopFaceValue(dice));
        currentTask.total = currentTask.results.reduce((a, b) => a + b, 0);

        const container = document.getElementById('dr-results-badges');
        container.innerHTML = '';

        currentTask.results.forEach(val => {
            const badge = document.createElement('div');
            badge.className = 'dr-badge';
            badge.innerHTML = `🎲 ${val}`;
            container.appendChild(badge);
        });

        document.getElementById('dr-btn-play').classList.add('dr-hidden');
        document.getElementById('dr-btn-submit').classList.remove('dr-hidden');
    }

    global.DiceRoller = {
        open: function (countOrOptions, faces, callback) {
            let count = 1;
            let options = {};

            if (typeof countOrOptions === 'object' && countOrOptions !== null) {
                options = countOrOptions;
                count = options.count || 1;
                faces = options.faces || faces;
                callback = options.onComplete || callback;
            } else if (typeof countOrOptions === 'number') {
                count = countOrOptions;
            }

            currentTask.title = options.title || `${count}D6 Roll`;
            currentTask.renderStyle = options.renderStyle !== undefined ? options.renderStyle : 0;
            currentTask.customTheme = options.customTheme || null;
            currentTask.onComplete = callback || null;

            if (options.physics) {
                currentTask.physics = Object.assign({}, currentTask.physics, options.physics);
            }

            currentTask.diceSpecs = [];
            for (let i = 0; i < count; i++) {
                if (Array.isArray(faces) && Array.isArray(faces[0])) {
                    currentTask.diceSpecs.push(faces[i] || [1, 2, 3, 4, 5, 6]);
                } else if (Array.isArray(faces) && faces.length === 6) {
                    currentTask.diceSpecs.push(faces);
                } else {
                    currentTask.diceSpecs.push([1, 2, 3, 4, 5, 6]);
                }
            }

            injectUI();
            document.getElementById('dr-title').innerText = currentTask.title;
            document.getElementById('dr-desc').innerText = `Dice Count: ${count}`;
            document.getElementById('dr-results-badges').innerHTML = '';
            document.getElementById('dr-btn-play').classList.remove('dr-hidden');
            document.getElementById('dr-btn-submit').classList.add('dr-hidden');

            document.getElementById('dr-overlay-container').classList.remove('dr-hidden');

            initEngine();
            world.gravity.set(0, currentTask.physics.gravity, 0);
            setupDice(currentTask.diceSpecs);
            onResize();
        },

        playRoll: function () {
            if (isRolling) return;
            initAudio();
            isRolling = true;

            const p = currentTask.physics;
            const force = p.impulseForce;
            const torque = p.torqueForce;

            diceArray.forEach((dice, i) => {
                dice.body.position.set(
                    (Math.random() - 0.5) * 2,
                    p.height + Math.random(),
                    (Math.random() - 0.5) * 2
                );

                let vx = (Math.random() - 0.5) * force;
                let vz = (Math.random() - 0.5) * force;

                if (p.angleDeg !== 0) {
                    const rad = (p.angleDeg * Math.PI) / 180;
                    vx = Math.cos(rad) * force;
                    vz = Math.sin(rad) * force;
                }

                dice.body.velocity.set(vx, 4 + Math.random() * 6, vz);
                dice.body.angularVelocity.set(
                    (Math.random() - 0.5) * torque,
                    (Math.random() - 0.5) * torque,
                    (Math.random() - 0.5) * torque
                );
            });

            if (rollCheckTimeout) clearTimeout(rollCheckTimeout);
            rollCheckTimeout = setTimeout(checkIfStopped, 800);
        },

        submitAndClose: function () {
            const resultData = {
                title: currentTask.title,
                results: currentTask.results,
                total: currentTask.total
            };

            if (typeof currentTask.onComplete === 'function') {
                currentTask.onComplete(resultData);
            }
            this.close();
        },

        close: function () {
            const overlay = document.getElementById('dr-overlay-container');
            if (overlay) overlay.classList.add('dr-hidden');
            isRolling = false;
            if (rollCheckTimeout) clearTimeout(rollCheckTimeout);
        }
    };
})(window);