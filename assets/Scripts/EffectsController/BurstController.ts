import { _decorator, Component, Sprite, Material, Vec4, UITransform, Size, CCFloat } from 'cc';
const { ccclass, property, executeInEditMode } = _decorator;

type EffectState = 'IDLE' | 'HOVER' | 'ACTIVE' | 'BURST' | 'FADING';

@ccclass('BurstController')
@executeInEditMode
export class BurstController extends Component {

    @property({ type: Material, tooltip: 'El material UI que usa el effect plasma-flow' })
    public customMaterial: Material | null = null;

    @property
    private _arcRadius: number = 0.36;
    @property({ type: CCFloat, slide: true, range: [0.0, 0.6], step: 0.01, tooltip: 'Radio del arco desde el centro' })
    get arcRadius(): number { return this._arcRadius; }
    set arcRadius(val: number) { this._arcRadius = val; this.updateShader(); }

    @property
    private _arcThickness: number = 0.06;
    @property({ type: CCFloat, slide: true, range: [0.01, 0.3], step: 0.005, tooltip: 'Grosor de la línea del arco' })
    get arcThickness(): number { return this._arcThickness; }
    set arcThickness(val: number) { this._arcThickness = val; this.updateShader(); }

    @property
    private _distortion: number = 1.0;
    @property({ type: CCFloat, slide: true, range: [0.0, 5.0], step: 0.1, tooltip: 'Nivel de caos y quiebre del rayo' })
    get distortion(): number { return this._distortion; }
    set distortion(val: number) { this._distortion = val; this.updateShader(); }

    @property
    private _glowStrength: number = 1.0;
    @property({ type: CCFloat, slide: true, range: [0.0, 5.0], step: 0.1, tooltip: 'Fuerza del resplandor de color' })
    get glowStrength(): number { return this._glowStrength; }
    set glowStrength(val: number) { this._glowStrength = val; this.updateShader(); }

    @property
    private _squash: number = 1.0;
    @property({ type: CCFloat, slide: true, range: [0.1, 3.0], step: 0.05, tooltip: 'Aplasta o estira el efecto verticalmente' })
    get squash(): number { return this._squash; }
    set squash(val: number) { this._squash = val; this.updateShader(); }

    @property
    private _arcSpread: number = 0.7;
    @property({ type: CCFloat, slide: true, range: [0.0, 1.0], step: 0.01, tooltip: 'Longitud de las puntas. 0=largas, 1=cortas' })
    get arcSpread(): number { return this._arcSpread; }
    set arcSpread(val: number) { this._arcSpread = val; this.updateShader(); }

    // --- NUEVA VARIABLE PARA CONTROLAR EL LÍMITE DE LA ONDA ---
    @property({ type: CCFloat, slide: true, range: [0.3, 0.48], step: 0.01, tooltip: 'Hasta dónde se expande el Burst. Max 0.48 para no cortarse en los bordes del Sprite.' })
    public burstMaxRadius: number = 0.46;

    @property
    private _progress: number = 0.01;
    @property({ type: CCFloat, slide: true, range: [0.0, 1.0], step: 0.01, tooltip: 'Desliza para ver el efecto en el editor' })
    get progress(): number { return this._progress; }
    set progress(val: number) { this._progress = val; this.updateShader(); }

    private _sprite: Sprite | null = null;
    private _animVector: Vec4 = new Vec4(0.01, 4, 0.36, 0.06);
    private _extraVector: Vec4 = new Vec4(1.0, 1.0, 1.0, 0.7);

    private _targetProgress: number = 0.01;
    private _animSpeed: number = 0.0;
    private _isAnimating: boolean = false;

    private _currentRadius: number = 0.36;
    private _targetRadius: number = 0.36;
    private _radiusSpeed: number = 0.0;
    private _isRadiusAnimating: boolean = false;

    private _currentSpread: number = 0.7;
    private _targetSpread: number = 0.7;
    private _spreadSpeed: number = 0.0;
    private _isSpreadAnimating: boolean = false;

    private _state: EffectState = 'IDLE';
    private _stayActiveAfterBurst: boolean = false;

    onLoad() {
        this._sprite = this.getComponent(Sprite);
        if (!this._sprite) this._sprite = this.addComponent(Sprite);

        const transform = this.getComponent(UITransform) || this.addComponent(UITransform);
        transform.setContentSize(new Size(600, 600));

        if (this.customMaterial && this._sprite && !this._sprite.customMaterial) {
            this._sprite.customMaterial = this.customMaterial;
        }
    }

    start() {
        this._progress = 0.01;
        this._currentRadius = this._arcRadius;
        this._currentSpread = this._arcSpread;
        this._targetProgress = 0.01;
        this._isAnimating = false;
        this._isRadiusAnimating = false;
        this._isSpreadAnimating = false;
        this._state = 'IDLE';
        this._stayActiveAfterBurst = false;
        this.scheduleOnce(() => { this.writeToMaterial(0.01, this._arcRadius, this._arcSpread); }, 0);
    }

