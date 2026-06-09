import { _decorator, Component, Node, Animation, game } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('BackButtonController')
export class BackButtonController extends Component {

    @property({ type: Animation, tooltip: 'El componente de animación del botón' })
    public buttonAnim: Animation | null = null;

    // Guardamos la referencia a la función para poder desconectarla limpiamente si destruimos el botón
    private _globalMouseLeaveHandler: () => void = null!;

    onLoad() {
        // Vinculamos la función al contexto del botón
        this._globalMouseLeaveHandler = this.onHoverLeave.bind(this);
    }

    start() {
        if (!this.buttonAnim) {
            this.buttonAnim = this.getComponent(Animation);
        }

        // 1. Escuchadores nativos de Cocos (Para cuando te mueves dentro del juego)
        this.node.on(Node.EventType.MOUSE_ENTER, this.onHoverEnter, this);
        this.node.on(Node.EventType.MOUSE_LEAVE, this.onHoverLeave, this);

        // 2. Escuchador Global del Navegador (Para cuando sacas el ratón de la pantalla por los bordes)
        // Comprobamos que estamos en navegador y que existe el canvas para evitar errores en móviles
        if (game.canvas && typeof game.canvas.addEventListener === 'function') {
            game.canvas.addEventListener('mouseleave', this._globalMouseLeaveHandler);
        }
    }

    private onHoverEnter() {
        if (this.buttonAnim) {
            this.buttonAnim.play();
        }
    }

    private onHoverLeave() {
        if (this.buttonAnim) {
            this.buttonAnim.stop();
            
            // Reiniciamos la animación a su fotograma original (reposo)
            const clipName = this.buttonAnim.defaultClip?.name;
            if (clipName) {
                const state = this.buttonAnim.getState(clipName);
                if (state) {
                    state.setTime(0);
                    state.sample(); 
                }
            }
        }
    }

    public onBackClicked() {
        console.log("🔙 [BackButton] Volviendo a la escena anterior... (Pendiente)");
        // director.loadScene("MenuScene");
    }

    onDestroy() {
        // Limpiamos la basura de la memoria al destruir la escena
        this.node.off(Node.EventType.MOUSE_ENTER, this.onHoverEnter, this);
        this.node.off(Node.EventType.MOUSE_LEAVE, this.onHoverLeave, this);

        if (game.canvas && typeof game.canvas.removeEventListener === 'function') {
            game.canvas.removeEventListener('mouseleave', this._globalMouseLeaveHandler);
        }
    }
}