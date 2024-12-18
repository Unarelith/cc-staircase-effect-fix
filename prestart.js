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
						name: 'This mod adds camera smoothing and other tweaks to fix diagonal movement stutter.',
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
						init: true,
						name: 'Better timer precision',
						description: "Improve frame timer precision (can prevent stutter).",
					},
				},
				'Deprecated': {
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
		//----------------------------------------------------------------------
		// Camera smoothing
		//----------------------------------------------------------------------
		ig.Camera.inject(
		{
			_getNewPos: function(a, b, c)
			{
				let isTargettingPlayer = (this.targets.length > 0 && this.targets[this.targets.length - 1].target.entity === ig.game.playerEntity);

				if (!Opts.useCameraSmoothing || (Opts.onlySmoothPlayerCamera && !isTargettingPlayer))
					return this.parent(a, b, c);

				let olda = Vec2.create();
				Vec2.assign(olda, a);

				a = this.parent(a, b, c);

				// Smooth camera position
				let dx = a.x - olda.x;
				let dy = a.y - olda.y;

				let smoothingFactor = Opts.cameraSmoothingFactor;

				if (Math.sqrt(dx * dx + dy * dy) > Opts.cameraSmoothingThreshold)
					smoothingFactor = 1.0;

				a.x = olda.x + dx * smoothingFactor;
				a.y = olda.y + dy * smoothingFactor;

				return a
			}
		});

		//----------------------------------------------------------------------
		// Timer precision improvement
		//----------------------------------------------------------------------
		var cc_t = 0;
		var cc_o = 0;

		ig.Timer.oldstep = ig.Timer.step;

		ig.Timer.step = function()
		{
			if (!Opts.useBetterTimerPrecision)
			{
				cc_o = -1;
				return ig.Timer.oldstep();
			}

			var a = cc_t ? cc_t : (window.performance.now ? window.performance.now() : Date.now());

			if (cc_o < 0)
				cc_o = ig.Timer._last - a + 1;

			a += cc_o;

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

		//----------------------------------------------------------------------
		// Physics rounding (deprecated)
		//----------------------------------------------------------------------
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
