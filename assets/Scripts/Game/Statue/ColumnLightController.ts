import { _decorator, Component, Sprite, Material, Vec4, CCFloat, director, tween } from 'cc';
import { EDITOR } from 'cc/env';
const { ccclass, property, executeInEditMode } = _decorator;

@ccclass('ColumnLightController')
@executeInEditMode
export class ColumnLightController extends Component {

    @property({ type: Material, tooltip: 'Material con el effect column-light' })
    public customMaterial: Material | null = null;

    @property
    private _glowStrength: number = 1.0;
    @property({ type: CCFloat, slide: true, range: [0.0, 5.0], step: 0.1, tooltip: 'Intensidad general' })
    get glowStrength(): number { return this._glowStrength; }
    set glowStrength(val: number) { this._glowStrength = val; this.updateShader(); }

    @property
    private _raySpeed: number = 2.0;
    @property({ type: CCFloat, slide: true, range: [0.0, 10.0], step: 0.1, tooltip: 'Velocidad de las franjas' })
    get raySpeed(): number { return this._raySpeed; }
    set raySpeed(val: number) { this._raySpeed = val; this.updateShader(); }

    @property
    private _rayCount: number = 6.0;
    @property({ type: CCFloat, slide: true, range: [1.0, 20.0], step: 0.5, tooltip: 'Número de franjas' })
    get rayCount(): number { return this._rayCount; }
    set rayCount(val: number) { this._rayCount = val; this.updateShader(); }

    @property
    private _edgeFeather: number = 0.3;
    @property({ type: CCFloat, slide: true, range: [0.0, 1.0], step: 0.05, tooltip: 'Suavidad del borde horizontal' })
    get edgeFeather(): number { return this._edgeFeather; }
    set edgeFeather(val: number) { this._edgeFeather = val; this.updateShader(); }

    @property
    private _distortion: number = 1.0;
    @property({ type: CCFloat, slide: true, range: [0.0, 5.0], step: 0.1, tooltip: 'Distorsión ondulada de las franjas' })
    get distortion(): number { return this._distortion; }
    set distortion(val: number) { this._distortion = val; this.updateShader(); }

    @property
    private _lineStrength: number = 0.0;
    @property({ type: CCFloat, slide: true, range: [0.0, 3.0], step: 0.1, tooltip: 'Fuerza de las líneas verticales. 0=desactivado' })
    get lineStrength(): number { return this._lineStrength; }
    set lineStrength(val: number) { this._lineStrength = val; this.updateShader(); }

    @property
    private _lineCount: number = 0.5;
    @property({ type: CCFloat, slide: true, range: [0.1, 5.0], step: 0.1, tooltip: 'Número de líneas verticales' })
    get lineCount(): number { return this._lineCount; }
    set lineCount(val: number) { this._lineCount = val; this.updateShader(); }

    @property
    private _goesUp: boolean = true;
    @property({ tooltip: 'True=sube, False=baja' })
    get goesUp(): boolean { return this._goesUp; }
    set goesUp(val: boolean) { this._goesUp = val; this.updateShader(); }

    private _sprite: Sprite | null = null;
    private _params1: Vec4 = new Vec4(1.0, 2.0, 6.0, 0.3);
    private _params2: Vec4 = new Vec4(1.0, 0.0, 0.5, 1.0);

    // Variable para el despertar
    private _targetGlow: number = 0;

    onLoad() {
        this._sprite = this.getComponent(Sprite);
        if (this.customMaterial && this._sprite && !this._sprite.customMaterial) {
            this._sprite.customMaterial = this.customMaterial;
        }
    }

    start() {
        if (!EDITOR) {
            // Guardamos tu intensidad original
            this._targetGlow = this._glowStrength;
            
            // Lo hacemos invisible al empezar el nivel
            this.glowStrength = 0;

            // Nos suscribimos al evento
            director.on('AWAKE_STATUE', this.onAwakeStatue, this);
        }

        this.scheduleOnce(() => { this.updateShader(); }, 0);
    }

    onDestroy() {
        if (!EDITOR) {
            director.off('AWAKE_STATUE', this.onAwakeStatue, this);
        }
    }

    private onAwakeStatue() {
        // Objeto temporal para animar la intensidad
        let proxy = { glow: 0 };

        tween(proxy)
            .to(3.0, { glow: this._targetGlow }, { 
                easing: 'sineInOut',
                onUpdate: () => {
                    this.glowStrength = proxy.glow;
                }
            })
            .start();
    }

    private updateShader() {
        if (!this._sprite) this._sprite = this.getComponent(Sprite);
        if (!this._sprite) return;

        this._params1.x = this._glowStrength;
        this._params1.y = this._raySpeed;
        this._params1.z = this._rayCount;
        this._params1.w = this._edgeFeather;

        this._params2.x = this._distortion;
        this._params2.y = this._lineStrength;
        this._params2.z = this._lineCount;
        this._params2.w = this._goesUp ? 1.0 : -1.0;

        const mat = this._sprite.getMaterialInstance(0);
        if (mat) {
            mat.setProperty('columnParams',  this._params1);
            mat.setProperty('columnParams2', this._params2);
        }
    }
}