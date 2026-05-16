<script lang="ts">
	import { onMount } from "svelte";
	import { game } from "$lib/state/game.svelte";

	let canvas: HTMLCanvasElement;
	let api: { splatForColor: (color: "white" | "black") => void } | null = null;

	onMount(() => {
		const fluid = startFluid(canvas);
		api = { splatForColor: fluid.splatForColor };
		return fluid.cleanup;
	});

	$effect(() => {
		const count = game.moveCount;
		const color = game.lastMoveColor;
		if (count > 0 && color && api) api.splatForColor(color);
	});

	function startFluid(canvasEl: HTMLCanvasElement): {
		cleanup: () => void;
		splatForColor: (color: "white" | "black") => void;
	} {
		const canvas = canvasEl;
		canvas.width = canvas.clientWidth;
		canvas.height = canvas.clientHeight;

		const config = {
			SIM_RESOLUTION: 256,
			DYE_RESOLUTION: 1024,
			DENSITY_DISSIPATION: 0.97,
			VELOCITY_DISSIPATION: 0.98,
			PRESSURE_DISSIPATION: 0.8,
			PRESSURE_ITERATIONS: 20,
			CURL: 30,
			SPLAT_RADIUS: 0.3,
			SHADING: true,
			COLORFUL: false,
			PAUSED: false,
			BACK_COLOR: { r: 0, g: 0, b: 0 },
			TRANSPARENT: true,
			BLOOM: true,
			BLOOM_ITERATIONS: 8,
			BLOOM_RESOLUTION: 256,
			BLOOM_INTENSITY: 0.8,
			BLOOM_THRESHOLD: 0.6,
			BLOOM_SOFT_KNEE: 0.7,
			POINTER_COLOR: [
				{ r: 0, g: 0.15, b: 0.15 }, // cyan
				{ r: 0.15, g: 0, b: 0.15 }, // magenta
			],
			IDLE_SPLATS: false,
			RANDOM_AMOUNT: 4,
			RANDOM_INTERVAL: 2,
			MOVE_SPLAT_AMOUNT: 5,
			FRAME_INTERVAL_MS: 1000 / 60,
			STEP_SIZE_S: 0.016,
		};

		type RGB = { r: number; g: number; b: number };
		const pickRandom = <T,>(arr: T[]): T =>
			arr[Math.floor(Math.random() * arr.length)];

		class Pointer {
			id = -1;
			x = 0;
			y = 0;
			dx = 0;
			dy = 0;
			down = false;
			moved = false;
			color: RGB = config.COLORFUL
				? generateColor()
				: pickRandom(config.POINTER_COLOR);
		}

		const pointers: Pointer[] = [new Pointer()];
		const splatStack: number[] = [];
		const bloomFramebuffers: FBO[] = [];

		// ---- WebGL context ---------------------------------------------------
		const params: WebGLContextAttributes = {
			alpha: true,
			depth: false,
			stencil: false,
			antialias: false,
			preserveDrawingBuffer: false,
		};
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let gl: any = canvas.getContext("webgl2", params);
		const isWebGL2 = !!gl;
		if (!isWebGL2)
			gl =
				canvas.getContext("webgl", params) ??
				canvas.getContext("experimental-webgl", params);
		if (!gl) {
			console.warn("FluidBackground: WebGL unavailable");
			return { cleanup: () => {}, splatForColor: () => {} };
		}

		let halfFloat: { HALF_FLOAT_OES: number } | null = null;
		let supportLinearFiltering: unknown;
		if (isWebGL2) {
			gl.getExtension("EXT_color_buffer_float");
			supportLinearFiltering = gl.getExtension("OES_texture_float_linear");
		} else {
			halfFloat = gl.getExtension("OES_texture_half_float");
			supportLinearFiltering = gl.getExtension("OES_texture_half_float_linear");
		}
		gl.clearColor(0, 0, 0, 1);
		const halfFloatTexType = isWebGL2
			? gl.HALF_FLOAT
			: (halfFloat as { HALF_FLOAT_OES: number }).HALF_FLOAT_OES;

		type Format = { internalFormat: number; format: number } | null;
		function supportRenderTextureFormat(
			internalFormat: number,
			format: number,
			type: number,
		): boolean {
			const tex = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, tex);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texImage2D(
				gl.TEXTURE_2D,
				0,
				internalFormat,
				4,
				4,
				0,
				format,
				type,
				null,
			);
			const fb = gl.createFramebuffer();
			gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
			gl.framebufferTexture2D(
				gl.FRAMEBUFFER,
				gl.COLOR_ATTACHMENT0,
				gl.TEXTURE_2D,
				tex,
				0,
			);
			return (
				gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE
			);
		}

		function getSupportedFormat(
			internalFormat: number,
			format: number,
			type: number,
		): Format {
			if (!supportRenderTextureFormat(internalFormat, format, type)) {
				switch (internalFormat) {
					case gl.R16F:
						return getSupportedFormat(gl.RG16F, gl.RG, type);
					case gl.RG16F:
						return getSupportedFormat(gl.RGBA16F, gl.RGBA, type);
					default:
						return null;
				}
			}
			return { internalFormat, format };
		}

		let formatRGBA: Format;
		let formatRG: Format;
		let formatR: Format;
		if (isWebGL2) {
			formatRGBA = getSupportedFormat(gl.RGBA16F, gl.RGBA, halfFloatTexType);
			formatRG = getSupportedFormat(gl.RG16F, gl.RG, halfFloatTexType);
			formatR = getSupportedFormat(gl.R16F, gl.RED, halfFloatTexType);
		} else {
			formatRGBA = getSupportedFormat(gl.RGBA, gl.RGBA, halfFloatTexType);
			formatRG = getSupportedFormat(gl.RGBA, gl.RGBA, halfFloatTexType);
			formatR = getSupportedFormat(gl.RGBA, gl.RGBA, halfFloatTexType);
		}
		if (!formatRGBA || !formatRG || !formatR) {
			console.warn("FluidBackground: required texture formats unavailable");
			return { cleanup: () => {}, splatForColor: () => {} };
		}

		if (!supportLinearFiltering) {
			config.SHADING = false;
			config.BLOOM = false;
		}

		// ---- Shader plumbing -------------------------------------------------
		function compileShader(type: number, source: string): WebGLShader {
			const shader = gl.createShader(type)!;
			gl.shaderSource(shader, source);
			gl.compileShader(shader);
			if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
				throw new Error(gl.getShaderInfoLog(shader) ?? "shader compile error");
			return shader;
		}

		class GLProgram {
			uniforms: Record<string, WebGLUniformLocation> = {};
			program: WebGLProgram;
			constructor(vs: WebGLShader, fs: WebGLShader) {
				this.program = gl.createProgram()!;
				gl.attachShader(this.program, vs);
				gl.attachShader(this.program, fs);
				gl.linkProgram(this.program);
				if (!gl.getProgramParameter(this.program, gl.LINK_STATUS))
					throw new Error(
						gl.getProgramInfoLog(this.program) ?? "program link error",
					);
				const count = gl.getProgramParameter(
					this.program,
					gl.ACTIVE_UNIFORMS,
				) as number;
				for (let i = 0; i < count; i++) {
					const info = gl.getActiveUniform(this.program, i)!;
					this.uniforms[info.name] = gl.getUniformLocation(
						this.program,
						info.name,
					)!;
				}
			}
			bind() {
				gl.useProgram(this.program);
			}
		}

		const baseVertexShader = compileShader(
			gl.VERTEX_SHADER,
			`
				precision highp float;
				attribute vec2 aPosition;
				varying vec2 vUv;
				varying vec2 vL;
				varying vec2 vR;
				varying vec2 vT;
				varying vec2 vB;
				uniform vec2 texelSize;
				void main () {
					vUv = aPosition * 0.5 + 0.5;
					vL = vUv - vec2(texelSize.x, 0.0);
					vR = vUv + vec2(texelSize.x, 0.0);
					vT = vUv + vec2(0.0, texelSize.y);
					vB = vUv - vec2(0.0, texelSize.y);
					gl_Position = vec4(aPosition, 0.0, 1.0);
				}
			`,
		);

		const clearShader = compileShader(
			gl.FRAGMENT_SHADER,
			`
				precision mediump float;
				precision mediump sampler2D;
				varying highp vec2 vUv;
				uniform sampler2D uTexture;
				uniform float value;
				void main () { gl_FragColor = value * texture2D(uTexture, vUv); }
			`,
		);

		const colorShader = compileShader(
			gl.FRAGMENT_SHADER,
			`
				precision mediump float;
				uniform vec4 color;
				void main () { gl_FragColor = color; }
			`,
		);

		const backgroundShader = compileShader(
			gl.FRAGMENT_SHADER,
			`void main () { gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0); }`,
		);

		const displayShader = compileShader(
			gl.FRAGMENT_SHADER,
			`
				precision highp float;
				precision highp sampler2D;
				varying vec2 vUv;
				uniform sampler2D uTexture;
				void main () {
					vec3 C = texture2D(uTexture, vUv).rgb;
					float a = max(C.r, max(C.g, C.b));
					gl_FragColor = vec4(C, a);
				}
			`,
		);

		const displayBloomShader = compileShader(
			gl.FRAGMENT_SHADER,
			`
				precision highp float;
				precision highp sampler2D;
				varying vec2 vUv;
				uniform sampler2D uTexture;
				uniform sampler2D uBloom;
				void main () {
					vec3 C = texture2D(uTexture, vUv).rgb;
					vec3 bloom = texture2D(uBloom, vUv).rgb;
					bloom = pow(bloom.rgb, vec3(1.0 / 2.2));
					C += bloom;
					float a = max(C.r, max(C.g, C.b));
					gl_FragColor = vec4(C, a);
				}
			`,
		);

		const displayShadingShader = compileShader(
			gl.FRAGMENT_SHADER,
			`
				precision highp float;
				precision highp sampler2D;
				varying vec2 vUv;
				varying vec2 vL;
				varying vec2 vR;
				varying vec2 vT;
				varying vec2 vB;
				uniform sampler2D uTexture;
				uniform vec2 texelSize;
				void main () {
					vec3 L = texture2D(uTexture, vL).rgb;
					vec3 R = texture2D(uTexture, vR).rgb;
					vec3 T = texture2D(uTexture, vT).rgb;
					vec3 B = texture2D(uTexture, vB).rgb;
					vec3 C = texture2D(uTexture, vUv).rgb;
					float dx = length(R) - length(L);
					float dy = length(T) - length(B);
					vec3 n = normalize(vec3(dx, dy, length(texelSize)));
					vec3 l = vec3(0.0, 0.0, 1.0);
					float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
					C.rgb *= diffuse;
					float a = max(C.r, max(C.g, C.b));
					gl_FragColor = vec4(C, a);
				}
			`,
		);

		const displayBloomShadingShader = compileShader(
			gl.FRAGMENT_SHADER,
			`
				precision highp float;
				precision highp sampler2D;
				varying vec2 vUv;
				varying vec2 vL;
				varying vec2 vR;
				varying vec2 vT;
				varying vec2 vB;
				uniform sampler2D uTexture;
				uniform sampler2D uBloom;
				uniform vec2 texelSize;
				void main () {
					vec3 L = texture2D(uTexture, vL).rgb;
					vec3 R = texture2D(uTexture, vR).rgb;
					vec3 T = texture2D(uTexture, vT).rgb;
					vec3 B = texture2D(uTexture, vB).rgb;
					vec3 C = texture2D(uTexture, vUv).rgb;
					float dx = length(R) - length(L);
					float dy = length(T) - length(B);
					vec3 n = normalize(vec3(dx, dy, length(texelSize)));
					vec3 l = vec3(0.0, 0.0, 1.0);
					float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
					C *= diffuse;
					vec3 bloom = texture2D(uBloom, vUv).rgb;
					bloom = pow(bloom.rgb, vec3(1.0 / 2.2));
					C += bloom;
					float a = max(C.r, max(C.g, C.b));
					gl_FragColor = vec4(C, a);
				}
			`,
		);

		const bloomPrefilterShader = compileShader(
			gl.FRAGMENT_SHADER,
			`
				precision mediump float;
				precision mediump sampler2D;
				varying vec2 vUv;
				uniform sampler2D uTexture;
				uniform vec3 curve;
				uniform float threshold;
				void main () {
					vec3 c = texture2D(uTexture, vUv).rgb;
					float br = max(c.r, max(c.g, c.b));
					float rq = clamp(br - curve.x, 0.0, curve.y);
					rq = curve.z * rq * rq;
					c *= max(rq, br - threshold) / max(br, 0.0001);
					gl_FragColor = vec4(c, 0.0);
				}
			`,
		);

		const bloomBlurShader = compileShader(
			gl.FRAGMENT_SHADER,
			`
				precision mediump float;
				precision mediump sampler2D;
				varying vec2 vL;
				varying vec2 vR;
				varying vec2 vT;
				varying vec2 vB;
				uniform sampler2D uTexture;
				void main () {
					vec4 sum = vec4(0.0);
					sum += texture2D(uTexture, vL);
					sum += texture2D(uTexture, vR);
					sum += texture2D(uTexture, vT);
					sum += texture2D(uTexture, vB);
					sum *= 0.25;
					gl_FragColor = sum;
				}
			`,
		);

		const bloomFinalShader = compileShader(
			gl.FRAGMENT_SHADER,
			`
				precision mediump float;
				precision mediump sampler2D;
				varying vec2 vL;
				varying vec2 vR;
				varying vec2 vT;
				varying vec2 vB;
				uniform sampler2D uTexture;
				uniform float intensity;
				void main () {
					vec4 sum = vec4(0.0);
					sum += texture2D(uTexture, vL);
					sum += texture2D(uTexture, vR);
					sum += texture2D(uTexture, vT);
					sum += texture2D(uTexture, vB);
					sum *= 0.25;
					gl_FragColor = sum * intensity;
				}
			`,
		);

		const splatShader = compileShader(
			gl.FRAGMENT_SHADER,
			`
				precision highp float;
				precision highp sampler2D;
				varying vec2 vUv;
				uniform sampler2D uTarget;
				uniform float aspectRatio;
				uniform vec3 color;
				uniform vec2 point;
				uniform float radius;
				void main () {
					vec2 p = vUv - point.xy;
					p.x *= aspectRatio;
					vec3 splat = exp(-dot(p, p) / radius) * color;
					vec3 base = texture2D(uTarget, vUv).xyz;
					gl_FragColor = vec4(base + splat, 1.0);
				}
			`,
		);

		const advectionManualFilteringShader = compileShader(
			gl.FRAGMENT_SHADER,
			`
				precision highp float;
				precision highp sampler2D;
				varying vec2 vUv;
				uniform sampler2D uVelocity;
				uniform sampler2D uSource;
				uniform vec2 texelSize;
				uniform vec2 dyeTexelSize;
				uniform float dt;
				uniform float dissipation;
				vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
					vec2 st = uv / tsize - 0.5;
					vec2 iuv = floor(st);
					vec2 fuv = fract(st);
					vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
					vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
					vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
					vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
					return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
				}
				void main () {
					vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
					gl_FragColor = dissipation * bilerp(uSource, coord, dyeTexelSize);
					gl_FragColor.a = 1.0;
				}
			`,
		);

		const advectionShader = compileShader(
			gl.FRAGMENT_SHADER,
			`
				precision highp float;
				precision highp sampler2D;
				varying vec2 vUv;
				uniform sampler2D uVelocity;
				uniform sampler2D uSource;
				uniform vec2 texelSize;
				uniform float dt;
				uniform float dissipation;
				void main () {
					vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
					gl_FragColor = dissipation * texture2D(uSource, coord);
					gl_FragColor.a = 1.0;
				}
			`,
		);

		const divergenceShader = compileShader(
			gl.FRAGMENT_SHADER,
			`
				precision mediump float;
				precision mediump sampler2D;
				varying highp vec2 vUv;
				varying highp vec2 vL;
				varying highp vec2 vR;
				varying highp vec2 vT;
				varying highp vec2 vB;
				uniform sampler2D uVelocity;
				void main () {
					float L = texture2D(uVelocity, vL).x;
					float R = texture2D(uVelocity, vR).x;
					float T = texture2D(uVelocity, vT).y;
					float B = texture2D(uVelocity, vB).y;
					vec2 C = texture2D(uVelocity, vUv).xy;
					if (vL.x < 0.0) { L = -C.x; }
					if (vR.x > 1.0) { R = -C.x; }
					if (vT.y > 1.0) { T = -C.y; }
					if (vB.y < 0.0) { B = -C.y; }
					float div = 0.5 * (R - L + T - B);
					gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
				}
			`,
		);

		const curlShader = compileShader(
			gl.FRAGMENT_SHADER,
			`
				precision mediump float;
				precision mediump sampler2D;
				varying highp vec2 vUv;
				varying highp vec2 vL;
				varying highp vec2 vR;
				varying highp vec2 vT;
				varying highp vec2 vB;
				uniform sampler2D uVelocity;
				void main () {
					float L = texture2D(uVelocity, vL).y;
					float R = texture2D(uVelocity, vR).y;
					float T = texture2D(uVelocity, vT).x;
					float B = texture2D(uVelocity, vB).x;
					float vorticity = R - L - T + B;
					gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
				}
			`,
		);

		const vorticityShader = compileShader(
			gl.FRAGMENT_SHADER,
			`
				precision highp float;
				precision highp sampler2D;
				varying vec2 vUv;
				varying vec2 vL;
				varying vec2 vR;
				varying vec2 vT;
				varying vec2 vB;
				uniform sampler2D uVelocity;
				uniform sampler2D uCurl;
				uniform float curl;
				uniform float dt;
				void main () {
					float L = texture2D(uCurl, vL).x;
					float R = texture2D(uCurl, vR).x;
					float T = texture2D(uCurl, vT).x;
					float B = texture2D(uCurl, vB).x;
					float C = texture2D(uCurl, vUv).x;
					vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
					force /= length(force) + 0.0001;
					force *= curl * C;
					force.y *= -1.0;
					vec2 vel = texture2D(uVelocity, vUv).xy;
					gl_FragColor = vec4(vel + force * dt, 0.0, 1.0);
				}
			`,
		);

		const pressureShader = compileShader(
			gl.FRAGMENT_SHADER,
			`
				precision mediump float;
				precision mediump sampler2D;
				varying highp vec2 vUv;
				varying highp vec2 vL;
				varying highp vec2 vR;
				varying highp vec2 vT;
				varying highp vec2 vB;
				uniform sampler2D uPressure;
				uniform sampler2D uDivergence;
				vec2 boundary (vec2 uv) { return uv; }
				void main () {
					float L = texture2D(uPressure, boundary(vL)).x;
					float R = texture2D(uPressure, boundary(vR)).x;
					float T = texture2D(uPressure, boundary(vT)).x;
					float B = texture2D(uPressure, boundary(vB)).x;
					float divergence = texture2D(uDivergence, vUv).x;
					float pressure = (L + R + B + T - divergence) * 0.25;
					gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
				}
			`,
		);

		const gradientSubtractShader = compileShader(
			gl.FRAGMENT_SHADER,
			`
				precision mediump float;
				precision mediump sampler2D;
				varying highp vec2 vUv;
				varying highp vec2 vL;
				varying highp vec2 vR;
				varying highp vec2 vT;
				varying highp vec2 vB;
				uniform sampler2D uPressure;
				uniform sampler2D uVelocity;
				vec2 boundary (vec2 uv) { return uv; }
				void main () {
					float L = texture2D(uPressure, boundary(vL)).x;
					float R = texture2D(uPressure, boundary(vR)).x;
					float T = texture2D(uPressure, boundary(vT)).x;
					float B = texture2D(uPressure, boundary(vB)).x;
					vec2 velocity = texture2D(uVelocity, vUv).xy;
					velocity.xy -= vec2(R - L, T - B);
					gl_FragColor = vec4(velocity, 0.0, 1.0);
				}
			`,
		);

		// ---- Geometry --------------------------------------------------------
		const vertexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]),
			gl.STATIC_DRAW,
		);
		const elementBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer);
		gl.bufferData(
			gl.ELEMENT_ARRAY_BUFFER,
			new Uint16Array([0, 1, 2, 0, 2, 3]),
			gl.STATIC_DRAW,
		);
		gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(0);

		function blit(destination: WebGLFramebuffer | null) {
			gl.bindFramebuffer(gl.FRAMEBUFFER, destination);
			gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
		}

		// ---- FBOs ------------------------------------------------------------
		type FBO = {
			texture: WebGLTexture;
			fbo: WebGLFramebuffer;
			width: number;
			height: number;
			attach(id: number): number;
		};
		type DoubleFBO = {
			read: FBO;
			write: FBO;
			swap(): void;
		};

		function createFBO(
			w: number,
			h: number,
			internalFormat: number,
			format: number,
			type: number,
			param: number,
		): FBO {
			gl.activeTexture(gl.TEXTURE0);
			const texture = gl.createTexture()!;
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texImage2D(
				gl.TEXTURE_2D,
				0,
				internalFormat,
				w,
				h,
				0,
				format,
				type,
				null,
			);
			const fbo = gl.createFramebuffer()!;
			gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
			gl.framebufferTexture2D(
				gl.FRAMEBUFFER,
				gl.COLOR_ATTACHMENT0,
				gl.TEXTURE_2D,
				texture,
				0,
			);
			gl.viewport(0, 0, w, h);
			gl.clear(gl.COLOR_BUFFER_BIT);
			return {
				texture,
				fbo,
				width: w,
				height: h,
				attach(id: number) {
					gl.activeTexture(gl.TEXTURE0 + id);
					gl.bindTexture(gl.TEXTURE_2D, texture);
					return id;
				},
			};
		}

		function createDoubleFBO(
			w: number,
			h: number,
			internalFormat: number,
			format: number,
			type: number,
			param: number,
		): DoubleFBO {
			let fbo1 = createFBO(w, h, internalFormat, format, type, param);
			let fbo2 = createFBO(w, h, internalFormat, format, type, param);
			return {
				get read() {
					return fbo1;
				},
				set read(v: FBO) {
					fbo1 = v;
				},
				get write() {
					return fbo2;
				},
				set write(v: FBO) {
					fbo2 = v;
				},
				swap() {
					const t = fbo1;
					fbo1 = fbo2;
					fbo2 = t;
				},
			};
		}

		function resizeFBO(
			target: FBO,
			w: number,
			h: number,
			internalFormat: number,
			format: number,
			type: number,
			param: number,
		): FBO {
			const newFBO = createFBO(w, h, internalFormat, format, type, param);
			clearProgram.bind();
			gl.uniform1i(clearProgram.uniforms.uTexture, target.attach(0));
			gl.uniform1f(clearProgram.uniforms.value, 1);
			blit(newFBO.fbo);
			return newFBO;
		}

		function resizeDoubleFBO(
			target: DoubleFBO,
			w: number,
			h: number,
			internalFormat: number,
			format: number,
			type: number,
			param: number,
		): DoubleFBO {
			target.read = resizeFBO(
				target.read,
				w,
				h,
				internalFormat,
				format,
				type,
				param,
			);
			target.write = createFBO(w, h, internalFormat, format, type, param);
			return target;
		}

		// ---- Programs --------------------------------------------------------
		const clearProgram = new GLProgram(baseVertexShader, clearShader);
		const colorProgram = new GLProgram(baseVertexShader, colorShader);
		const backgroundProgram = new GLProgram(baseVertexShader, backgroundShader);
		const displayProgram = new GLProgram(baseVertexShader, displayShader);
		const displayBloomProgram = new GLProgram(
			baseVertexShader,
			displayBloomShader,
		);
		const displayShadingProgram = new GLProgram(
			baseVertexShader,
			displayShadingShader,
		);
		const displayBloomShadingProgram = new GLProgram(
			baseVertexShader,
			displayBloomShadingShader,
		);
		const bloomPrefilterProgram = new GLProgram(
			baseVertexShader,
			bloomPrefilterShader,
		);
		const bloomBlurProgram = new GLProgram(baseVertexShader, bloomBlurShader);
		const bloomFinalProgram = new GLProgram(baseVertexShader, bloomFinalShader);
		const splatProgram = new GLProgram(baseVertexShader, splatShader);
		const advectionProgram = new GLProgram(
			baseVertexShader,
			supportLinearFiltering ? advectionShader : advectionManualFilteringShader,
		);
		const divergenceProgram = new GLProgram(baseVertexShader, divergenceShader);
		const curlProgram = new GLProgram(baseVertexShader, curlShader);
		const vorticityProgram = new GLProgram(baseVertexShader, vorticityShader);
		const pressureProgram = new GLProgram(baseVertexShader, pressureShader);
		const gradientSubtractProgram = new GLProgram(
			baseVertexShader,
			gradientSubtractShader,
		);

		// ---- Sim state -------------------------------------------------------
		let simWidth = 0;
		let simHeight = 0;
		let dyeWidth = 0;
		let dyeHeight = 0;
		let density!: DoubleFBO;
		let velocity!: DoubleFBO;
		let divergence!: FBO;
		let curlFBO!: FBO;
		let pressure!: DoubleFBO;
		let bloom!: FBO;

		function getResolution(resolution: number) {
			let aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
			if (aspect < 1) aspect = 1 / aspect;
			const max = Math.round(resolution * aspect);
			const min = Math.round(resolution);
			return gl.drawingBufferWidth > gl.drawingBufferHeight
				? { width: max, height: min }
				: { width: min, height: max };
		}

		function initBloomFramebuffers() {
			const res = getResolution(config.BLOOM_RESOLUTION);
			const texType = halfFloatTexType;
			const rgba = formatRGBA!;
			const filtering = supportLinearFiltering ? gl.LINEAR : gl.NEAREST;
			bloom = createFBO(
				res.width,
				res.height,
				rgba.internalFormat,
				rgba.format,
				texType,
				filtering,
			);
			bloomFramebuffers.length = 0;
			for (let i = 0; i < config.BLOOM_ITERATIONS; i++) {
				const w = res.width >> (i + 1);
				const h = res.height >> (i + 1);
				if (w < 2 || h < 2) break;
				bloomFramebuffers.push(
					createFBO(
						w,
						h,
						rgba.internalFormat,
						rgba.format,
						texType,
						filtering,
					),
				);
			}
		}

		function initFramebuffers() {
			const simRes = getResolution(config.SIM_RESOLUTION);
			const dyeRes = getResolution(config.DYE_RESOLUTION);
			simWidth = simRes.width;
			simHeight = simRes.height;
			dyeWidth = dyeRes.width;
			dyeHeight = dyeRes.height;
			const texType = halfFloatTexType;
			const rgba = formatRGBA!;
			const rg = formatRG!;
			const r = formatR!;
			const filtering = supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

			density =
				density == null
					? createDoubleFBO(
							dyeWidth,
							dyeHeight,
							rgba.internalFormat,
							rgba.format,
							texType,
							filtering,
						)
					: resizeDoubleFBO(
							density,
							dyeWidth,
							dyeHeight,
							rgba.internalFormat,
							rgba.format,
							texType,
							filtering,
						);
			velocity =
				velocity == null
					? createDoubleFBO(
							simWidth,
							simHeight,
							rg.internalFormat,
							rg.format,
							texType,
							filtering,
						)
					: resizeDoubleFBO(
							velocity,
							simWidth,
							simHeight,
							rg.internalFormat,
							rg.format,
							texType,
							filtering,
						);
			divergence = createFBO(
				simWidth,
				simHeight,
				r.internalFormat,
				r.format,
				texType,
				gl.NEAREST,
			);
			curlFBO = createFBO(
				simWidth,
				simHeight,
				r.internalFormat,
				r.format,
				texType,
				gl.NEAREST,
			);
			pressure = createDoubleFBO(
				simWidth,
				simHeight,
				r.internalFormat,
				r.format,
				texType,
				gl.NEAREST,
			);
			initBloomFramebuffers();
		}

		// ---- Utility ---------------------------------------------------------
		function HSVtoRGB(h: number, s: number, v: number): RGB {
			let r = 0,
				g = 0,
				b = 0;
			const i = Math.floor(h * 6);
			const f = h * 6 - i;
			const p = v * (1 - s);
			const q = v * (1 - f * s);
			const t = v * (1 - (1 - f) * s);
			switch (i % 6) {
				case 0:
					r = v;
					g = t;
					b = p;
					break;
				case 1:
					r = q;
					g = v;
					b = p;
					break;
				case 2:
					r = p;
					g = v;
					b = t;
					break;
				case 3:
					r = p;
					g = q;
					b = v;
					break;
				case 4:
					r = t;
					g = p;
					b = v;
					break;
				case 5:
					r = v;
					g = p;
					b = q;
					break;
			}
			return { r, g, b };
		}

		function generateColor(): RGB {
			const c = HSVtoRGB(Math.random(), 1.0, 1.0);
			c.r *= 0.15;
			c.g *= 0.15;
			c.b *= 0.15;
			return c;
		}

		// ---- Sim steps -------------------------------------------------------
		function splat(
			x: number,
			y: number,
			dx: number,
			dy: number,
			color: RGB,
		) {
			gl.viewport(0, 0, simWidth, simHeight);
			splatProgram.bind();
			gl.uniform1i(splatProgram.uniforms.uTarget, velocity.read.attach(0));
			gl.uniform1f(
				splatProgram.uniforms.aspectRatio,
				canvas.width / canvas.height,
			);
			gl.uniform2f(
				splatProgram.uniforms.point,
				x / canvas.width,
				1 - y / canvas.height,
			);
			gl.uniform3f(splatProgram.uniforms.color, dx, -dy, 1);
			gl.uniform1f(splatProgram.uniforms.radius, config.SPLAT_RADIUS / 100);
			blit(velocity.write.fbo);
			velocity.swap();

			gl.viewport(0, 0, dyeWidth, dyeHeight);
			gl.uniform1i(splatProgram.uniforms.uTarget, density.read.attach(0));
			gl.uniform3f(splatProgram.uniforms.color, color.r, color.g, color.b);
			blit(density.write.fbo);
			density.swap();
		}

		function multipleSplats(amount: number) {
			for (let i = 0; i < amount; i++) {
				const base = config.COLORFUL
					? generateColor()
					: { ...pickRandom(config.POINTER_COLOR) };
				base.r *= 10;
				base.g *= 10;
				base.b *= 10;
				const x = canvas.width * Math.random();
				const y = canvas.height * Math.random();
				const dx = 1000 * (Math.random() - 0.5);
				const dy = 1000 * (Math.random() - 0.5);
				splat(x, y, dx, dy, base);
			}
		}

		function step(dt: number) {
			gl.disable(gl.BLEND);
			gl.viewport(0, 0, simWidth, simHeight);

			curlProgram.bind();
			gl.uniform2f(
				curlProgram.uniforms.texelSize,
				1 / simWidth,
				1 / simHeight,
			);
			gl.uniform1i(curlProgram.uniforms.uVelocity, velocity.read.attach(0));
			blit(curlFBO.fbo);

			vorticityProgram.bind();
			gl.uniform2f(
				vorticityProgram.uniforms.texelSize,
				1 / simWidth,
				1 / simHeight,
			);
			gl.uniform1i(
				vorticityProgram.uniforms.uVelocity,
				velocity.read.attach(0),
			);
			gl.uniform1i(vorticityProgram.uniforms.uCurl, curlFBO.attach(1));
			gl.uniform1f(vorticityProgram.uniforms.curl, config.CURL);
			gl.uniform1f(vorticityProgram.uniforms.dt, dt);
			blit(velocity.write.fbo);
			velocity.swap();

			divergenceProgram.bind();
			gl.uniform2f(
				divergenceProgram.uniforms.texelSize,
				1 / simWidth,
				1 / simHeight,
			);
			gl.uniform1i(
				divergenceProgram.uniforms.uVelocity,
				velocity.read.attach(0),
			);
			blit(divergence.fbo);

			clearProgram.bind();
			gl.uniform1i(clearProgram.uniforms.uTexture, pressure.read.attach(0));
			gl.uniform1f(clearProgram.uniforms.value, config.PRESSURE_DISSIPATION);
			blit(pressure.write.fbo);
			pressure.swap();

			pressureProgram.bind();
			gl.uniform2f(
				pressureProgram.uniforms.texelSize,
				1 / simWidth,
				1 / simHeight,
			);
			gl.uniform1i(pressureProgram.uniforms.uDivergence, divergence.attach(0));
			for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
				gl.uniform1i(
					pressureProgram.uniforms.uPressure,
					pressure.read.attach(1),
				);
				blit(pressure.write.fbo);
				pressure.swap();
			}

			gradientSubtractProgram.bind();
			gl.uniform2f(
				gradientSubtractProgram.uniforms.texelSize,
				1 / simWidth,
				1 / simHeight,
			);
			gl.uniform1i(
				gradientSubtractProgram.uniforms.uPressure,
				pressure.read.attach(0),
			);
			gl.uniform1i(
				gradientSubtractProgram.uniforms.uVelocity,
				velocity.read.attach(1),
			);
			blit(velocity.write.fbo);
			velocity.swap();

			advectionProgram.bind();
			gl.uniform2f(
				advectionProgram.uniforms.texelSize,
				1 / simWidth,
				1 / simHeight,
			);
			if (!supportLinearFiltering)
				gl.uniform2f(
					advectionProgram.uniforms.dyeTexelSize,
					1 / simWidth,
					1 / simHeight,
				);
			const velocityId = velocity.read.attach(0);
			gl.uniform1i(advectionProgram.uniforms.uVelocity, velocityId);
			gl.uniform1i(advectionProgram.uniforms.uSource, velocityId);
			gl.uniform1f(advectionProgram.uniforms.dt, dt);
			gl.uniform1f(
				advectionProgram.uniforms.dissipation,
				config.VELOCITY_DISSIPATION,
			);
			blit(velocity.write.fbo);
			velocity.swap();

			gl.viewport(0, 0, dyeWidth, dyeHeight);
			if (!supportLinearFiltering)
				gl.uniform2f(
					advectionProgram.uniforms.dyeTexelSize,
					1 / dyeWidth,
					1 / dyeHeight,
				);
			gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read.attach(0));
			gl.uniform1i(advectionProgram.uniforms.uSource, density.read.attach(1));
			gl.uniform1f(
				advectionProgram.uniforms.dissipation,
				config.DENSITY_DISSIPATION,
			);
			blit(density.write.fbo);
			density.swap();
		}

		function applyBloom(source: FBO, destination: FBO) {
			if (bloomFramebuffers.length < 2) return;
			let last = destination;
			gl.disable(gl.BLEND);
			bloomPrefilterProgram.bind();
			const knee = config.BLOOM_THRESHOLD * config.BLOOM_SOFT_KNEE + 0.0001;
			const curve0 = config.BLOOM_THRESHOLD - knee;
			const curve1 = knee * 2;
			const curve2 = 0.25 / knee;
			gl.uniform3f(
				bloomPrefilterProgram.uniforms.curve,
				curve0,
				curve1,
				curve2,
			);
			gl.uniform1f(
				bloomPrefilterProgram.uniforms.threshold,
				config.BLOOM_THRESHOLD,
			);
			gl.uniform1i(
				bloomPrefilterProgram.uniforms.uTexture,
				source.attach(0),
			);
			gl.viewport(0, 0, last.width, last.height);
			blit(last.fbo);

			bloomBlurProgram.bind();
			for (let i = 0; i < bloomFramebuffers.length; i++) {
				const dest = bloomFramebuffers[i];
				gl.uniform2f(
					bloomBlurProgram.uniforms.texelSize,
					1 / last.width,
					1 / last.height,
				);
				gl.uniform1i(bloomBlurProgram.uniforms.uTexture, last.attach(0));
				gl.viewport(0, 0, dest.width, dest.height);
				blit(dest.fbo);
				last = dest;
			}

			gl.blendFunc(gl.ONE, gl.ONE);
			gl.enable(gl.BLEND);
			for (let i = bloomFramebuffers.length - 2; i >= 0; i--) {
				const baseTex = bloomFramebuffers[i];
				gl.uniform2f(
					bloomBlurProgram.uniforms.texelSize,
					1 / last.width,
					1 / last.height,
				);
				gl.uniform1i(bloomBlurProgram.uniforms.uTexture, last.attach(0));
				gl.viewport(0, 0, baseTex.width, baseTex.height);
				blit(baseTex.fbo);
				last = baseTex;
			}

			gl.disable(gl.BLEND);
			bloomFinalProgram.bind();
			gl.uniform2f(
				bloomFinalProgram.uniforms.texelSize,
				1 / last.width,
				1 / last.height,
			);
			gl.uniform1i(bloomFinalProgram.uniforms.uTexture, last.attach(0));
			gl.uniform1f(
				bloomFinalProgram.uniforms.intensity,
				config.BLOOM_INTENSITY,
			);
			gl.viewport(0, 0, destination.width, destination.height);
			blit(destination.fbo);
		}

		function render(target: WebGLFramebuffer | null) {
			if (config.BLOOM) applyBloom(density.read, bloom);

			if (target == null || !config.TRANSPARENT) {
				gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
				gl.enable(gl.BLEND);
			} else {
				gl.disable(gl.BLEND);
			}

			const width = target == null ? gl.drawingBufferWidth : dyeWidth;
			const height = target == null ? gl.drawingBufferHeight : dyeHeight;
			gl.viewport(0, 0, width, height);

			if (!config.TRANSPARENT) {
				colorProgram.bind();
				const bc = config.BACK_COLOR;
				gl.uniform4f(
					colorProgram.uniforms.color,
					bc.r / 255,
					bc.g / 255,
					bc.b / 255,
					1,
				);
				blit(target);
			}
			if (target == null && config.TRANSPARENT) {
				backgroundProgram.bind();
				blit(null);
			}

			if (config.SHADING) {
				const program = config.BLOOM
					? displayBloomShadingProgram
					: displayShadingProgram;
				program.bind();
				gl.uniform2f(program.uniforms.texelSize, 1 / width, 1 / height);
				gl.uniform1i(program.uniforms.uTexture, density.read.attach(0));
				if (config.BLOOM) {
					gl.uniform1i(program.uniforms.uBloom, bloom.attach(1));
				}
			} else {
				const program = config.BLOOM ? displayBloomProgram : displayProgram;
				program.bind();
				gl.uniform1i(program.uniforms.uTexture, density.read.attach(0));
				if (config.BLOOM) {
					gl.uniform1i(program.uniforms.uBloom, bloom.attach(1));
				}
			}
			blit(target);
		}

		// ---- Loop ------------------------------------------------------------
		let lastColorChangeTime = Date.now();

		function input() {
			if (splatStack.length > 0) multipleSplats(splatStack.pop()!);
			for (const p of pointers) {
				if (p.moved) {
					splat(p.x, p.y, p.dx, p.dy, p.color);
					p.moved = false;
				}
			}
			if (lastColorChangeTime + 100 < Date.now()) {
				lastColorChangeTime = Date.now();
				for (const p of pointers) {
					p.color = config.COLORFUL
						? generateColor()
						: pickRandom(config.POINTER_COLOR);
				}
			}
		}

		function resizeCanvasIfNeeded() {
			if (
				canvas.width !== canvas.clientWidth ||
				canvas.height !== canvas.clientHeight
			) {
				canvas.width = canvas.clientWidth;
				canvas.height = canvas.clientHeight;
				initFramebuffers();
			}
		}

		initFramebuffers();

		const CYAN: RGB = { r: 0, g: 0.15, b: 0.15 };
		const MAGENTA: RGB = { r: 0.15, g: 0, b: 0.15 };

		function splatForColor(side: "white" | "black") {
			const base = side === "white" ? CYAN : MAGENTA;
			for (let i = 0; i < config.MOVE_SPLAT_AMOUNT; i++) {
				const c: RGB = {
					r: base.r * 10,
					g: base.g * 10,
					b: base.b * 10,
				};
				const x = canvas.width * Math.random();
				const y = canvas.height * Math.random();
				const dx = 1000 * (Math.random() - 0.5);
				const dy = 1000 * (Math.random() - 0.5);
				splat(x, y, dx, dy, c);
			}
		}

		let stopped = false;
		let timeoutId: ReturnType<typeof setTimeout> | null = null;
		let idleId: ReturnType<typeof setInterval> | null = null;

		function update() {
			if (stopped) return;
			timeoutId = setTimeout(update, config.FRAME_INTERVAL_MS);
			resizeCanvasIfNeeded();
			input();
			if (!config.PAUSED) {
				let remaining = config.FRAME_INTERVAL_MS / 1000;
				while (remaining > config.STEP_SIZE_S) {
					step(config.STEP_SIZE_S);
					remaining -= config.STEP_SIZE_S;
				}
				step(remaining);
			}
			render(null);
		}

		update();

		if (config.IDLE_SPLATS) {
			idleId = setInterval(
				() => multipleSplats(config.RANDOM_AMOUNT),
				config.RANDOM_INTERVAL * 1000,
			);
		}

		return {
			cleanup: () => {
				stopped = true;
				if (timeoutId != null) clearTimeout(timeoutId);
				if (idleId != null) clearInterval(idleId);
				try {
					gl.clearColor(0, 0, 0, 0);
					gl.clear(gl.COLOR_BUFFER_BIT);
				} catch {}
				canvasEl.remove();
				const ctxLoss = gl.getExtension("WEBGL_lose_context");
				if (ctxLoss && typeof ctxLoss.loseContext === "function")
					ctxLoss.loseContext();
			},
			splatForColor,
		};
	}
</script>

<canvas
	bind:this={canvas}
	class="pointer-events-none fixed inset-0 -z-10 h-full w-full"
	style="background: transparent;"
></canvas>
