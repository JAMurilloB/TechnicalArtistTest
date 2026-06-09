import { _decorator, Component, Node, tween, Vec3, Tween, Sprite, Color } from 'cc';
import { BurstController } from '../EffectsController/BurstController';
const { ccclass, property } = _decorator;

@ccclass('SpinController')
export class SpinController extends Component {

    @property({ type: Node, tooltip: 'El nodo de la flecha blanca que gira' })
    public spinArrow: Node | null = null;

    @property({ type: Node, tooltip: 'El cuerpo visual del botón para animar el click' })
    public buttonVisual: Node | null = null;

    @property({ type: BurstController, tooltip: 'Arrastra aquí el nodo BurstEffect' })
    public burstScript: BurstController | null = null;

    // --- VARIABLES EXPORTADAS PARA EL CONTROL TOTAL DEL LATIDO ---
    @property({ type: Color, tooltip: 'Color de reposo (Más oscuro = mayor contraste de brillo)' })
    public baseColor: Color = new Color(140, 140, 140, 255);

    @property({ type: Color, tooltip: 'Color de la caída en medio del doble latido' })
    public midPulseColor: Color = new Color(200, 200, 200, 255);

    @property({ type: Color, tooltip: 'Brillo máximo del latido (Normalmente blanco puro)' })
    public peakPulseColor: Color = new Color(255, 255, 255, 255);

    @property({ tooltip: 'Segundos de espera entre cada latido completo' })
    public pulseInterval: number = 5.0;

    @property({ tooltip: 'Duración total de la animación del latido (doble pulso)' })
    public pulseDuration: number = 1.5;

    // --- Variables internas ---
    private _isSpinningFast: boolean = false;
    private _debounce: boolean = false;
    private _isHovering: boolean = false;
    
    private _isPulsing: boolean = false;
    private _idleTimer: number = 0.0;
    private _pulseTimer: number = 0.0;

    start() {
        this.startIdleRotation();
        this.registerHoverEvents();
        
        const target = this.buttonVisual ?? this.node;
        const sprite = target.getComponent(Sprite);
        if (sprite) sprite.color = this.baseColor;

        this._idleTimer = 0.0;
    }

    private registerHoverEvents() {
        this.node.on(Node.EventType.MOUSE_ENTER, this.onHoverEnter, this);
        this.node.on(Node.EventType.MOUSE_LEAVE, this.onHoverLeave, this);
    }

    private onHoverEnter() {
        if (this._isHovering) return;
        this._isHovering = true;

        if (!this._isSpinningFast) {
            if (this.burstScript) this.burstScript.animateToHover();
        }
    }

    private onHoverLeave() {
        if (!this._isHovering) return;
        this._isHovering = false;

        if (!this._isSpinningFast) {
            if (this.burstScript) this.burstScript.animateToInvisible();
        }
    }

    public onSpinClicked() {
        if (this._debounce) return;
        this._debounce = true;
        this.scheduleOnce(() => { this._debounce = false; }, 0.2);

        if (this._isSpinningFast) {
            // --- DESACTIVAR ---
            this._isSpinningFast = false;
            this.startIdleRotation();

            if (this.burstScript) this.burstScript.animateToInvisible();

            if (this._isHovering) {
                this.scheduleOnce(() => {
                    if (this._isHovering && !this._isSpinningFast && this.burstScript) {
                        this.burstScript.animateToHover();
                    }
                }, 0.35);
            }

        } else {
            // --- ACTIVAR ---
            this._isSpinningFast = true;
            this.startFastRotation();

            // Cortamos el latido en seco y aplicamos el color base
            this._isPulsing = false;
            this._idleTimer = 0.0;
            const target = this.buttonVisual ?? this.node;
            const sprite = target.getComponent(Sprite);
            if (sprite) sprite.color = this.baseColor;

            if (this.burstScript) this.burstScript.animateBurst(false);
            
            this.playClickBurstScale();
            this.scheduleOnce(this.autoStopSpin, 2.5);
        }
    }

    private autoStopSpin() {
        if (!this._isSpinningFast) return;
        this._isSpinningFast = false;
        this.startIdleRotation();

        if (this.burstScript) this.burstScript.animateToInvisible();

        if (this._isHovering) {
            this.scheduleOnce(() => {
                if (this._isHovering && !this._isSpinningFast && this.burstScript) {
                    this.burstScript.animateToHover();
                }
            }, 0.35);
        }
    }

    private playClickBurstScale() {
        const target = this.buttonVisual ?? this.node;
        Tween.stopAllByTarget(target);
        
        const originalScale = new Vec3(1, 1, 1);
        const burstScale = new Vec3(1.08, 1.08, 1);

        tween(target)
            .to(0.06, { scale: burstScale }, { easing: 'quadOut' })
            .to(0.15, { scale: originalScale }, { easing: 'quadIn' })
            .start();
    }

    // --- RELOJ MATEMÁTICO INQUEBRANTABLE ---
    update(dt: number) {
        if (this._isSpinningFast) return;

        if (!this._isPulsing) {
            this._idleTimer += dt;
            if (this._idleTimer >= this.pulseInterval) {
                this._idleTimer = 0.0;
                this._isPulsing = true;
                this._pulseTimer = 0.0;
            }
        } 
        else {
            this._pulseTimer += dt;
            let t = this._pulseTimer / this.pulseDuration;
            
            if (t >= 1.0) {
                t = 1.0;
                this._isPulsing = false;
                this._idleTimer = 0.0; 
            }

            const target = this.buttonVisual ?? this.node;
            const sprite = target.getComponent(Sprite);
            
            if (sprite) {
                let fromColor = this.baseColor;
                let toColor = this.baseColor;
                let localT = 0;
                
                if (t <= 0.25) {
                    fromColor = this.baseColor;
                    toColor = this.peakPulseColor;
                    localT = t / 0.25;
                } else if (t <= 0.5) {
                    fromColor = this.peakPulseColor;
                    toColor = this.midPulseColor;
                    localT = (t - 0.25) / 0.25;
                } else if (t <= 0.75) {
                    fromColor = this.midPulseColor;
                    toColor = this.peakPulseColor;
                    localT = (t - 0.5) / 0.25;
                } else {
                    fromColor = this.peakPulseColor;
                    toColor = this.baseColor;
                    localT = (t - 0.75) / 0.25;
                }
                
                let finalColor = new Color();
                Color.lerp(finalColor, fromColor, toColor, localT);
                sprite.color = finalColor;
            }
        }
    }

    private startIdleRotation() {
        if (!this.spinArrow) return;
        Tween.stopAllByTarget(this.spinArrow);
        tween(this.spinArrow).by(2.5, { angle: -360 }).repeatForever().start();
    }

    private startFastRotation() {
        if (!this.spinArrow) return;
        Tween.stopAllByTarget(this.spinArrow);
        tween(this.spinArrow).by(0.3, { angle: -360 }).repeatForever().start();
    }

    onDestroy() {
        this.node.off(Node.EventType.MOUSE_ENTER, this.onHoverEnter, this);
        this.node.off(Node.EventType.MOUSE_LEAVE, this.onHoverLeave, this);
        this.unscheduleAllCallbacks();
    }
}