// Game State & Logic
class GameState {
    constructor() {
        this.currentDay = 1;
        this.gameOver = false;
        this.gameOverReason = "";
        this.dossiers = [];
        this.events = [];
        this.currentDossierQueue = [];
        this.log = [];
        this.processedDossiers = [];
        
        this.factions = {
            "Army": { influence: 50, loyalty: 50, satisfaction: 50 },
            "SecretPolice": { influence: 50, loyalty: 50, satisfaction: 50 },
            "People": { influence: 30, loyalty: 50, satisfaction: 50 },
            "Party": { influence: 60, loyalty: 60, satisfaction: 50 },
            "Scientists": { influence: 40, loyalty: 50, satisfaction: 50 }
        };
        
            // Background: wall (soviet office palette)
            ctx.fillStyle = '#24462f'; // deep green wall
            ctx.fillRect(0, 0, displayWidth, displayHeight);

            // Large map on the wall (center-left)
            const mapW = Math.min(520, displayWidth * 0.5);
            const mapH = Math.min(320, displayHeight * 0.38);
            const mapX = Math.max(60, displayWidth * 0.08);
            const mapY = Math.max(40, displayHeight * 0.08);
            ctx.fillStyle = '#e6d9c7';
            ctx.fillRect(mapX, mapY, mapW, mapH);
            ctx.strokeStyle = '#aa7f3c'; ctx.lineWidth = 2;
            ctx.strokeRect(mapX, mapY, mapW, mapH);
            ctx.fillStyle = '#9b6a3a'; ctx.font = '20px Courier New';
            ctx.fillText('UNION OF SOVIET', mapX + 12, mapY + 28);
            ctx.fillText('SOCIALIST REPUBLICS', mapX + 12, mapY + 52);
            // Sketchy 'map' marks
            ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1;
            for (let i = 0; i < 10; i++) {
                ctx.beginPath();
                ctx.moveTo(mapX + 20 + Math.random() * (mapW - 40), mapY + 60 + Math.random() * (mapH - 100));
                ctx.lineTo(mapX + 30 + Math.random() * (mapW - 60), mapY + 60 + Math.random() * (mapH - 100));
                ctx.stroke();
            }

            // Portrait frames (Lenin, Stalin) on the wall to the right
            const frameW = 120, frameH = 160;
            const f1x = displayWidth - frameW - 60;
            const f1y = 40;
            const f2x = f1x - frameW - 20;
            const f2y = f1y + 10;
            // Lenin (left)
            ctx.fillStyle = '#2b2b2b'; ctx.fillRect(f2x, f2y, frameW, frameH);
            ctx.strokeStyle = '#b88b3a'; ctx.lineWidth = 4; ctx.strokeRect(f2x, f2y, frameW, frameH);
            // simple silhouette
            ctx.fillStyle = '#f0e7d6'; ctx.beginPath(); ctx.arc(f2x + frameW/2, f2y + 60, 28, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#222'; ctx.font = 'bold 14px Courier New'; ctx.fillText('LENIN', f2x + 18, f2y + frameH - 10);
            // Stalin (right)
            ctx.fillStyle = '#2b2b2b'; ctx.fillRect(f1x, f1y, frameW, frameH);
            ctx.strokeStyle = '#b88b3a'; ctx.lineWidth = 4; ctx.strokeRect(f1x, f1y, frameW, frameH);
            ctx.fillStyle = '#f0e7d6'; ctx.beginPath(); ctx.arc(f1x + frameW/2, f1y + 60, 28, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#222'; ctx.font = 'bold 14px Courier New'; ctx.fillText('STALIN', f1x + 18, f1y + frameH - 10);

            // Soviet flags (red banners) flanking the portraits
            function drawFlag(x, y, h) {
                ctx.fillStyle = '#b40000'; ctx.fillRect(x, y, h*0.6, h);
                // hammer & sickle simple: circle and arc
                ctx.fillStyle = '#ffd93d'; ctx.beginPath(); ctx.arc(x + h*0.24, y + h*0.35, h*0.08, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.moveTo(x + h*0.28, y + h*0.28); ctx.quadraticCurveTo(x + h*0.4, y + h*0.2, x + h*0.52, y + h*0.44); ctx.strokeStyle = '#ffd93d'; ctx.lineWidth = 3; ctx.stroke();
            }
            drawFlag(f2x - 40, f2y + 20, 80);
            drawFlag(f1x + frameW + 10, f1y + 20, 80);

            // Bookshelf at left
            const shelfX = mapX + mapW + 20;
            const shelfY = mapY;
            ctx.fillStyle = '#4a3629'; ctx.fillRect(shelfX, shelfY, 140, mapH + 20);
            for (let s = 0; s < 6; s++) {
                ctx.fillStyle = `rgba(200,180,140,${0.6 - s*0.06})`;
                ctx.fillRect(shelfX + 8, shelfY + 12 + s*38, 124, 22);
            }

            // Desk foreground: leather inset with perspective trapezoid
            const deskTopY = displayHeight * 0.55;
            ctx.beginPath();
            ctx.moveTo(40, deskTopY);
            ctx.lineTo(displayWidth - 40, deskTopY);
            ctx.lineTo(displayWidth - 10, displayHeight - 20);
            ctx.lineTo(10, displayHeight - 20);
            ctx.closePath();
            const leatherGrad = ctx.createLinearGradient(0, deskTopY, 0, displayHeight);
            leatherGrad.addColorStop(0, '#7a3e2f'); leatherGrad.addColorStop(1, '#4b220f');
            ctx.fillStyle = leatherGrad; ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 2; ctx.stroke();

            // Desk items shadow and vignette
            ctx.fillStyle = 'rgba(0,0,0,0.12)';
            ctx.fillRect(0, displayHeight - 18, displayWidth, 18);

            // Gentle wood grain on leather (subtle)
            for (let i = 0; i < 18; i++) {
                ctx.strokeStyle = `rgba(0,0,0,${0.02 + Math.random()*0.04})`;
                ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(20, deskTopY + Math.random() * (displayHeight - deskTopY - 20)); ctx.quadraticCurveTo(displayWidth * 0.5, deskTopY + Math.random() * 10 + 10, displayWidth - 20, deskTopY + Math.random() * (displayHeight - deskTopY - 20)); ctx.stroke();
            }

            // Debug hint
            if (window.__SOVIET_DESK_DEBUG) console.log('drawDesk', {displayWidth, displayHeight, dpr});
                const parts = key.split("_");
                const factionName = parts[0];
                const stat = parts[1];
                if (this.factions[factionName] && stat in this.factions[factionName]) {
                    this.factions[factionName][stat] = Math.max(0, Math.min(100, this.factions[factionName][stat] + value));
                }
            }
        }
        
        this.processedDossiers.push(dossier.id);
        this.addLog(`Dossier '${dossier.title}' → ${action.toUpperCase()}`);
        this.checkGameState();
    }
    
    addLog(entry) {
        this.log.unshift(`[Day ${this.currentDay}] ${entry}`);
        if (this.log.length > 50) this.log.pop();
    }
    
    advanceDay() {
        this.currentDay++;
        this.refreshDossierQueue();
        this.triggerDailyEvents();
        this.checkGameState();
    }
    
    triggerDailyEvents() {
        for (const event of this.events) {
            if (Math.random() < event.probability) {
                this.addLog(`EVENT: ${event.title}`);
                if (event.consequences && event.consequences.automatic) {
                    for (const key in event.consequences.automatic) {
                        const value = event.consequences.automatic[key];
                        if (key in this.gauges) {
                            this.gauges[key] = Math.max(0, Math.min(100, this.gauges[key] + value));
                        }
                    }
                }
            }
        }
    }
    
    checkGameState() {
        if (this.gauges.stability <= 0) {
            this.gameOver = true;
            this.gameOverReason = "Government collapsed! Stability reached 0.";
        } else if (this.gauges.paranoia >= 100) {
            this.gameOver = true;
            this.gameOverReason = "Paranoia spiral - the regime destroyed itself.";
        }
        
        for (const factionName in this.factions) {
            const faction = this.factions[factionName];
            if (faction.influence > 75 && faction.loyalty < 25) {
                this.gameOver = true;
                this.gameOverReason = `${factionName} launched a successful coup d'État!`;
                break;
            }
        }
    }
}

// Embedded Data (fallback if JSON files don't load)
const EMBEDDED_DOSSIERS = [
    {
        "id": "dos_001",
        "title": "Allocate Military Funds",
        "description": "Request to increase military budget by 15%",
        "source": "Ministry of Defence",
        "urgency": 8,
        "risk": 3,
        "benefit": 5,
        "linked_faction": "Army",
        "consequences": {
            "if_signed": { "Army_influence": 10, "paranoia": 2 },
            "if_refused": { "Army_loyalty": -8, "stability": -3 }
        }
    },
    {
        "id": "dos_002",
        "title": "Expand Secret Police Authority",
        "description": "Grant Secret Police expanded surveillance powers",
        "source": "Secret Police",
        "urgency": 7,
        "risk": 8,
        "benefit": 6,
        "linked_faction": "SecretPolice",
        "consequences": {
            "if_signed": { "SecretPolice_influence": 12, "paranoia": 15, "People_satisfaction": -10 },
            "if_refused": { "SecretPolice_loyalty": -10 }
        }
    },
    {
        "id": "dos_003",
        "title": "Approve Bread Rationing Cut",
        "description": "Reduce public bread rations to save resources",
        "source": "Ministry of Supply",
        "urgency": 6,
        "risk": 7,
        "benefit": 4,
        "linked_faction": "People",
        "consequences": {
            "if_signed": { "People_satisfaction": -15, "resources": 20, "paranoia": 5 },
            "if_refused": { "resources": -10, "Party_loyalty": -5 }
        }
    },
    {
        "id": "dos_004",
        "title": "Fund Secret Scientific Project",
        "description": "Allocate resources for classified weapons research",
        "source": "Scientists",
        "urgency": 5,
        "risk": 4,
        "benefit": 8,
        "linked_faction": "Scientists",
        "consequences": {
            "if_signed": { "Scientists_influence": 10, "resources": -15, "stability": 5 },
            "if_refused": { "Scientists_loyalty": -12 }
        }
    },
    {
        "id": "dos_005",
        "title": "Purge Party Officials - Traitors List",
        "description": "Eliminate 50 suspected traitors within the Party",
        "source": "Secret Police",
        "urgency": 9,
        "risk": 10,
        "benefit": 7,
        "linked_faction": "Party",
        "consequences": {
            "if_signed": { "Party_influence": -15, "paranoia": 20, "stability": -8 },
            "if_refused": { "SecretPolice_loyalty": -15 }
        }
    }
];

const EMBEDDED_EVENTS = [
    {
        "id": "evt_001",
        "title": "Attempted Military Coup",
        "description": "The Army attempts to overthrow your government!",
        "probability": 0.15,
        "trigger_condition": "Army_influence > 70 AND Army_loyalty < 30",
        "consequences": {
            "if_handled_well": { "Army_influence": -20, "stability": -10 },
            "if_failed": { "stability": -40, "game_over": true }
        }
    },
    {
        "id": "evt_002",
        "title": "Worker Strike in Major City",
        "description": "Workers strike demanding higher wages and better conditions",
        "probability": 0.25,
        "trigger_condition": "People_satisfaction < 30",
        "consequences": {
            "if_concede": { "People_satisfaction": 15, "resources": -10 },
            "if_suppress": { "People_satisfaction": -20, "paranoia": 10, "SecretPolice_influence": 5 }
        }
    },
    {
        "id": "evt_003",
        "title": "Scientific Breakthrough",
        "description": "Scientists announce a major technological advancement!",
        "probability": 0.2,
        "trigger_condition": "Scientists_influence > 50",
        "consequences": {
            "automatic": { "Scientists_loyalty": 10, "stability": 5, "resources": 25 }
        }
    },
    {
        "id": "evt_004",
        "title": "Leak of Classified Documents",
        "description": "Secret files leaked to foreign press",
        "probability": 0.1,
        "trigger_condition": "paranoia > 60",
        "consequences": {
            "automatic": { "paranoia": 10, "People_satisfaction": -10, "stability": -5 }
        }
    }
];

// UI Controller
class GameUI {
    constructor() {
        this.gameState = new GameState();
        this.currentSelectedDossier = null;
        this.setupEventListeners();
    }
    
