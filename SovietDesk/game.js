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
        
        this.factions = {
            Army: { influence: 50, loyalty: 50, satisfaction: 50 },
            SecretPolice: { influence: 50, loyalty: 50, satisfaction: 50 },
            People: { influence: 30, loyalty: 50, satisfaction: 50 },
            Party: { influence: 60, loyalty: 60, satisfaction: 50 },
            Scientists: { influence: 40, loyalty: 50, satisfaction: 50 }
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
        for (let i = 0; i < Math.min(3, this.dossiers.length); i++) {
            const randomIdx = Math.floor(Math.random() * this.dossiers.length);
            this.currentDossierQueue.push(this.dossiers[randomIdx]);
        }
    }
    
    applyDossierConsequence(dossier, action) {
        const consequences = dossier.consequences[`if_${action}`] || {};
        
        for (const key in consequences) {
            const value = consequences[key];
            
            if (key in this.gauges) {
                this.gauges[key] = Math.max(0, Math.min(100, this.gauges[key] + value));
            } else if (key.includes("_")) {
                const [factionName, stat] = key.split("_");
                if (this.factions[factionName] && stat in this.factions[factionName]) {
                    this.factions[factionName][stat] = Math.max(0, Math.min(100, this.factions[factionName][stat] + value));
                }
            }
        }
        
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

// UI Controller
class GameUI {
    constructor() {
        this.gameState = new GameState();
        this.currentSelectedDossier = null;
        this.setupEventListeners();
    }
    
    async init() {
        // Load data from JSON
        const dossiersData = await fetch('./data/dossiers.json').then(r => r.json());
        const eventsData = await fetch('./data/events.json').then(r => r.json());
        
        this.gameState.loadData(dossiersData.dossiers, eventsData.events);
        this.updateDisplay();
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
    const ui = new GameUI();
    await ui.init();
});
