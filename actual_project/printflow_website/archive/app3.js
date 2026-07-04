/* ==========================================================================
   PrintFlow Landing Page V3 - Light Theme Layout Script
   Handles Canvas Simulator V3 and CMYK Simulator V3.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    initCanvasPlayground();
    initCmykSimulator();
});

/* ==========================================================================
   1. Canvas Playground Simulator V3
   ========================================================================== */
function initCanvasPlayground() {
    const presetSelect = document.getElementById("sheet-preset3");
    const simPaper = document.getElementById("sim-paper3");
    const dragElement = document.getElementById("drag-element3");
    const coordsDisplay = document.getElementById("coords-display3");
    const statusBadge = document.getElementById("status-badge3");
    const statusText = document.getElementById("status-text3");
    const playgroundCard = document.getElementById("playground");

    // Coordinate Indicators
    const coordXInd = document.getElementById("ruler-x3");
    const coordYInd = document.getElementById("ruler-y3");
    
    // Page dimensions
    const presets = {
        a4: {
            widthPx: 170,
            heightPx: 240,
            widthMm: 210,
            heightMm: 297,
            safeMarginMm: 15,
            elWidthMm: 90,
            elHeightMm: 36
        },
        c5: {
            widthPx: 220,
            heightPx: 155,
            widthMm: 229,
            heightMm: 162,
            safeMarginMm: 10,
            elWidthMm: 110,
            elHeightMm: 45
        },
        dl: {
            widthPx: 230,
            heightPx: 115,
            widthMm: 220,
            heightMm: 110,
            safeMarginMm: 8,
            elWidthMm: 95,
            elHeightMm: 35
        }
    };

    let activePreset = "a4";
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 20;
    let startTop = 20;

    let mmPerPxX = 1;
    let mmPerPxY = 1;
    let safeMarginPx = 12;

    function updatePreset() {
        const config = presets[activePreset];
        
        simPaper.style.width = `${config.widthPx}px`;
        simPaper.style.height = `${config.heightPx}px`;
        
        mmPerPxX = config.widthMm / config.widthPx;
        mmPerPxY = config.heightMm / config.heightPx;
        
        safeMarginPx = config.safeMarginMm / mmPerPxX;
        const safeGuide = document.getElementById("guide-safe3");
        if (safeGuide) {
            safeGuide.style.top = `${safeMarginPx}px`;
            safeGuide.style.left = `${safeMarginPx}px`;
            safeGuide.style.right = `${safeMarginPx}px`;
            safeGuide.style.bottom = `${safeMarginPx}px`;
        }

        const elWidthPx = Math.round(config.elWidthMm / mmPerPxX);
        const elHeightPx = Math.round(config.elHeightMm / mmPerPxY);
        dragElement.style.width = `${elWidthPx}px`;
        dragElement.style.height = `${elHeightPx}px`;

        document.getElementById("metric-w3").textContent = config.elWidthMm;
        document.getElementById("metric-h3").textContent = config.elHeightMm;
        
        const defaultLeft = Math.round((config.widthPx - elWidthPx) / 2);
        const defaultTop = Math.round(config.widthPx * 0.15);
        dragElement.style.left = `${defaultLeft}px`;
        dragElement.style.top = `${defaultTop}px`;
        
        evaluateSafety(defaultLeft, defaultTop, elWidthPx, elHeightPx, config);
    }

    function evaluateSafety(leftPx, topPx, elW, elH, config) {
        const xMm = (leftPx * mmPerPxX).toFixed(1);
        const yMm = (topPx * mmPerPxY).toFixed(1);
        
        // Update console and minimal coordinate overlays
        coordsDisplay.textContent = `X: ${xMm}mm | Y: ${yMm}mm`;
        coordXInd.textContent = `X: ${xMm}mm`;
        coordYInd.textContent = `Y: ${yMm}mm`;

        const rightPx = leftPx + elW;
        const bottomPx = topPx + elH;
        
        // Collisions
        const overlapsTrim = leftPx < 0 || topPx < 0 || rightPx > config.widthPx || bottomPx > config.heightPx;
        const overlapsSafe = leftPx < safeMarginPx || topPx < safeMarginPx || rightPx > (config.widthPx - safeMarginPx) || bottomPx > (config.heightPx - safeMarginPx);

        if (overlapsTrim) {
            dragElement.classList.add("alert-zone");
            playgroundCard.classList.add("colliding");
            statusBadge.className = "status-indicator-v3 px-3 py-1 rounded-pill danger";
            statusText.textContent = "TRIM COLLISION";
        } 
        else if (overlapsSafe) {
            dragElement.classList.add("alert-zone");
            playgroundCard.classList.add("colliding");
            statusBadge.className = "status-indicator-v3 px-3 py-1 rounded-pill danger";
            statusText.textContent = "SAFE LIMIT BREACH";
        } 
        else {
            dragElement.classList.remove("alert-zone");
            playgroundCard.classList.remove("colliding");
            statusBadge.className = "status-indicator-v3 px-3 py-1 rounded-pill safe";
            statusText.textContent = "SAFE FOR PRINT";
        }
    }

    if (presetSelect) {
        presetSelect.addEventListener("change", (e) => {
            activePreset = e.target.value;
            updatePreset();
        });
    }

    // Drag-and-drop
    function onStart(e) {
        isDragging = true;
        dragElement.classList.add("dragging");
        
        const clientX = e.type.startsWith("touch") ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.startsWith("touch") ? e.touches[0].clientY : e.clientY;
        
        startX = clientX;
        startY = clientY;
        startLeft = parseInt(dragElement.style.left) || 0;
        startTop = parseInt(dragElement.style.top) || 0;
        
        if (e.cancelable) e.preventDefault();
    }

    function onMove(e) {
        if (!isDragging) return;
        
        const clientX = e.type.startsWith("touch") ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.startsWith("touch") ? e.touches[0].clientY : e.clientY;
        
        const dx = clientX - startX;
        const dy = clientY - startY;
        
        let newLeft = startLeft + dx;
        let newTop = startTop + dy;
        
        const config = presets[activePreset];
        const elW = dragElement.offsetWidth;
        const elH = dragElement.offsetHeight;
        
        const maxBoundX = config.widthPx - elW + 20;
        const maxBoundY = config.heightPx - elH + 20;
        
        newLeft = Math.max(-20, Math.min(newLeft, maxBoundX));
        newTop = Math.max(-20, Math.min(newTop, maxBoundY));
        
        dragElement.style.left = `${newLeft}px`;
        dragElement.style.top = `${newTop}px`;
        
        evaluateSafety(newLeft, newTop, elW, elH, config);
    }

    function onEnd() {
        if (!isDragging) return;
        isDragging = false;
        dragElement.classList.remove("dragging");
    }

    dragElement.addEventListener("mousedown", onStart);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onEnd);

    dragElement.addEventListener("touchstart", onStart, { passive: false });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);

    updatePreset();
}

