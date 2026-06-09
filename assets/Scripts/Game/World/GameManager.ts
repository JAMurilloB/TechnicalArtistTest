import { _decorator, Component, PhysicsSystem2D, EPhysics2DDrawFlags } from 'cc';
const { ccclass } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {

    onLoad() {
        // 1. Activa el motor de físicas 2D
        PhysicsSystem2D.instance.enable = true;

        // 2. Descomenta la línea de abajo si en algún momento necesitas ver las cajas verdes de nuevo
        //PhysicsSystem2D.instance.debugDrawFlags = EPhysics2DDrawFlags.Aabb | EPhysics2DDrawFlags.Shape;
    }
}