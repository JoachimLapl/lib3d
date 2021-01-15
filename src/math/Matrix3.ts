import { Vector3 } from "./Vector3";

class Matrix3 {
  /**
   * Matrix values stored in array.
   * @default [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
   */
  elements: Array<Array<number>>;

  /**
   * Initialize a new Matrix.
   * @param elements Initial values of Matrix
   */
  constructor(elements?: Array<Array<number>>) {
    this.elements = elements ?? [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ]
  }
}

export { Matrix3 };
