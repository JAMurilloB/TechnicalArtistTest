import { _decorator, Component, Collider2D, Contact2DType, director } from 'cc';
const { ccclass } = _decorator;

@ccclass('KeyController')
export class KeyController extends Component {

    start() {
        let collider = this.getComponent(Collider2D);
        if (collider) {
            collider.on(Contact2DType.BEGIN_CONTACT, this.onKeyCollected, this);
        } else {
            console.error("No hay Collider2D en este nodo");
        }
    }

    onKeyCollected(selfCollider: Collider2D, otherCollider: Collider2D) {
        if (otherCollider.node.name === "Player") {
            // 📢 EL GRITO GLOBAL: Avisa a todos los scripts que estén escuchando
            director.emit('AWAKE_STATUE');
            
            // Retrasamos la desactivación 1 frame para que Box2D no explote
            this.scheduleOnce(() => {
                this.node.active = false; 
            }, 0);
        }
    }
}