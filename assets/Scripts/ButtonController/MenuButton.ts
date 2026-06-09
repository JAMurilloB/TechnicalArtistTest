import { _decorator, Component, Node, Vec3, tween, UIOpacity, director, game, Tween, sys } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MenuButton')
export class MenuButton extends Component {
    @property({ tooltip: 'Nombre exacto de la escena a cargar. Déjalo vacío si es el botón de salir.' })
    public targetScene: string = "";

    @property({ tooltip: 'Marca esta casilla si este es el botón de EXIT' })
    public isExitButton: boolean = false;

    @property({ tooltip: 'Si está activado, el botón se hará más grande al pasar el ratón.' })
    public enableHoverScale: boolean = true;

    private _originalScale: Vec3 = new Vec3();
    private _targetScale: Vec3 = new Vec3();
    private _uiOpacity: UIOpacity | null = null;

    private _scaleTween: Tween<Node> | null = null;
    private _opacityTween: Tween<any> | null = null;
    
    // Referencia para limpiar el evento del navegador
    private _onCanvasLeaveBound: any = null;

    start() {
        this._originalScale.set(this.node.scale);
        this._targetScale.set(this._originalScale.x * 1.1, this._originalScale.y * 1.1, this._originalScale.z * 1.1);

        this._uiOpacity = this.getComponent(UIOpacity);
        if (!this._uiOpacity) {
            this._uiOpacity = this.addComponent(UIOpacity);
        }

        // Eventos nativos del nodo
        this.node.on(Node.EventType.MOUSE_ENTER, this.onMouseEnter, this);
        this.node.on(Node.EventType.MOUSE_LEAVE, this.onMouseLeave, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onMouseLeave, this); // Por si se cancela el clic
        this.node.on(Node.EventType.TOUCH_END, this.onClick, this);

        // Eventos globales entre botones
        director.on('MENU_HOVER_ENTER', this.onOtherHoverEnter, this);
        director.on('MENU_HOVER_LEAVE', this.onOtherHoverLeave, this);

        // TRUCO PRO: Si el ratón sale físicamente de la ventana del juego, forzamos el reseteo
        if (sys.isBrowser) {
            this._onCanvasLeaveBound = this.onMouseLeave.bind(this);
            document.getElementById('GameCanvas')?.addEventListener('mouseleave', this._onCanvasLeaveBound);
        }
    }

    onDestroy() {
        director.off('MENU_HOVER_ENTER', this.onOtherHoverEnter, this);
        director.off('MENU_HOVER_LEAVE', this.onOtherHoverLeave, this);
        
        if (sys.isBrowser && this._onCanvasLeaveBound) {
            document.getElementById('GameCanvas')?.removeEventListener('mouseleave', this._onCanvasLeaveBound);
        }
    }

    private onMouseEnter() {
        if (this.enableHoverScale) {
            this.animateScale(this._targetScale);
        }
        director.emit('MENU_HOVER_ENTER', this.node);
    }

    private onMouseLeave() {
        // Reseteo INCONDICIONAL. Da igual cómo estuviera configurado, lo devolvemos a la normalidad
        this.animateScale(this._originalScale);
        this.animateOpacity(255);
        
        director.emit('MENU_HOVER_LEAVE', this.node);
    }

    private onOtherHoverEnter(hoveredNode: Node) {
        if (hoveredNode !== this.node) {
            this.animateOpacity(100);
        }
    }

    private onOtherHoverLeave(hoveredNode: Node) {
        if (hoveredNode !== this.node) {
            this.animateOpacity(255);
        }
    }

    private animateScale(targetS: Vec3) {
        if (this._scaleTween) this._scaleTween.stop();
        this._scaleTween = tween(this.node)
            .to(0.15, { scale: targetS }, { easing: 'sineOut' })
            .start();
    }

    private animateOpacity(targetAlpha: number) {
        if (this._opacityTween) this._opacityTween.stop();
        
        let proxy = { alpha: this._uiOpacity!.opacity };
        this._opacityTween = tween(proxy)
            .to(0.15, { alpha: targetAlpha }, { 
                easing: 'sineOut',
                onUpdate: () => { if (this._uiOpacity) this._uiOpacity.opacity = proxy.alpha; }
            })
            .start();
    }

    private onClick() {
        if (this.isExitButton) {
            game.end();
        } else if (this.targetScene && this.targetScene.trim() !== "") {
            director.loadScene(this.targetScene);
        }
    }
}