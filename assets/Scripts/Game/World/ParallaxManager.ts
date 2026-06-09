import { _decorator, Component, Node, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

// Creamos una clase para definir cada capa desde el Inspector
@ccclass('ParallaxLayer')
class ParallaxLayer {
    @property({ type: Node })
    public layerNode: Node | null = null;
    
    @property({ tooltip: "1 = Se mueve con la cámara (Fondo estático). 0 = Se mueve igual que el suelo" })
    public speedX: number = 0.5;
}

@ccclass('ParallaxManager')
export class ParallaxManager extends Component {
    @property({ type: Node, tooltip: "La cámara que sigue al jugador" })
    public mainCamera: Node | null = null;

    @property({ type: [ParallaxLayer] })
    public layers: ParallaxLayer[] = [];

    private previousCamPos: Vec3 = new Vec3();

    start() {
        if (this.mainCamera) {
            this.previousCamPos.set(this.mainCamera.position);
        }
    }

    lateUpdate() {
        if (!this.mainCamera) return;

        // Calculamos cuánto se ha movido la cámara en este frame
        let deltaX = this.mainCamera.position.x - this.previousCamPos.x;

        // Movemos cada capa según su multiplicador de velocidad
        for (let layer of this.layers) {
            if (layer.layerNode) {
                // Si speedX es 1, se moverá a la vez que la cámara (parecerá que está en el infinito)
                let newX = layer.layerNode.position.x + (deltaX * layer.speedX);
                layer.layerNode.setPosition(newX, layer.layerNode.position.y, layer.layerNode.position.z);
            }
        }

        this.previousCamPos.set(this.mainCamera.position);
    }
}