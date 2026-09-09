class_name SeraUnit
extends Node2D

var sprite: Sprite2D
var shadow: Polygon2D
var audio: AudioStreamPlayer
var moving: bool = false
var base_sprite_pos: Vector2 = Vector2(0, -40)
var base_scale: Vector2 = Vector2(0.64, 0.64)

func setup(texture: Texture2D, clack: AudioStream) -> void:
	shadow = Polygon2D.new()
	shadow.polygon = _ellipse_polygon(27.0, 10.0, 28)
	shadow.color = Color(0.03, 0.04, 0.04, 0.46)
	shadow.position = Vector2(0, 3)
	shadow.z_index = -1
	add_child(shadow)

	sprite = Sprite2D.new()
	sprite.texture = texture
	sprite.scale = base_scale
	sprite.position = base_sprite_pos
	sprite.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	add_child(sprite)

	audio = AudioStreamPlayer.new()
	audio.stream = clack
	audio.volume_db = -8.0
	add_child(audio)

func _ellipse_polygon(rx: float, ry: float, points: int) -> PackedVector2Array:
	var polygon: PackedVector2Array = PackedVector2Array()
	for i: int in range(points):
		var angle: float = TAU * float(i) / float(points)
		polygon.append(Vector2(cos(angle) * rx, sin(angle) * ry))
	return polygon

func move_along(board: TacticalBoard, path: Array[Vector2i]) -> void:
	if moving or path.is_empty():
		return
	moving = true
	for cell: Vector2i in path:
		await _step_to(board.cell_center(cell))
	moving = false

func _step_to(target: Vector2) -> void:
	var travel: Tween = create_tween()
	travel.tween_property(self, "position", target, 0.19).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN_OUT)

	var hop: Tween = create_tween()
	hop.tween_property(sprite, "position:y", base_sprite_pos.y - 8.0, 0.095).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
	hop.tween_property(sprite, "position:y", base_sprite_pos.y, 0.095).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN)

	var shadow_tween: Tween = create_tween()
	shadow_tween.tween_property(shadow, "scale", Vector2(0.72, 0.72), 0.095).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
	shadow_tween.tween_property(shadow, "scale", Vector2.ONE, 0.095).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN)

	await travel.finished
	_land_feedback()

func _land_feedback() -> void:
	if audio.stream != null:
		audio.pitch_scale = randf_range(0.94, 1.07)
		audio.play()
	var squash: Tween = create_tween()
	squash.tween_property(sprite, "scale", Vector2(base_scale.x * 1.06, base_scale.y * 0.94), 0.045)
	squash.tween_property(sprite, "scale", base_scale, 0.075).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
