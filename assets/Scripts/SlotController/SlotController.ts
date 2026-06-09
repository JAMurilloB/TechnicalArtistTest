import { _decorator, Component, Node, SpriteFrame, math, Vec3, CCFloat, EventHandler, Graphics, UITransform, Color, director } from 'cc';
const { ccclass, property } = _decorator;

enum ReelState { IDLE, SPINNING, STOPPING, BOUNCING }

@ccclass('SlotController')
export class SlotController extends Component {

    @property({ type: [Node] }) public reels: Node[] = [];
    @property({ type: [SpriteFrame] }) public symbolTextures: SpriteFrame[] = [];
    @property({ type: [CCFloat] }) public symbolWeights: number[] = [];
    @property({ tooltip: "Distancia exacta en Y entre cada símbolo" }) public symbolHeight: number = 220;

    @property({ type: Graphics, tooltip: "Arrastra aquí el nodo WinLineCanvas" }) 
    public winLineGraphics: Graphics | null = null;

    @property({ type: [EventHandler] }) public onSpinStartEvents: EventHandler[] = [];
    @property({ type: [EventHandler] }) public onTurboStartEvents: EventHandler[] = [];
    @property({ type: [EventHandler] }) public onSpinEndEvents: EventHandler[] = [];

    @property({ tooltip: "Velocidad a la que caen los símbolos" })
    public spinSpeed: number = 2800; 

    @property({ tooltip: "Segundos de retraso al parar entre un rodillo y el siguiente" })
    public delayBetweenReels: number = 0.25; 

    @property({ tooltip: "Número mínimo de vueltas completas que da el primer rodillo antes de detenerse" })
    public minReelLoops: number = 3;

    private baseScale: Vec3 = new Vec3(1, 1, 1);
    
    private rStates: ReelState[] = [];
    private rTimers: number[] = [];
    private rStretchFactors: number[] = []; 
    private rBounceTimers: number[] = [];
    private rSnappedYs: number[][] = []; 

    private isGlobalSpinning: boolean = false;
    private globalSpinTimer: number = 0;
    
    // Guardará el tiempo objetivo de cada tirada
    private _targetSpinTime: number = 0;

    private currentWinningPaths: Node[][] = [];
    private lightningTimer: number = 0;
    private pathCycleTimer: number = 0;
    private currentPathIndex: number = 0;
    
    private isCelebrating: boolean = false;
    private celebrationTimer: number = 0;

    start() {
        if (this.reels.length > 0 && this.reels[0].children.length > 0) {
            this.baseScale = this.reels[0].children[0].getScale().clone();
        }
        for (let i = 0; i < this.reels.length; i++) {
            this.rStates.push(ReelState.IDLE); this.rTimers.push(0);
            this.rStretchFactors.push(0); this.rBounceTimers.push(0); this.rSnappedYs.push([]);
        }
        this.randomizeBoard();

        director.on('TRIGGER_SPIN', this.onSpinButtonClicked, this);
    }

    onDestroy() {
        director.off('TRIGGER_SPIN', this.onSpinButtonClicked, this);
    }

