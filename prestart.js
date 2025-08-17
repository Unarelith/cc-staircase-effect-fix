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
						init: false,
						name: 'Smooth player camera only',
						description: "Apply the smoothing to all cameras or only to player camera.",
					},
					useBetterTimerPrecision: {
						type: 'CHECKBOX',
						init: false,
						name: 'Better timer precision',
						description: "Improve frame timer precision (can prevent stutter).",
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
		// Tree shadow sync fix
		//----------------------------------------------------------------------
		ig.Light.inject(
		{
			init: function()
			{
				this.parent();

				const c = ig.system.contextScale;
				this.lightCanvas.width = ig.system.contextWidth * c + 2;
				this.lightCanvas.height = ig.system.contextHeight * c + 2;

				this.lightContext = this.lightCanvas.getContext('2d');
				this.lightContext.imageSmoothingEnabled = false;

				this.lightContext.setTransform(c, 0, 0, c, 0, 0);
			},

			onMidDraw: function()
			{
				if (ig.perf.lighting && sc.options.get("lighting")) {
					ig.system.context.globalCompositeOperation = "lighter";
					ig.system.context.globalAlpha = 1;
					for (var a = 0; a < this.shadowProviders.length; ++a) {
						var b = this.shadowProviders[a];
						b.drawGlow && b.drawGlow()
					}
					for (a = this.condLightList.length; a--;) this.condLightList[a].drawGlow();
					if (this.hasShadow) {
						ig.system.context.globalCompositeOperation = "source-over";
						ig.system.context.globalAlpha = 1;

						ig.system.context.drawImage(
							this.lightCanvas,
							0, 0, this.lightCanvas.width, this.lightCanvas.height,
							0, 0, ig.system.contextWidth, ig.system.contextHeight
						);

						ig.system.context.globalCompositeOperation = "lighter";
					}
					if (this.lightHandles.length > 0)
						for (a = this.lightHandles.length; a--;) this.lightHandles[a].glow && this.lightHandles[a].draw(0.2, 1);
					if (this.screenFlashHandles.length > 0)
						for (a = this.screenFlashHandles.length; a--;) this.screenFlashHandles[a].draw();
					ig.system.context.globalCompositeOperation = "source-over";
					ig.system.context.globalAlpha = 1
				}
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
	});
