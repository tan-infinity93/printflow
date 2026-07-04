/* ==========================================================================
   PrintFlow Landing Page - Interactive Script
   Includes: Signature Canvas Playground (Drag, Preset & Bleed Logic),
             and CMYK Color Gamut Simulator.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    initCanvasPlayground();
    initCmykSimulator();
});

/* ==========================================================================
   1. Signature Canvas Playground
   ========================================================================== */
function initCanvasPlayground() {
    const presetSelect = document.getElementById("sheet-preset");
    const simPaper = document.getElementById("sim-paper");
    const dragElement = document.getElementById("drag-element");
    const coordsDisplay = document.getElementById("coords-display");
    const statusBadge = document.getElementById("status-badge");
    const statusText = document.getElementById("status-text");
    const consoleAlert = document.getElementById("console-alert");
    const alertMsg = document.getElementById("alert-msg");
    const playgroundCard = document.getElementById("playground");
    const toggleGrid = document.getElementById("toggle-grid");
    const toggleGuides = document.getElementById("toggle-guides");

    // Ruler containers
    const rulerX = document.getElementById("ruler-x");
    const rulerY = document.getElementById("ruler-y");
    
    // Page dimensions configurations
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

    // Millimeters per pixel scale factors
    let mmPerPxX = 1;
    let mmPerPxY = 1;
    let safeMarginPx = 12;

    function updatePreset() {
        const config = presets[activePreset];
        
        // Update paper visual dimensions
        simPaper.style.width = `${config.widthPx}px`;
        simPaper.style.height = `${config.heightPx}px`;
        
        // Calculate scaling ratios
        mmPerPxX = config.widthMm / config.widthPx;
        mmPerPxY = config.heightMm / config.heightPx;
        
        // Calculate pixel boundaries for safe zone
        safeMarginPx = config.safeMarginMm / mmPerPxX;
        const safeGuide = document.getElementById("guide-safe");
        if (safeGuide) {
            safeGuide.style.top = `${safeMarginPx}px`;
            safeGuide.style.left = `${safeMarginPx}px`;
            safeGuide.style.right = `${safeMarginPx}px`;
            safeGuide.style.bottom = `${safeMarginPx}px`;
        }

        // Set dimensions for draggable element
        const elWidthPx = Math.round(config.elWidthMm / mmPerPxX);
        const elHeightPx = Math.round(config.elHeightMm / mmPerPxY);
        dragElement.style.width = `${elWidthPx}px`;
        dragElement.style.height = `${elHeightPx}px`;

        // Update elements text
        document.getElementById("metric-w").textContent = config.elWidthMm;
        document.getElementById("metric-h").textContent = config.elHeightMm;
        
        // Reset element position to center top
        const defaultLeft = Math.round((config.widthPx - elWidthPx) / 2);
        const defaultTop = Math.round(config.widthPx * 0.15);
        dragElement.style.left = `${defaultLeft}px`;
        dragElement.style.top = `${defaultTop}px`;
        
        buildRulers(config);
        evaluateSafety(defaultLeft, defaultTop, elWidthPx, elHeightPx, config);
    }

    function buildRulers(config) {
        rulerX.innerHTML = "";
        rulerY.innerHTML = "";
        
        // X ruler ticks every 50mm
        const ticksX = Math.floor(config.widthMm / 50);
        for(let i = 0; i <= ticksX; i++) {
            const mmVal = i * 50;
            const pxPos = (mmVal / config.widthMm) * 100;
            const tick = document.createElement("div");
            tick.className = "ruler-marker";
            tick.style.left = `${pxPos}%`;
            tick.innerHTML = `<span>${mmVal}</span>`;
            rulerX.appendChild(tick);
        }
        
        // Y ruler ticks every 50mm
        const ticksY = Math.floor(config.heightMm / 50);
        for(let i = 0; i <= ticksY; i++) {
            const mmVal = i * 50;
            const pxPos = (mmVal / config.heightMm) * 100;
            const tick = document.createElement("div");
            tick.className = "ruler-marker";
            tick.style.top = `${pxPos}%`;
            tick.innerHTML = `<span>${mmVal}</span>`;
            rulerY.appendChild(tick);
        }
    }

    function evaluateSafety(leftPx, topPx, elW, elH, config) {
        // Calculate physical coordinates of top-left anchor in mm
        const xMm = (leftPx * mmPerPxX).toFixed(1);
        const yMm = (topPx * mmPerPxY).toFixed(1);
        coordsDisplay.textContent = `X: ${xMm}mm | Y: ${yMm}mm`;

        const rightPx = leftPx + elW;
        const bottomPx = topPx + elH;
        
        // Collisions checks
        const overlapsLeftTrim = leftPx < 0;
        const overlapsTopTrim = topPx < 0;
        const overlapsRightTrim = rightPx > config.widthPx;
        const overlapsBottomTrim = bottomPx > config.heightPx;
        
        const overlapsLeftSafe = leftPx < safeMarginPx;
        const overlapsTopSafe = topPx < safeMarginPx;
        const overlapsRightSafe = rightPx > (config.widthPx - safeMarginPx);
        const overlapsBottomSafe = bottomPx > (config.heightPx - safeMarginPx);

        if (overlapsLeftTrim || overlapsTopTrim || overlapsRightTrim || overlapsBottomTrim) {
            // Trim collision (elements outside the paper boundary)
            dragElement.classList.add("alert-zone");
            playgroundCard.classList.add("colliding");
            
            statusBadge.className = "status-indicator danger mt-1 px-3 py-1 rounded-pill";
            statusText.textContent = "CRITICAL TRIM COLLISION";
            
            consoleAlert.className = "console-alert warning-mode p-3 rounded d-flex gap-2";
            alertMsg.innerHTML = `<strong>DANGER:</strong> Element is extending beyond the trim boundary (${config.widthMm}x${config.heightMm}mm). This area will be completely cropped by the cutter, leading to severe document text clipping.`;
        } 
        else if (overlapsLeftSafe || overlapsTopSafe || overlapsRightSafe || overlapsBottomSafe) {
            // Safe zone violation (element too close to edge)
            dragElement.classList.add("alert-zone");
            playgroundCard.classList.add("colliding");
            
            statusBadge.className = "status-indicator danger mt-1 px-3 py-1 rounded-pill";
            statusText.textContent = "MARGIN BREACH";
            
            consoleAlert.className = "console-alert warning-mode p-3 rounded d-flex gap-2";
            alertMsg.innerHTML = `<strong>WARNING:</strong> Element is inside the safe margin limit (< ${config.safeMarginMm}mm from trim). Rotary shear deviations during paper slicing can crop into this text.`;
        } 
        else {
            // Safe
            dragElement.classList.remove("alert-zone");
            playgroundCard.classList.remove("colliding");
            
            statusBadge.className = "status-indicator safe mt-1 px-3 py-1 rounded-pill";
            statusText.textContent = "SAFE FOR PRINT";
            
            consoleAlert.className = "console-alert info-mode p-3 rounded d-flex gap-2";
            alertMsg.textContent = "All page contents are centered inside the safe zones. Clean bleed limits are respected for optimal press guillotine trim.";
        }
    }

    // Preset selector event listener
    if (presetSelect) {
        presetSelect.addEventListener("change", (e) => {
            activePreset = e.target.value;
            updatePreset();
        });
    }

    // Grid visual toggle
    if (toggleGrid) {
        toggleGrid.addEventListener("change", (e) => {
            if (e.target.checked) {
                simPaper.classList.remove("grid-hidden");
            } else {
                simPaper.classList.add("grid-hidden");
            }
        });
    }

    // Guides visual toggle
    if (toggleGuides) {
        toggleGuides.addEventListener("change", (e) => {
            if (e.target.checked) {
                simPaper.classList.remove("guides-hidden");
            } else {
                simPaper.classList.add("guides-hidden");
            }
        });
    }

    // Drag-and-drop Mouse & Touch listeners
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
        
        // Bound movement slightly beyond borders to let user test clipping warnings
        const config = presets[activePreset];
        const elW = dragElement.offsetWidth;
        const elH = dragElement.offsetHeight;
        
        const maxBoundX = config.widthPx - elW + 30;
        const maxBoundY = config.heightPx - elH + 30;
        
        newLeft = Math.max(-30, Math.min(newLeft, maxBoundX));
        newTop = Math.max(-30, Math.min(newTop, maxBoundY));
        
        dragElement.style.left = `${newLeft}px`;
        dragElement.style.top = `${newTop}px`;
        
        evaluateSafety(newLeft, newTop, elW, elH, config);
    }

    function onEnd() {
        if (!isDragging) return;
        isDragging = false;
        dragElement.classList.remove("dragging");
    }

    // Desktop mouse events
    dragElement.addEventListener("mousedown", onStart);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onEnd);

    // Mobile touch events
    dragElement.addEventListener("touchstart", onStart, { passive: false });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);

    // Init call
    updatePreset();
}