    update(dt: number) {
        if (this.isGlobalSpinning) {
            this.globalSpinTimer += dt;
            let allIdle = true;

            // Comparamos el tiempo actual con el objetivo calculado al iniciar el giro
            if (this.globalSpinTimer >= this._targetSpinTime && this.rStates[0] === ReelState.SPINNING) {
                this.startStoppingSequence(false);
            }

            for (let i = 0; i < this.reels.length; i++) {
                let symbols = this.reels[i].children;
                let state = this.rStates[i];
                if (state !== ReelState.IDLE) allIdle = false;

                if (state === ReelState.SPINNING || state === ReelState.STOPPING) {
                    this.rStretchFactors[i] = math.lerp(this.rStretchFactors[i], 1.0, dt * 10);
                } else {
                    this.rStretchFactors[i] = math.lerp(this.rStretchFactors[i], 0.0, dt * 15);
                }

                let currentStretchY = this.baseScale.y * (1.0 + (0.8 * this.rStretchFactors[i]));
                for (let j = 0; j < symbols.length; j++) {
                    symbols[j].setScale(this.baseScale.x, currentStretchY, this.baseScale.z);
                }

                if (state === ReelState.SPINNING || state === ReelState.STOPPING) {
                    if (state === ReelState.STOPPING) this.rTimers[i] += dt;

                    for (let j = 0; j < symbols.length; j++) {
                        let sym = symbols[j];
                        sym.setPosition(sym.position.x, sym.position.y - this.spinSpeed * dt, sym.position.z);

                        if (sym.position.y <= -this.symbolHeight * 1.5) {
                            sym.setPosition(sym.position.x, sym.position.y + (this.symbolHeight * symbols.length), sym.position.z);
                            this.updateSymbolVisuals(sym);
                        }
                    }

                    if (state === ReelState.STOPPING && this.rTimers[i] >= i * this.delayBetweenReels) {
                        let refSym = symbols[0];
                        if (Math.abs(refSym.position.y % this.symbolHeight) < 45 || Math.abs(refSym.position.y % this.symbolHeight) > this.symbolHeight - 45) { 
                            this.snapAndStartBounce(i, symbols);
                        }
                    }
                } else if (state === ReelState.BOUNCING) {
                    this.rBounceTimers[i] += dt;
                    let t = this.rBounceTimers[i] / 0.25;
                    if (t >= 1.0) { t = 1.0; this.rStates[i] = ReelState.IDLE; this.rStretchFactors[i] = 0.0; }
                    let overshoot = -35 * Math.sin(t * Math.PI); 
                    for (let j = 0; j < symbols.length; j++) {
                        symbols[j].setPosition(symbols[j].position.x, this.rSnappedYs[i][j] + overshoot, symbols[j].position.z);
                    }
                }
            }

            if (allIdle && this.isGlobalSpinning) {
                this.isGlobalSpinning = false;
                this.evaluateRealWinsAndDraw();
                
                if (this.currentWinningPaths.length > 0) {
                    this.isCelebrating = true;
                    this.celebrationTimer = 2.0; 
                } else {
                    for (let i = 0; i < this.onSpinEndEvents.length; i++) this.onSpinEndEvents[i].emit([]);
                    director.emit('SLOT_FINISHED');
                }
            }
        }

        if (this.isCelebrating) {
            this.celebrationTimer -= dt;
            if (this.celebrationTimer <= 0) {
                this.isCelebrating = false;
                for (let i = 0; i < this.onSpinEndEvents.length; i++) this.onSpinEndEvents[i].emit([]);
                director.emit('SLOT_FINISHED');
            }
        }

        if (this.currentWinningPaths.length > 0 && this.winLineGraphics) {
            this.lightningTimer += dt;
            this.pathCycleTimer += dt;

            if (this.pathCycleTimer >= 1.5) {
                this.pathCycleTimer = 0;
                this.currentPathIndex = (this.currentPathIndex + 1) % this.currentWinningPaths.length;
                this.updateHighlightedSymbols(); 
            }

            if (this.lightningTimer >= 0.05) {
                this.lightningTimer = 0;
                this.drawAnimatedLightning();
            }
        }
    }

