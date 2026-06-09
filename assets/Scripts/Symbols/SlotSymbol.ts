import { _decorator, Component, Sprite, SpriteFrame, Label, Color } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SlotSymbol')
export class SlotSymbol extends Component {

    @property({ type: Sprite, tooltip: "El componente Sprite del símbolo" })
    public spriteComponent: Sprite | null = null;

    @property({ type: Label, tooltip: "El componente Label para el texto del premio" })
    public valueLabel: Label | null = null;

    public setupSymbol(texture: SpriteFrame) {
        if (this.spriteComponent) {
            this.spriteComponent.spriteFrame = texture;
        }

        if (!this.valueLabel) return;

        if (texture && texture.name === "LikeItValue") {
            this.valueLabel.node.active = true;
            this.valueLabel.string = this.generateRandomValue().toString();
        } else {
            this.valueLabel.node.active = false;
        }
    }

    private generateRandomValue(): number {
        const min = 5, max = 50;
        const randomMultiplier = Math.floor(Math.random() * (max - min + 1)) + min;
        return randomMultiplier * 10;
    }

    // --- NUEVAS FUNCIONES VISUALES ---

    /** Vuelve al símbolo a su brillo blanco puro */
    public highlight() {
        if (this.spriteComponent) {
            this.spriteComponent.color = new Color(255, 255, 255, 255);
        }
    }

    /** Tiñe el símbolo de gris oscuro para mandarlo al fondo */
    public dimOut() {
        if (this.spriteComponent) {
            this.spriteComponent.color = new Color(80, 80, 80, 255);
        }
    }
}