    public animateToHover() {
        this._state = 'HOVER';
        this._isRadiusAnimating = false;
        this._isSpreadAnimating = false;
        this._currentRadius = this._arcRadius;
        this._currentSpread = this._arcSpread;

        if (this._progress < 0.012) this._progress = 0.012;
        this._targetProgress = 0.28;
        this._animSpeed = (0.28 - this._progress) / 0.15;
        this._isAnimating = true;
    }

    public animateToCenter() {
        this._state = 'ACTIVE';
        this._isRadiusAnimating = false;
        this._isSpreadAnimating = false;
        this._currentRadius = this._arcRadius;
        this._currentSpread = this._arcSpread;

        if (this._progress < 0.012) this._progress = 0.012;
        this._targetProgress = 0.5;
        this._animSpeed = (0.5 - this._progress) / 0.12;
        this._isAnimating = true;
    }

    public animateBurst(stayActive: boolean = false) {
        this._state = 'BURST';
        this._stayActiveAfterBurst = stayActive;
        this._progress = 0.15;

        this._currentSpread = 0.0;
        this._isSpreadAnimating = false;

        this._currentRadius = this._arcRadius;
        // Sustituimos el 0.65 que rompía los bordes por el límite seguro exportado
        this._targetRadius = this.burstMaxRadius; 
        this._radiusSpeed = (this._targetRadius - this._currentRadius) / 0.35;
        this._isRadiusAnimating = true;

        this._targetProgress = 0.94;
        this._animSpeed = (0.94 - this._progress) / 0.35;
        this._isAnimating = true;
    }

    public animateToInvisible() {
        if (this._progress <= 0.02 || this._state === 'IDLE') {
            this._progress = 0.01;
            this._isAnimating = false;
            this._state = 'IDLE';
            this.updateShader();
            return;
        }

        this._state = 'FADING';
        this._isRadiusAnimating = false;
        this._isSpreadAnimating = false;

        const delta = 0.94 - this._progress;
        this._animSpeed = Math.abs(delta) > 0.001 ? delta / 0.25 : 0;
        this._targetProgress = 0.94;
        this._isAnimating = true;
    }

    update(dt: number) {
        let dirty = false;

        if (this._isAnimating) {
            this._progress += this._animSpeed * dt;
            dirty = true;

            const reached =
                (this._animSpeed > 0 && this._progress >= this._targetProgress) ||
                (this._animSpeed < 0 && this._progress <= this._targetProgress);

            if (reached) {
                this._progress = this._targetProgress;
                this._isAnimating = false;
                
                if (this._progress >= 0.94) {
                    this._progress = 0.01;
                    this._currentSpread = this._arcSpread;
                    
                    if (this._stayActiveAfterBurst) {
                        this._stayActiveAfterBurst = false;
                        this.animateToCenter(); 
                    } else {
                        this._state = 'IDLE';
                    }
                }
            }
        }

        if (this._isRadiusAnimating) {
            this._currentRadius += this._radiusSpeed * dt;
            dirty = true;
            if (this._currentRadius >= this._targetRadius) {
                this._currentRadius = this._targetRadius;
                this._isRadiusAnimating = false;
            }
        }

        if (this._isSpreadAnimating) {
            this._currentSpread += this._spreadSpeed * dt;
            dirty = true;
            const spreadReached =
                (this._spreadSpeed < 0 && this._currentSpread <= this._targetSpread) ||
                (this._spreadSpeed > 0 && this._currentSpread >= this._targetSpread);
            if (spreadReached) {
                this._currentSpread = this._targetSpread;
                this._isSpreadAnimating = false;
            }
        }

        if (dirty) {
            const r = (this._state === 'BURST') ? this._currentRadius : this._arcRadius;
            const s = (this._state === 'BURST') ? this._currentSpread : this._arcSpread;
            this.writeToMaterial(this._progress, r, s);
        }
    }

    private writeToMaterial(prog: number, radius: number, spread: number) {
        if (!this._sprite) {
            this._sprite = this.getComponent(Sprite);
            if (!this._sprite) return;
        }

        this._animVector.x = prog;
        this._animVector.y = 4;
        this._animVector.z = radius;
        this._animVector.w = this._arcThickness;

        this._extraVector.x = this._distortion;
        this._extraVector.y = this._glowStrength;
        this._extraVector.z = this._squash;
        this._extraVector.w = spread;

        const mat = this._sprite.getMaterialInstance(0);
        if (mat) {
            mat.setProperty('animParams', this._animVector);
            mat.setProperty('extraParams', this._extraVector);
        }
    }

    private updateShader() {
        const r = (this._state === 'BURST') ? this._currentRadius : this._arcRadius;
        const s = (this._state === 'BURST') ? this._currentSpread : this._arcSpread;
        this.writeToMaterial(this._progress, r, s);
    }
}