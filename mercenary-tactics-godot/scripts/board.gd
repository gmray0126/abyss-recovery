class_name TacticalBoard
extends Node2D

signal cell_clicked(cell: Vector2i)

const SIZE: int = 8
const PLAIN: int = 0
const RIVER: int = 1
const BRIDGE: int = 2
const FOREST: int = 3
const ROCK: int = 4

var terrain: Array = []
var cell_polygons: Dictionary = {}
var hover_cell: Vector2i = Vector2i(-1, -1)
var reachable: Dictionary = {}
var rng: RandomNumberGenerator = RandomNumberGenerator.new()

var top_left: Vector2 = Vector2(292, 150)
var top_right: Vector2 = Vector2(988, 150)
var bottom_right: Vector2 = Vector2(1088, 650)
var bottom_left: Vector2 = Vector2(192, 650)

func _ready() -> void:
	generate_map()

func point_at(grid_x: float, grid_y: float) -> Vector2:
	var u: float = grid_x / float(SIZE)
	var v: float = grid_y / float(SIZE)
	var top: Vector2 = top_left.lerp(top_right, u)
	var bottom: Vector2 = bottom_left.lerp(bottom_right, u)
	return top.lerp(bottom, v)

func cell_polygon(cell: Vector2i) -> PackedVector2Array:
	var r: int = cell.x
	var c: int = cell.y
	return PackedVector2Array([
		point_at(float(c), float(r)),
		point_at(float(c + 1), float(r)),
		point_at(float(c + 1), float(r + 1)),
		point_at(float(c), float(r + 1))
	])

func cell_center(cell: Vector2i) -> Vector2:
	return point_at(float(cell.y) + 0.5, float(cell.x) + 0.5)

func generate_map(seed_value: int = 0) -> void:
	if seed_value == 0:
		rng.randomize()
	else:
		rng.seed = seed_value

	terrain.clear()
	for r: int in range(SIZE):
		var row_data: Array[int] = []
		for _c: int in range(SIZE):
			row_data.append(PLAIN)
		terrain.append(row_data)

	var row: int = rng.randi_range(2, 5)
	for c: int in range(SIZE):
		terrain[row][c] = RIVER
		if c < SIZE - 1:
			var roll: float = rng.randf()
			var next_row: int = row
			if roll < 0.28:
				next_row = maxi(2, row - 1)
			elif roll > 0.72:
				next_row = mini(5, row + 1)
			if next_row != row:
				terrain[next_row][c] = RIVER
			row = next_row

	var bridge_cols: Array[int] = [1, 2, 3, 4, 5, 6]
	bridge_cols.shuffle()
	for i: int in range(2):
		var bridge_col: int = bridge_cols[i]
		for r: int in range(2, 6):
			if int(terrain[r][bridge_col]) == RIVER:
				terrain[r][bridge_col] = BRIDGE

	var free_cells: Array[Vector2i] = []
	for r: int in range(2, 6):
		for c: int in range(SIZE):
			if int(terrain[r][c]) == PLAIN:
				free_cells.append(Vector2i(r, c))
	free_cells.shuffle()

	var forest_count: int = mini(7, free_cells.size())
	for _i: int in range(forest_count):
		var p: Vector2i = free_cells.pop_back()
		terrain[p.x][p.y] = FOREST

	var rock_count: int = mini(4, free_cells.size())
	for _i: int in range(rock_count):
		var p: Vector2i = free_cells.pop_back()
		terrain[p.x][p.y] = ROCK

	_rebuild_polygons()
	queue_redraw()

func _rebuild_polygons() -> void:
	cell_polygons.clear()
	for r: int in range(SIZE):
		for c: int in range(SIZE):
			var cell: Vector2i = Vector2i(r, c)
			cell_polygons[cell] = cell_polygon(cell)

func is_passable(cell: Vector2i) -> bool:
	if cell.x < 0 or cell.x >= SIZE or cell.y < 0 or cell.y >= SIZE:
		return false
	var tile: int = int(terrain[cell.x][cell.y])
	return tile != RIVER and tile != ROCK

func move_cost(cell: Vector2i) -> int:
	return 2 if int(terrain[cell.x][cell.y]) == FOREST else 1

func find_path(start: Vector2i, goal: Vector2i, max_cost: int) -> Array[Vector2i]:
	if start == goal or not is_passable(goal):
		return []

	var frontier: Array[Dictionary] = [{"cell": start, "cost": 0}]
	var best: Dictionary = {start: 0}
	var parent: Dictionary = {}
	var dirs: Array[Vector2i] = [Vector2i(1, 0), Vector2i(-1, 0), Vector2i(0, 1), Vector2i(0, -1)]

	while not frontier.is_empty():
		frontier.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
			return int(a["cost"]) < int(b["cost"])
		)
		var item: Dictionary = frontier.pop_front()
		var here: Vector2i = item["cell"]
		var cost: int = int(item["cost"])
		if here == goal:
			break

		for d: Vector2i in dirs:
			var nxt: Vector2i = here + d
			if not is_passable(nxt):
				continue
			var nc: int = cost + move_cost(nxt)
			if nc > max_cost:
				continue
			if not best.has(nxt) or nc < int(best[nxt]):
				best[nxt] = nc
				parent[nxt] = here
				frontier.append({"cell": nxt, "cost": nc})

	if not best.has(goal):
		return []

	var result: Array[Vector2i] = []
	var cur: Vector2i = goal
	while cur != start:
		result.push_front(cur)
		var previous: Vector2i = parent[cur]
		cur = previous
	return result

