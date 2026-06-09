import { _decorator, Component, Sprite, Material, Vec4, CCFloat, Color } from 'cc';
const { ccclass, property, executeInEditMode } = _decorator;

@ccclass('KeyGlowController')
@executeInEditMode
export class KeyGlowController extends Component {

    @property({ type: Material, tooltip: 'El material key-glow' })
    public customMaterial: Material | null = null;

    @property
    private _glowStrength: number = 1.0;
    @property({ type: CCFloat, slide: true, range: [0.0, 5.0], step: 0.1, tooltip: 'Intensidad máxima del glow' })
    get glowStrength(): number { return this._glowStrength; }
    set glowStrength(val: number) { this._glowStrength = val; this.updateShader(); }

    @property
    private _pulseSpeed: number = 1.0;
    @property({ type: CCFloat, slide: true, range: [0.1, 5.0], step: 0.1, tooltip: 'Velocidad del latido' })
    get pulseSpeed(): number { return this._pulseSpeed; }
    set pulseSpeed(val: number) { this._pulseSpeed = val; this.updateShader(); }

    @property
    private _pulseMin: number = 0.1;
    @property({ type: CCFloat, slide: true, range: [0.0, 1.0], step: 0.05, tooltip: 'Brillo mínimo del latido' })
    get pulseMin(): number { return this._pulseMin; }
    set pulseMin(val: number) { this._pulseMin = val; this.updateShader(); }

    @property
    private _pulseMax: number = 1.0;
    @property({ type: CCFloat, slide: true, range: [0.0, 3.0], step: 0.05, tooltip: 'Brillo máximo del latido' })
    get pulseMax(): number { return this._pulseMax; }
    set pulseMax(val: number) { this._pulseMax = val; this.updateShader(); }

    private _sprite: Sprite | null = null;
    private _glowVector: Vec4 = new Vec4(1.0, 1.0, 0.1, 1.0);

    onLoad() {
        this._sprite = this.getComponent(Sprite);
        if (this.customMaterial && this._sprite && !this._sprite.customMaterial) {
            this._sprite.customMaterial = this.customMaterial;
        }
    }

    start() {
        this.scheduleOnce(() => { this.updateShader(); }, 0);
    }

    private updateShader() {
        if (!this._sprite) {
            this._sprite = this.getComponent(Sprite);
        }
        if (!this._sprite) return;

        this._glowVector.x = this._glowStrength;
        this._glowVector.y = this._pulseSpeed;
        this._glowVector.z = this._pulseMin;
        this._glowVector.w = this._pulseMax;

        const mat = this._sprite.getMaterialInstance(0);
        if (mat) {
            mat.setProperty('glowParams', this._glowVector);
        }
    }
}