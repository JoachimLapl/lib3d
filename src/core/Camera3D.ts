import { OCS } from "../math/OCS";
import { Point } from "../math/Point";
import { Vector3 } from "../math/Vector3";

class Camera3D {
  position: Point;
  orientation: Point;
  constructor(p = new Point(0, 0, 0), o = new Point(0, 0, 1)) {
    this.position = p;
    this.orientation = o;
  }
  get vector() { return new Vector3().setFromPoints(this.position, this.orientation); }
  LonLat(ocs: OCS = new OCS(this.position)) {
    return {};
  }
  set Orientation(o: Point) {
    this.orientation = o;
  }
}

export { Camera3D };
