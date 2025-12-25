export enum TreeState {
  SCATTERED = 'SCATTERED',
  TREE_SHAPE = 'TREE_SHAPE'
}

export interface DualPosition {
  tree: [number, number, number];
  scatter: [number, number, number];
}

export interface TreeConfig {
  height: number;
  radius: number;
  needleCount: number;
  ornamentCount: number;
}