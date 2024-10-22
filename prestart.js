ig.module('cc-staircase-effect-fix')
	.requires(
		'impact.base.physics'
	)
	.defines(() => {
		ig.Physics.inject({
			moveEntityXY(a, c, e, f, g)
			{
				var originalX = c.pos.x;
				var originalY = c.pos.y;
				var originalRound = Math.round;
				Math.round = x => x;
				var ret = this.parent(a, c, e, f, g);
				Math.round = originalRound;

				if (e.x != 0 || e.y != 0)
				{
					var x = c.pos.x;
					var y = c.pos.y;

					if (e.x != 0 && Math.abs(e.x) > Math.abs(e.y)) {
						x = Math.round(c.pos.x);
						y = Math.round(c.pos.y + (x - c.pos.x) * e.y / e.x);
					}
					else if (e.y != 0 && Math.abs(e.y) >= Math.abs(e.x)) {
						y = Math.round(c.pos.y);
						x = Math.round(c.pos.x + (y - c.pos.y) * e.x / e.y);
					}
					x = Math.round(x * 100) / 100;
					y = Math.round(y * 100) / 100;
					if (!g) {
						c._collData.frameVel.x = x - originalX;
						c._collData.frameVel.y = y - originalY;
					}

					c.pos.x = x;
					c.pos.y = y;
				}

				return ret;
			}
		});
	})