func reachable_from(start: Vector2i, max_cost: int) -> Dictionary:
	var result: Dictionary = {}
	for r: int in range(SIZE):
		for c: int in range(SIZE):
			var cell: Vector2i = Vector2i(r, c)
			var path: Array[Vector2i] = find_path(start, cell, max_cost)
			if not path.is_empty():
				result[cell] = path
	return result

func set_reachable(cells: Dictionary) -> void:
	reachable = cells
	queue_redraw()

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion:
		var mouse_event: InputEventMouseMotion = event
		var found: Vector2i = _cell_at(mouse_event.position)
		if found != hover_cell:
			hover_cell = found
			queue_redraw()
	elif event is InputEventMouseButton:
		var mouse_button: InputEventMouseButton = event
		if mouse_button.button_index == MOUSE_BUTTON_LEFT and mouse_button.pressed:
			var cell: Vector2i = _cell_at(mouse_button.position)
			if cell.x >= 0:
				cell_clicked.emit(cell)

func _cell_at(p: Vector2) -> Vector2i:
	for r: int in range(SIZE):
		for c: int in range(SIZE):
			var cell: Vector2i = Vector2i(r, c)
			var poly: PackedVector2Array = cell_polygons[cell]
			if Geometry2D.is_point_in_polygon(p, poly):
				return cell
	return Vector2i(-1, -1)

func _draw() -> void:
	var board_outline: PackedVector2Array = PackedVector2Array([top_left, top_right, bottom_right, bottom_left])
	draw_colored_polygon(board_outline, Color("151b18"))

	for r: int in range(SIZE):
		for c: int in range(SIZE):
			var cell: Vector2i = Vector2i(r, c)
			var poly: PackedVector2Array = cell_polygons[cell]
			var type: int = int(terrain[r][c])
			var base: Color = Color("778266")
			if (r + c) % 2 == 0:
				base = Color("818b6d")
			if r <= 1:
				base = base.lerp(Color("6c4146"), 0.18)
			elif r >= 6:
				base = base.lerp(Color("366c68"), 0.18)
			if type == RIVER or type == BRIDGE:
				base = Color("3f91ad")
			elif type == FOREST:
				base = Color("577057")
			elif type == ROCK:
				base = Color("65665f")

			draw_colored_polygon(poly, base)
			for i: int in range(poly.size()):
				draw_line(poly[i], poly[(i + 1) % poly.size()], Color(0.12, 0.16, 0.14, 0.72), 1.5)

			var center: Vector2 = cell_center(cell)
			if type == FOREST:
				_draw_tree(center + Vector2(-10, 2), 0.72)
				_draw_tree(center + Vector2(8, -2), 0.62)
			elif type == ROCK:
				_draw_rock(center)
			elif type == BRIDGE:
				_draw_bridge(poly)

			if reachable.has(cell):
				draw_colored_polygon(poly, Color(0.30, 0.76, 1.0, 0.24))
				draw_polyline(PackedVector2Array([poly[0], poly[1], poly[2], poly[3], poly[0]]), Color(0.55, 0.88, 1.0, 0.75), 2.0)
			if cell == hover_cell:
				draw_polyline(PackedVector2Array([poly[0], poly[1], poly[2], poly[3], poly[0]]), Color(1.0, 0.91, 0.60, 0.9), 2.5)

func _draw_tree(pos: Vector2, scale_value: float) -> void:
	draw_line(pos + Vector2(0, 8) * scale_value, pos + Vector2(0, -3) * scale_value, Color("403829"), 4.0 * scale_value)
	draw_circle(pos + Vector2(0, -7) * scale_value, 10.0 * scale_value, Color("2e5140"))
	draw_circle(pos + Vector2(-5, -3) * scale_value, 7.5 * scale_value, Color("355f47"))
	draw_circle(pos + Vector2(6, -2) * scale_value, 7.0 * scale_value, Color("284937"))

func _draw_rock(pos: Vector2) -> void:
	var p: PackedVector2Array = PackedVector2Array([pos + Vector2(-14, 5), pos + Vector2(-9, -5), pos + Vector2(1, -10), pos + Vector2(13, -3), pos + Vector2(16, 7), pos + Vector2(4, 11), pos + Vector2(-8, 10)])
	draw_colored_polygon(p, Color("9a9a8e"))
	draw_polyline(PackedVector2Array([p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[0]]), Color("4f514d"), 1.4)

func _draw_bridge(poly: PackedVector2Array) -> void:
	var left_mid: Vector2 = (poly[0] + poly[3]) * 0.5
	var right_mid: Vector2 = (poly[1] + poly[2]) * 0.5
	var dir: Vector2 = right_mid - left_mid
	for i: int in range(6):
		var t0: float = (float(i) + 0.15) / 6.0
		var t1: float = (float(i) + 0.85) / 6.0
		var a: Vector2 = left_mid + dir * t0
		var b: Vector2 = left_mid + dir * t1
		draw_line(a + Vector2(0, -9), b + Vector2(0, -9), Color("9d7447"), 10.0)
