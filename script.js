const wheels = {
    1: { masterItems: [], activeItems: [], currentRotation: 0, canvasId: 'canvas1', textId: 'list1', resultId: 'result1', storageKey: 'wheel_students' },
    2: { masterItems: [], activeItems: [], currentRotation: 0, canvasId: 'canvas2', textId: 'list2', resultId: 'result2', storageKey: 'wheel_objects' }
};

// --- Audio Engine ---
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

// --- Wheel Logic ---
function loadFromStorage() {
    [1, 2].forEach(id => {
        const savedData = localStorage.getItem(wheels[id].storageKey);
        if (savedData) document.getElementById(wheels[id].textId).value = savedData;
        updateWheel(id, false);
    });
}

function updateWheel(id, shouldSave = true) {
    const text = document.getElementById(wheels[id].textId).value;
    
    // CHANGED: Now splits by new lines (\n). 
    // .filter(s => s.trim() !== "") removes empty lines.
    const items = text.split('\n').map(s => s.trim()).filter(s => s !== "");
    
    wheels[id].masterItems = [...items];
    wheels[id].activeItems = [...items];
    
    if (shouldSave) localStorage.setItem(wheels[id].storageKey, text);
    drawWheel(id);
    
    document.getElementById(wheels[id].resultId).innerText = "List Updated!";
    document.getElementById(wheels[id].resultId).classList.remove('winner-pulse');
}

function drawWheel(id) {
    const canvas = document.getElementById(wheels[id].canvasId);
    const ctx = canvas.getContext('2d');
    const items = wheels[id].activeItems;
    ctx.clearRect(0, 0, 400, 400);
    
    if (items.length === 0) {
        ctx.fillStyle = "#888"; ctx.textAlign = "center"; ctx.font = "18px Arial";
        ctx.fillText("Empty: Add items & Update", 200, 200);
        return;
    }

    const arc = (2 * Math.PI) / items.length;
    items.forEach((item, i) => {
        ctx.beginPath();
        // Alternating colors or dynamic HSL
        ctx.fillStyle = `hsl(${(i * 360) / items.length}, 60%, 45%)`;
        ctx.moveTo(200, 200);
        ctx.arc(200, 200, 195, i * arc, (i + 1) * arc);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.lineWidth = 1; ctx.stroke();
        
        ctx.save();
        ctx.translate(200, 200);
        ctx.rotate(i * arc + arc / 2);
        ctx.fillStyle = "white";
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(item.substring(0, 18), 180, 5);
        ctx.restore();
    });
}

function spin(id) {
    initAudio();
    const wheel = wheels[id];
    if (wheel.activeItems.length === 0) return;

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

        // Ticking logic based on rotation distance
        if (Math.floor(totalTravel / arcSize) > Math.floor(lastDegrees / arcSize)) {
            playTick();
        }
        lastDegrees = totalTravel;

        if (progress < 1) {
            request
