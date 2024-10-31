const Opts = modmanager.registerAndGetModOptions(
	{
		modId: 'cc-staircase-effect-fix',
		title: 'Staircase Effect Fix',
	},
	{
		general: {
			settings: {
				title: 'General',
				tabIcon: 'general',
			},
			headers: {
				'Basic options': {
					myInfo: {
						type: 'INFO',
						name: 'This mod adds camera smoothing and other tweaks to attempt to fix the stutter when moving diagonally.',
					},
					myInfo2: {
						type: 'INFO',
						name: 'IMPORTANT: Please use the biggest Pixel Size in Video settings for the best effect.',
					},
					useCameraSmoothing: {
						type: 'CHECKBOX',
						init: true,
						name: 'Camera smoothing',
						description: "Enables camera smoothing (recommended).",
					},
					cameraSmoothingFactor: {
						type: 'OBJECT_SLIDER',
						init: 0.30,
						min: 0.15,
						max: 0.90,
						step: 0.15,
						fill: true,
						showPercentage: false,
						name: 'Camera smoothing factor',
						description: "Defines how much the camera is smoothed (lower = more smoothing).",
						customNumberDisplay(index)
						{
							const num = this.min + this.step * index;
							return num;
						},
					},
				},
				'Advanced options': {
					cameraSmoothingThreshold: {
						type: 'OBJECT_SLIDER',
						init: 50,
						min: 0,
						max: 100,
						step: 1,
						fill: true,
						showPercentage: false,
						name: 'Camera smoothing threshold',
						description: "Defines the max movement length where smoothing can still be applied.",
						customNumberDisplay(index)
						{
							const num = this.min + this.step * index;
							return num;
						},
					},
					onlySmoothPlayerCamera: {
						type: 'CHECKBOX',
						init: true,
						name: 'Smooth player camera only',
						description: "Apply the smoothing to all cameras or only to player camera.",
					},
					useBetterTimerPrecision: {
						type: 'CHECKBOX',
						init: false,
						name: 'Better timer precision',
						description: "Might prevent stutter on some devices.",
					},
				},
				'Deprecated': {
					useCameraRoundingFix: {
						type: 'CHECKBOX',
						init: false,
						name: 'Camera rounding /!\\',
						description: "Might be better in some cases, might cause issues in others.",
					},
					useRoundedPhysics: {
						type: 'CHECKBOX',
						init: false,
						name: 'Use rounded physics /!\\',
						description: "This WILL break a lot of stuff and decrease overall movement speed.",
					},
				},
			},
		},
	}
)

ig.module('cc-staircase-effect-fix')
	.requires(
		'impact.feature.camera.camera',
		'impact.base.timer',
		'impact.base.system'
	)
	.defines(() => {
		ig.Camera.inject(
		{
			_getNewPos: function(a, b, c)
			{
				if (!Opts.useCameraSmoothing)
					return this.parent(a, b, c);

				if (Opts.onlySmoothPlayerCamera && !(this.targets.length > 0 && this.targets[this.targets.length - 1].target.entity === ig.game.playerEntity))
					return this.parent(a, b, c);

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

				let smoothingFactor = Opts.cameraSmoothingFactor;

				if (Math.sqrt(dx * dx + dy * dy) > Opts.cameraSmoothingThreshold)
					smoothingFactor = 1.0;

				a.x = olda.x + dx * smoothingFactor;
				a.y = olda.y + dy * smoothingFactor;

				return a
			}
		});

		ig.Camera.EntityTarget.inject(
		{
			_lastEntityPos: Vec2.create(),

			init(a, b)
			{
				this.parent(a, b);

				Vec2.assign(this._lastEntityPos, this.entity.coll.pos);
			},

			getPos(a)
			{
				if (!Opts.useCameraRoundingFix)
					return this.parent(a)

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

		ig.Timer.oldstep = ig.Timer.step;

		ig.Timer.step = function()
		{
			if (!Opts.useBetterTimerPrecision)
				return ig.Timer.oldstep();

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

		ig.Physics.inject({
			moveEntityXY(a, c, e, f, g)
			{
				if (!Opts.useRoundedPhysics)
					return this.parent(a, c, e, f, g);

				var originalX = c.pos.x;
				var originalY = c.pos.y;
				var originalRound = Math.round;
				Math.round = x => x;
				var ret = this.parent(a, c, e, f, g);
				Math.round = originalRound;

				if ((e.x != 0 || e.y != 0) && c === ig.game.playerEntity.coll)
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
	});
