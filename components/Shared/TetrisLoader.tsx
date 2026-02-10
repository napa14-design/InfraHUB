import React, { useEffect, useMemo, useState } from 'react';

type Cell = string | null;
type Shape = number[][];

interface Piece {
  shape: Shape;
  row: number;
  col: number;
  color: string;
}

interface GameState {
  board: Cell[][];
  piece: Piece;
  lines: number;
  resets: number;
}

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 18;
const TICK_MS = 320;

const SHAPES: Array<{ shape: Shape; color: string }> = [
  { shape: [[1, 1, 1, 1]], color: '#06b6d4' },
  { shape: [[1, 1], [1, 1]], color: '#f59e0b' },
  { shape: [[0, 1, 0], [1, 1, 1]], color: '#8b5cf6' },
  { shape: [[1, 0, 0], [1, 1, 1]], color: '#10b981' },
  { shape: [[0, 0, 1], [1, 1, 1]], color: '#ef4444' },
  { shape: [[0, 1, 1], [1, 1, 0]], color: '#3b82f6' },
  { shape: [[1, 1, 0], [0, 1, 1]], color: '#ec4899' },
];

const createEmptyBoard = (): Cell[][] =>
  Array.from({ length: BOARD_HEIGHT }, () => Array.from({ length: BOARD_WIDTH }, () => null));

const randomShape = (): { shape: Shape; color: string } => {
  const next = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  return {
    shape: next.shape.map((line) => [...line]),
    color: next.color,
  };
};

const createSpawnPiece = (): Piece => {
  const next = randomShape();
  return {
    shape: next.shape,
    row: -1,
    col: Math.floor((BOARD_WIDTH - next.shape[0].length) / 2),
    color: next.color,
  };
};

const collides = (board: Cell[][], piece: Piece, row = piece.row, col = piece.col, shape = piece.shape): boolean => {
  for (let r = 0; r < shape.length; r += 1) {
    for (let c = 0; c < shape[r].length; c += 1) {
      if (!shape[r][c]) continue;

      const boardRow = row + r;
      const boardCol = col + c;

      if (boardCol < 0 || boardCol >= BOARD_WIDTH || boardRow >= BOARD_HEIGHT) return true;
      if (boardRow >= 0 && board[boardRow][boardCol]) return true;
    }
  }
  return false;
};

const mergePiece = (board: Cell[][], piece: Piece): Cell[][] => {
  const nextBoard = board.map((line) => [...line]);
  for (let r = 0; r < piece.shape.length; r += 1) {
    for (let c = 0; c < piece.shape[r].length; c += 1) {
      if (!piece.shape[r][c]) continue;
      const boardRow = piece.row + r;
      const boardCol = piece.col + c;
      if (boardRow >= 0 && boardRow < BOARD_HEIGHT && boardCol >= 0 && boardCol < BOARD_WIDTH) {
        nextBoard[boardRow][boardCol] = piece.color;
      }
    }
  }
  return nextBoard;
};

const clearLines = (board: Cell[][]): { board: Cell[][]; cleared: number } => {
  let cleared = 0;
  const kept = board.filter((line) => {
    const full = line.every(Boolean);
    if (full) cleared += 1;
    return !full;
  });

  const empty = Array.from({ length: cleared }, () => Array.from({ length: BOARD_WIDTH }, () => null as Cell));
  return {
    board: [...empty, ...kept],
    cleared,
  };
};

const rotateShape = (shape: Shape): Shape =>
  Array.from({ length: shape[0].length }, (_, row) =>
    Array.from({ length: shape.length }, (_, col) => shape[shape.length - 1 - col][row])
  );

const lockPiece = (state: GameState, pieceToLock: Piece): GameState => {
  const merged = mergePiece(state.board, pieceToLock);
  const { board: afterClear, cleared } = clearLines(merged);
  const nextPiece = createSpawnPiece();

  if (collides(afterClear, nextPiece)) {
    return {
      board: createEmptyBoard(),
      piece: createSpawnPiece(),
      lines: 0,
      resets: state.resets + 1,
    };
  }

  return {
    board: afterClear,
    piece: nextPiece,
    lines: state.lines + cleared,
    resets: state.resets,
  };
};

const step = (state: GameState): GameState => {
  const down = { ...state.piece, row: state.piece.row + 1 };
  if (collides(state.board, down)) {
    return lockPiece(state, state.piece);
  }
  return { ...state, piece: down };
};

const initialState = (): GameState => ({
  board: createEmptyBoard(),
  piece: createSpawnPiece(),
  lines: 0,
  resets: 0,
});

