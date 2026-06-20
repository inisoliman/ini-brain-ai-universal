/**
 * Savings layer orchestrator.
 * Coordinates Caveman, Ponytail, Claude-Lean, and Token Meter.
 */
import { CavemanMode, deployCavemanLocal, removeCavemanLocal } from './caveman';
import { PonytailMode, deployPonytailLocal, removePonytailLocal } from './ponytail';
import { deployClaudeLeanLocal, removeClaudeLeanLocal } from './claudeLean';

export * from './caveman';
export * from './ponytail';
export * from './claudeLean';
export * from './tokenMeter';

export type SavingsSkill = 'caveman' | 'ponytail' | 'claudeLean';

export interface SavingsState {
  caveman: { enabled: boolean; mode: CavemanMode };
  ponytail: { enabled: boolean; mode: PonytailMode };
  claudeLean: { enabled: boolean };
}

export async function applySavings(root: string, state: SavingsState): Promise<string[]> {
  const written: string[] = [];
  if (state.caveman.enabled) {
    written.push(...await deployCavemanLocal({ root, mode: state.caveman.mode }));
  } else {
    await removeCavemanLocal(root);
  }
  if (state.ponytail.enabled) {
    written.push(...await deployPonytailLocal({ root, mode: state.ponytail.mode }));
  } else {
    await removePonytailLocal(root);
  }
  if (state.claudeLean.enabled) {
    written.push(...await deployClaudeLeanLocal(root));
  } else {
    await removeClaudeLeanLocal(root);
  }
  return written;
}

export async function removeAllSavings(root: string): Promise<void> {
  await removeCavemanLocal(root);
  await removePonytailLocal(root);
  await removeClaudeLeanLocal(root);
}
