import { game } from '$lib/state/game.svelte';
import type { Opponent } from '$lib/state/opponent';

export class MachineOpponent implements Opponent {
    private worker: Worker | null = null;
    private moves: string[] = [];
    private skillLevel: number;
    private moveTimeMs: number;

    constructor(opts: { skillLevel?: number; moveTimeMs?: number } = {}) {
        this.skillLevel = opts.skillLevel ?? 1;
        this.moveTimeMs = opts.moveTimeMs ?? 100;
    }

    start(): Promise<void> {
        return new Promise((resolve) => {
            const w = new Worker('/stockfish/stockfish-18-lite-single.js#/stockfish/stockfish-18-lite-single.wasm');
            this.worker = w;
            game.status = 'on';
            w.onmessage = (e) => this.onLine(e.data);

            const onReady = (e: MessageEvent) => {
                if (e.data === 'readyok') {
                    w.removeEventListener('message', onReady);
                    game.status = 'match';
                    game.color = 'white';
                    game.turn = 'white';
                    resolve();
                }
            };
            w.addEventListener('message', onReady);

            w.postMessage('uci');
            w.postMessage(`setoption name Skill Level value ${this.skillLevel}`);
            w.postMessage('isready');
        });
    }

    sendMove(from: string, to: string, promotion?: string) {
        this.moves.push(from + to + (promotion ?? ''));
        this.worker?.postMessage(`position startpos moves ${this.moves.join(' ')}`);
        this.worker?.postMessage(`go movetime ${this.moveTimeMs}`);
    }

    stop() { this.worker?.terminate(); this.worker = null; }

    private onLine(line: string) {
        if (line.startsWith('bestmove')) {
            const uci = line.split(' ')[1];
            const from = uci.slice(0, 2), to = uci.slice(2, 4);
            const promotion = uci.length >= 5 ? uci[4] : undefined;
            this.moves.push(uci);
            game.lastMove = { from, to, promotion };
            game.turn = game.color;
        }
    }
}