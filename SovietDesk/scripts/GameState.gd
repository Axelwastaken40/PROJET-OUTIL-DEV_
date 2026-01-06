# GameState.gd
extends Node

class_name GameState

# Factions
var factions = {
	"Army": {"influence": 50, "loyalty": 50, "satisfaction": 50},
	"SecretPolice": {"influence": 50, "loyalty": 50, "satisfaction": 50},
	"People": {"influence": 30, "loyalty": 50, "satisfaction": 50},
	"Party": {"influence": 60, "loyalty": 60, "satisfaction": 50},
	"Scientists": {"influence": 40, "loyalty": 50, "satisfaction": 50}
}

# Global gauges
var gauges = {
	"paranoia": 20,
	"stability": 60,
	"resources": 100
}

# Game state
var current_day = 1
var game_over = false
var game_over_reason = ""
var dossiers = []
var events = []
var current_dossier_queue = []
var log = []

func _ready():
	load_dossiers()
	load_events()
	refresh_dossier_queue()

func load_dossiers():
	var file = FileAccess.open("res://data/dossiers.json", FileAccess.READ)
	if file == null:
		push_error("Failed to load dossiers.json")
		return
	var data = JSON.parse_string(file.get_as_text())
	dossiers = data["dossiers"]

func load_events():
	var file = FileAccess.open("res://data/events.json", FileAccess.READ)
	if file == null:
		push_error("Failed to load events.json")
		return
	var data = JSON.parse_string(file.get_as_text())
	events = data["events"]

func refresh_dossier_queue():
	# Randomly select 3 dossiers for current day
	current_dossier_queue.clear()
	for i in range(min(3, dossiers.size())):
		var idx = randi() % dossiers.size()
		current_dossier_queue.append(dossiers[idx])

func apply_dossier_consequence(dossier: Dictionary, action: String):
	var consequences = dossier.get("consequences", {})
	var chosen = consequences.get("if_" + action, {})
	
	for key in chosen:
		if key in gauges:
			gauges[key] = clampi(gauges[key] + chosen[key], 0, 100)
		elif "_" in key:
			var parts = key.split("_")
			if parts.size() == 2:
				var faction = parts[0]
				var stat = parts[1]
				if faction in factions and stat in factions[faction]:
					factions[faction][stat] = clampi(factions[faction][stat] + chosen[key], 0, 100)
	
	add_log("Dossier '%s' -> %s" % [dossier["title"], action])
	check_game_state()

func add_log(entry: String):
	log.append("[Day %d] %s" % [current_day, entry])
	if log.size() > 50:
		log.pop_front()

func advance_day():
	current_day += 1
	refresh_dossier_queue()
	trigger_daily_events()
	check_game_state()

func trigger_daily_events():
	for event in events:
		var prob = event.get("probability", 0.1)
		if randf() < prob:
			add_log("EVENT: %s" % event["title"])

func check_game_state():
	# Game over conditions
	if gauges["stability"] <= 0:
		game_over = true
		game_over_reason = "Government collapsed!"
	elif gauges["paranoia"] >= 100:
		game_over = true
		game_over_reason = "Paranoia spiral - regime destroyed itself"
	
	# Check faction rebellion
	for faction in factions:
		if factions[faction]["influence"] > 75 and factions[faction]["loyalty"] < 25:
			game_over = true
			game_over_reason = faction + " launched a successful coup!"

func clamp_gauge(value: float) -> int:
	return clampi(int(value), 0, 100)
