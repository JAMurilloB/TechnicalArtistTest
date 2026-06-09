import { _decorator, Component, CCFloat, Vec3, director } from 'cc';
import { EDITOR } from 'cc/env';
const { ccclass, property, executeInEditMode } = _decorator;

@ccclass('TriangleController')
@executeInEditMode
export class TriangleController extends Component {

    @property
    private _pulseSpeed: number = 1.2;
    @property({ type: CCFloat, slide: true, range: [0.1, 5.0], step: 0.1, tooltip: 'Velocidad del pulso' })
    get pulseSpeed(): number { return this._pulseSpeed; }
    set pulseSpeed(val: number) { this._pulseSpeed = val; }

    @property
    private _scaleMin: number = 0.9;
    @property({ type: CCFloat, slide: true, range: [0.1, 1.0], step: 0.05, tooltip: 'Escala mínima' })
    get scaleMin(): number { return this._scaleMin; }
    set scaleMin(val: number) { this._scaleMin = val; }

    @property
    private _scaleMax: number = 1.15;
    @property({ type: CCFloat, slide: true, range: [1.0, 2.0], step: 0.05, tooltip: 'Escala máxima' })
    get scaleMax(): number { return this._scaleMax; }
    set scaleMax(val: number) { this._scaleMax = val; }

    private _baseScale: Vec3 = new Vec3(1, 1, 1);
    
    private _isAwake: boolean = false; 
    // Añadimos nuestro propio cronómetro interno
    private _elapsedTime: number = 0; 

    onLoad() {
        this._baseScale.set(this.node.scale);
    }

    start() {
        if (!EDITOR) {
            this._isAwake = false;
            this._elapsedTime = 0; 
            
            // Forzamos el nodo al tamaño mínimo exacto para que espere así
            this.node.setScale(
                this._baseScale.x * this._scaleMin,
                this._baseScale.y * this._scaleMin,
                1
            );
            
            director.on('AWAKE_STATUE', this.onAwakeStatue, this);
        }
    }

    onDestroy() {
        if (!EDITOR) {
            director.off('AWAKE_STATUE', this.onAwakeStatue, this);
        }
    }

    private onAwakeStatue() {
        this._isAwake = true;
        // Al despertar, el cronómetro empieza en 0. 
        // Las matemáticas calcularán justo desde el punto mínimo.
        this._elapsedTime = 0; 
    }

    update(dt: number) {
        if (!EDITOR && !this._isAwake) return;

        // Sumamos los deltas de tiempo en lugar de leer el reloj global
        this._elapsedTime += dt;

        // Cambiamos el Math.sin por Math.cos invertido. 
        // 0.5 - 0.5 * cos(0) = 0. Al empezar (tiempo 0), el pulse es obligatoriamente 0.
        const pulse = 0.5 - 0.5 * Math.cos(this._elapsedTime * this._pulseSpeed * Math.PI);
        const s = this._scaleMin + (this._scaleMax - this._scaleMin) * pulse;
        
        this.node.setScale(
            this._baseScale.x * s,
            this._baseScale.y * s,
            1
        );
    }
}