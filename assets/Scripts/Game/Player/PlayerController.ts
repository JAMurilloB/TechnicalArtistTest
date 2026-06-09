import { _decorator, Component, Node, input, Input, EventKeyboard, KeyCode, RigidBody2D, v2, Animation, Sprite, PhysicsSystem2D, ERaycast2DType, BoxCollider2D, Graphics, Color } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PlayerController')
export class PlayerController extends Component {

    @property({ type: Sprite })
    public playerSprite: Sprite | null = null;

    @property({ type: Animation })
    public animComponent: Animation | null = null;

    @property({ type: Graphics, tooltip: "Lápiz para dibujar los rayos" })
    public debugDraw: Graphics | null = null;

    @property({ tooltip: "Velocidad de movimiento horizontal" })
    public moveSpeed: number = 280;

    @property({ tooltip: "Fuerza del salto" })
    public jumpForce: number = 15;

    @property({ tooltip: "Debe ser un poco mayor que la distancia desde el centro del PJ hasta la suela de sus zapatos" })
    public raycastLength: number = 65;

    private rb: RigidBody2D | null = null;
    private boxCollider: BoxCollider2D | null = null;
    private walkDirection: number = 0; 
    private isGrounded: boolean = true;
    private wasGrounded: boolean = true;
    private landingTimer: number = 0;
    private currentAnim: string = "";

    onLoad() {
        this.rb = this.getComponent(RigidBody2D);
        this.boxCollider = this.getComponent(BoxCollider2D);
        
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
    }

    onDestroy() {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
    }

    private onKeyDown(event: EventKeyboard) {
        switch (event.keyCode) {
            case KeyCode.KEY_A:
            case KeyCode.ARROW_LEFT:
                this.walkDirection = -1;
                this.flipSprite(true);
                break;
            case KeyCode.KEY_D:
            case KeyCode.ARROW_RIGHT:
                this.walkDirection = 1;
                this.flipSprite(false);
                break;
            case KeyCode.SPACE:
            case KeyCode.KEY_W:
            case KeyCode.ARROW_UP:
                this.jump();
                break;
        }
    }

    private onKeyUp(event: EventKeyboard) {
        switch (event.keyCode) {
            case KeyCode.KEY_A:
            case KeyCode.ARROW_LEFT:
                if (this.walkDirection === -1) this.walkDirection = 0;
                break;
            case KeyCode.KEY_D:
            case KeyCode.ARROW_RIGHT:
                if (this.walkDirection === 1) this.walkDirection = 0;
                break;
        }
    }

    update(dt: number) {
        if (!this.rb) return;

        // Guardamos el estado anterior y comprobamos el actual
        this.wasGrounded = this.isGrounded;
        this.checkGroundedWithRaycast();

        // Detectar el momento exacto del aterrizaje
        if (!this.wasGrounded && this.isGrounded) {
            // Ajusta este 0.2 al tiempo real que dure tu animación de impacto ("land")
            this.landingTimer = 0.2; 
        }

        if (this.landingTimer > 0) {
            this.landingTimer -= dt;
        }

        let currentVelocity = this.rb.linearVelocity;
        let targetX = this.walkDirection * this.moveSpeed * dt * 60;
        
        if (!this.isGrounded) {
            // Inercia en el aire
            if (this.walkDirection === 0) targetX = currentVelocity.x * 0.98;
            else targetX = (currentVelocity.x * 0.8) + (targetX * 0.2);
        } else {
            // Freno en el suelo
            if (this.walkDirection === 0) targetX = 0; 
        }

        this.rb.linearVelocity = v2(targetX, currentVelocity.y);
        this.animate();
    }

    private checkGroundedWithRaycast() {
        if (!this.rb || !this.boxCollider) return;

        let pos = this.node.worldPosition;
        let halfWidth = (this.boxCollider.size.width / 2) * Math.abs(this.node.scale.x);
        let offset = Math.max(0, halfWidth - 2);

        let origins = [
            v2(pos.x, pos.y),
            v2(pos.x - offset, pos.y),
            v2(pos.x + offset, pos.y)
        ];

        let hitGround = false;

        if (this.debugDraw) this.debugDraw.clear();

        for (let i = 0; i < origins.length; i++) {
            let origin = origins[i];
            let endPoint = v2(origin.x, origin.y - this.raycastLength);
            
            let results = PhysicsSystem2D.instance.raycast(origin, endPoint, ERaycast2DType.All);
            let rayHit = false;

            for (let res of results) {
                if (res.collider.node !== this.node && !res.collider.sensor) {
                    hitGround = true;
                    rayHit = true;
                    break;
                }
            }

            // Dibujar los rayos
            if (this.debugDraw) {
                let localX = i === 0 ? 0 : (i === 1 ? -offset : offset);
                this.debugDraw.strokeColor = rayHit ? Color.GREEN : Color.RED;
                this.debugDraw.moveTo(localX, 0);
                this.debugDraw.lineTo(localX, -this.raycastLength);
                this.debugDraw.stroke();
            }
        }

        // Si hay una velocidad vertical brusca, asumimos que está en el aire
        if (this.rb.linearVelocity.y > 1 || this.rb.linearVelocity.y < -1) {
            hitGround = false;
        }

        this.isGrounded = hitGround;
    }

    private jump() {
        if (!this.rb || !this.isGrounded) return;

        this.isGrounded = false; 
        this.rb.linearVelocity = v2(this.rb.linearVelocity.x, this.jumpForce);
        this.playAnimation("jump");
    }

    private flipSprite(lookLeft: boolean) {
        if (!this.playerSprite) return;
        let currentScale = this.playerSprite.node.getScale();
        this.playerSprite.node.setScale(lookLeft ? -Math.abs(currentScale.x) : Math.abs(currentScale.x), currentScale.y, currentScale.z);
    }

    private animate() {
        if (!this.animComponent) return;

        if (!this.isGrounded) {
            this.playAnimation("jump");
            return;
        }

        if (this.walkDirection !== 0) {
            this.playAnimation("run");
        } else {
            if (this.landingTimer > 0) {
                this.playAnimation("land");
            } else {
                this.playAnimation("idle");
            }
        }
    }

    private playAnimation(animName: string) {
        if (this.currentAnim === animName || !this.animComponent) return;
        
        if (this.animComponent.clips.some(clip => clip.name === animName)) {
            this.currentAnim = animName;
            this.animComponent.play(animName);
        }
    }
}