    private evaluateRealWinsAndDraw() {
        if (!this.winLineGraphics) return;
        this.winLineGraphics.clear();
        this.currentWinningPaths = [];

        let visibleMatrix: Node[][] = [];
        for(let i = 0; i < this.reels.length; i++) {
            visibleMatrix.push(this.getVisibleSymbols(this.reels[i]));
        }

        let winningPaths: Node[][] = [];

        for (let row = 0; row < visibleMatrix[0].length; row++) {
            let startNode = visibleMatrix[0][row];
            let symScript = startNode.getComponent('SlotSymbol') as any;
            if (!symScript || !symScript.spriteComponent || !symScript.spriteComponent.spriteFrame) continue;
            
            let targetName = symScript.spriteComponent.spriteFrame.name;
            let currentPath = [startNode];

            for (let col = 1; col < this.reels.length; col++) {
                let matchFound = false;
                for (let r = 0; r < visibleMatrix[col].length; r++) {
                    let nextNode = visibleMatrix[col][r];
                    let nextScript = nextNode.getComponent('SlotSymbol') as any;
                    
                    if (nextScript && nextScript.spriteComponent && nextScript.spriteComponent.spriteFrame.name === targetName) {
                        currentPath.push(nextNode);
                        matchFound = true;
                        break; 
                    }
                }
                if (!matchFound) break; 
            }

            if (currentPath.length >= 3) { 
                winningPaths.push(currentPath);
            }
        }

        if (winningPaths.length > 0) {
            this.currentWinningPaths = winningPaths;
            this.currentPathIndex = 0; 
            this.pathCycleTimer = 0;
            
            this.updateHighlightedSymbols();
            this.drawAnimatedLightning();
        }
    }

    private updateHighlightedSymbols() {
        for (let i = 0; i < this.reels.length; i++) {
            for (let j = 0; j < this.reels[i].children.length; j++) {
                let symComp = this.reels[i].children[j].getComponent('SlotSymbol') as any;
                if (symComp) symComp.dimOut();
            }
        }

        let activePath = this.currentWinningPaths[this.currentPathIndex];
        for (let n = 0; n < activePath.length; n++) {
            let symComp = activePath[n].getComponent('SlotSymbol') as any;
            if (symComp) symComp.highlight();
        }
    }

    private getVisibleSymbols(reel: Node): Node[] {
        let syms = [...reel.children];
        syms.sort((a, b) => Math.abs(a.position.y) - Math.abs(b.position.y));
        return syms.slice(0, 3); 
    }

    private drawAnimatedLightning() {
        if (!this.winLineGraphics || this.currentWinningPaths.length === 0) return;
        let g = this.winLineGraphics;
        g.clear();

        let path = this.currentWinningPaths[this.currentPathIndex];
        let uiTrans = g.node.getComponent(UITransform)!;

        let points: Vec3[] = [];
        for (let i = 0; i < path.length; i++) {
            let worldPos = path[i].getComponent(UITransform)!.convertToWorldSpaceAR(new Vec3(0,0,0));
            points.push(uiTrans.convertToNodeSpaceAR(worldPos));
        }

        g.lineWidth = 18;
        g.strokeColor = new Color(150, 255, 0, 80); 
        g.lineJoin = Graphics.LineJoin.ROUND;
        g.lineCap = Graphics.LineCap.ROUND;
        this.generateJaggedPath(g, points, 35); 
        g.stroke();

        g.lineWidth = 6;
        g.strokeColor = new Color(255, 255, 255, 255); 
        this.generateJaggedPath(g, points, 15); 
        g.stroke();
    }

    private generateJaggedPath(g: Graphics, points: Vec3[], maxOffset: number) {
        if (points.length < 2) return;

        for (let i = 0; i < points.length - 1; i++) {
            let p1 = points[i];
            let p2 = points[i+1];

            if (i === 0) g.moveTo(p1.x, p1.y);

            let segments = 8; 
            let dx = p2.x - p1.x;
            let dy = p2.y - p1.y;
            let length = Math.sqrt(dx*dx + dy*dy);
            
            let nx = -dy / length; 
            let ny = dx / length;  

            for (let j = 1; j <= segments; j++) {
                let t = j / segments;
                let baseX = p1.x + dx * t;
                let baseY = p1.y + dy * t;

                if (j < segments) {
                    let swell = Math.sin(t * Math.PI); 
                    let jitter = (Math.random() - 0.5) * 2; 
                    let offset = jitter * maxOffset * swell;
                    g.lineTo(baseX + nx * offset, baseY + ny * offset);
                } else {
                    g.lineTo(p2.x, p2.y);
                }
            }
        }
    }

