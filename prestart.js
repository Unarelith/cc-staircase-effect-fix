ig.module('cc-staircase-effect-fix')
	.requires(
		'impact.feature.camera.camera',
		'impact.base.timer',
		'impact.base.system'
	)
	.defines(() => {
		ig.Camera.inject(
		{
			_cameraSmoothingFactor: 0.15,

			_getNewPos: function(a, b, c)
			{
				let olda = Vec2.create();
				Vec2.assign(olda, a);

				var d = false;
				if (this.targets.length > 0) {
					d = this.targets[this.targets.length - 1];

					d.target.getPos(a);

					if (c) {
						c.x = a.x + Math.round(d._currentZoomOffset.x);
						c.y = a.y + Math.round(d._currentZoomOffset.y)
					}

					a.x = a.x + Math.round(d._currentOffset.x);
					a.y = a.y + Math.round(d._currentOffset.y);

					d = d.keepZoomFocusAligned || false
				}
				if (b) {
					b.x = a.x;
					b.y = a.y
				}
				if (this._cameraInBounds) {
					b = d ? 1 : ig.system.zoom;
					a.x = a.x.limit(ig.system.width / 2 / b, ig.game.size.x - ig.system.width / 2 / b);
					a.y = a.y.limit(ig.system.height / 2 / b, ig.game.size.y - ig.system.height / 2 / b)
				}
				!d && c && Vec2.assign(c, a);

				// Smooth camera position
				var dx = a.x - olda.x;
				var dy = a.y - olda.y;

				let smoothingFactor = this._cameraSmoothingFactor;

				if (Math.sqrt(dx * dx + dy * dy) > 50)
					smoothingFactor = 1.0;

				a.x = olda.x + dx * smoothingFactor;
				a.y = olda.y + dy * smoothingFactor;

				return a
			}
		});

		ig.Camera.EntityTarget.inject(
		{
			_lastEntityPos: Vec2.create(),
			_cameraSmoothingFactor: 0.15,

			init(a, b)
			{
				this.parent(a, b);

				Vec2.assign(this._lastEntityPos, this.entity.coll.pos);
			},

			getPos(a)
			{
				let olda = Vec2.create();
				Vec2.assign(olda, a);
				this.parent(a)
				Vec2.assign(a, olda);
	
				var d = Vec2.create();
				Vec2.assign(d, this.entity.coll.pos);
				var ex = d.x - this._lastEntityPos.x;
				var ey = d.y - this._lastEntityPos.y;
				var x = d.x;
				var y = d.y;

				// Round entity position properly for diagonal movement
				if (ex != 0 && Math.abs(ex) > Math.abs(ey)) {
					x = Math.round(d.x);
					y = Math.round(d.y + (x - d.x) * ey / ex);
				}
				else if (ey != 0 && Math.abs(ey) >= Math.abs(ex)) {
					y = Math.round(d.y);
					x = Math.round(d.x + (y - d.y) * ex / ey);
				}

				y -= this._currentZ;

				this._lastEntityPos.x = x;
				this._lastEntityPos.y = y;

				a.x = x + this.entity.coll.size.x / 2;
				a.y = y + this.entity.coll.size.y / 2 - Constants.BALL_HEIGHT;
			}
		});

		var cc_t = 0;

		ig.Timer.step = function()
		{
			var a = cc_t ? cc_t : (window.performance.now ? window.performance.now() : Date.now());
			ig.Timer.time = ig.Timer.time + Math.min((a - ig.Timer._last) / 1E3, ig.Timer.maxStep) * ig.Timer.timeScale;
			ig.Timer._last = a;
		};

		ig.System.inject({
			run(t)
			{
				cc_t = t;
				this.parent();
			}
		});
	});
