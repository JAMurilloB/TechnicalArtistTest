import { _decorator, Component, Vec3, RigidBody2D, v2, CCFloat } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('RespawnController')
export class RespawnController extends Component {

    @property({ type: CCFloat, tooltip: 'Límite inferior (Y) de la muerte' })
    public limitBottom: number = -600;

    @property({ type: CCFloat, tooltip: 'Límite izquierdo (X) de la pantalla' })
    public limitLeft: number = -1000;

    @property({ type: CCFloat, tooltip: 'Límite derecho (X) de la pantalla' })
    public limitRight: number = 1000;

    @property({ type: CCFloat, tooltip: 'Segundos de espera antes de reaparecer' })
    public respawnDelay: number = 1.0;

    private _startPos: Vec3 = new Vec3();
    private _isDead: boolean = false;

    start() {
        // Guardamos exactamente la posición inicial del personaje al arrancar el nivel
        this._startPos.set(this.node.position);
    }

    update(dt: number) {
        // Si ya se ha caído y está esperando el respawn, abortamos para no lanzar el timer 60 veces por segundo
        if (this._isDead) return;

        const pos = this.node.position;

        // Comprobamos si el jugador ha cruzado la línea de la muerte (cualquiera de los 3 lados)
        if (pos.y < this.limitBottom || pos.x < this.limitLeft || pos.x > this.limitRight) {
            this._isDead = true;

            // Iniciamos la cuenta atrás para revivir
            this.scheduleOnce(() => {
                this.respawn();
            }, this.respawnDelay);
        }
    }

    private respawn() {
        // 1. Buscamos el cuerpo físico y lo frenamos en seco (reseteamos la inercia)
        let rb = this.getComponent(RigidBody2D);
        if (rb) {
            rb.linearVelocity = v2(0, 0);
            rb.angularVelocity = 0;
        }

        // 2. Lo teletransportamos de vuelta a la posición original
        this.node.setPosition(this._startPos);
        
        // 3. Volvemos a darle el control
        this._isDead = false;
    }
}