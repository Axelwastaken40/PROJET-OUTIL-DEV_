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
        
        this.gauges = {
            paranoia: 20,
            stability: 60,
            resources: 100
        };
    }
    
    loadData(dossiersData, eventsData) {
        this.dossiers = dossiersData;
        this.events = eventsData;
        this.refreshDossierQueue();
    }
    
    refreshDossierQueue() {
        this.currentDossierQueue = [];
        const available = this.dossiers.filter(d => !this.processedDossiers.includes(d.id));
        
        for (let i = 0; i < Math.min(3, available.length); i++) {
            const randomIdx = Math.floor(Math.random() * available.length);
            const chosen = available[randomIdx];
            this.currentDossierQueue.push(chosen);
            available.splice(randomIdx, 1);
        }
    }
    
    applyDossierConsequence(dossier, action) {
        const consequences = dossier.consequences[`if_${action}`] || {};
        
        for (const key in consequences) {
            const value = consequences[key];
            
            if (key in this.gauges) {
                this.gauges[key] = Math.max(0, Math.min(100, this.gauges[key] + value));
            } else if (key.includes("_")) {
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
        this.drawDesk();
        this.updateDisplay();
    }
    
    drawDesk() {
        const canvas = document.getElementById("desk-canvas");
        if (!canvas) return;
        
        const ctx = canvas.getContext("2d");
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        
        // Draw wooden desk surface with details
        ctx.fillStyle = "#8b7d70";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Wood grain effect
        for (let i = 0; i < 30; i++) {
            ctx.strokeStyle = `rgba(0, 0, 0, ${Math.random() * 0.1})`;
            ctx.lineWidth = Math.random() * 3;
            ctx.beginPath();
            ctx.moveTo(0, Math.random() * canvas.height);
            ctx.lineTo(canvas.width, Math.random() * canvas.height);
            ctx.stroke();
        }
        
        // Window on the left with shadow
        ctx.fillStyle = "rgba(100, 180, 220, 0.3)";
        ctx.fillRect(20, 20, 150, 150);
        ctx.strokeStyle = "#666";
        ctx.lineWidth = 3;
        ctx.strokeRect(20, 20, 150, 150);
        
        // Bookshelf in background
        ctx.fillStyle = "#6b5b4e";
        ctx.fillRect(canvas.width - 200, 50, 180, 200);
        for (let i = 0; i < 4; i++) {
            ctx.strokeStyle = "#999";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(canvas.width - 200, 80 + i * 40);
            ctx.lineTo(canvas.width - 20, 80 + i * 40);
            ctx.stroke();
        }
        
        // Draw desk shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
        ctx.beginPath();
        ctx.ellipse(canvas.width / 2, canvas.height * 0.7, 300, 50, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    setupEventListeners() {
        document.getElementById("sign-btn").addEventListener("click", () => this.handleDossier("signed"));
        document.getElementById("refuse-btn").addEventListener("click", () => this.handleDossier("refused"));
        document.getElementById("delay-btn").addEventListener("click", () => this.handleDossier("delayed"));
        document.getElementById("next-day-btn").addEventListener("click", () => this.nextDay());
        document.getElementById("restart-btn").addEventListener("click", () => this.restart());
        document.querySelector(".close").addEventListener("click", () => this.closeDossierModal());
        
        // Close modal when clicking outside
        document.getElementById("dossier-modal").addEventListener("click", (e) => {
            if (e.target.id === "dossier-modal") this.closeDossierModal();
        });
        
        // Desk object interactions
        document.getElementById("dossiers-stack").addEventListener("click", () => this.showDossierQueue());
        document.getElementById("telephone").addEventListener("click", () => this.handleTelephone());
        document.getElementById("radio").addEventListener("click", () => this.handleRadio());
        document.getElementById("typewriter").addEventListener("click", () => this.handleTypewriter());
        document.getElementById("safe").addEventListener("click", () => this.handleSafe());
        
        // Tooltips
        const objects = document.querySelectorAll(".desk-object");
        objects.forEach(obj => {
            obj.addEventListener("mouseenter", (e) => this.showTooltip(e));
            obj.addEventListener("mouseleave", () => this.hideTooltip());
        });
    }
    
    showTooltip(event) {
        const tooltip = document.getElementById("tooltip");
        const title = event.target.closest(".desk-object").getAttribute("title");
        tooltip.textContent = title;
        tooltip.style.display = "block";
        tooltip.style.left = event.pageX + 10 + "px";
        tooltip.style.top = event.pageY + 10 + "px";
    }
    
    hideTooltip() {
        document.getElementById("tooltip").style.display = "none";
    }
    
    showDossierQueue() {
        if (this.gameState.currentDossierQueue.length === 0) {
            alert("No dossiers available. Click 'NEXT DAY' to continue.");
            return;
        }
        
        const titles = this.gameState.currentDossierQueue.map(d => `• ${d.title}`).join("\n");
        const dossierMsg = `INCOMING DOSSIERS:\n\n${titles}`;
        alert(dossierMsg);
    }
    
    handleTelephone() {
        const choices = [
            "Answer the call",
            "Ignore it",
            "Order interception"
        ];
        const choice = this.showChoiceDialog("TELEPHONE CALL", "An urgent call is coming in...", choices);
        if (choice >= 0) {
            this.gameState.addLog(`Telephone: Action ${choice + 1} taken`);
            if (choice === 0) this.gameState.gauges.paranoia = Math.min(100, this.gameState.gauges.paranoia + 5);
            else if (choice === 2) this.gameState.gauges.paranoia = Math.min(100, this.gameState.gauges.paranoia + 15);
            this.updateDisplay();
        }
    }
    
    handleRadio() {
        const choices = [
            "Broadcast propaganda (paranoia +10)",
            "Report on stability",
            "Leave it off"
        ];
        const choice = this.showChoiceDialog("RADIO", "State radio awaits your message...", choices);
        if (choice >= 0) {
            this.gameState.addLog(`Radio broadcast: Option ${choice + 1} selected`);
            if (choice === 0) {
                this.gameState.gauges.paranoia = Math.min(100, this.gameState.gauges.paranoia + 10);
                this.gameState.factions["People"].satisfaction = Math.max(0, this.gameState.factions["People"].satisfaction - 8);
            }
            this.updateDisplay();
        }
    }
    
    handleTypewriter() {
        const choices = [
            "Type urgent decree (paranoia +3)",
            "Write official letter",
            "Cancel"
        ];
        const choice = this.showChoiceDialog("TYPEWRITER", "The machine is ready for your orders...", choices);
        if (choice >= 0 && choice < 2) {
            this.gameState.addLog(`Decree typed: Option ${choice + 1}`);
            if (choice === 0) this.gameState.gauges.paranoia = Math.min(100, this.gameState.gauges.paranoia + 3);
            this.updateDisplay();
        }
    }
    
    handleSafe() {
        const choice = confirm("Attempt to open the safe? (Paranoia +5)");
        if (choice) {
            this.gameState.addLog("Safe opened - secret resources found!");
            this.gameState.gauges.resources = Math.min(100, this.gameState.gauges.resources + 15);
            this.gameState.gauges.paranoia = Math.min(100, this.gameState.gauges.paranoia + 5);
            this.updateDisplay();
        }
    }
    
    showChoiceDialog(title, message, choices) {
        let result = -1;
        let choiceStr = `${title}\n\n${message}\n\n`;
        choices.forEach((choice, idx) => {
            choiceStr += `${idx + 1}. ${choice}\n`;
        });
        choiceStr += `\nEnter choice (1-${choices.length}):`;
        
        const input = prompt(choiceStr);
        if (input) {
            const num = parseInt(input) - 1;
            if (num >= 0 && num < choices.length) result = num;
        }
        return result;
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