    async init() {
        // Try to load from JSON, fallback to embedded data
        let dossiersData = EMBEDDED_DOSSIERS;
        let eventsData = EMBEDDED_EVENTS;
        
        try {
            const dosResponse = await fetch('./data/dossiers.json');
            if (dosResponse.ok) {
                const json = await dosResponse.json();
                dossiersData = json.dossiers;
            }
        } catch (e) {
            console.warn("Could not load dossiers.json, using embedded data");
        }
        
        try {
            const evResponse = await fetch('./data/events.json');
            if (evResponse.ok) {
                const json = await evResponse.json();
                eventsData = json.events;
            }
        } catch (e) {
            console.warn("Could not load events.json, using embedded data");
        }
        
        this.gameState.loadData(dossiersData, eventsData);
        // Enable debug when needed
        if (typeof window.__SOVIET_DESK_DEBUG === 'undefined') window.__SOVIET_DESK_DEBUG = false;
        console.log('GameUI init: loading data, debug=', window.__SOVIET_DESK_DEBUG);
        this.drawDesk();
        // Re-draw on resize to keep canvas crisp
        window.addEventListener('resize', () => this.drawDesk());
        this.updateDisplay();
    }
    
    drawDesk() {
        const canvas = document.getElementById("desk-canvas");
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        // Handle high-DPI displays to prevent blurriness
        const dpr = window.devicePixelRatio || 1;
        const displayWidth = canvas.offsetWidth;
        const displayHeight = canvas.offsetHeight;
        canvas.width = Math.floor(displayWidth * dpr);
        canvas.height = Math.floor(displayHeight * dpr);
        canvas.style.width = displayWidth + 'px';
        canvas.style.height = displayHeight + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        
        // Draw wooden desk surface with details
        ctx.fillStyle = "#8b7d70";
        ctx.fillRect(0, 0, displayWidth, displayHeight);
        
        // Wood grain effect
        for (let i = 0; i < 30; i++) {
            ctx.strokeStyle = `rgba(0, 0, 0, ${Math.random() * 0.08})`;
            ctx.lineWidth = (Math.random() * 2) + 0.5;
            ctx.beginPath();
            ctx.moveTo(0, Math.random() * displayHeight);
            ctx.lineTo(displayWidth, Math.random() * displayHeight);
            ctx.stroke();
        }
        
        // Window on the left with shadow
        ctx.fillStyle = "rgba(100, 180, 220, 0.3)";
        // Window (scaled using display dimensions)
        ctx.fillRect(20, 20, Math.min(150, displayWidth * 0.25), Math.min(150, displayHeight * 0.25));
        ctx.strokeStyle = "#666";
        ctx.lineWidth = 3;
        ctx.strokeRect(20, 20, Math.min(150, displayWidth * 0.25), Math.min(150, displayHeight * 0.25));
        
        // Bookshelf in background
        ctx.fillStyle = "#6b5b4e";
        // Bookshelf in background (position relative to display size)
        ctx.fillRect(displayWidth - Math.min(200, displayWidth * 0.3), 50, Math.min(180, displayWidth * 0.25), Math.min(200, displayHeight * 0.4));
        for (let i = 0; i < 4; i++) {
            ctx.strokeStyle = "#999";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(displayWidth - Math.min(200, displayWidth * 0.3), 80 + i * 40);
            ctx.lineTo(displayWidth - 20, 80 + i * 40);
            ctx.stroke();
        }

        // Debug hint
        if (window.__SOVIET_DESK_DEBUG) console.log('drawDesk', {displayWidth, displayHeight, dpr});
        
        // Draw desk shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
        ctx.beginPath();
        ctx.ellipse(canvas.width / 2, canvas.height * 0.7, 300, 50, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    setupEventListeners() {
        if (window.__SOVIET_DESK_DEBUG) console.log('setupEventListeners attaching events');
        const signBtn = document.getElementById("sign-btn"); if (signBtn) signBtn.addEventListener("click", () => this.handleDossier("signed")); else console.warn('sign-btn missing');
        const refuseBtn = document.getElementById("refuse-btn"); if (refuseBtn) refuseBtn.addEventListener("click", () => this.handleDossier("refused")); else console.warn('refuse-btn missing');
        const delayBtn = document.getElementById("delay-btn"); if (delayBtn) delayBtn.addEventListener("click", () => this.handleDossier("delayed")); else console.warn('delay-btn missing');
        const nextDayBtn = document.getElementById("next-day-btn"); if (nextDayBtn) nextDayBtn.addEventListener("click", () => this.nextDay()); else console.warn('next-day-btn missing');
        const restartBtn = document.getElementById("restart-btn"); if (restartBtn) restartBtn.addEventListener("click", () => this.restart()); else console.warn('restart-btn missing');
        const closeX = document.querySelector(".close"); if (closeX) closeX.addEventListener("click", () => this.closeDossierModal()); else console.warn('.close missing');
        const actionClose = document.getElementById("action-close"); if (actionClose) actionClose.addEventListener("click", () => this.closeActionModal()); else console.warn('action-close missing');
        const actionOk = document.getElementById("action-ok-btn"); if (actionOk) actionOk.addEventListener("click", () => this.closeActionModal()); else console.warn('action-ok-btn missing');
        
        // Close modal when clicking outside
        const dossierModal = document.getElementById("dossier-modal");
        if (dossierModal) dossierModal.addEventListener("click", (e) => {
            if (e.target.id === "dossier-modal") this.closeDossierModal();
        }); else console.warn('dossier-modal missing');
        
        const actionModal = document.getElementById("action-modal");
        if (actionModal) actionModal.addEventListener("click", (e) => {
            if (e.target.id === "action-modal") this.closeActionModal();
        }); else console.warn('action-modal missing');
        
        // Desk object interactions - with proper event delegation
        const ds = document.getElementById("dossiers-stack"); if (ds) ds.addEventListener("click", (e) => { e.stopPropagation(); this.showDossierQueue(); }); else console.warn('dossiers-stack missing');
        const tel = document.getElementById("telephone"); if (tel) tel.addEventListener("click", (e) => { e.stopPropagation(); this.handleTelephone(); }); else console.warn('telephone missing');
        const rad = document.getElementById("radio"); if (rad) rad.addEventListener("click", (e) => { e.stopPropagation(); this.handleRadio(); }); else console.warn('radio missing');
        const type = document.getElementById("typewriter"); if (type) type.addEventListener("click", (e) => { e.stopPropagation(); this.handleTypewriter(); }); else console.warn('typewriter missing');
        const sf = document.getElementById("safe"); if (sf) sf.addEventListener("click", (e) => { e.stopPropagation(); this.handleSafe(); }); else console.warn('safe missing');
        
        // Tooltips
        const objects = document.querySelectorAll(".desk-object");
        objects.forEach(obj => {
            obj.addEventListener("mouseenter", (e) => this.showTooltip(e));
            obj.addEventListener("mouseleave", () => this.hideTooltip());
        });
    }
    
    showTooltip(event) {
        const tooltip = document.getElementById("tooltip");
        const title = event.currentTarget.getAttribute("title");
        tooltip.textContent = title;
        tooltip.style.display = "block";
        tooltip.style.left = event.pageX + 10 + "px";
        tooltip.style.top = event.pageY + 10 + "px";
    }
    
    hideTooltip() {
        document.getElementById("tooltip").style.display = "none";
    }
    
    showActionResult(title, message) {
        document.getElementById("action-title").textContent = title;
        document.getElementById("action-text").textContent = message;
        document.getElementById("action-modal").style.display = "flex";
    }
    
    closeActionModal() {
        document.getElementById("action-modal").style.display = "none";
    }
    
    showDossierQueue() {
        if (this.gameState.currentDossierQueue.length === 0) {
            this.showActionResult("INCOMING DOSSIERS", "No dossiers available. Click 'NEXT DAY' in the top bar to continue.");
            return;
        }
        
        const titles = this.gameState.currentDossierQueue.map((d, i) => `${i + 1}. ${d.title} (Urgency: ${d.urgency}/10)`).join("\n");
        const dossierMsg = `${titles}\n\nClick on any dossier to view details.`;
        this.showActionResult("INCOMING DOSSIERS", dossierMsg);
    }
    
    handleTelephone() {
        this.gameState.addLog("📞 Telephone call answered");
        this.gameState.gauges.paranoia = Math.min(100, this.gameState.gauges.paranoia + 5);
        this.showActionResult("TELEPHONE CALL", `A military general reports: Army morale is stable.\n\nParanoia +5`);
        this.updateDisplay();
    }
    
    handleRadio() {
        this.gameState.addLog("📻 Radio broadcast initiated");
        this.gameState.gauges.paranoia = Math.min(100, this.gameState.gauges.paranoia + 10);
        this.gameState.factions["People"].satisfaction = Math.max(0, this.gameState.factions["People"].satisfaction - 8);
        this.showActionResult("STATE RADIO BROADCAST", `"Citizens! Our great nation progresses..."\n\nParanoia +10\nPeople satisfaction -8`);
        this.updateDisplay();
    }
    
    handleTypewriter() {
        this.gameState.addLog("⌨️ Urgent decree typed");
        this.gameState.gauges.paranoia = Math.min(100, this.gameState.gauges.paranoia + 3);
        this.gameState.gauges.stability = Math.max(0, this.gameState.gauges.stability - 2);
        this.showActionResult("TYPED DECREE", `"By order of the Secretary...\nAll dissidents must be identified..."\n\nParanoia +3\nStability -2`);
        this.updateDisplay();
    }
    
    handleSafe() {
        this.gameState.addLog("🔒 Safe opened - secret resources acquired");
        this.gameState.gauges.resources = Math.min(100, this.gameState.gauges.resources + 20);
        this.gameState.gauges.paranoia = Math.min(100, this.gameState.gauges.paranoia + 5);
        this.showActionResult("SECRET SAFE OPENED", `You discovered classified files and emergency funds.\n\nResources +20\nParanoia +5`);
        this.updateDisplay();
    }
    
    updateDisplay() {
        // Update gauges
        document.getElementById("day-counter").textContent = this.gameState.currentDay;
        document.getElementById("paranoia-value").textContent = this.gameState.gauges.paranoia;
        document.getElementById("paranoia-bar").style.width = this.gameState.gauges.paranoia + "%";
        document.getElementById("stability-value").textContent = this.gameState.gauges.stability;
        document.getElementById("stability-bar").style.width = this.gameState.gauges.stability + "%";
        document.getElementById("resources-value").textContent = this.gameState.gauges.resources;
        document.getElementById("resources-bar").style.width = (this.gameState.gauges.resources * 0.66) + "%";
        
        // Update dossier queue
        const dossierQueue = document.getElementById("dossier-queue");
        dossierQueue.innerHTML = "";
        for (const dossier of this.gameState.currentDossierQueue) {
            const urgencyClass = dossier.urgency >= 8 ? "urgency-high" : dossier.urgency >= 5 ? "urgency-medium" : "urgency-low";
            const item = document.createElement("div");
            item.className = "dossier-item";
            item.innerHTML = `
                <div class="dossier-title">${dossier.title}</div>
                <div class="dossier-meta">
                    <span><strong>Source:</strong> ${dossier.source}</span>
                    <span class="${urgencyClass}"><strong>Urgency:</strong> ${dossier.urgency}/10</span>
                    <span><strong>Risk:</strong> ${dossier.risk}/10</span>
                </div>
            `;
            item.addEventListener("click", () => this.showDossierDetail(dossier));
            dossierQueue.appendChild(item);
        }
        
        // Show next day button if queue is empty
        document.getElementById("next-day-btn").style.display = 
            this.gameState.currentDossierQueue.length === 0 ? "block" : "none";
        
        // Update factions
        const factionList = document.getElementById("faction-list");
        factionList.innerHTML = "";
        for (const factionName in this.gameState.factions) {
            const faction = this.gameState.factions[factionName];
            const item = document.createElement("div");
            item.className = "faction-item";
            item.innerHTML = `
                <div class="faction-name">${factionName.toUpperCase()}</div>
                <div class="faction-stat">
                    <span>Influence</span>
                    <div class="faction-bar"><div class="faction-bar-fill" style="width: ${faction.influence}%"></div></div>
                    <span>${faction.influence}</span>
                </div>
                <div class="faction-stat">
                    <span>Loyalty</span>
                    <div class="faction-bar"><div class="faction-bar-fill" style="width: ${faction.loyalty}%"></div></div>
                    <span>${faction.loyalty}</span>
                </div>
                <div class="faction-stat">
                    <span>Satisfaction</span>
                    <div class="faction-bar"><div class="faction-bar-fill" style="width: ${faction.satisfaction}%"></div></div>
                    <span>${faction.satisfaction}</span>
                </div>
            `;
            factionList.appendChild(item);
        }
        
        // Update log
        const logContainer = document.getElementById("log-container");
        logContainer.innerHTML = "";
        for (const entry of this.gameState.log.slice(0, 10)) {
            const entryDiv = document.createElement("div");
            entryDiv.className = "log-entry";
            entryDiv.textContent = entry;
            if (entry.includes("EVENT:")) entryDiv.classList.add("event");
            logContainer.appendChild(entryDiv);
        }
        
        // Check game over
        if (this.gameState.gameOver) {
            this.showGameOver();
        }
    }
    
    showDossierDetail(dossier) {
        this.currentSelectedDossier = dossier;
        document.getElementById("modal-title").textContent = dossier.title;
        document.getElementById("modal-description").textContent = dossier.description;
        document.getElementById("modal-info").innerHTML = `
            <strong>Source:</strong> ${dossier.source}<br>
            <strong>Urgency:</strong> ${dossier.urgency}/10 | 
            <strong>Risk:</strong> ${dossier.risk}/10 | 
            <strong>Benefit:</strong> ${dossier.benefit}/10<br>
            <strong>Linked Faction:</strong> ${dossier.linked_faction}
        `;
        document.getElementById("dossier-modal").style.display = "flex";
    }
    
    closeDossierModal() {
        document.getElementById("dossier-modal").style.display = "none";
    }
    
    handleDossier(action) {
        if (!this.currentSelectedDossier) return;
        
        this.gameState.applyDossierConsequence(this.currentSelectedDossier, action);
        this.gameState.currentDossierQueue = this.gameState.currentDossierQueue.filter(d => d.id !== this.currentSelectedDossier.id);
        
        this.closeDossierModal();
        this.updateDisplay();
    }
    
    nextDay() {
        this.gameState.advanceDay();
        this.updateDisplay();
    }
    
    showGameOver() {
        document.getElementById("game-over-reason").textContent = this.gameState.gameOverReason;
        document.getElementById("game-over-modal").style.display = "flex";
    }
    
    restart() {
        this.gameState = new GameState();
        this.init();
        document.getElementById("game-over-modal").style.display = "none";
    }
}

// Initialize game on page load
window.addEventListener("load", async () => {
    console.log("Soviet Desk game initializing...");
    const ui = new GameUI();
    try {
        await ui.init();
        console.log("Game initialized successfully!");
    } catch (error) {
        console.error("Failed to initialize game:", error);
        // Try again with just embedded data
        ui.gameState.loadData(EMBEDDED_DOSSIERS, EMBEDDED_EVENTS);
        ui.updateDisplay();
    }
});