export const TetrisLoader: React.FC = () => {
  const [game, setGame] = useState<GameState>(initialState);

  const movePiece = (delta: number) => {
    setGame((prev) => {
      const next = { ...prev.piece, col: prev.piece.col + delta };
      return collides(prev.board, next) ? prev : { ...prev, piece: next };
    });
  };

  const rotatePiece = () => {
    setGame((prev) => {
      const rotated = rotateShape(prev.piece.shape);
      const kicks = [0, -1, 1, -2, 2];

      for (const offset of kicks) {
        const test = { ...prev.piece, shape: rotated, col: prev.piece.col + offset };
        if (!collides(prev.board, test)) return { ...prev, piece: test };
      }

      return prev;
    });
  };

  const softDropPiece = () => {
    setGame((prev) => step(prev));
  };

  const hardDropPiece = () => {
    setGame((prev) => {
      let dropped = { ...prev.piece };
      while (!collides(prev.board, dropped, dropped.row + 1, dropped.col, dropped.shape)) {
        dropped = { ...dropped, row: dropped.row + 1 };
      }
      return lockPiece(prev, dropped);
    });
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      setGame((prev) => step(prev));
    }, TICK_MS);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key;
      if (!['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' ', 'Spacebar'].includes(key)) return;
      event.preventDefault();

      if (key === 'ArrowLeft') {
        movePiece(-1);
        return;
      }

      if (key === 'ArrowRight') {
        movePiece(1);
        return;
      }

      if (key === 'ArrowDown') {
        softDropPiece();
        return;
      }

      if (key === 'ArrowUp') {
        rotatePiece();
        return;
      }

      if (key === ' ' || key === 'Spacebar') {
        hardDropPiece();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const displayBoard = useMemo(() => {
    const next = game.board.map((line) => [...line]);
    const piece = game.piece;

    for (let r = 0; r < piece.shape.length; r += 1) {
      for (let c = 0; c < piece.shape[r].length; c += 1) {
        if (!piece.shape[r][c]) continue;
        const boardRow = piece.row + r;
        const boardCol = piece.col + c;
        if (boardRow >= 0 && boardRow < BOARD_HEIGHT && boardCol >= 0 && boardCol < BOARD_WIDTH) {
          next[boardRow][boardCol] = piece.color;
        }
      }
    }

    return next;
  }, [game.board, game.piece]);

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-5">
        <div className="text-center mb-4">
          <h2 className="font-mono uppercase tracking-widest text-sm text-brand-600 dark:text-brand-400">
            Carregando InfraHub
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-1">
            Jogue enquanto sincroniza com o Supabase
          </p>
        </div>

        <div className="mx-auto w-fit border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 p-2 rounded-lg">
          <div
            className="grid gap-[2px]"
            style={{
              gridTemplateColumns: `repeat(${BOARD_WIDTH}, minmax(0, 1fr))`,
            }}
          >
            {displayBoard.flatMap((line, row) =>
              line.map((cell, col) => (
                <div
                  key={`${row}-${col}`}
                  className="w-4 h-4 rounded-sm border border-slate-200/40 dark:border-slate-700/40"
                  style={{
                    backgroundColor: cell || 'transparent',
                    boxShadow: cell ? 'inset 0 0 0 1px rgba(255,255,255,0.25)' : 'none',
                  }}
                />
              ))
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] font-mono">
          <div className="rounded-md bg-slate-100 dark:bg-slate-800 p-2 text-slate-600 dark:text-slate-300">
            Linhas: <span className="font-bold">{game.lines}</span>
          </div>
          <div className="rounded-md bg-slate-100 dark:bg-slate-800 p-2 text-slate-600 dark:text-slate-300">
            Reinicios: <span className="font-bold">{game.resets}</span>
          </div>
        </div>

        <div className="mt-3 text-[10px] font-mono text-slate-500 dark:text-slate-400 text-center uppercase tracking-wide">
          ← → mover | ↑ girar | ↓ descer | Space soltar
        </div>

        <div className="mt-3 grid grid-cols-5 gap-2">
          <button
            type="button"
            onClick={() => movePiece(-1)}
            className="py-2 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-700 dark:text-slate-200"
          >
            LEFT
          </button>
          <button
            type="button"
            onClick={rotatePiece}
            className="py-2 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-700 dark:text-slate-200"
          >
            ROT
          </button>
          <button
            type="button"
            onClick={softDropPiece}
            className="py-2 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-700 dark:text-slate-200"
          >
            DOWN
          </button>
          <button
            type="button"
            onClick={hardDropPiece}
            className="py-2 rounded-md bg-brand-600 text-[10px] font-mono text-white"
          >
            DROP
          </button>
          <button
            type="button"
            onClick={() => movePiece(1)}
            className="py-2 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-700 dark:text-slate-200"
          >
            RIGHT
          </button>
        </div>
      </div>
    </div>
  );
};