/* ==========================================================================
   2. CMYK Gamut Simulator V3
   ========================================================================== */
function initCmykSimulator() {
    const sliderC = document.getElementById("slider-c3");
    const sliderM = document.getElementById("slider-m3");
    const sliderY = document.getElementById("slider-y3");
    const sliderK = document.getElementById("slider-k3");

    const valC = document.getElementById("val-c3");
    const valM = document.getElementById("val-m3");
    const valY = document.getElementById("val-y3");
    const valK = document.getElementById("val-k3");

    const gamutPreview = document.getElementById("gamut-preview3");
    const rgbLabel = document.getElementById("gamut-rgb-val3");
    const warningBox = document.getElementById("gamut-warning-box3");
    const warningText = document.getElementById("gamut-warning-text3");

    function updateColor() {
        const c = parseInt(sliderC.value);
        const m = parseInt(sliderM.value);
        const y = parseInt(sliderY.value);
        const k = parseInt(sliderK.value);

        valC.textContent = `${c}%`;
        valM.textContent = `${m}%`;
        valY.textContent = `${y}%`;
        valK.textContent = `${k}%`;

        let r = 255 * (1 - c/100) * (1 - k/100);
        let g = 255 * (1 - m/100) * (1 - k/100);
        let b = 255 * (1 - y/100) * (1 - k/100);

        r = Math.round(r);
        g = Math.round(g);
        b = Math.round(b);

        // Simulated matte finish
        const simulatedR = Math.round(r * 0.9 + 10);
        const simulatedG = Math.round(g * 0.9 + 10);
        const simulatedB = Math.round(b * 0.88 + 8);

        gamutPreview.style.backgroundColor = `rgb(${simulatedR}, ${simulatedG}, ${simulatedB})`;
        rgbLabel.textContent = `cmyk(${c}%, ${m}%, ${y}%, ${k}%) → rgb(${simulatedR}, ${simulatedG}, ${simulatedB})`;

        const totalInk = c + m + y + k;

        if (totalInk > 280) {
            warningBox.className = "gamut-indicator-bar-v3 out-of-gamut d-flex p-3 rounded";
            warningBox.querySelector(".warning-title").textContent = "Total Ink Limit Warning";
            warningText.innerHTML = `Ink coverage is <strong>${totalInk}%</strong> (max 280%). High risk of paper pooling and transfer smudging.`;
        } 
        else if ((c < 10 && m > 80 && y > 80 && k < 15) || (c > 75 && m > 75 && y < 15 && k < 10)) {
            warningBox.className = "gamut-indicator-bar-v3 out-of-gamut d-flex p-3 rounded";
            warningBox.querySelector(".warning-title").textContent = "Out of Gamut";
            warningText.innerHTML = "This color is outside of normal press limits and will convert duller on physical sheets.";
        } 
        else {
            warningBox.className = "gamut-indicator-bar-v3 safe-gamut d-flex p-3 rounded";
            warningBox.querySelector(".warning-title").textContent = "Gamut Compliant";
            warningText.innerHTML = `Ink coverage is <strong>${totalInk}%</strong>. Viscosity levels are within standard press safety constraints.`;
        }
    }

    if (sliderC && sliderM && sliderY && sliderK) {
        sliderC.addEventListener("input", updateColor);
        sliderM.addEventListener("input", updateColor);
        sliderY.addEventListener("input", updateColor);
        sliderK.addEventListener("input", updateColor);
        
        updateColor();
    }
}
