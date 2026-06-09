import { _decorator, Component, Node, tween, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('LeverController')
export class LeverController extends Component {

    @property({ type: Node, tooltip: "Arrastra aquí el nodo SlotMachineWidget" })
    public slotMachineNode: Node | null = null;

    @property({ tooltip: "Duración en segundos de la animación de bajada/subida" })
    public animationDuration: number = 0.3;

    private _slotScript: any = null;
    private _baseScale: Vec3 = new Vec3(1, 1, 1);
    private _isAnimating: boolean = false;

    start() {
        // Guardamos tu escala original fijada en el editor
        this._baseScale = this.node.getScale().clone();

        if (this.slotMachineNode) {
            this._slotScript = this.slotMachineNode.getComponent('SlotController');
        }
    }

    public onLeverPressed() {
        if (this._isAnimating || !this._slotScript) return;

        this._isAnimating = true;

        // Iniciamos el slot una sola vez
        this._slotScript.onSpinButtonClicked();

        // --- INVERSIÓN EN EL EJE Y CORREGIDA ---
        // Mantener la X original y pasar la Y de positiva a negativa para simular la bajada
        const targetScaleInverted = new Vec3(this._baseScale.x, -this._baseScale.y, this._baseScale.z);
        const targetScaleOriginal = new Vec3(this._baseScale.x, this._baseScale.y, this._baseScale.z);

        let halfTime = this.animationDuration * 0.5;

        tween(this.node)
            .to(halfTime, { scale: targetScaleInverted }, { easing: 'quadOut' }) // La palanca baja
            .to(halfTime, { scale: targetScaleOriginal }, { easing: 'quadIn' })  // La palanca sube
            .call(() => {
                this._isAnimating = false;
            })
            .start();
    }
}