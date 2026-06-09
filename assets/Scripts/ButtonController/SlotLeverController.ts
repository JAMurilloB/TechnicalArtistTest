import { _decorator, Component, Node, tween, Vec3, director } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SlotLeverController')
export class SlotLeverController extends Component {

    @property({ tooltip: "Duración en segundos de la animación de bajada/subida" })
    public animationDuration: number = 0.3;

    private _slotScript: any = null;
    private _baseScale: Vec3 = new Vec3(1, 1, 1);
    private _isAnimating: boolean = false;

    start() {
        this._baseScale = this.node.getScale().clone();

        // Búsqueda en la escena sin imports problemáticos de carpetas
        const scene = director.getScene();
        if (scene) {
            this._slotScript = scene.getComponentInChildren('SlotController');
        }

        if (!this._slotScript) {
            console.warn("SlotLeverController: No se pudo encontrar el script 'SlotController' en la escena.");
        }
    }

    public onLeverPressed() {
        if (this._isAnimating || !this._slotScript) return;

        this._isAnimating = true;
        this._slotScript.onSpinButtonClicked();

        // Escalado corregido e invertido en Y para simular la palanca física
        const targetScaleInverted = new Vec3(this._baseScale.x, -this._baseScale.y, this._baseScale.z);
        const targetScaleOriginal = new Vec3(this._baseScale.x, this._baseScale.y, this._baseScale.z);

        let halfTime = this.animationDuration * 0.5;

        tween(this.node)
            .to(halfTime, { scale: targetScaleInverted }, { easing: 'quadOut' })
            .to(halfTime, { scale: targetScaleOriginal }, { easing: 'quadIn' })
            .call(() => {
                this._isAnimating = false;
            })
            .start();
    }
}