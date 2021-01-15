import { Point } from "../math/Point";

class Path3D {
  unrotated3dPlane: Point[]; // We could possibly change the name unrotated3dPlane to something shorter and more appealing
  start: Point[];
  path2D: SVGPathElement;
  rotateX = 0;
  rotateY = 0;
  rotateZ = 0;
  origin = new Point(0, 0);
  perspective: number;
  zIndex: number = 0;
  constructor(...points: Point[]) {
    this.unrotated3dPlane = this.start = points;
    this.path2D = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    this.perspective = 0;
    this.calculateZIndex();
    // On calcule une fonction affine : z = CMx*x + CMy*y + oo qui sert à déterminer si tous les points du path forment quelque chose de plat
    /* Ce n'est pas terminé encore, il y a quelques problèmes quand CMx, CMy ou oo = Infinity ou -Infinity */
    if (points.length > 3) {
      var a = this.plane3dFunction();
      for (let p of points) {
        console.log(a, p);
        // var equ =
        //   ((a?.CMx ?? 0) * p.x === Infinity &&
        //     (a?.CMy ?? 0) * p.y === -Infinity) ||
        //     ((a?.CMx ?? 0) * p.x === -Infinity &&
        //       (a?.CMy ?? 0) * p.y === Infinity)
        //     ? a?.oo
        //     : ((a?.CMx ?? 0) * p.x === Infinity && a?.oo === -Infinity) ||
        //       ((a?.CMx ?? 0) * p.x === -Infinity && a?.oo === Infinity)
        //       ? a?.CMy * p.y
        //       : ((a?.CMy ?? 0) * p.y === Infinity && a?.oo === -Infinity) ||
        //         ((a?.CMy ?? 0) * p.y === -Infinity && a?.oo === Infinity)
        //         ? a?.CMx * p.x
        //         : (a?.CMx ?? 0) * p.x + (a?.CMy ?? 0) * p.y + (a?.oo ?? 0);
        // console.log(
        //   a?.CMx === Infinity,
        //   a?.CMx === -Infinity,
        //   a?.CMy === Infinity,
        //   a?.CMy === -Infinity,
        //   a?.oo === Infinity,
        //   a?.oo === -Infinity
        // );
        // var str =
        //   (a?.CMx ?? 0) * p.x +
        //   "+" +
        //   (a?.CMy ?? 0) * p.y +
        //   "+" +
        //   (a?.oo ?? 0) +
        //   " = " +
        //   equ;

        if (a !== null && a.CMx * p.x + a.CMy * p.y + a.CMz * p.z + a.oo !== 0) {
          console.log(p.z);
          console.error("Path " + this + " is not flat: \n", 'Bumpy paths may appear distorted'); break
        }
      }
    }
  }
  private calculateZIndex() {
    /*** Maybe we could make this a getter? ***/
    let z = 0;
    for (let point of this.unrotated3dPlane) {
      z += point.z; // It could be good if we had a viewer in SVG3D and then we find the distance between the viewer and the path
    }
    z /= this.unrotated3dPlane.length;
    this.zIndex = z;
  }
  // get rotated3dPlane() {    /*** Useless yet ***/
  //   var result = [];
  //   for (let point of this.unrotated3dPlane)
  //     result.push(
  //       point.rotate(this.rotateX, this.rotateY, this.rotateZ, this.origin)
  //     );
  //   return result;
  // }
  rotate(rx = 0, ry = 0, rz = 0, origin = { x: 0, y: 0, z: 0 }) {
    // console.log(origin);
    var result: Point[] = [];
    for (let point of this.unrotated3dPlane)
      result.push(point.rotate(rx, ry, rz, origin));
    this.unrotated3dPlane = result;
    this.calculateZIndex();
    return this;
  }
  translate(tx = 0, ty = 0, tz = 0) {
    var result = [];
    for (let point of this.unrotated3dPlane) {
      result.push(point.translate(tx, ty, tz));
    }
    this.unrotated3dPlane = result;
    this.origin.x += tx;
    this.origin.y += ty;
    this.origin.z += tz;
    return this;
  }
  display(origin = { x: 0, y: 0 }) {
    // console.log(origin, this.unrotated3dPlane);
    var str = "";
    for (let point of this.unrotated3dPlane) {
      var coef = this.perspective > 0.003 ? 1 + point.z / this.perspective : 1;
      str +=
        (this.unrotated3dPlane.indexOf(point) === 0 ? "M " : " L ") +
        (origin.x + point.x * coef) +
        "," +
        (origin.y - point.y * coef);
      // console.log(str);
    }
    this.path2D.setAttribute("d", str + " z");
    return this.path2D;
  }
  intersects(path2: Path3D) {
    for (let p of this.unrotated3dPlane) {
      var aff = p.affineFunction(
        this.unrotated3dPlane[
        (this.unrotated3dPlane.indexOf(p) + 1) % this.unrotated3dPlane.length
        ]
      );
      for (let p2 of path2.unrotated3dPlane) {
        var aff2 = p2.affineFunction(
          path2.unrotated3dPlane[
          (path2.unrotated3dPlane.indexOf(p2) + 1) %
          path2.unrotated3dPlane.length
          ]
        );
        var x = (aff.oo - aff2.oo) / (aff2.CM - aff.CM);
        var y = aff.CM * x + aff.oo;
      }
    }
  }
  set rotation(r: { x: number; y: number; z: number }) {
    this.unrotated3dPlane = this.start;
    this.rotate((r.x, r.y, r.z));
  }
  set fill(f: string) {
    this.path2D.style.fill = f;
  }
  set stroke(s: string) {
    this.path2D.style.stroke = s;
  }
  set strokeWidth(w: string) {
    this.path2D.style.strokeWidth = w;
  }
  plane3dFunction() {
    if (this.unrotated3dPlane.length < 3) return null;
    var A = this.unrotated3dPlane[0],
      B = this.unrotated3dPlane[1],
      C = this.unrotated3dPlane[2];
    //a= ((x_A-x_C )(y_B-y_A )+(y_C-y_A )(x_B-x_A ))
    //b= ((y_A-y_C )(z_B-z_A )+(z_C-z_A )(y_B-y_A ))
    //c= ((y_A-y_C )(x_B-x_A )+(x_C-x_A )(y_B-y_A ))
    //d= ((x_A-x_C )(z_B-z_A )+(z_C-z_A )(x_B-x_A))
    //xab - x_A ab + ycd - y_A cd + z_A ac - zac = 0
    var a = ((A.x - C.x) * (B.y - A.y) + (C.y - A.y) * (B.x - A.x)),
      b = ((A.y - C.y) * (B.z - A.z) + (C.z - A.z) * (B.y - A.y)),
      c = ((A.y - C.y) * (B.x - A.x) + (C.x - A.x) * (B.y - A.y)),
      d = ((A.x - C.x) * (B.z - A.z) + (C.z - A.z) * (B.x - A.x));
    var CMx = a * b,
      CMy = c * d,
      CMz = -a * c,
      oo = -(A.x * CMx + A.y * CMy + A.z * CMz);
    return { CMx: CMx, CMy: CMy, CMz: CMz, oo: oo };
  }
  valueOf() {
    var result = '[';
    for (let p of this.unrotated3dPlane)
      result += (this.unrotated3dPlane.indexOf(p) === 0 ? '' : ',') + '[' + p.x + ',' + p.y + ',' + p.z + ']';
    return result
  }
}

export { Path3D };
