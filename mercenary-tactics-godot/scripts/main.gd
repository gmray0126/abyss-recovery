extends Node2D

const BoardScript = preload("res://scripts/board.gd")
const SeraScript = preload("res://scripts/sera_unit.gd")
const SERA_TEXTURE: Texture2D = preload("res://assets/sera_sd.png")
const CLACK_SOUND: AudioStream = preload("res://assets/clack.wav")

var board: TacticalBoard
var sera: SeraUnit
var sera_cell: Vector2i = Vector2i(7, 3)
var move_range: int = 3
var info_label: Label
var status_label: Label
var regenerate_button: Button

func _ready() -> void:
	board = BoardScript.new()
	add_child(board)
	board.cell_clicked.connect(_on_cell_clicked)

	sera = SeraScript.new()
	sera.setup(SERA_TEXTURE, CLACK_SOUND)
	sera.z_index = 50
	add_child(sera)

	_create_ui()
	_reset_sera_position()
	_refresh_reachable()

func _create_ui() -> void:
	var canvas: CanvasLayer = CanvasLayer.new()
	canvas.layer = 100
	add_child(canvas)

	var top: Panel = Panel.new()
	top.position = Vector2(24, 20)
	top.size = Vector2(1232, 88)
	canvas.add_child(top)

	var title: Label = Label.new()
	title.text = "흐린 달의 용병단"
	title.position = Vector2(26, 12)
	title.add_theme_font_size_override("font_size", 30)
	top.add_child(title)

	var sub: Label = Label.new()
	sub.text = "GODOT TACTICAL PROTOTYPE  ·  클릭한 칸으로 세라 이동  ·  R: 전장 재생성"
	sub.position = Vector2(28, 52)
	sub.modulate = Color(0.78, 0.80, 0.78)
	top.add_child(sub)

	regenerate_button = Button.new()
	regenerate_button.text = "전장 재생성"
	regenerate_button.position = Vector2(1052, 22)
	regenerate_button.size = Vector2(150, 44)
	regenerate_button.pressed.connect(_regenerate)
	top.add_child(regenerate_button)

	var left: Panel = Panel.new()
	left.position = Vector2(20, 150)
	left.size = Vector2(158, 220)
	canvas.add_child(left)

	var name_label: Label = Label.new()
	name_label.text = "세라 · 검사"
	name_label.position = Vector2(16, 14)
	name_label.add_theme_font_size_override("font_size", 22)
	left.add_child(name_label)

	info_label = Label.new()
	info_label.position = Vector2(16, 54)
	info_label.text = "이동력 3\n강/바위 이동 불가\n숲 이동 비용 2\n다리 통행 가능"
	left.add_child(info_label)

	status_label = Label.new()
	status_label.position = Vector2(344, 664)
	status_label.size = Vector2(780, 34)
	status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	status_label.text = "파란 칸을 클릭해 세라를 이동시켜 보세요."
	canvas.add_child(status_label)

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey:
		var key_event: InputEventKey = event
		if key_event.pressed and not key_event.echo and key_event.keycode == KEY_R:
			_regenerate()

func _on_cell_clicked(cell: Vector2i) -> void:
	if sera.moving:
		return
	var path: Array[Vector2i] = board.find_path(sera_cell, cell, move_range)
	if path.is_empty():
		status_label.text = "그 칸은 이동력 3 안에서 갈 수 없습니다."
		return
	status_label.text = "%s → %s  이동 중…" % [_cell_name(sera_cell), _cell_name(cell)]
	board.set_reachable({})
	await sera.move_along(board, path)
	sera_cell = cell
	_refresh_reachable()
	status_label.text = "%s 도착. 착지할 때 달그락 소리가 납니다." % _cell_name(sera_cell)

func _refresh_reachable() -> void:
	board.set_reachable(board.reachable_from(sera_cell, move_range))

func _reset_sera_position() -> void:
	sera_cell = Vector2i(7, 3)
	if not board.is_passable(sera_cell):
		sera_cell = Vector2i(7, 4)
	sera.position = board.cell_center(sera_cell)

func _regenerate() -> void:
	if sera.moving:
		return
	board.generate_map()
	_reset_sera_position()
	_refresh_reachable()
	status_label.text = "새 전장을 생성했습니다. 강은 좌우로 이어지고 다리가 놓입니다."

func _cell_name(cell: Vector2i) -> String:
	return "%s%d" % ["ABCDEFGH".substr(cell.y, 1), 8 - cell.x]
