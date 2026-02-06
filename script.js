const wheels = {
    1: { masterItems: [], activeItems: [], currentRotation: 0, canvasId: 'canvas1', textId: 'list1', resultId: 'result1', storageKey: 'wheel_students', isSpinning: false },
    2: { masterItems: [], activeItems: [], currentRotation: 0, canvasId: 'canvas2', textId: 'list2', resultId: 'result2', storageKey: 'wheel_objects', isSpinning: false }
};

let audioCtx;
function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playTick() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.03);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.03);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.03);
}

function loadFromStorage() {
    [1, 2].forEach(id => {
        const savedData = localStorage.getItem(wheels[id].storageKey);
        if (savedData) document.getElementById(wheels[id].textId).value = savedData;
        updateWheel(id, false);
    });
}

function updateWheel(id, shouldSave = true) {
    const wheel = wheels[id];
    // Don't allow update if currently spinning
    if (wheel.isSpinning) return;

    const text = document.getElementById(wheel.textId).value;
    const items = text.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    
    wheel.masterItems = [...items];
    wheel.activeItems = [...items];
    
    if (shouldSave) localStorage.setItem(wheel.storageKey, text);
    
    drawWheel(id);
    document.getElementById(wheel.resultId).innerText = "List Updated!";
    document.getElementById(wheel.resultId).classList.remove('winner-pulse');
}

function drawWheel(id) {
    const canvas = document.getElementById(wheels[id].canvasId);
    const ctx = canvas.getContext('2d');
    const items = wheels[id].activeItems;
    ctx.clearRect(0, 0, 400, 400);
    
    if (items.length === 0) {
        ctx.fillStyle = "#888"; ctx.textAlign = "center"; ctx.font = "bold 18px sans-serif";
        ctx.fillText("Wheel Empty", 200, 180);
        return;
    }

    const arc = (2 * Math.PI) / items.length;
    items.forEach((item, i) => {
        ctx.beginPath();
        ctx.fillStyle = `hsl(${(i * 360) / items.length}, 60%, 45%)`;
        ctx.moveTo(200, 200);
        ctx.arc(200, 200, 195, i * arc, (i + 1) * arc);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 1; ctx.stroke();
        
        ctx.save();
        ctx.translate(200, 200);
        ctx.rotate(i * arc + arc / 2);
        ctx.fillStyle = "white";
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(item.substring(0, 20), 180, 5);
        ctx.restore();
    });
}

function spin(id) {
    const wheel = wheels[id];

    // --- LOCK CHECK ---
    if (wheel.isSpinning) return; // Ignore clicks if already spinning
    if (wheel.activeItems.length === 0) return;

    wheel.isSpinning = true; // Set lock
    initAudio();

    const resultEl = document.getElementById(wheel.resultId);
    resultEl.innerText = "Spinning...";
    resultEl.classList.remove('winner-pulse');

    const duration = 5000; 
    const extraDegrees = 1800 + Math.random() * 1800; 
    const startRotation = wheel.currentRotation;
    const startTime = performance.now();
    const arcSize = 360 / wheel.activeItems.length;
    let lastDegrees = 0;

    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 4);
        const totalTravel = extraDegrees * easeOut;
        const currentRotation = startRotation + totalTravel;
        
        const canvas = document.getElementById(wheel.canvasId);
        canvas.style.transform = `rotate(${currentRotation}deg)`;

        if (Math.floor(totalTravel / arcSize) > Math.floor(lastDegrees / arcSize)) {
            playTick();
        }
        lastDegrees = totalTravel;

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            wheel.currentRotation = currentRotation;
            const netRotation = currentRotation % 360;
            const finalIndex = Math.floor((360 - netRotation + 270) % 360 / arcSize);
            const winner = wheel.activeItems[finalIndex];
            
            resultEl.innerText = "🎯 " + winner;
            resultEl.classList.add('winner-pulse');

            setTimeout(() => {
                wheel.activeItems.splice(finalIndex, 1);
                drawWheel(id);
                wheel.isSpinning = false; // RELEASE LOCK
            }, 1200);
        }
    }
    requestAnimationFrame(animate);
}

loadFromStorage();