    private updateSymbolVisuals(symbolNode: Node) {
        const slotSymbol = symbolNode.getComponent('SlotSymbol') as any;
        if (!slotSymbol || typeof slotSymbol.setupSymbol !== 'function') return;
        let randIndex = this.getRandomSymbolIndex();
        slotSymbol.setupSymbol(this.symbolTextures[randIndex]);
    }

    public onSpinButtonClicked() {
        if (this.isCelebrating) {
            this.isCelebrating = false;
        }

        if (!this.isGlobalSpinning) {
            this.isGlobalSpinning = true;
            this.globalSpinTimer = 0;
            
            // --- CÁLCULO DE TIEMPO CON ALEATORIEDAD ---
            let symbolsPerReel = this.reels[0] ? this.reels[0].children.length : 5;
            let timeForOneLoop = (this.symbolHeight * symbolsPerReel) / this.spinSpeed;
            // Garantiza las vueltas mínimas, pero le suma hasta 1 vuelta extra en tiempo para que aterrice donde sea
            this._targetSpinTime = (this.minReelLoops * timeForOneLoop) + (math.random() * timeForOneLoop);
            
            this.currentWinningPaths = [];
            this.currentPathIndex = 0;
            this.pathCycleTimer = 0;
            if (this.winLineGraphics) this.winLineGraphics.clear();
            
            for (let i = 0; i < this.reels.length; i++) {
                for (let j = 0; j < this.reels[i].children.length; j++) {
                    let symComp = this.reels[i].children[j].getComponent('SlotSymbol') as any;
                    if (symComp) symComp.highlight();
                }
            }

            for (let i = 0; i < this.onSpinStartEvents.length; i++) this.onSpinStartEvents[i].emit([]);
            for (let i = 0; i < this.reels.length; i++) {
                this.rStates[i] = ReelState.SPINNING; this.rTimers[i] = 0; this.rBounceTimers[i] = 0;
            }
            
        } else if (this.rStates[0] === ReelState.SPINNING && this.globalSpinTimer > 0.3) {
            // TURBO STOP: Solo si ha pasado al menos 0.3s desde que empezó, para evitar doble-clicks fantasma
            for (let i = 0; i < this.onTurboStartEvents.length; i++) this.onTurboStartEvents[i].emit([]);
            this.startStoppingSequence(true);
        }
    }

    private startStoppingSequence(isSlamStop: boolean) {
        for (let i = 0; i < this.reels.length; i++) {
            if (this.rStates[i] === ReelState.SPINNING) {
                this.rStates[i] = ReelState.STOPPING;
                this.rTimers[i] = isSlamStop ? (i * this.delayBetweenReels * 0.2) : 0;
            }
        }
    }

    private snapAndStartBounce(reelIndex: number, symbols: Node[]) {
        this.rStates[reelIndex] = ReelState.BOUNCING; this.rBounceTimers[reelIndex] = 0; this.rSnappedYs[reelIndex] = [];
        for (let j = 0; j < symbols.length; j++) {
            let snappedY = Math.round(symbols[j].position.y / this.symbolHeight) * this.symbolHeight;
            this.rSnappedYs[reelIndex][j] = snappedY;
            symbols[j].setPosition(symbols[j].position.x, snappedY, symbols[j].position.z);
        }
    }

    private getRandomSymbolIndex(): number {
        let totalWeight = 0;
        for (let w of this.symbolWeights) totalWeight += w;
        let randomVal = math.random() * totalWeight, currentWeight = 0;
        for (let i = 0; i < this.symbolWeights.length; i++) {
            currentWeight += this.symbolWeights[i];
            if (randomVal <= currentWeight) return i;
        }
        return 0;
    }

    public randomizeBoard() {
        for (let i = 0; i < this.reels.length; i++) {
            let symbols = this.reels[i].children;
            for (let j = 0; j < symbols.length; j++) {
                let snappedY = Math.round(symbols[j].position.y / this.symbolHeight) * this.symbolHeight;
                symbols[j].setPosition(symbols[j].position.x, snappedY, symbols[j].position.z);
                this.updateSymbolVisuals(symbols[j]);
            }
        }
    }
}