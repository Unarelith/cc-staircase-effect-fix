ig.module('cc-staircase-effect-fix')
	.requires(
		'impact.feature.camera.camera'
	)
	.defines(() => {
		ig.Camera.EntityTarget.inject(
		{
			_lastEntityPos: Vec2.create(),
			_offset: Vec2.create(),

			init(a, b)
			{
				this.parent(a, b);

				Vec2.assign(this._lastEntityPos, this.entity.coll.pos);
				this._offset.x = 0;
				this._offset.y = 0;
			},

			getPos(a)
			{
				this.parent(a)
	
				var d = Vec2.create();
				Vec2.assign(d, this.entity.coll.pos);
				d.x = d.x - this._offset.x;
				d.y = d.y - this._offset.y;
				var ex = d.x - this._lastEntityPos.x;
				var ey = d.y - this._lastEntityPos.y;
				var x = d.x;
				var y = d.y;

				if (ex != 0 && Math.abs(ex) > Math.abs(ey)) {
					x = Math.round(d.x);
					y = Math.round(d.y + (x - d.x) * ey / ex);
				}
				else if (ey != 0 && Math.abs(ey) >= Math.abs(ex)) {
					y = Math.round(d.y);
					x = Math.round(d.x + (y - d.y) * ex / ey);
				}

				this._lastEntityPos.x = x;
				this._lastEntityPos.y = y;

				this._offset.x += d.x - x;
				this._offset.y += d.y - y; 

				a.x = x + this.entity.coll.size.x / 2;
				a.y = y + this.entity.coll.size.y / 2 - Constants.BALL_HEIGHT
			}
		});
	});
