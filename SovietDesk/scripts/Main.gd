# Main.gd
extends Control

@onready var game_state = GameState.new()

@onready var paranoia_label = Label.new()
@onready var stability_label = Label.new()
@onready var resources_label = Label.new()
@onready var day_label = Label.new()
@onready var dossier_panel = PanelContainer.new()
@onready var faction_panel = PanelContainer.new()
@onready var log_text = TextEdit.new()

func _ready():
	game_state._ready()
	setup_ui()
	update_display()

func setup_ui():
	# Top bar with gauges
	var top_bar = HBoxContainer.new()
	top_bar.custom_minimum_size = Vector2(1200, 40)
	
	day_label.text = "Day: 1"
	paranoia_label.text = "Paranoia: 20"
	stability_label.text = "Stability: 60"
	resources_label.text = "Resources: 100"
	
	top_bar.add_child(day_label)
	top_bar.add_child(paranoia_label)
	top_bar.add_child(stability_label)
	top_bar.add_child(resources_label)
	add_child(top_bar)
	
	# Dossier queue (left)
	var main_hbox = HBoxContainer.new()
	main_hbox.anchor_left = 0
	main_hbox.anchor_top = 0.05
	main_hbox.anchor_right = 1
	main_hbox.anchor_bottom = 1
	
	dossier_panel.custom_minimum_size = Vector2(500, 600)
	var dossier_vbox = VBoxContainer.new()
	var dossier_title = Label.new()
	dossier_title.text = "=== INCOMING DOSSIERS ==="
	dossier_vbox.add_child(dossier_title)
	dossier_panel.add_child(dossier_vbox)
	main_hbox.add_child(dossier_panel)
	
	# Factions (right)
	faction_panel.custom_minimum_size = Vector2(400, 600)
	var faction_vbox = VBoxContainer.new()
	var faction_title = Label.new()
	faction_title.text = "=== FACTIONS ==="
	faction_vbox.add_child(faction_title)
	faction_panel.add_child(faction_vbox)
	main_hbox.add_child(faction_panel)
	
	# Log (bottom)
	log_text.custom_minimum_size = Vector2(1200, 150)
	log_text.editable = false
	add_child(main_hbox)
	add_child(log_text)

func update_display():
	day_label.text = "Day: %d" % game_state.current_day
	paranoia_label.text = "Paranoia: %d" % game_state.gauges["paranoia"]
	stability_label.text = "Stability: %d" % game_state.gauges["stability"]
	resources_label.text = "Resources: %d" % game_state.gauges["resources"]
	
	# Update dossier display
	var dossier_container = dossier_panel.get_child(0)
	for child in dossier_container.get_children():
		if child != dossier_container.get_child(0):
			child.queue_free()
	
	for dossier in game_state.current_dossier_queue:
		var dossier_btn = Button.new()
		dossier_btn.text = "%s (Urgency: %d)" % [dossier["title"], dossier["urgency"]]
		dossier_btn.pressed.connect(func(): show_dossier_detail(dossier))
		dossier_container.add_child(dossier_btn)
	
	# Update faction display
	var faction_container = faction_panel.get_child(0)
	for child in faction_container.get_children():
		if child != faction_container.get_child(0):
			child.queue_free()
	
	for faction_name in game_state.factions:
		var faction_data = game_state.factions[faction_name]
		var faction_label = Label.new()
		faction_label.text = "%s: Inf=%d Loy=%d Sat=%d" % [
			faction_name,
			faction_data["influence"],
			faction_data["loyalty"],
			faction_data["satisfaction"]
		]
		faction_container.add_child(faction_label)
	
	# Update log
	log_text.text = "\n".join(game_state.log)

func show_dossier_detail(dossier: Dictionary):
	var dialog = AcceptDialog.new()
	dialog.title = dossier["title"]
	
	var vbox = VBoxContainer.new()
	var desc = Label.new()
	desc.text = dossier["description"]
	desc.word_wrap_mode = TextServer.WORD_WRAP_WORD
	vbox.add_child(desc)
	
	var info = Label.new()
	info.text = "Source: %s\nUrgency: %d/10 | Risk: %d/10 | Benefit: %d/10\n" % [dossier["source"], dossier["urgency"], dossier["risk"], dossier["benefit"]]
	vbox.add_child(info)
	
	var btn_box = HBoxContainer.new()
	var sign_btn = Button.new()
	sign_btn.text = "SIGN"
	sign_btn.pressed.connect(func(): handle_dossier(dossier, "signed"); dialog.queue_free())
	btn_box.add_child(sign_btn)
	
	var refuse_btn = Button.new()
	refuse_btn.text = "REFUSE"
	refuse_btn.pressed.connect(func(): handle_dossier(dossier, "refused"); dialog.queue_free())
	btn_box.add_child(refuse_btn)
	
	var delay_btn = Button.new()
	delay_btn.text = "DELAY"
	delay_btn.pressed.connect(func(): handle_dossier(dossier, "delayed"); dialog.queue_free())
	btn_box.add_child(delay_btn)
	
	vbox.add_child(btn_box)
	dialog.add_child(vbox)
	get_tree().root.add_child(dialog)
	dialog.popup_centered_ratio(0.7)

func handle_dossier(dossier: Dictionary, action: String):
	if action == "signed":
		game_state.apply_dossier_consequence(dossier, "signed")
	elif action == "refused":
		game_state.apply_dossier_consequence(dossier, "refused")
	elif action == "delayed":
		game_state.add_log("Dossier '%s' delayed" % dossier["title"])
	
	game_state.current_dossier_queue.erase(dossier)
	update_display()
	
	# Check if dossiers done
	if game_state.current_dossier_queue.is_empty():
		var next_day_btn = Button.new()
		next_day_btn.text = "NEXT DAY"
		next_day_btn.pressed.connect(func(): game_state.advance_day(); update_display(); next_day_btn.queue_free())
		add_child(next_day_btn)

func _process(delta):
	if game_state.game_over:
		var end_dialog = AcceptDialog.new()
		end_dialog.title = "GAME OVER"
		var label = Label.new()
		label.text = "Reason: " + game_state.game_over_reason
		end_dialog.add_child(label)
		get_tree().root.add_child(end_dialog)
		game_state.game_over = false  # Prevent spam
		set_process(false)