/* ==========================================================================
   2. CMYK Color Gamut Simulator
   ========================================================================== */
function initCmykSimulator() {
    const sliderC = document.getElementById("slider-c");
    const sliderM = document.getElementById("slider-m");
    const sliderY = document.getElementById("slider-y");
    const sliderK = document.getElementById("slider-k");

    const valC = document.getElementById("val-c");
    const valM = document.getElementById("val-m");
    const valY = document.getElementById("val-y");
    const valK = document.getElementById("val-k");

    const gamutPreview = document.getElementById("gamut-preview");
    const rgbLabel = document.getElementById("gamut-rgb-val");
    const warningBox = document.getElementById("gamut-warning-box");
    const warningText = document.getElementById("gamut-warning-text");

    function updateColor() {
        const c = parseInt(sliderC.value);
        const m = parseInt(sliderM.value);
        const y = parseInt(sliderY.value);
        const k = parseInt(sliderK.value);

        // Update slider values labels
        valC.textContent = `${c}%`;
        valM.textContent = `${m}%`;
        valY.textContent = `${y}%`;
        valK.textContent = `${k}%`;

        // standard CMYK to RGB conversions
        let r = 255 * (1 - c/100) * (1 - k/100);
        let g = 255 * (1 - m/100) * (1 - k/100);
        let b = 255 * (1 - y/100) * (1 - k/100);

        r = Math.round(r);
        g = Math.round(g);
        b = Math.round(b);

        // Simulate matte, slightly lower contrast paper profiles (ICC standard uncoated simulation)
        const simulatedR = Math.round(r * 0.9 + 10);
        const simulatedG = Math.round(g * 0.9 + 10);
        const simulatedB = Math.round(b * 0.88 + 8);

        // Update visual preview box
        gamutPreview.style.backgroundColor = `rgb(${simulatedR}, ${simulatedG}, ${simulatedB})`;
        rgbLabel.textContent = `cmyk(${c}%, ${m}%, ${y}%, ${k}%) → rgb(${simulatedR}, ${simulatedG}, ${simulatedB})`;

        // Total Ink limit (Total Area Coverage - TAC limit)
        const totalInk = c + m + y + k;

        if (totalInk > 280) {
            warningBox.className = "gamut-indicator-bar out-of-gamut d-flex p-3 rounded";
            warningBox.querySelector(".warning-title").textContent = "Total Ink Limit Warning";
            warningText.innerHTML = `Total Ink Coverage is <strong>${totalInk}%</strong> (max safe: 280%). Inks will pool, oversaturating the paper fibers and causing sheet wrinkling or ink smudges.`;
        } 
        else if (c < 10 && m > 80 && y > 80 && k < 15) {
            // Neon Orange/Red
            warningBox.className = "gamut-indicator-bar out-of-gamut d-flex p-3 rounded";
            warningBox.querySelector(".warning-title").textContent = "RGB Out of Gamut warning";
            warningText.innerHTML = "Highly saturated neon oranges and warm reds cannot be achieved with standard ink pigments. This color will print noticeably duller.";
        } 
        else if (c > 75 && m > 75 && y < 15 && k < 10) {
            // Royal blue/violet
            warningBox.className = "gamut-indicator-bar out-of-gamut d-flex p-3 rounded";
            warningBox.querySelector(".warning-title").textContent = "RGB Out of Gamut warning";
            warningText.innerHTML = "Deep violet and bright electric blues will undergo severe shift to a flat navy blue on standard offset plates.";
        } 
        else {
            // Safe CMYK mix
            warningBox.className = "gamut-indicator-bar safe-gamut d-flex p-3 rounded";
            warningBox.querySelector(".warning-title").textContent = "Ink Balance Compliant";
            warningText.innerHTML = `Mix coverage is <strong>${totalInk}%</strong>. Viscosity levels and color conversion metrics are within standard offset and dry-toner printer gamuts.`;
        }
    }

    if (sliderC && sliderM && sliderY && sliderK) {
        sliderC.addEventListener("input", updateColor);
        sliderM.addEventListener("input", updateColor);
        sliderY.addEventListener("input", updateColor);
        sliderK.addEventListener("input", updateColor);
        
        // Init color mix
        updateColor();
    }
}
