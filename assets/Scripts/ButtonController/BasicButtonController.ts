import { _decorator, Component, Node, tween, Vec3, Tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('BasicButtonController')
export class BasicButtonController extends Component {

    // Usamos el propio nodo al que está atachado el script por defecto, 
    // pero dejamos la opción de arrastrar otro nodo si la jerarquía fuera compleja.
    @property({ type: Node, tooltip: 'El nodo que se encogerá al hacer clic' })
    public buttonVisual: Node | null = null;

    // Guardamos la escala original para que el botón no se deforme si en el editor lo tenías a 0.8 o 1.2
    private _originalScale: Vec3 = new Vec3();

    start() {
        if (!this.buttonVisual) {
            this.buttonVisual = this.node;
        }
        
        // Clonamos la escala inicial que le hayas puesto en el Canvas
        this._originalScale.set(this.buttonVisual.scale);
    }

    public onSimpleClick() {
        if (!this.buttonVisual) return;

        // Limpiamos animaciones previas por si el jugador pulsa muy rápido (spam click)
        Tween.stopAllByTarget(this.buttonVisual);

        // Calculamos un encogimiento muy sutil (95% de su tamaño original)
        const targetScale = new Vec3(
            this._originalScale.x * 0.95, 
            this._originalScale.y * 0.95, 
            1
        );

        // Tween ultrarrápido y suave: baja en 0.05s y recupera en 0.08s
        tween(this.buttonVisual)
            .to(0.05, { scale: targetScale }, { easing: 'quadOut' })
            .to(0.08, { scale: this._originalScale }, { easing: 'quadIn' })
            .start();
    }
}