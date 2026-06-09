import { _decorator, Component, Node, Vec3, director } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AutoplayButtonController')
export class AutoplayButtonController extends Component {

    // ¡Adiós a la referencia de la SlotMachine!
    
    @property({ type: Node, tooltip: "Arrastra aquí el nodo del AutoplaySymbol" })
    public autoplaySymbol: Node | null = null;

    @property({ tooltip: "Velocidad de rotación del símbolo" })
    public rotationSpeed: number = 600;

    private _isAutoplayActive: boolean = false;

    start() {
        // Nos ponemos los cascos para escuchar cuándo termina la máquina
        director.on('SLOT_FINISHED', this.onSlotFinished, this);
    }

    onDestroy() {
        // Importantísimo: apagar los auriculares al destruir el nodo para evitar bugs
        director.off('SLOT_FINISHED', this.onSlotFinished, this);
    }

    update(dt: number) {
        if (this._isAutoplayActive && this.autoplaySymbol) {
            let currentZ = this.autoplaySymbol.eulerAngles.z;
            this.autoplaySymbol.eulerAngles = new Vec3(0, 0, currentZ - this.rotationSpeed * dt);
        }
    }

    public onSpinButtonPressed() {
        if (!this._isAutoplayActive) {
            this._isAutoplayActive = true;
            // 📢 Emitimos la orden global de girar
            director.emit('TRIGGER_SPIN');
        } else {
            this._isAutoplayActive = false;
            
            if (this.autoplaySymbol) {
                this.autoplaySymbol.eulerAngles = new Vec3(0, 0, 0);
            }

            // Según tu lógica original, si lo desactivabas, también lanzaba un último spin manual
            director.emit('TRIGGER_SPIN');
        }
    }

    private onSlotFinished() {
        if (this._isAutoplayActive) {
            this.scheduleOnce(() => {
                if (this._isAutoplayActive) {
                    // 📢 Volvemos a emitir la orden tras medio segundo de descanso
                    director.emit('TRIGGER_SPIN');
                }
            }, 0.5);
        }
    }
}